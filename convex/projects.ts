import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { projectBySlugOrId } from "./slugs";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").order("desc").take(20);
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

/** Accepts a slug or a raw ID so links predating slugs keep working. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await projectBySlugOrId(ctx, args.slug);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    clientName: v.optional(v.string()),
    defaultWcagVersion: v.string(),
    defaultConformanceLevel: v.union(v.literal("A"), v.literal("AA"), v.literal("AAA")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error("A project with this slug already exists.");
    }

    return await ctx.db.insert("projects", {
      ...args,
      updatedAt: Date.now(),
    });
  },
});

export const removeBySlug = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!existing) {
      return null;
    }

    await ctx.db.delete(existing._id);
    return existing._id;
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    const audits = await ctx.db
      .query("audits")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(50);

    for (const audit of audits) {
      const scopeItems = await ctx.db
        .query("scopeItems")
        .withIndex("by_audit", (q) => q.eq("auditId", audit._id))
        .take(100);
      for (const item of scopeItems) {
        await ctx.db.delete(item._id);
      }

      const testMatrixEntries = await ctx.db
        .query("testMatrixEntries")
        .withIndex("by_audit", (q) => q.eq("auditId", audit._id))
        .take(100);
      for (const entry of testMatrixEntries) {
        await ctx.db.delete(entry._id);
      }

      const testRuns = await ctx.db
        .query("testRuns")
        .withIndex("by_audit", (q) => q.eq("auditId", audit._id))
        .take(100);
      for (const run of testRuns) {
        await ctx.db.delete(run._id);
      }

      const observations = await ctx.db
        .query("observations")
        .withIndex("by_audit", (q) => q.eq("auditId", audit._id))
        .take(100);
      for (const observation of observations) {
        await ctx.db.delete(observation._id);
      }

      const findings = await ctx.db
        .query("findings")
        .withIndex("by_audit", (q) => q.eq("auditId", audit._id))
        .take(100);
      for (const finding of findings) {
        await ctx.db.delete(finding._id);
      }

      const evidence = await ctx.db
        .query("evidence")
        .withIndex("by_audit", (q) => q.eq("auditId", audit._id))
        .take(100);
      for (const item of evidence) {
        await ctx.db.delete(item._id);
      }

      const reports = await ctx.db
        .query("reports")
        .withIndex("by_audit", (q) => q.eq("auditId", audit._id))
        .take(100);
      for (const report of reports) {
        await ctx.db.delete(report._id);
      }

      await ctx.db.delete(audit._id);
    }

    await ctx.db.delete(args.projectId);
    return args.projectId;
  },
});
