/**
 * Sitemap discovery core — no browser required.
 *
 * Shared by the `discover` CLI and the in-app discovery endpoint so both
 * produce identical results. Everything here runs on plain fetch, which is
 * why it can execute server-side in the app; crawling and structural
 * fingerprinting need a real browser and stay in the CLI.
 */

import { gunzipSync } from "node:zlib";
import {
  isProbablyPage,
  nameFor,
  normalizeUrl,
  refineRoutePatterns,
  routePatternFor,
  sameOrigin,
} from "./urls.mjs";
import { chooseRepresentatives } from "./fingerprint.mjs";

export const USER_AGENT =
  "AccessibilityQA-Discovery/1.0 (+accessibility audit tooling; respects robots.txt)";

export async function fetchText(url) {
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
export async function fetchRobots(origin) {
  const result = { sitemaps: [], disallow: [], allow: [] };

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

    if (field === "allow" && inDefaultAgent && value) {
      result.allow.push(value);
    }
  }

  return result;
}

/**
 * Walks sitemaps, following <sitemapindex> entries. A visited set plus a depth
 * cap keeps a self-referencing or circular index from looping forever.
 */
export async function collectFromSitemaps(sitemapUrls, options) {
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
export function extractLocs(xml) {
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

export function toScopeItems(found) {
  // Patterns are refined against the whole set: one URL alone cannot reveal
  // that a plain-word slug is a record rather than a section.
  const refined = refineRoutePatterns(found.map((entry) => entry.normalizedUrl));

  const items = found.map((entry) => ({
    ...entry,
    name: nameFor(entry.normalizedUrl),
    routePattern: refined.get(entry.normalizedUrl) ?? routePatternFor(entry.normalizedUrl),
    discoverySource: entry.discoverySource ?? "sitemap",
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

export function applyRepresentatives(items) {
  const clusters = new Map();
  for (const item of items) {
    const key = item.clusterKey ?? item.routePattern;
    const entry = clusters.get(key) ?? [];
    entry.push(item);
    clusters.set(key, entry);
  }

  for (const [, group] of clusters) {
    const chosen = new Set(
      chooseRepresentatives(group.map((item) => item.normalizedUrl)),
    );
    for (const item of group) {
      item.isRepresentative = chosen.has(item.normalizedUrl);
      item.clusterSize ??= group.length;
    }
  }
}

/**
 * End-to-end sitemap discovery for one origin.
 *
 * Returns the scope items plus the notes worth showing a person — an empty
 * result should say why (no sitemap, or every URL judged off-site) rather than
 * looking like an empty site.
 */
export async function discoverFromSitemap(origin, { max = 2000 } = {}) {
  const notes = [];
  const robots = await fetchRobots(origin);

  if (robots.sitemaps.length) {
    notes.push(`robots.txt lists ${robots.sitemaps.length} sitemap(s).`);
  }

  const sitemapUrls = robots.sitemaps.length
    ? robots.sitemaps
    : [new URL("/sitemap.xml", origin).toString()];

  const found = await collectFromSitemaps(sitemapUrls, { origin, max });

  if (!found.length) {
    notes.push(
      robots.sitemaps.length
        ? "No page URLs found in the listed sitemaps."
        : "No sitemap found at /sitemap.xml. Use the crawler for sites without one.",
    );
  }

  const items = toScopeItems(
    found.map((entry) => ({ ...entry, discoverySource: "sitemap", depth: 0 })),
  );
  applyRepresentatives(items);

  const templates = new Set(items.map((item) => item.clusterKey ?? item.routePattern));

  return {
    items,
    notes,
    stats: {
      discovered: items.length,
      templates: templates.size,
      proposed: items.filter((item) => item.isRepresentative).length,
    },
  };
}
