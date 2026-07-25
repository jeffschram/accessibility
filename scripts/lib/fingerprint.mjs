/**
 * Structural fingerprinting for template clustering.
 *
 * URL shape alone gets most of the way — /posts/:slug is obviously one
 * template. It fails when a CMS publishes everything at the root, so
 * /about, /pricing and /careers look like three templates when they are one
 * layout, or conversely when one URL pattern renders genuinely different
 * layouts. Comparing rendered structure resolves both.
 *
 * The fingerprint deliberately ignores text content: two blog posts with
 * different words are the same template, and that is the whole point.
 */

import { createHash } from "node:crypto";

/**
 * Runs in the page. Self-contained — Playwright serializes it into the browser,
 * so it cannot close over module scope.
 */
export function extractSkeleton() {
  const LANDMARKS = ["banner", "navigation", "main", "complementary", "contentinfo", "form", "search", "region"];

  const roleOf = (element) => {
    const explicit = element.getAttribute("role");
    if (explicit) return explicit.toLowerCase();
    const implicit = {
      header: "banner",
      nav: "navigation",
      main: "main",
      aside: "complementary",
      footer: "contentinfo",
      form: "form",
      section: "region",
    };
    return implicit[element.tagName.toLowerCase()] ?? null;
  };

  const landmarks = [...document.querySelectorAll("header,nav,main,aside,footer,form,section,[role]")]
    .map(roleOf)
    .filter((role) => role && LANDMARKS.includes(role));

  const headingLevels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
    (heading) => Number(heading.tagName[1]),
  );

  const main = document.querySelector("main") ?? document.body;
  const topLevelTags = [...(main?.children ?? [])]
    .map((child) => child.tagName.toLowerCase())
    .slice(0, 40);

  return {
    landmarks,
    // Levels only — heading *text* differs between two pages of one template.
    headingLevels,
    headingCount: headingLevels.length,
    topLevelTags,
    hasForm: Boolean(document.querySelector("form")),
    hasTable: Boolean(document.querySelector("table")),
    hasDialog: Boolean(document.querySelector("dialog,[role=dialog]")),
    hasNavList: Boolean(document.querySelector("nav ul,nav ol")),
    imageCount: document.querySelectorAll("img").length,
  };
}

/**
 * Hashes a skeleton into a short, comparable key.
 *
 * Counts are bucketed rather than exact: a 9-heading and an 11-heading article
 * are the same template, and hashing raw counts would split them.
 */
export function fingerprintOf(skeleton) {
  if (!skeleton) {
    return null;
  }

  const bucket = (value) => {
    if (value === 0) return "0";
    if (value <= 2) return "1-2";
    if (value <= 5) return "3-5";
    if (value <= 10) return "6-10";
    if (value <= 25) return "11-25";
    return "25+";
  };

  const parts = [
    skeleton.landmarks.join(">"),
    // Shape of the outline, not its length.
    [...new Set(skeleton.headingLevels)].sort().join(""),
    bucket(skeleton.headingCount),
    skeleton.topLevelTags.join(","),
    skeleton.hasForm ? "form" : "",
    skeleton.hasTable ? "table" : "",
    skeleton.hasDialog ? "dialog" : "",
    skeleton.hasNavList ? "navlist" : "",
    bucket(skeleton.imageCount),
  ];

  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 12);
}

/**
 * Picks the pages worth auditing from a cluster.
 *
 * WCAG-EM samples rather than enumerates, so one representative per template
 * plus a structurally deeper example is enough to characterize it. The
 * shallowest path is usually the canonical or index example; the deepest
 * exercises nesting the shallow one does not.
 */
export function chooseRepresentatives(urls, perCluster = 2) {
  if (urls.length <= perCluster) {
    return [...urls];
  }

  const byDepth = [...urls].sort((first, second) => {
    const depth = pathDepth(first) - pathDepth(second);
    return depth !== 0 ? depth : first.localeCompare(second);
  });

  const chosen = [byDepth[0]];
  if (perCluster > 1) {
    chosen.push(byDepth[byDepth.length - 1]);
  }

  return [...new Set(chosen)].slice(0, perCluster);
}

function pathDepth(rawUrl) {
  try {
    return new URL(rawUrl).pathname.split("/").filter(Boolean).length;
  } catch {
    return 0;
  }
}
