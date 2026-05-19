import { query } from "./_generated/server";

export const listTasks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("guidanceTasks").take(50);
  },
});
