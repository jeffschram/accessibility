import { query } from "./_generated/server";

export const listCriteria = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("wcagCriteria").take(100);
  },
});
