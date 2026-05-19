import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("audits").order("desc").take(20);
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("audits")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(20);
  },
});

export const get = query({
  args: { auditId: v.id("audits") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.auditId);
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    wcagVersion: v.string(),
    conformanceLevel: v.union(v.literal("A"), v.literal("AA"), v.literal("AAA")),
    environmentName: v.optional(v.string()),
    environmentUrl: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    return await ctx.db.insert("audits", {
      ...args,
      status: "scoping",
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { auditId: v.id("audits") },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      return null;
    }

    const scopeItems = await ctx.db
      .query("scopeItems")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(100);
    for (const item of scopeItems) {
      await ctx.db.delete(item._id);
    }

    const testMatrixEntries = await ctx.db
      .query("testMatrixEntries")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(100);
    for (const entry of testMatrixEntries) {
      await ctx.db.delete(entry._id);
    }

    const testRuns = await ctx.db
      .query("testRuns")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(100);
    for (const run of testRuns) {
      await ctx.db.delete(run._id);
    }

    const observations = await ctx.db
      .query("observations")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(100);
    for (const observation of observations) {
      await ctx.db.delete(observation._id);
    }

    const findings = await ctx.db
      .query("findings")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(100);
    for (const finding of findings) {
      await ctx.db.delete(finding._id);
    }

    const evidence = await ctx.db
      .query("evidence")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(100);
    for (const item of evidence) {
      await ctx.db.delete(item._id);
    }

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(100);
    for (const report of reports) {
      await ctx.db.delete(report._id);
    }

    await ctx.db.delete(args.auditId);
    return args.auditId;
  },
});
