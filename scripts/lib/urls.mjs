/**
 * URL handling shared by every discovery source.
 *
 * Sitemap parsing and crawling must produce identical strings for the same
 * page, or the two sources deduplicate against each other incorrectly and the
 * same page is audited twice.
 */

/** Params that identify a campaign or session, never a distinct page. */
const TRACKING_PARAMS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^gbraid$/i,
  /^wbraid$/i,
  /^msclkid$/i,
  /^mc_(cid|eid)$/i,
  /^igshid$/i,
  /^ref$/i,
  /^referrer$/i,
  /^source$/i,
  /^_ga$/i,
  /^yclid$/i,
];

/** Extensions that are assets or documents rather than HTML pages. */
const NON_PAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "ico", "bmp", "tiff",
  "css", "js", "mjs", "map", "json", "xml", "rss", "atom",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv",
  "zip", "gz", "tar", "rar", "7z", "dmg", "exe", "pkg",
  "mp3", "mp4", "wav", "avi", "mov", "webm", "ogg", "m4a",
  "woff", "woff2", "ttf", "otf", "eot",
  "txt",
]);

/** Links that end the crawler's own session or trigger side effects. */
const DESTRUCTIVE_PATTERNS = [
  /\/(log|sign)[-_]?out\b/i,
  /\/signout\b/i,
  /[?&](logout|signout)=/i,
  /\/delete\b/i,
  /\/unsubscribe\b/i,
];

export function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

/**
 * Canonical form used for deduplication.
 *
 * Drops the fragment (never a separate page), removes tracking parameters,
 * sorts the remaining query so parameter order does not create duplicates,
 * collapses repeated slashes, and strips a trailing slash except on the root.
 * Scheme and host are lowercased; path case is preserved because many servers
 * treat paths case-sensitively.
 */
export function normalizeUrl(rawUrl, base) {
  let url;
  try {
    url = base ? new URL(rawUrl, base) : new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  url.protocol = url.protocol.toLowerCase();

  if (
    (url.protocol === "https:" && url.port === "443") ||
    (url.protocol === "http:" && url.port === "80")
  ) {
    url.port = "";
  }

  const params = [...url.searchParams.entries()]
    .filter(([key]) => !TRACKING_PARAMS.some((pattern) => pattern.test(key)))
    .sort(([first], [second]) => first.localeCompare(second));

  url.search = "";
  for (const [key, value] of params) {
    url.searchParams.append(key, value);
  }

  let pathname = url.pathname.replace(/\/{2,}/g, "/");
  if (pathname.length > 1) {
    pathname = pathname.replace(/\/+$/, "") || "/";
  }
  url.pathname = pathname;

  return url.toString();
}

/** Hosts differing only by a `www.` prefix are the same site in practice. */
export function registrableHost(rawUrl) {
  try {
    return new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Whether a URL belongs to the site being audited.
 *
 * Deliberately looser than an origin match: sitemaps routinely list the
 * canonical host (`example.com`) when you passed `www.example.com`, and may
 * list https while you passed http. A strict origin comparison silently
 * discards the entire sitemap in that very common case, so hosts are compared
 * with the `www.` prefix stripped and the scheme ignored.
 */
export function sameOrigin(candidateUrl, originUrl) {
  const candidate = registrableHost(candidateUrl);
  const origin = registrableHost(originUrl);
  return candidate !== null && candidate === origin;
}

export function isProbablyPage(rawUrl) {
  let pathname;
  try {
    pathname = new URL(rawUrl).pathname;
  } catch {
    return false;
  }

  const lastSegment = pathname.split("/").pop() ?? "";
  const dot = lastSegment.lastIndexOf(".");
  if (dot === -1) {
    return true;
  }

  const extension = lastSegment.slice(dot + 1).toLowerCase();
  // .html/.php/.aspx and friends are pages despite having an extension.
  if (["html", "htm", "php", "asp", "aspx", "jsp", "shtml"].includes(extension)) {
    return true;
  }

  return !NON_PAGE_EXTENSIONS.has(extension);
}

export function isDestructive(rawUrl) {
  return DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(rawUrl));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_ID = /^[0-9a-f]{16,}$/i;
const CONTAINS_DIGIT = /\d/;

/**
 * Collapses a URL into the template it was rendered from, so /blog/2026/my-post
 * and /blog/2025/other-post share one pattern.
 *
 * Segments become `:id` when they are numeric, a UUID, a long hex string, or a
 * slug carrying digits (dated or numbered posts). A purely alphabetic slug is
 * kept, because /about and /contact are genuinely different templates.
 */
export function routePatternFor(rawUrl) {
  let pathname;
  try {
    pathname = new URL(rawUrl).pathname;
  } catch {
    return "/";
  }

  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) {
    return "/";
  }

  const pattern = segments.map((segment) => {
    const bare = segment.replace(/\.(html?|php|aspx?|jsp|shtml)$/i, "");

    if (!bare) return ":id";
    if (/^\d+$/.test(bare)) return ":id";
    if (UUID.test(bare)) return ":id";
    if (HEX_ID.test(bare)) return ":id";
    // Long slugs with digits are almost always generated content.
    if (CONTAINS_DIGIT.test(bare) && bare.length > 8) return ":slug";
    return bare.toLowerCase();
  });

  return `/${pattern.join("/")}`;
}

/**
 * Refines route patterns using the whole discovered set.
 *
 * `routePatternFor` sees one URL at a time, so it cannot tell that
 * /posts/alt-text and /posts/aria-landmark-roles are the same template — both
 * slugs are plain words. Looking at the corpus makes it obvious: when one
 * parent path has many distinct children, those children are records, not
 * sections.
 *
 * Depth-1 segments are never collapsed. /about and /contact are siblings under
 * the root too, but they are genuinely different pages rather than rows of one
 * template, and collapsing them to /:slug would erase the whole site.
 *
 * @param {string[]} urls normalized URLs
 * @param {number} threshold distinct children before a level is treated as records
 * @returns {Map<string, string>} normalized URL -> refined route pattern
 */
export function refineRoutePatterns(urls, threshold = 3) {
  const patterns = new Map(urls.map((url) => [url, routePatternFor(url)]));

  // Collect the distinct child segments seen under each parent, per depth.
  const childrenByParent = new Map();

  for (const pattern of patterns.values()) {
    const segments = pattern.split("/").filter(Boolean);
    for (let depth = 1; depth < segments.length; depth += 1) {
      const parent = `/${segments.slice(0, depth).join("/")}`;
      const key = `${depth}|${parent}`;
      const entry = childrenByParent.get(key) ?? new Set();
      entry.add(segments[depth]);
      childrenByParent.set(key, entry);
    }
  }

  const collapsed = new Set(
    [...childrenByParent.entries()]
      .filter(([, children]) => {
        const real = [...children].filter((segment) => !segment.startsWith(":"));
        return real.length >= threshold;
      })
      .map(([key]) => key),
  );

  if (!collapsed.size) {
    return patterns;
  }

  for (const [url, pattern] of patterns) {
    const segments = pattern.split("/").filter(Boolean);
    let changed = false;

    for (let depth = 1; depth < segments.length; depth += 1) {
      const parent = `/${segments.slice(0, depth).join("/")}`;
      if (collapsed.has(`${depth}|${parent}`) && !segments[depth].startsWith(":")) {
        segments[depth] = ":slug";
        changed = true;
      }
    }

    if (changed) {
      patterns.set(url, `/${segments.join("/")}`);
    }
  }

  return patterns;
}

/** Human-readable name derived from the last meaningful path segment. */
export function nameFor(rawUrl) {
  let pathname;
  try {
    pathname = new URL(rawUrl).pathname;
  } catch {
    return rawUrl;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) {
    return "Home";
  }

  const last = segments[segments.length - 1]
    .replace(/\.(html?|php|aspx?|jsp|shtml)$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!last) {
    return pathname;
  }

  return last.charAt(0).toUpperCase() + last.slice(1);
}
