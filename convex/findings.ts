import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("findings").order("desc").take(50);
  },
});

export const listByAudit = query({
  args: { auditId: v.id("audits") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("findings")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .order("desc")
      .take(50);
  },
});
