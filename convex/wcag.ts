import { query, mutation } from "./_generated/server";
import { defaultWcagCriteria } from "./defaultWcag";

export const listCriteria = query({
  args: {},
  handler: async (ctx) => {
    const criteria = await ctx.db.query("wcagCriteria").take(200);

    return criteria.sort((first, second) =>
      first.criterion.localeCompare(second.criterion, undefined, { numeric: true }),
    );
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;
    let updated = 0;

    for (const criterion of defaultWcagCriteria) {
      const existing = await ctx.db
        .query("wcagCriteria")
        .withIndex("by_version_criterion", (q) =>
          q.eq("version", "2.2").eq("criterion", criterion.criterion),
        )
        .first();

      const value = {
        version: "2.2",
        criterion: criterion.criterion,
        handle: criterion.handle,
        title: criterion.title,
        level: criterion.level,
        principle: criterion.principle,
        guideline: `${criterion.guideline} ${criterion.guidelineTitle}`,
        url: `https://www.w3.org/TR/WCAG22/#${criterion.handle}`,
        summary: `WCAG ${criterion.criterion} ${criterion.title}.`,
        plainLanguageSummary: `Review the official WCAG ${criterion.criterion} success criterion: ${criterion.title}.`,
        commonFailures: [],
        relatedGuidanceTopicIds: [],
        automationPotential: criterion.automationPotential,
      };

      if (existing) {
        await ctx.db.patch(existing._id, value);
        updated += 1;
      } else {
        await ctx.db.insert("wcagCriteria", value);
        created += 1;
      }
    }

    return { created, updated };
  },
});
