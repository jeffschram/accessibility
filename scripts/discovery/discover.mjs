#!/usr/bin/env node
/**
 * Page discovery worker.
 *
 * Finds the URLs that make up a site and files them into an audit's scope as
 * proposals. Discovered rows land with `included: false` — a person decides
 * what is actually in scope, the same boundary observations and findings use.
 *
 * Usage:
 *   npm run discover -- --dry-run https://example.com
 *   npm run discover -- --audit <auditId> https://example.com
 *   npm run discover -- --crawl --dry-run https://example.com
 *
 * Options:
 *   --audit <id>            Convex audit ID to file scope items against.
 *   --max <n>               Cap on discovered URLs (default 2000).
 *   --out <dir>             Write the raw discovery result to disk.
 *   --dry-run               Print a grouped summary; do not contact Convex.
 *   --crawl                 Also crawl, to catch pages missing from the sitemap.
 *   --crawl-only            Skip the sitemap and crawl only.
 *   --depth <n>             Crawl depth (default 3).
 *   --concurrency <n>       Parallel page loads while crawling (default 3).
 *   --delay <ms>            Pause between page loads (default 250).
 *   --storage-state <path>  Playwright storage state, for authenticated crawls.
 *   --cluster               Group pages by rendered structure, not just URL shape.
 *   --fingerprint-sample <n>  Pages sampled per route pattern (default 3).
 *
 * Authenticated crawling: log in once and save the session with
 *   npx playwright open --save-storage=auth.json https://example.com
 * then pass --storage-state auth.json.
 */

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { UsageError, requireConvexId, takeValue } from "../lib/args.mjs";
import { createRobotsMatcher } from "../lib/robots.mjs";
import { extractSkeleton, fingerprintOf } from "../lib/fingerprint.mjs";
import {
  USER_AGENT,
  applyRepresentatives,
  collectFromSitemaps,
  fetchRobots,
  toScopeItems,
} from "../lib/sitemap.mjs";
import {
  isDestructive,
  isHttpUrl,
  isProbablyPage,
  normalizeUrl,
  sameOrigin,
} from "../lib/urls.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

/** Loaded only when filing to Convex, so dry runs stay dependency-light. */
let api;

main().catch((error) => {
  // A mistyped flag deserves the message, not a stack trace.
  if (error instanceof UsageError) {
    console.error(`\n${error.message}\n`);
    process.exit(1);
  }
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.origin) {
    console.error(
      "Usage: npm run discover -- --audit <auditId> <url>\n" +
        "       npm run discover -- --dry-run <url>\n" +
        "       npm run discover -- --crawl --dry-run <url>",
    );
    process.exit(1);
  }

  const dryRun = options.dryRun || !options.auditId;

  // Discovery can run for minutes. Confirm the audit exists before spending
  // that time, rather than failing on the write at the very end.
  const client = dryRun ? null : await connect();
  if (client) {
    let audit;
    try {
      audit = await client.query(api.audits.get, { auditId: options.auditId });
    } catch (error) {
      // The 32-character shape check passes for strings Convex still rejects,
      // because its IDs carry an internal encoding. Translate that rather than
      // surfacing a validator stack trace.
      const message = error instanceof Error ? error.message : String(error);
      if (/ArgumentValidationError|v\.id\(/.test(message)) {
        throw new UsageError(
          `"${options.auditId}" is not a valid audit ID.\n` +
            `Open the audit in the app and copy the ID from its URL.`,
        );
      }
      throw error;
    }

    if (!audit) {
      throw new UsageError(
        `No audit found with ID "${options.auditId}".\n` +
          `Open the audit in the app and copy the ID from its URL, or run with ` +
          `--dry-run to preview without writing.`,
      );
    }

    process.stderr.write(`Audit: ${audit.name}\n`);
  }

  process.stderr.write(`Discovering ${options.origin}\n`);

  const robots = await fetchRobots(options.origin);
  if (robots.sitemaps.length) {
    process.stderr.write(
      `robots.txt lists ${robots.sitemaps.length} sitemap(s)\n`,
    );
  }

  const found = new Map();

  if (!options.crawlOnly) {
    const sitemapUrls = robots.sitemaps.length
      ? robots.sitemaps
      : [new URL("/sitemap.xml", options.origin).toString()];

    for (const entry of await collectFromSitemaps(sitemapUrls, options)) {
      found.set(entry.normalizedUrl, { ...entry, discoverySource: "sitemap", depth: 0 });
    }
  }

  if (options.crawl || options.crawlOnly) {
    // Seeds from the sitemap pass, so the crawl expands coverage rather than
    // re-walking pages already known.
    for (const entry of await crawl(options, robots, found)) {
      if (!found.has(entry.normalizedUrl)) {
        found.set(entry.normalizedUrl, entry);
      }
    }
  }

  let items = toScopeItems([...found.values()]);

  if (options.cluster) {
    items = await clusterItems(items, options);
  }

  applyRepresentatives(items);

  if (options.outDir) {
    await writeBundle(options.outDir, options, items);
  }

  if (dryRun) {
    reportDryRun(items, options);
    return;
  }

  const result = await client.mutation(api.scope.createBatch, {
    auditId: options.auditId,
    items: items.map((item) => ({
      name: item.name,
      url: item.url,
      normalizedUrl: item.normalizedUrl,
      routePattern: item.routePattern,
      clusterKey: item.clusterKey ?? item.routePattern,
      clusterSize: item.clusterSize,
      isRepresentative: item.isRepresentative,
      discoverySource: item.discoverySource,
      discoveryDepth: item.depth,
    })),
  });

  process.stderr.write(
    `Filed ${result.created} new and refreshed ${result.updated} existing scope item(s) ` +
      `against audit ${options.auditId}.\n` +
      `Nothing is in scope until it is included from the scope review screen.\n`,
  );
}

function requirePositive(raw, flag) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${flag} expects a positive number.`);
  }
  return value;
}

function parseArgs(argv) {
  const options = {
    auditId: null,
    origin: null,
    max: 2000,
    outDir: null,
    dryRun: false,
    crawl: false,
    crawlOnly: false,
    depth: 3,
    concurrency: 3,
    delay: 250,
    storageState: null,
    cluster: false,
    fingerprintSample: 3,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--audit":
        options.auditId = requireConvexId(takeValue(argv, ++index, "--audit"), "--audit");
        break;
      case "--max": {
        const value = Number(argv[++index]);
        if (!Number.isFinite(value) || value <= 0) {
          throw new Error("--max expects a positive number.");
        }
        options.max = value;
        break;
      }
      case "--out":
        options.outDir = path.resolve(takeValue(argv, ++index, "--out"));
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--crawl":
        options.crawl = true;
        break;
      case "--crawl-only":
        options.crawlOnly = true;
        break;
      case "--depth":
        options.depth = requirePositive(argv[++index], "--depth");
        break;
      case "--concurrency":
        options.concurrency = requirePositive(argv[++index], "--concurrency");
        break;
      case "--delay": {
        const value = Number(argv[++index]);
        if (!Number.isFinite(value) || value < 0) {
          throw new Error("--delay expects a non-negative number of milliseconds.");
        }
        options.delay = value;
        break;
      }
      case "--storage-state":
        options.storageState = path.resolve(takeValue(argv, ++index, "--storage-state"));
        break;
      case "--cluster":
        options.cluster = true;
        break;
      case "--fingerprint-sample":
        options.fingerprintSample = requirePositive(argv[++index], "--fingerprint-sample");
        break;
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown option ${arg}`);
        }
        if (!options.origin) {
          options.origin = isHttpUrl(arg) ? arg : `https://${arg}`;
        }
    }
  }

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

/**
 * Refines clusters by rendered structure.
 *
 * Visits a bounded sample per route pattern rather than every page — the point
 * is to characterize the template, and three examples settle that.
 */
async function clusterItems(items, options) {
  const { chromium } = await import("playwright");

  const byPattern = new Map();
  for (const item of items) {
    const entry = byPattern.get(item.routePattern) ?? [];
    entry.push(item);
    byPattern.set(item.routePattern, entry);
  }

  process.stderr.write(
    `Fingerprinting up to ${options.fingerprintSample} page(s) in each of ` +
      `${byPattern.size} route pattern(s)\n`,
  );

  const browser = await chromium.launch();
  const context = await browser.newContext({ userAgent: USER_AGENT });

  try {
    for (const [pattern, group] of byPattern) {
      const sample = group.slice(0, options.fingerprintSample);
      const fingerprints = [];

      for (const item of sample) {
        const page = await context.newPage();
        try {
          await page.goto(item.normalizedUrl, {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });
          if (options.delay) {
            await new Promise((resolve) => setTimeout(resolve, options.delay));
          }
          const skeleton = await page.evaluate(extractSkeleton);
          fingerprints.push(fingerprintOf(skeleton));
        } catch {
          fingerprints.push(null);
        } finally {
          await page.close();
        }
      }

      const usable = fingerprints.filter(Boolean);
      // Sampled pages agreeing means the pattern really is one template, so
      // the fingerprint can stand for the whole group. Disagreement means the
      // pattern renders more than one layout — keep the URL shape, which at
      // least stays honest about the grouping.
      const consistent = usable.length > 0 && new Set(usable).size === 1;
      const clusterKey = consistent ? `fp:${usable[0]}` : pattern;

      for (const item of group) {
        item.clusterKey = clusterKey;
        item.fingerprintConsistent = consistent;
      }
    }
  } finally {
    await browser.close();
  }

  // Patterns sharing a fingerprint are the same template despite different
  // URL shapes — this is what merges /about, /pricing and /careers.
  const merged = new Map();
  for (const item of items) {
    const entry = merged.get(item.clusterKey) ?? [];
    entry.push(item);
    merged.set(item.clusterKey, entry);
  }

  for (const [, group] of merged) {
    for (const item of group) {
      item.clusterSize = group.length;
    }
  }

  process.stderr.write(
    `  ${byPattern.size} route pattern(s) resolved to ${merged.size} template(s)\n`,
  );

  return items;
}

/**
 * Breadth-first same-origin crawl.
 *
 * Covers what a sitemap cannot: sites that publish none, pages omitted from
 * one, and navigation rendered by JavaScript that a raw fetch never sees.
 * Runs against client production sites, so robots.txt Disallow rules are
 * honoured and every request is delayed and capped.
 */
async function crawl(options, robots, seeded) {
  const { chromium } = await import("playwright");
  const isAllowed = createRobotsMatcher(robots);

  const visited = new Set();
  const results = new Map();
  // Sitemap URLs are already known; seeding them stops the crawl re-walking
  // pages we have, while still letting it follow links out of them.
  let frontier = [{ url: normalizeUrl(options.origin), depth: 0 }];
  for (const key of seeded.keys()) {
    if (!frontier.some((entry) => entry.url === key)) {
      frontier.push({ url: key, depth: 0 });
    }
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    ...(options.storageState ? { storageState: options.storageState } : {}),
  });

  let loginWarned = false;

  try {
    for (let depth = 0; depth <= options.depth && frontier.length; depth += 1) {
      const level = frontier.filter((entry) => !visited.has(entry.url));
      frontier = [];

      process.stderr.write(`  crawl depth ${depth}: ${level.length} page(s)\n`);

      for (let index = 0; index < level.length; index += options.concurrency) {
        if (visited.size >= options.max) break;

        const batch = level.slice(index, index + options.concurrency);
        const found = await Promise.all(
          batch.map(async (entry) => {
            if (visited.has(entry.url) || visited.size >= options.max) {
              return [];
            }
            visited.add(entry.url);

            const { pathname } = new URL(entry.url);
            if (!isAllowed(pathname)) {
              return [];
            }

            if (options.delay) {
              await new Promise((resolve) => setTimeout(resolve, options.delay));
            }

            const page = await context.newPage();
            try {
              const response = await page.goto(entry.url, {
                waitUntil: "domcontentloaded",
                timeout: 20000,
              });

              if (response && !response.ok()) {
                return [];
              }

              // A crawl that lands on a login page usually means the saved
              // session expired — warn, but keep going.
              if (!loginWarned && options.storageState) {
                const url = page.url();
                if (/\/(login|signin|sign-in|auth)\b/i.test(url)) {
                  loginWarned = true;
                  process.stderr.write(
                    `  ! redirected to a login page (${url}) — the saved ` +
                      `storage state may have expired\n`,
                  );
                }
              }

              results.set(entry.url, {
                url: entry.url,
                normalizedUrl: entry.url,
                discoverySource: seeded.has(entry.url) ? "sitemap" : "crawl",
                depth: entry.depth,
              });

              const hrefs = await page.$$eval("a[href]", (anchors) =>
                anchors.map((anchor) => anchor.getAttribute("href") ?? ""),
              );

              return hrefs
                .map((href) => normalizeUrl(href, entry.url))
                .filter(
                  (href) =>
                    href &&
                    sameOrigin(href, options.origin) &&
                    isProbablyPage(href) &&
                    !isDestructive(href) &&
                    !visited.has(href),
                )
                .map((href) => ({ url: href, depth: entry.depth + 1 }));
            } catch {
              return [];
            } finally {
              await page.close();
            }
          }),
        );

        for (const entry of found.flat()) {
          if (!frontier.some((queued) => queued.url === entry.url)) {
            frontier.push(entry);
          }
        }
      }

      if (visited.size >= options.max) {
        process.stderr.write(`  reached --max ${options.max}; stopping crawl\n`);
        break;
      }
    }
  } finally {
    await browser.close();
  }

  const fresh = [...results.values()].filter((entry) => !seeded.has(entry.normalizedUrl));
  process.stderr.write(
    `  crawl visited ${visited.size} page(s), ${fresh.length} not in the sitemap\n`,
  );

  return [...results.values()];
}

function summarize(items) {
  const clusters = new Map();

  for (const item of items) {
    const key = item.clusterKey ?? item.routePattern;
    const entry = clusters.get(key) ?? {
      key,
      routePatterns: new Set(),
      count: 0,
      representatives: [],
      example: item.normalizedUrl,
    };
    entry.count += 1;
    entry.routePatterns.add(item.routePattern);
    if (item.isRepresentative) {
      entry.representatives.push(item.normalizedUrl);
    }
    clusters.set(key, entry);
  }

  return [...clusters.values()].sort((first, second) => second.count - first.count);
}

function reportDryRun(items, options) {
  const clusters = summarize(items);
  const proposed = items.filter((item) => item.isRepresentative).length;

  console.log(`Discovered ${items.length} page URL(s) on ${options.origin}`);
  console.log(
    `Collapsed to ${clusters.length} template(s); ` +
      `${proposed} page(s) proposed for the audit sample.\n`,
  );

  for (const cluster of clusters) {
    const patterns = [...cluster.routePatterns];
    const label =
      patterns.length === 1 ? patterns[0] : `${patterns.length} route patterns`;

    console.log(`  ${String(cluster.count).padStart(5)}  ${label}`);

    if (patterns.length > 1) {
      console.log(`         ${patterns.slice(0, 4).join(", ")}${patterns.length > 4 ? ", …" : ""}`);
    }
    for (const representative of cluster.representatives) {
      console.log(`         → audit ${representative}`);
    }
    if (!cluster.representatives.length && cluster.count > 1) {
      console.log(`         e.g. ${cluster.example}`);
    }
  }

  console.log(
    `\nRun again with --audit <auditId> to file these as scope proposals ` +
      `(they land excluded until reviewed).`,
  );
}

async function writeBundle(outDir, options, items) {
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "discovery.json"),
    JSON.stringify(
      {
        origin: options.origin,
        discoveredAt: new Date().toISOString(),
        total: items.length,
        clusters: summarize(items),
        items,
      },
      null,
      2,
    ),
  );
  process.stderr.write(`Wrote discovery bundle to ${outDir}\n`);
}
