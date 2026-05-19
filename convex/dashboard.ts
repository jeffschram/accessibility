import { query } from "./_generated/server";

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").order("desc").take(20);
    const audits = await ctx.db.query("audits").order("desc").take(20);
    const findings = await ctx.db.query("findings").order("desc").take(50);
    const scopeItems = await ctx.db.query("scopeItems").take(50);
    const guidanceTasks = await ctx.db.query("guidanceTasks").take(20);
    const wcagCriteria = await ctx.db.query("wcagCriteria").take(100);

    return {
      projects,
      audits,
      findings,
      scopeItems,
      guidanceTasks,
      wcagCriteria,
    };
  },
});
