import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const severity = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

const scopeType = v.union(
  v.literal("page"),
  v.literal("flow"),
  v.literal("component"),
  v.literal("state"),
);

const discoverySource = v.union(
  v.literal("manual"),
  v.literal("sitemap"),
  v.literal("crawl"),
);

export const listByAudit = query({
  args: {
    auditId: v.id("audits"),
    included: v.optional(v.boolean()),
    promoted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("scopeItems")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(5000);

    return items.filter((item) => {
      if (args.included !== undefined && item.included !== args.included) {
        return false;
      }
      if (args.promoted !== undefined) {
        if (args.promoted !== Boolean(item.promotedPageId)) {
          return false;
        }
      }
      return true;
    });
  },
});

/**
 * Cluster summary for the review screen: a large discovered set should read as
 * a handful of templates, not thousands of rows.
 */
export const getCounts = query({
  args: { auditId: v.id("audits") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("scopeItems")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(5000);

    const clusters = new Map<string, { key: string; total: number; included: number }>();

    for (const item of items) {
      const key = item.clusterKey ?? item.routePattern ?? item.url ?? item.name;
      const entry = clusters.get(key) ?? { key, total: 0, included: 0 };
      entry.total += 1;
      if (item.included) {
        entry.included += 1;
      }
      clusters.set(key, entry);
    }

    return {
      counts: {
        total: items.length,
        included: items.filter((item) => item.included).length,
        excluded: items.filter((item) => !item.included).length,
        promoted: items.filter((item) => Boolean(item.promotedPageId)).length,
      },
      clusters: [...clusters.values()].sort((first, second) => second.total - first.total),
    };
  },
});

export const create = mutation({
  args: {
    auditId: v.id("audits"),
    type: scopeType,
    name: v.string(),
    url: v.optional(v.string()),
    routePattern: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: severity,
    riskNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    return await ctx.db.insert("scopeItems", {
      ...args,
      normalizedUrl: args.url,
      discoverySource: "manual",
      included: true,
      testStatus: "not_started",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Bulk intake for the discovery worker. Discovered URLs land with
 * `included: false` — nothing enters an audit's scope without a human saying so.
 * Re-running discovery refreshes metadata on rows nobody has acted on and
 * leaves included/excluded decisions alone.
 */
export const createBatch = mutation({
  args: {
    auditId: v.id("audits"),
    items: v.array(
      v.object({
        type: v.optional(scopeType),
        name: v.string(),
        url: v.string(),
        normalizedUrl: v.string(),
        routePattern: v.optional(v.string()),
        description: v.optional(v.string()),
        riskNotes: v.optional(v.string()),
        discoverySource: v.optional(discoverySource),
        discoveryDepth: v.optional(v.number()),
        clusterKey: v.optional(v.string()),
        clusterSize: v.optional(v.number()),
        isRepresentative: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    const now = Date.now();
    let created = 0;
    let updated = 0;
    const ids: Id<"scopeItems">[] = [];

    for (const item of args.items) {
      const existing = await ctx.db
        .query("scopeItems")
        .withIndex("by_audit_url", (q) =>
          q.eq("auditId", args.auditId).eq("normalizedUrl", item.normalizedUrl),
        )
        .first();

      if (existing) {
        // Refresh discovery metadata, but never overturn a human's
        // include/exclude decision or re-point a promoted row.
        await ctx.db.patch(existing._id, {
          routePattern: item.routePattern,
          clusterKey: item.clusterKey,
          clusterSize: item.clusterSize,
          isRepresentative: item.isRepresentative,
          discoverySource: item.discoverySource,
          discoveryDepth: item.discoveryDepth,
          updatedAt: now,
        });
        ids.push(existing._id);
        updated += 1;
        continue;
      }

      ids.push(
        await ctx.db.insert("scopeItems", {
          auditId: args.auditId,
          type: item.type ?? "page",
          name: item.name,
          url: item.url,
          normalizedUrl: item.normalizedUrl,
          routePattern: item.routePattern,
          description: item.description,
          riskNotes: item.riskNotes,
          discoverySource: item.discoverySource ?? "sitemap",
          discoveryDepth: item.discoveryDepth,
          clusterKey: item.clusterKey,
          clusterSize: item.clusterSize,
          isRepresentative: item.isRepresentative,
          included: false,
          priority: "medium",
          testStatus: "not_started",
          updatedAt: now,
        }),
      );
      created += 1;
    }

    return { created, updated, total: args.items.length, ids };
  },
});

export const setIncluded = mutation({
  args: {
    scopeItemIds: v.array(v.id("scopeItems")),
    included: v.boolean(),
  },
  handler: async (ctx, args) => {
    for (const scopeItemId of args.scopeItemIds) {
      const item = await ctx.db.get(scopeItemId);
      if (!item) {
        continue;
      }
      await ctx.db.patch(scopeItemId, {
        included: args.included,
        updatedAt: Date.now(),
      });
    }

    return args.scopeItemIds.length;
  },
});

/** Include or exclude a whole template cluster in one action. */
export const setClusterIncluded = mutation({
  args: {
    auditId: v.id("audits"),
    clusterKey: v.string(),
    included: v.boolean(),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("scopeItems")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(5000);

    const now = Date.now();
    let changed = 0;

    for (const item of items) {
      const key = item.clusterKey ?? item.routePattern ?? item.url ?? item.name;
      if (key !== args.clusterKey || item.included === args.included) {
        continue;
      }
      await ctx.db.patch(item._id, { included: args.included, updatedAt: now });
      changed += 1;
    }

    return changed;
  },
});

export const setPriority = mutation({
  args: {
    scopeItemIds: v.array(v.id("scopeItems")),
    priority: severity,
  },
  handler: async (ctx, args) => {
    for (const scopeItemId of args.scopeItemIds) {
      const item = await ctx.db.get(scopeItemId);
      if (!item) {
        continue;
      }
      await ctx.db.patch(scopeItemId, {
        priority: args.priority,
        updatedAt: Date.now(),
      });
    }

    return args.scopeItemIds.length;
  },
});

export const remove = mutation({
  args: { scopeItemId: v.id("scopeItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.scopeItemId);
    if (!item) {
      return null;
    }

    await ctx.db.delete(args.scopeItemId);
    return args.scopeItemId;
  },
});

/** Clears discovered-but-unpromoted rows so a fresh discovery run starts clean. */
export const clearUnpromoted = mutation({
  args: { auditId: v.id("audits") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("scopeItems")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(5000);

    let removed = 0;
    for (const item of items) {
      if (item.promotedPageId || item.discoverySource === "manual") {
        continue;
      }
      await ctx.db.delete(item._id);
      removed += 1;
    }

    return { removed };
  },
});

export type ScopeItem = Doc<"scopeItems">;
export type ScopeMutationCtx = MutationCtx;
