#!/usr/bin/env node
/**
 * Accessibility scan worker.
 *
 * Runs axe-core over one or more URLs, captures the evidence an auditor (or a
 * later AI pass) needs to judge the result, and files everything into Convex as
 * observations. Observations are triage input: this script never writes to the
 * findings table.
 *
 * Usage:
 *   npm run scan -- --audit <auditId> https://example.com /about
 *   npm run scan -- --dry-run https://example.com
 *
 * Options:
 *   --audit <id>       Convex audit ID to file observations against.
 *   --base <url>       Base URL, so remaining arguments may be paths.
 *   --page <id>=<url>  Link a URL to an existing auditPages row.
 *   --viewport <WxH>   Viewport size (default 1440x1000).
 *   --out <dir>        Also write the raw evidence bundle to disk.
 *   --dry-run          Print grouped results; do not contact Convex.
 */

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

/** Loaded only when filing to Convex, so dry runs stay dependency-light. */
let api;

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.urls.length) {
    console.error(
      "Usage: npm run scan -- --audit <auditId> <url...>\n" +
        "       npm run scan -- --dry-run <url...>",
    );
    process.exit(1);
  }

  const dryRun = options.dryRun || !options.auditId;
  const client = dryRun ? null : await connect();

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: options.viewport });

  const results = [];

  try {
    for (const url of options.urls) {
      process.stderr.write(`Scanning ${url}\n`);
      const page = await context.newPage();
      try {
        results.push(await scanPage(page, url, options));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (options.outDir) {
    await writeBundle(options.outDir, results);
  }

  if (dryRun) {
    reportDryRun(results);
    return;
  }

  const filed = await fileObservations(client, options, results);
  process.stderr.write(
    `Filed ${filed} observation${filed === 1 ? "" : "s"} against audit ${options.auditId}.\n`,
  );
}

function parseArgs(argv) {
  const options = {
    auditId: null,
    base: null,
    viewport: { width: 1440, height: 1000 },
    outDir: null,
    dryRun: false,
    pageIds: new Map(),
    urls: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--audit":
        options.auditId = argv[++index];
        break;
      case "--base":
        options.base = argv[++index];
        break;
      case "--viewport": {
        const [width, height] = String(argv[++index]).split("x").map(Number);
        if (!width || !height) {
          throw new Error("--viewport expects a WxH value such as 1440x1000.");
        }
        options.viewport = { width, height };
        break;
      }
      case "--out":
        options.outDir = path.resolve(argv[++index]);
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--page": {
        const value = String(argv[++index]);
        const separator = value.indexOf("=");
        if (separator === -1) {
          throw new Error("--page expects <pageId>=<url>.");
        }
        options.pageIds.set(value.slice(separator + 1), value.slice(0, separator));
        break;
      }
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown option ${arg}`);
        }
        options.urls.push(arg);
    }
  }

  options.urls = options.urls.map((url) =>
    options.base ? new URL(url, options.base).toString() : url,
  );

  return options;
}

async function connect() {
  const env = await loadEnv();
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? env.NEXT_PUBLIC_CONVEX_URL;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is not set. Add it to .env.local or pass --dry-run.",
    );
  }

  const [{ ConvexHttpClient }, generated] = await Promise.all([
    import("convex/browser"),
    import("../../convex/_generated/api.js"),
  ]);

  api = generated.api;
  return new ConvexHttpClient(url);
}

async function loadEnv() {
  try {
    const raw = await readFile(path.join(REPO_ROOT, ".env.local"), "utf8");
    return Object.fromEntries(
      raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const separator = line.indexOf("=");
          return [
            line.slice(0, separator).trim(),
            line.slice(separator + 1).trim().replace(/^["']|["']$/g, ""),
          ];
        }),
    );
  } catch {
    return {};
  }
}

async function scanPage(page, url, options) {
  await page.goto(url, { waitUntil: "networkidle" });

  const axeResults = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const screenshot = await page.screenshot({ fullPage: true });
  const dom = await page.content();
  const accessibilityTree = await captureAccessibilityTree(page);
  const structure = await page.evaluate(extractStructure);

  return {
    url,
    title: await page.title(),
    scannedAt: new Date().toISOString(),
    viewport: options.viewport,
    screenshot,
    dom,
    accessibilityTree,
    structure,
    violations: groupByRule(axeResults.violations),
    incomplete: groupByRule(axeResults.incomplete),
  };
}

/**
 * Playwright removed page.accessibility in 1.43, so the tree comes from CDP.
 * Chromium-only; other engines return null and the structure capture below
 * still provides the heading, landmark, and focus-order facts.
 */
async function captureAccessibilityTree(page) {
  let session;
  try {
    session = await page.context().newCDPSession(page);
    const { nodes } = await session.send("Accessibility.getFullAXTree");

    return nodes
      .filter((node) => !node.ignored)
      .map((node) => ({
        role: node.role?.value ?? null,
        name: node.name?.value ?? null,
        description: node.description?.value ?? null,
        value: node.value?.value ?? null,
        properties: Object.fromEntries(
          (node.properties ?? []).map((property) => [property.name, property.value?.value]),
        ),
      }));
  } catch (error) {
    process.stderr.write(`Accessibility tree unavailable: ${error.message}\n`);
    return null;
  } finally {
    await session?.detach().catch(() => {});
  }
}

/**
 * Runs in the page. Captures the structural facts the judgment-call checks need
 * later: heading outline, landmark map, and DOM-order vs visual-order focus
 * sequence for 2.4.3.
 */
function extractStructure() {
  const landmarkRoles = {
    header: "banner",
    nav: "navigation",
    main: "main",
    aside: "complementary",
    footer: "contentinfo",
    form: "form",
    section: "region",
  };

  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role=heading]")].map(
    (element) => ({
      level: Number(element.getAttribute("aria-level")) || Number(element.tagName[1]) || null,
      text: (element.textContent ?? "").trim().slice(0, 200),
      hidden: element.getAttribute("aria-hidden") === "true",
    }),
  );

  const landmarks = [...document.querySelectorAll("header,nav,main,aside,footer,form,section,[role]")]
    .map((element) => {
      const role =
        element.getAttribute("role") ?? landmarkRoles[element.tagName.toLowerCase()] ?? null;
      if (!role || !Object.values(landmarkRoles).includes(role)) {
        return null;
      }
      return {
        role,
        label:
          element.getAttribute("aria-label") ??
          (element.getAttribute("aria-labelledby")
            ? (document.getElementById(element.getAttribute("aria-labelledby"))?.textContent ?? "").trim()
            : null),
      };
    })
    .filter(Boolean);

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type=hidden])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
    "[contenteditable='true']",
  ].join(",");

  const focusable = [...document.querySelectorAll(focusableSelector)]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        (rect.width > 0 || rect.height > 0)
      );
    })
    .map((element, index) => {
      const rect = element.getBoundingClientRect();
      return {
        domOrder: index,
        tag: element.tagName.toLowerCase(),
        tabindex: element.getAttribute("tabindex"),
        name:
          element.getAttribute("aria-label") ??
          (element.textContent ?? "").trim().slice(0, 80) ??
          null,
        top: Math.round(rect.top + window.scrollY),
        left: Math.round(rect.left + window.scrollX),
      };
    });

  const visualOrder = [...focusable]
    .sort((first, second) => first.top - second.top || first.left - second.left)
    .map((item) => item.domOrder);

  return {
    documentTitle: document.title,
    lang: document.documentElement.lang || null,
    headings,
    landmarks,
    focusable,
    // Index into focusable, sorted top-to-bottom then left-to-right. If this
    // differs from 0..n-1 the DOM focus order diverges from the visual order.
    visualOrder,
    focusOrderMatchesVisualOrder: visualOrder.every((value, index) => value === index),
  };
}

/** One observation per rule per page, with the failing nodes collapsed into it. */
function groupByRule(entries) {
  return entries.map((entry) => ({
    id: entry.id,
    impact: entry.impact,
    description: entry.description,
    help: entry.help,
    helpUrl: entry.helpUrl,
    tags: entry.tags,
    wcag: wcagCriteriaFromTags(entry.tags),
    nodes: entry.nodes.map((node) => ({
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary,
    })),
  }));
}

/**
 * axe tags carry the criterion as digits: wcag143 -> 1.4.3, wcag1410 -> 1.4.10.
 * Level tags (wcag2a, wcag21aa) contain letters and are skipped.
 */
function wcagCriteriaFromTags(tags) {
  return tags
    .map((tag) => /^wcag(\d)(\d)(\d+)$/.exec(tag))
    .filter(Boolean)
    .map(([, principle, guideline, criterion]) => `${principle}.${guideline}.${criterion}`);
}

async function fileObservations(client, options, results) {
  const observations = [];

  for (const result of results) {
    const pageId = options.pageIds.get(result.url);
    const evidence = await buildEvidence(client, result);

    for (const rule of result.violations) {
      observations.push(
        toObservation(result, rule, pageId, evidence, {
          confidence: "high",
          prefix: "",
        }),
      );
    }

    // axe's "incomplete" results are the ones it cannot decide on its own.
    // They belong in the queue flagged for human judgment, not dropped.
    for (const rule of result.incomplete) {
      observations.push(
        toObservation(result, rule, pageId, evidence, {
          confidence: "needs_review",
          prefix: "Needs review: ",
        }),
      );
    }
  }

  if (!observations.length) {
    return 0;
  }

  await client.mutation(api.observations.createBatch, {
    auditId: options.auditId,
    observations,
  });

  return observations.length;
}

async function buildEvidence(client, result) {
  const evidence = [];
  const storageId = await uploadScreenshot(client, result.screenshot);

  if (storageId) {
    evidence.push({
      type: "screenshot",
      label: `Full-page screenshot — ${result.url}`,
      storageId,
      metadata: { url: result.url, viewport: result.viewport, scannedAt: result.scannedAt },
    });
  }

  evidence.push({
    type: "dom",
    label: `DOM snapshot — ${result.url}`,
    text: result.dom,
    metadata: { url: result.url, scannedAt: result.scannedAt },
  });

  evidence.push({
    type: "tool_output",
    label: `Accessibility tree and page structure — ${result.url}`,
    text: JSON.stringify(
      { accessibilityTree: result.accessibilityTree, structure: result.structure },
      null,
      2,
    ),
    metadata: {
      url: result.url,
      lang: result.structure.lang,
      headingCount: result.structure.headings.length,
      landmarkCount: result.structure.landmarks.length,
      focusableCount: result.structure.focusable.length,
      focusOrderMatchesVisualOrder: result.structure.focusOrderMatchesVisualOrder,
    },
  });

  return evidence;
}

async function uploadScreenshot(client, screenshot) {
  try {
    const uploadUrl = await client.mutation(api.evidence.generateUploadUrl, {});
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: screenshot,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with ${response.status}`);
    }

    const { storageId } = await response.json();
    return storageId;
  } catch (error) {
    // A failed screenshot upload should not lose the whole scan; the DOM and
    // accessibility-tree evidence still file.
    process.stderr.write(`Screenshot upload failed: ${error.message}\n`);
    return null;
  }
}

function toObservation(result, rule, pageId, evidence, { confidence, prefix }) {
  return {
    pageId,
    url: result.url,
    source: "automated",
    title: `${prefix}${rule.help}`,
    description: buildDescription(rule),
    rawTool: "axe-core",
    rawRuleId: rule.id,
    suggestedWcag: rule.wcag,
    confidence,
    metadata: {
      impact: rule.impact,
      tags: rule.tags,
      helpUrl: rule.helpUrl,
      nodeCount: rule.nodes.length,
      scannedAt: result.scannedAt,
      pageTitle: result.title,
    },
    evidence,
  };
}

function buildDescription(rule) {
  const lines = [rule.description, "", `${rule.nodes.length} affected element(s):`];

  for (const node of rule.nodes.slice(0, 20)) {
    lines.push("", `- ${node.target.join(" ")}`, `  ${collapse(node.html, 300)}`);
    if (node.failureSummary) {
      lines.push(`  ${collapse(node.failureSummary, 300)}`);
    }
  }

  if (rule.nodes.length > 20) {
    lines.push("", `...and ${rule.nodes.length - 20} more.`);
  }

  lines.push("", `Reference: ${rule.helpUrl}`);
  return lines.join("\n");
}

function collapse(value, max) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

async function writeBundle(outDir, results) {
  await mkdir(outDir, { recursive: true });

  for (const [index, result] of results.entries()) {
    const slug = `${String(index + 1).padStart(2, "0")}-${slugify(result.url)}`;
    await writeFile(path.join(outDir, `${slug}.png`), result.screenshot);
    await writeFile(path.join(outDir, `${slug}.html`), result.dom);
    await writeFile(
      path.join(outDir, `${slug}.json`),
      JSON.stringify(
        {
          url: result.url,
          title: result.title,
          scannedAt: result.scannedAt,
          structure: result.structure,
          accessibilityTree: result.accessibilityTree,
          violations: result.violations,
          incomplete: result.incomplete,
        },
        null,
        2,
      ),
    );
  }

  process.stderr.write(`Wrote evidence bundle to ${outDir}\n`);
}

function slugify(url) {
  return url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "").slice(0, 60);
}

function reportDryRun(results) {
  console.log(
    JSON.stringify(
      results.map((result) => ({
        url: result.url,
        title: result.title,
        scannedAt: result.scannedAt,
        lang: result.structure.lang,
        headings: result.structure.headings.length,
        landmarks: result.structure.landmarks.length,
        focusable: result.structure.focusable.length,
        focusOrderMatchesVisualOrder: result.structure.focusOrderMatchesVisualOrder,
        violations: result.violations.map(summarize),
        incomplete: result.incomplete.map(summarize),
      })),
      null,
      2,
    ),
  );
}

function summarize(rule) {
  return {
    rule: rule.id,
    impact: rule.impact,
    help: rule.help,
    wcag: rule.wcag,
    affectedElements: rule.nodes.length,
  };
}
