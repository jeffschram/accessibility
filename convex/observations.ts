import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const observationSource = v.union(
  v.literal("automated"),
  v.literal("manual"),
  v.literal("screen_reader"),
  v.literal("keyboard"),
  v.literal("code_review"),
  v.literal("imported"),
);

const observationStatus = v.union(
  v.literal("new"),
  v.literal("triaged"),
  v.literal("dismissed"),
  v.literal("converted_to_finding"),
);

const confidence = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("needs_review"),
);

const severity = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

const evidenceInput = v.object({
  type: v.union(
    v.literal("screenshot"),
    v.literal("dom"),
    v.literal("tool_output"),
    v.literal("screen_reader_notes"),
    v.literal("video"),
    v.literal("trace"),
    v.literal("link"),
  ),
  label: v.string(),
  storageId: v.optional(v.id("_storage")),
  url: v.optional(v.string()),
  text: v.optional(v.string()),
  metadata: v.optional(v.any()),
});

const observationInput = v.object({
  pageId: v.optional(v.id("auditPages")),
  url: v.optional(v.string()),
  source: observationSource,
  title: v.string(),
  description: v.optional(v.string()),
  rawTool: v.optional(v.string()),
  rawRuleId: v.optional(v.string()),
  suggestedWcag: v.array(v.string()),
  relatedGuidanceTaskId: v.optional(v.string()),
  confidence: v.optional(confidence),
  metadata: v.optional(v.any()),
  evidence: v.optional(v.array(evidenceInput)),
});

export const listByAudit = query({
  args: {
    auditId: v.id("audits"),
    status: v.optional(observationStatus),
    source: v.optional(observationSource),
    rawRuleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const observations = args.status
      ? await ctx.db
          .query("observations")
          .withIndex("by_audit_status", (q) =>
            q.eq("auditId", args.auditId).eq("status", args.status!),
          )
          .order("desc")
          .take(500)
      : await ctx.db
          .query("observations")
          .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
          .order("desc")
          .take(500);

    const filtered = observations.filter((observation) => {
      if (args.source && observation.source !== args.source) {
        return false;
      }
      if (args.rawRuleId && observation.rawRuleId !== args.rawRuleId) {
        return false;
      }
      return true;
    });

    return await Promise.all(filtered.map((observation) => hydrate(ctx, observation)));
  },
});

export const getCounts = query({
  args: { auditId: v.id("audits") },
  handler: async (ctx, args) => {
    const observations = await ctx.db
      .query("observations")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(1000);

    const counts = {
      total: observations.length,
      new: 0,
      triaged: 0,
      dismissed: 0,
      converted_to_finding: 0,
    };

    const rules = new Map<string, number>();

    for (const observation of observations) {
      counts[observation.status] += 1;
      if (observation.rawRuleId) {
        rules.set(observation.rawRuleId, (rules.get(observation.rawRuleId) ?? 0) + 1);
      }
    }

    return {
      counts,
      rules: [...rules.entries()]
        .map(([rawRuleId, count]) => ({ rawRuleId, count }))
        .sort((first, second) => second.count - first.count),
    };
  },
});

export const get = query({
  args: { observationId: v.id("observations") },
  handler: async (ctx, args) => {
    const observation = await ctx.db.get(args.observationId);
    if (!observation) {
      return null;
    }

    return await hydrate(ctx, observation);
  },
});

export const create = mutation({
  args: { auditId: v.id("audits"), observation: observationInput },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    const [id] = await insertObservations(ctx, args.auditId, [args.observation]);
    return id;
  },
});

/**
 * Bulk intake for the scan worker. Re-running a scan updates the matching
 * untriaged observation instead of stacking duplicates, so the queue reflects
 * the latest run rather than every run.
 */
export const createBatch = mutation({
  args: {
    auditId: v.id("audits"),
    observations: v.array(observationInput),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    return await insertObservations(ctx, args.auditId, args.observations);
  },
});

export const triage = mutation({
  args: {
    observationId: v.id("observations"),
    triageNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const observation = await ctx.db.get(args.observationId);
    if (!observation) {
      throw new Error("Observation not found.");
    }

    await ctx.db.patch(args.observationId, {
      status: "triaged",
      triageNote: args.triageNote,
      updatedAt: Date.now(),
    });

    return args.observationId;
  },
});

export const dismiss = mutation({
  args: {
    observationId: v.id("observations"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const observation = await ctx.db.get(args.observationId);
    if (!observation) {
      throw new Error("Observation not found.");
    }

    const reason = args.reason.trim();
    if (!reason) {
      throw new Error("A dismissal reason is required.");
    }

    await ctx.db.patch(args.observationId, {
      status: "dismissed",
      dismissReason: reason,
      updatedAt: Date.now(),
    });

    return args.observationId;
  },
});

export const reopen = mutation({
  args: { observationId: v.id("observations") },
  handler: async (ctx, args) => {
    const observation = await ctx.db.get(args.observationId);
    if (!observation) {
      throw new Error("Observation not found.");
    }

    if (observation.status === "converted_to_finding") {
      throw new Error("Delete the finding before reopening this observation.");
    }

    await ctx.db.patch(args.observationId, {
      status: "new",
      dismissReason: undefined,
      updatedAt: Date.now(),
    });

    return args.observationId;
  },
});

/**
 * The trust boundary. Automated and AI pipelines write observations only; a
 * human calls this to promote one into a finding. Nothing else in the codebase
 * may insert into the findings table on behalf of a tool.
 */
export const convertToFinding = mutation({
  args: {
    observationId: v.id("observations"),
    severity,
    priority: severity,
    title: v.optional(v.string()),
    wcagCriteria: v.optional(v.array(v.string())),
    userImpact: v.optional(v.string()),
    stepsToReproduce: v.optional(v.string()),
    recommendedFix: v.optional(v.string()),
    owner: v.optional(v.string()),
    /** Additional observations sharing this root cause, merged into one finding. */
    mergeObservationIds: v.optional(v.array(v.id("observations"))),
  },
  handler: async (ctx, args) => {
    const observation = await ctx.db.get(args.observationId);
    if (!observation) {
      throw new Error("Observation not found.");
    }

    if (observation.status === "converted_to_finding") {
      throw new Error("This observation has already been converted to a finding.");
    }

    const audit = await ctx.db.get(observation.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    const merged: Doc<"observations">[] = [observation];

    for (const mergeId of args.mergeObservationIds ?? []) {
      if (mergeId === args.observationId) {
        continue;
      }

      const candidate = await ctx.db.get(mergeId);
      if (!candidate) {
        throw new Error("Observation to merge was not found.");
      }
      if (candidate.auditId !== observation.auditId) {
        throw new Error("Cannot merge observations across audits.");
      }
      if (candidate.status === "converted_to_finding") {
        throw new Error("An observation to merge is already part of a finding.");
      }

      merged.push(candidate);
    }

    const evidenceIds = unique(merged.flatMap((item) => item.evidenceIds));
    const pageIds = unique(
      merged.map((item) => item.pageId).filter((pageId): pageId is Id<"auditPages"> => Boolean(pageId)),
    );
    const wcagCriteria =
      args.wcagCriteria ?? unique(merged.flatMap((item) => item.suggestedWcag));

    const findingId = await ctx.db.insert("findings", {
      auditId: observation.auditId,
      projectId: audit.projectId,
      title: args.title?.trim() || observation.title,
      status: "open",
      severity: args.severity,
      priority: args.priority,
      wcagCriteria,
      affectedScopeItemIds: [],
      affectedPageIds: pageIds,
      sourceObservationIds: merged.map((item) => item._id),
      userImpact: args.userImpact,
      stepsToReproduce: args.stepsToReproduce ?? describeSteps(merged),
      recommendedFix: args.recommendedFix,
      evidenceIds,
      owner: args.owner,
      updatedAt: Date.now(),
    });

    for (const item of merged) {
      await ctx.db.patch(item._id, {
        status: "converted_to_finding",
        updatedAt: Date.now(),
      });
    }

    for (const evidenceId of evidenceIds) {
      await ctx.db.patch(evidenceId, { findingId });
    }

    return findingId;
  },
});

export const remove = mutation({
  args: { observationId: v.id("observations") },
  handler: async (ctx, args) => {
    const observation = await ctx.db.get(args.observationId);
    if (!observation) {
      return null;
    }

    for (const evidenceId of observation.evidenceIds) {
      const evidence = await ctx.db.get(evidenceId);
      if (evidence && !evidence.findingId) {
        if (evidence.storageId) {
          await ctx.storage.delete(evidence.storageId);
        }
        await ctx.db.delete(evidenceId);
      }
    }

    await ctx.db.delete(args.observationId);
    return args.observationId;
  },
});

async function insertObservations(
  ctx: MutationCtx,
  auditId: Id<"audits">,
  inputs: Array<{
    pageId?: Id<"auditPages">;
    url?: string;
    source: Doc<"observations">["source"];
    title: string;
    description?: string;
    rawTool?: string;
    rawRuleId?: string;
    suggestedWcag: string[];
    relatedGuidanceTaskId?: string;
    confidence?: Doc<"observations">["confidence"];
    metadata?: unknown;
    evidence?: Array<{
      type: Doc<"evidence">["type"];
      label: string;
      storageId?: Id<"_storage">;
      url?: string;
      text?: string;
      metadata?: unknown;
    }>;
  }>,
) {
  const existing = await ctx.db
    .query("observations")
    .withIndex("by_audit", (q) => q.eq("auditId", auditId))
    .take(1000);

  const ids: Id<"observations">[] = [];
  const now = Date.now();

  for (const input of inputs) {
    const { evidence, ...fields } = input;

    // Only replace observations nobody has acted on yet — a triaged, dismissed,
    // or converted observation is a human decision and must survive a re-scan.
    const duplicate = existing.find(
      (candidate) =>
        candidate.status === "new" &&
        candidate.source === input.source &&
        candidate.rawRuleId === input.rawRuleId &&
        candidate.url === input.url &&
        candidate.pageId === input.pageId,
    );

    const observationId =
      duplicate?._id ??
      (await ctx.db.insert("observations", {
        auditId,
        ...fields,
        status: "new",
        evidenceIds: [],
        updatedAt: now,
      }));

    if (duplicate) {
      await ctx.db.patch(observationId, { ...fields, updatedAt: now });

      // Drop the superseded evidence so re-scans do not accumulate screenshots.
      for (const staleId of duplicate.evidenceIds) {
        const stale = await ctx.db.get(staleId);
        if (stale && !stale.findingId) {
          if (stale.storageId) {
            await ctx.storage.delete(stale.storageId);
          }
          await ctx.db.delete(staleId);
        }
      }
    }

    const evidenceIds: Id<"evidence">[] = [];
    for (const item of evidence ?? []) {
      evidenceIds.push(
        await ctx.db.insert("evidence", {
          auditId,
          observationId,
          ...item,
          createdAt: now,
        }),
      );
    }

    await ctx.db.patch(observationId, { evidenceIds });
    ids.push(observationId);
  }

  return ids;
}

async function hydrate(ctx: QueryCtx, observation: Doc<"observations">) {
  const evidence = await Promise.all(
    observation.evidenceIds.map(async (evidenceId) => {
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

  return { ...observation, evidence: evidence.filter((item) => item !== null) };
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function describeSteps(observations: Doc<"observations">[]) {
  const locations = unique(
    observations.map((item) => item.url).filter((url): url is string => Boolean(url)),
  );

  if (!locations.length) {
    return undefined;
  }

  return `Observed on:\n${locations.map((url) => `- ${url}`).join("\n")}`;
}
