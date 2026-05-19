import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByAudit = query({
  args: { auditId: v.id("audits") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scopeItems")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(50);
  },
});

export const create = mutation({
  args: {
    auditId: v.id("audits"),
    type: v.union(v.literal("page"), v.literal("flow"), v.literal("component"), v.literal("state")),
    name: v.string(),
    url: v.optional(v.string()),
    routePattern: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    ),
    riskNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    return await ctx.db.insert("scopeItems", {
      ...args,
      included: true,
      testStatus: "not_started",
      updatedAt: Date.now(),
    });
  },
});
