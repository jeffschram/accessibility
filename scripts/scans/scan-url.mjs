#!/usr/bin/env node
/**
 * Quick single-URL scan that prints to stdout without touching Convex.
 * Kept as a shorthand for `npm run scan -- --dry-run <url>`; the full worker
 * (evidence capture and observation intake) lives in scan.mjs.
 */

const url = process.argv[2];

if (!url) {
  console.error("Usage: npm run scan:url -- https://example.com");
  process.exit(1);
}

process.argv = [process.argv[0], process.argv[1], "--dry-run", url];

await import("./scan.mjs");
