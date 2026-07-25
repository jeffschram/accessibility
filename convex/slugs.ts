import type { Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

/** Convex IDs are 32 lowercase base32 characters. */
const CONVEX_ID = /^[0-9a-z]{32}$/;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * A slug and a Convex ID are both plain strings in a URL, so a value that looks
 * like an ID is worth trying as one. This keeps links created before slugs
 * existed working instead of 404ing.
 */
export function looksLikeId(value: string) {
  return CONVEX_ID.test(value);
}

export async function projectBySlugOrId(ctx: QueryCtx | MutationCtx, slugOrId: string) {
  const bySlug = await ctx.db
    .query("projects")
    .withIndex("by_slug", (q) => q.eq("slug", slugOrId))
    .unique();

  if (bySlug) {
    return bySlug;
  }

  return looksLikeId(slugOrId) ? await ctx.db.get(slugOrId as Id<"projects">) : null;
}

export async function auditBySlugOrId(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  slugOrId: string,
) {
  const bySlug = await ctx.db
    .query("audits")
    .withIndex("by_project_slug", (q) => q.eq("projectId", projectId).eq("slug", slugOrId))
    .unique();

  if (bySlug) {
    return bySlug;
  }

  if (!looksLikeId(slugOrId)) {
    return null;
  }

  const byId = await ctx.db.get(slugOrId as Id<"audits">);
  return byId?.projectId === projectId ? byId : null;
}

/**
 * Audit slugs only need to be unique inside their project, so two projects can
 * each have a "baseline-audit".
 */
export async function uniqueAuditSlug(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  name: string,
  fallback = "audit",
) {
  const base = slugify(name) || fallback;

  for (let attempt = 0; ; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await ctx.db
      .query("audits")
      .withIndex("by_project_slug", (q) => q.eq("projectId", projectId).eq("slug", candidate))
      .unique();

    if (!taken) {
      return candidate;
    }
  }
}
