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
 *
 * Options:
 *   --audit <id>       Convex audit ID to file scope items against.
 *   --max <n>          Cap on discovered URLs (default 2000).
 *   --out <dir>        Write the raw discovery result to disk.
 *   --dry-run          Print a grouped summary; do not contact Convex.
 */

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import process from "node:process";
import {
  isHttpUrl,
  isProbablyPage,
  nameFor,
  normalizeUrl,
  refineRoutePatterns,
  routePatternFor,
  sameOrigin,
} from "../lib/urls.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const USER_AGENT =
  "AccessibilityQA-Discovery/1.0 (+accessibility audit tooling; respects robots.txt)";

/** Loaded only when filing to Convex, so dry runs stay dependency-light. */
let api;

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.origin) {
    console.error(
      "Usage: npm run discover -- --audit <auditId> <url>\n" +
        "       npm run discover -- --dry-run <url>",
    );
    process.exit(1);
  }

  const dryRun = options.dryRun || !options.auditId;

  process.stderr.write(`Discovering ${options.origin}\n`);

  const robots = await fetchRobots(options.origin);
  if (robots.sitemaps.length) {
    process.stderr.write(
      `robots.txt lists ${robots.sitemaps.length} sitemap(s)\n`,
    );
  }

  const sitemapUrls = robots.sitemaps.length
    ? robots.sitemaps
    : [new URL("/sitemap.xml", options.origin).toString()];

  const found = await collectFromSitemaps(sitemapUrls, options);
  const items = toScopeItems(found);

  if (options.outDir) {
    await writeBundle(options.outDir, options, items);
  }

  if (dryRun) {
    reportDryRun(items, options);
    return;
  }

  const client = await connect();
  const result = await client.mutation(api.scope.createBatch, {
    auditId: options.auditId,
    items: items.map((item) => ({
      name: item.name,
      url: item.url,
      normalizedUrl: item.normalizedUrl,
      routePattern: item.routePattern,
      clusterKey: item.routePattern,
      clusterSize: item.clusterSize,
      discoverySource: item.discoverySource,
    })),
  });

  process.stderr.write(
    `Filed ${result.created} new and refreshed ${result.updated} existing scope item(s) ` +
      `against audit ${options.auditId}.\n` +
      `Nothing is in scope until it is included from the scope review screen.\n`,
  );
}

function parseArgs(argv) {
  const options = {
    auditId: null,
    origin: null,
    max: 2000,
    outDir: null,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--audit":
        options.auditId = argv[++index];
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
        options.outDir = path.resolve(argv[++index]);
        break;
      case "--dry-run":
        options.dryRun = true;
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

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    redirect: "follow",
  });

  if (!response.ok) {
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // Sitemaps are commonly gzipped; some servers omit content-encoding, so
  // sniff the gzip magic bytes rather than trusting headers.
  if (url.endsWith(".gz") || (buffer[0] === 0x1f && buffer[1] === 0x8b)) {
    try {
      return gunzipSync(buffer).toString("utf8");
    } catch {
      return buffer.toString("utf8");
    }
  }

  return buffer.toString("utf8");
}

/** Reads robots.txt for Sitemap: directives. Disallow rules matter to the crawler. */
async function fetchRobots(origin) {
  const result = { sitemaps: [], disallow: [] };

  let body;
  try {
    body = await fetchText(new URL("/robots.txt", origin).toString());
  } catch {
    return result;
  }

  if (!body) {
    return result;
  }

  let inDefaultAgent = false;

  for (const rawLine of body.split("\n")) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    // Sitemap directives are global, not scoped to a user-agent group.
    if (field === "sitemap" && value) {
      const normalized = normalizeUrl(value);
      if (normalized) result.sitemaps.push(normalized);
      continue;
    }

    if (field === "user-agent") {
      inDefaultAgent = value === "*";
      continue;
    }

    if (field === "disallow" && inDefaultAgent && value) {
      result.disallow.push(value);
    }
  }

  return result;
}

/**
 * Walks sitemaps, following <sitemapindex> entries. A visited set plus a depth
 * cap keeps a self-referencing or circular index from looping forever.
 */
async function collectFromSitemaps(sitemapUrls, options) {
  const seenSitemaps = new Set();
  const urls = new Map();
  const queue = sitemapUrls.map((url) => ({ url, depth: 0 }));
  const MAX_DEPTH = 3;
  // Tracked so an empty result explains itself instead of looking like an
  // empty site — a host mismatch can otherwise discard an entire sitemap.
  const rejected = {
    offSite: 0,
    offSiteExample: null,
    notPage: 0,
    duplicate: 0,
    unparseable: 0,
  };

  while (queue.length) {
    const { url, depth } = queue.shift();

    if (seenSitemaps.has(url) || depth > MAX_DEPTH) {
      continue;
    }
    seenSitemaps.add(url);

    let body;
    try {
      body = await fetchText(url);
    } catch (error) {
      process.stderr.write(`  ! ${url}: ${error.message}\n`);
      continue;
    }

    if (!body) {
      process.stderr.write(`  ! ${url}: not available\n`);
      continue;
    }

    const isIndex = /<sitemapindex[\s>]/i.test(body);
    const locations = extractLocs(body);

    if (isIndex) {
      process.stderr.write(`  index ${url} -> ${locations.length} sitemap(s)\n`);
      for (const location of locations) {
        queue.push({ url: location, depth: depth + 1 });
      }
      continue;
    }

    let kept = 0;
    for (const location of locations) {
      if (urls.size >= options.max) break;

      const normalized = normalizeUrl(location);
      if (!normalized) {
        rejected.unparseable += 1;
        continue;
      }
      if (!sameOrigin(normalized, options.origin)) {
        rejected.offSite += 1;
        rejected.offSiteExample ??= normalized;
        continue;
      }
      if (!isProbablyPage(normalized)) {
        rejected.notPage += 1;
        continue;
      }
      if (urls.has(normalized)) {
        rejected.duplicate += 1;
        continue;
      }

      urls.set(normalized, { url: location, normalizedUrl: normalized });
      kept += 1;
    }

    process.stderr.write(
      `  ${url} -> ${kept} page URL(s) of ${locations.length} entry(ies)\n`,
    );

    if (urls.size >= options.max) {
      process.stderr.write(`  reached --max ${options.max}; stopping\n`);
      break;
    }
  }

  if (rejected.offSite || rejected.notPage || rejected.duplicate) {
    process.stderr.write(
      `  filtered: ${rejected.offSite} off-site, ${rejected.notPage} non-page, ` +
        `${rejected.duplicate} duplicate\n`,
    );
  }

  if (!urls.size && rejected.offSite) {
    process.stderr.write(
      `\n  ! Every URL was treated as off-site. The sitemap lists ` +
        `${rejected.offSiteExample}\n` +
        `    but you asked for ${options.origin}. Re-run using the host the ` +
        `site actually publishes.\n\n`,
    );
  }

  return [...urls.values()];
}

/** Sitemaps are simple enough that a scoped regex beats adding an XML parser. */
function extractLocs(xml) {
  const locations = [];
  const pattern = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match;

  while ((match = pattern.exec(xml)) !== null) {
    locations.push(decodeXmlEntities(match[1]));
  }

  return locations;
}

function decodeXmlEntities(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

function toScopeItems(found) {
  // Patterns are refined against the whole set: one URL alone cannot reveal
  // that a plain-word slug is a record rather than a section.
  const refined = refineRoutePatterns(found.map((entry) => entry.normalizedUrl));

  const items = found.map((entry) => ({
    ...entry,
    name: nameFor(entry.normalizedUrl),
    routePattern: refined.get(entry.normalizedUrl) ?? routePatternFor(entry.normalizedUrl),
    discoverySource: "sitemap",
  }));

  const sizes = new Map();
  for (const item of items) {
    sizes.set(item.routePattern, (sizes.get(item.routePattern) ?? 0) + 1);
  }

  for (const item of items) {
    item.clusterSize = sizes.get(item.routePattern);
  }

  items.sort(
    (first, second) =>
      first.routePattern.localeCompare(second.routePattern) ||
      first.normalizedUrl.localeCompare(second.normalizedUrl),
  );

  return items;
}

function summarize(items) {
  const clusters = new Map();

  for (const item of items) {
    const entry = clusters.get(item.routePattern) ?? {
      routePattern: item.routePattern,
      count: 0,
      example: item.normalizedUrl,
    };
    entry.count += 1;
    clusters.set(item.routePattern, entry);
  }

  return [...clusters.values()].sort((first, second) => second.count - first.count);
}

function reportDryRun(items, options) {
  const clusters = summarize(items);

  console.log(`Discovered ${items.length} page URL(s) on ${options.origin}`);
  console.log(`Grouped into ${clusters.length} route pattern(s):\n`);

  for (const cluster of clusters) {
    const label = `${cluster.routePattern}`;
    console.log(`  ${String(cluster.count).padStart(5)}  ${label}`);
    if (cluster.count > 1) {
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
