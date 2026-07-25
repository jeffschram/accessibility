/**
 * Minimal robots.txt matching for the default user-agent group.
 *
 * This runs against client production sites, so Disallow rules are honoured
 * rather than treated as advisory. Only the subset of the spec that matters
 * here is implemented: `*` wildcards, `$` end-anchors, and Allow winning over
 * Disallow when it is the more specific match.
 */

function toPattern(rule) {
  const escaped = rule
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  return escaped.endsWith("\\$")
    ? new RegExp(`^${escaped.slice(0, -2)}$`)
    : new RegExp(`^${escaped}`);
}

/**
 * Builds a matcher from the parsed rules of the default (`*`) user-agent group.
 *
 * @param {{allow: string[], disallow: string[]}} rules
 * @returns {(pathname: string) => boolean} true when crawling is permitted
 */
export function createRobotsMatcher(rules) {
  const allow = (rules.allow ?? []).map((rule) => ({
    length: rule.length,
    pattern: toPattern(rule),
  }));
  const disallow = (rules.disallow ?? []).map((rule) => ({
    length: rule.length,
    pattern: toPattern(rule),
  }));

  if (!disallow.length) {
    return () => true;
  }

  return (pathname) => {
    // Longest match wins, and Allow beats Disallow at equal length — the
    // behaviour Google and the RFC 9309 draft both specify.
    let bestDisallow = -1;
    let bestAllow = -1;

    for (const rule of disallow) {
      if (rule.pattern.test(pathname) && rule.length > bestDisallow) {
        bestDisallow = rule.length;
      }
    }

    if (bestDisallow === -1) {
      return true;
    }

    for (const rule of allow) {
      if (rule.pattern.test(pathname) && rule.length > bestAllow) {
        bestAllow = rule.length;
      }
    }

    return bestAllow >= bestDisallow;
  };
}
