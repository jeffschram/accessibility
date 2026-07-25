import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const severity = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

const findingStatus = v.union(
  v.literal("open"),
  v.literal("in_remediation"),
  v.literal("ready_for_retest"),
  v.literal("passed_retest"),
  v.literal("failed_retest"),
  v.literal("accepted_risk"),
  v.literal("closed"),
);

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

export const get = query({
  args: { findingId: v.id("findings") },
  handler: async (ctx, args) => {
    const finding = await ctx.db.get(args.findingId);
    if (!finding) {
      return null;
    }

    const evidence = await Promise.all(
      finding.evidenceIds.map(async (evidenceId) => {
        const item = await ctx.db.get(evidenceId);
        if (!item) {
          return null;
        }

        return {
          ...item,
          servedUrl: item.storageId ? await ctx.storage.getUrl(item.storageId) : item.url,
        };
      }),
    );

    return { ...finding, evidence: evidence.filter((item) => item !== null) };
  },
});

export const create = mutation({
  args: {
    auditId: v.id("audits"),
    title: v.string(),
    severity,
    priority: severity,
    wcagCriteria: v.array(v.string()),
    affectedPageIds: v.optional(v.array(v.id("auditPages"))),
    userImpact: v.optional(v.string()),
    stepsToReproduce: v.optional(v.string()),
    actualResult: v.optional(v.string()),
    expectedResult: v.optional(v.string()),
    recommendedFix: v.optional(v.string()),
    acceptanceCriteria: v.optional(v.string()),
    evidenceIds: v.optional(v.array(v.id("evidence"))),
    owner: v.optional(v.string()),
    targetDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    const title = args.title.trim();
    if (!title) {
      throw new Error("A finding title is required.");
    }

    const { evidenceIds, ...fields } = args;

    return await ctx.db.insert("findings", {
      ...fields,
      title,
      projectId: audit.projectId,
      status: "open",
      affectedScopeItemIds: [],
      evidenceIds: evidenceIds ?? [],
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    findingId: v.id("findings"),
    title: v.optional(v.string()),
    severity: v.optional(severity),
    priority: v.optional(severity),
    wcagCriteria: v.optional(v.array(v.string())),
    affectedPageIds: v.optional(v.array(v.id("auditPages"))),
    userImpact: v.optional(v.string()),
    stepsToReproduce: v.optional(v.string()),
    actualResult: v.optional(v.string()),
    expectedResult: v.optional(v.string()),
    recommendedFix: v.optional(v.string()),
    acceptanceCriteria: v.optional(v.string()),
    owner: v.optional(v.string()),
    targetDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { findingId, ...fields } = args;

    const finding = await ctx.db.get(findingId);
    if (!finding) {
      throw new Error("Finding not found.");
    }

    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    );

    await ctx.db.patch(findingId, { ...patch, updatedAt: Date.now() });
    return findingId;
  },
});

export const updateStatus = mutation({
  args: {
    findingId: v.id("findings"),
    status: findingStatus,
  },
  handler: async (ctx, args) => {
    const finding = await ctx.db.get(args.findingId);
    if (!finding) {
      throw new Error("Finding not found.");
    }

    await ctx.db.patch(args.findingId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.findingId;
  },
});

export const remove = mutation({
  args: { findingId: v.id("findings") },
  handler: async (ctx, args) => {
    const finding = await ctx.db.get(args.findingId);
    if (!finding) {
      return null;
    }

    // Release the observations this finding was promoted from so they return to
    // the triage queue rather than being stranded as converted.
    for (const observationId of finding.sourceObservationIds ?? []) {
      const observation = await ctx.db.get(observationId);
      if (observation?.status === "converted_to_finding") {
        await ctx.db.patch(observationId, {
          status: "triaged",
          updatedAt: Date.now(),
        });
      }
    }

    for (const evidenceId of finding.evidenceIds) {
      await ctx.db.patch(evidenceId, { findingId: undefined });
    }

    await ctx.db.delete(args.findingId);
    return args.findingId;
  },
});
