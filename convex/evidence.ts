import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const evidenceType = v.union(
  v.literal("screenshot"),
  v.literal("dom"),
  v.literal("tool_output"),
  v.literal("screen_reader_notes"),
  v.literal("video"),
  v.literal("trace"),
  v.literal("link"),
);

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    auditId: v.id("audits"),
    observationId: v.optional(v.id("observations")),
    findingId: v.optional(v.id("findings")),
    type: evidenceType,
    label: v.string(),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    text: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    if (!args.storageId && !args.url && !args.text) {
      throw new Error("Evidence needs a storageId, url, or text payload.");
    }

    return await ctx.db.insert("evidence", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const createBatch = mutation({
  args: {
    auditId: v.id("audits"),
    items: v.array(
      v.object({
        type: evidenceType,
        label: v.string(),
        storageId: v.optional(v.id("_storage")),
        url: v.optional(v.string()),
        text: v.optional(v.string()),
        metadata: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    const createdAt = Date.now();
    const ids = [];

    for (const item of args.items) {
      if (!item.storageId && !item.url && !item.text) {
        throw new Error(`Evidence "${item.label}" needs a storageId, url, or text payload.`);
      }

      ids.push(
        await ctx.db.insert("evidence", {
          auditId: args.auditId,
          ...item,
          createdAt,
        }),
      );
    }

    return ids;
  },
});

export const listByObservation = query({
  args: { observationId: v.id("observations") },
  handler: async (ctx, args) => {
    const observation = await ctx.db.get(args.observationId);
    if (!observation) {
      return [];
    }

    const items = await Promise.all(
      observation.evidenceIds.map((evidenceId) => ctx.db.get(evidenceId)),
    );

    return await Promise.all(
      items.filter((item) => item !== null).map(async (item) => ({
        ...item,
        servedUrl: item.storageId ? await ctx.storage.getUrl(item.storageId) : item.url,
      })),
    );
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
