import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { defaultComponentTypes } from "./componentTemplates";

const optionalString = v.optional(v.string());

export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const types = await ctx.db.query("componentTypes").order("asc").take(200);
    const visibleTypes = args.includeArchived
      ? types
      : types.filter((type) => type.archivedAt === undefined);

    return await Promise.all(
      visibleTypes.map(async (type) => {
        const checks = await ctx.db
          .query("componentCheckTemplates")
          .withIndex("by_component_type", (q) => q.eq("componentTypeId", type._id))
          .take(200);
        const mappings = await ctx.db
          .query("componentTypeWcagMappings")
          .withIndex("by_component_type", (q) => q.eq("componentTypeId", type._id))
          .take(200);
        const criteria = await Promise.all(
          mappings.map(async (mapping) => ({
            ...mapping,
            criterion: await ctx.db.get(mapping.wcagCriterionId),
          })),
        );

        return {
          ...type,
          checks: checks
            .filter((check) => args.includeArchived || check.archivedAt === undefined)
            .sort((first, second) => first.order - second.order),
          wcagMappings: criteria
            .filter((mapping) => mapping.criterion !== null)
            .sort((first, second) =>
              first.criterion!.criterion.localeCompare(second.criterion!.criterion, undefined, {
                numeric: true,
              }),
            ),
        };
      }),
    );
  },
});

export const listActiveOptions = query({
  args: {},
  handler: async (ctx) => {
    const types = await ctx.db.query("componentTypes").order("asc").take(200);
    const activeTypes = types.filter((type) => type.archivedAt === undefined);

    if (activeTypes.length) {
      return activeTypes
        .map((type) => ({
          key: type.key,
          name: type.name,
          description: type.description,
          exampleUrls: type.exampleUrls,
        }))
        .sort((first, second) => first.name.localeCompare(second.name));
    }

    return defaultComponentTypes
      .map((type) => ({
        key: type.key,
        name: type.name,
        description: type.description,
        exampleUrls: type.exampleUrls,
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;

    for (const type of defaultComponentTypes) {
      const existing = await ctx.db
        .query("componentTypes")
        .withIndex("by_key", (q) => q.eq("key", type.key))
        .first();

      if (existing) {
        continue;
      }

      const componentTypeId = await ctx.db.insert("componentTypes", {
        key: type.key,
        name: type.name,
        description: type.description,
        exampleUrls: type.exampleUrls,
        updatedAt: Date.now(),
      });

      for (const [index, check] of type.checks.entries()) {
        await ctx.db.insert("componentCheckTemplates", {
          componentTypeId,
          key: check.key,
          title: check.title,
          instructions: check.instructions,
          expectedBehavior: check.expectedBehavior,
          wcagCriteria: check.wcagCriteria,
          order: index,
          updatedAt: Date.now(),
        });
      }

      created += 1;
    }

    return created;
  },
});

export const seedWcagMappingsFromChecks = mutation({
  args: {},
  handler: async (ctx) => {
    const types = await ctx.db.query("componentTypes").take(200);
    const criteria = await ctx.db.query("wcagCriteria").take(200);
    let created = 0;

    for (const type of types) {
      const checks = await ctx.db
        .query("componentCheckTemplates")
        .withIndex("by_component_type", (q) => q.eq("componentTypeId", type._id))
        .take(200);
      const existing = await ctx.db
        .query("componentTypeWcagMappings")
        .withIndex("by_component_type", (q) => q.eq("componentTypeId", type._id))
        .take(200);
      const criterionNumbers = new Set(checks.flatMap((check) => check.wcagCriteria));

      for (const criterionNumber of criterionNumbers) {
        const criterion = criteria.find(
          (candidate) =>
            candidate.version === "2.2" && candidate.criterion === criterionNumber,
        );
        if (!criterion) {
          continue;
        }

        const alreadyMapped = existing.some(
          (mapping) => mapping.wcagCriterionId === criterion._id,
        );

        if (!alreadyMapped) {
          await ctx.db.insert("componentTypeWcagMappings", {
            componentTypeId: type._id,
            wcagCriterionId: criterion._id,
            relevance: "common",
            updatedAt: Date.now(),
          });
          created += 1;
        }
      }
    }

    return created;
  },
});

export const createType = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    description: optionalString,
    exampleUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const key = normalizeKey(args.key);
    const existing = await ctx.db
      .query("componentTypes")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      throw new Error("A component type with this key already exists.");
    }

    return await ctx.db.insert("componentTypes", {
      key,
      name: args.name,
      description: args.description,
      exampleUrls: args.exampleUrls,
      updatedAt: Date.now(),
    });
  },
});

export const updateType = mutation({
  args: {
    typeId: v.id("componentTypes"),
    key: v.string(),
    name: v.string(),
    description: optionalString,
    exampleUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const key = normalizeKey(args.key);
    const existing = await ctx.db
      .query("componentTypes")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing && existing._id !== args.typeId) {
      throw new Error("A component type with this key already exists.");
    }

    await ctx.db.patch(args.typeId, {
      key,
      name: args.name,
      description: args.description,
      exampleUrls: args.exampleUrls,
      updatedAt: Date.now(),
    });

    return args.typeId;
  },
});

export const archiveType = mutation({
  args: { typeId: v.id("componentTypes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.typeId, {
      archivedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.typeId;
  },
});

export const createCheckTemplate = mutation({
  args: {
    componentTypeId: v.id("componentTypes"),
    key: v.string(),
    title: v.string(),
    instructions: v.string(),
    expectedBehavior: v.string(),
    wcagCriteria: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existingChecks = await ctx.db
      .query("componentCheckTemplates")
      .withIndex("by_component_type", (q) => q.eq("componentTypeId", args.componentTypeId))
      .take(200);

    return await ctx.db.insert("componentCheckTemplates", {
      componentTypeId: args.componentTypeId,
      key: normalizeKey(args.key),
      title: args.title,
      instructions: args.instructions,
      expectedBehavior: args.expectedBehavior,
      wcagCriteria: args.wcagCriteria,
      order: existingChecks.length,
      updatedAt: Date.now(),
    });
  },
});

export const updateCheckTemplate = mutation({
  args: {
    checkId: v.id("componentCheckTemplates"),
    key: v.string(),
    title: v.string(),
    instructions: v.string(),
    expectedBehavior: v.string(),
    wcagCriteria: v.array(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.checkId, {
      key: normalizeKey(args.key),
      title: args.title,
      instructions: args.instructions,
      expectedBehavior: args.expectedBehavior,
      wcagCriteria: args.wcagCriteria,
      order: args.order,
      updatedAt: Date.now(),
    });

    return args.checkId;
  },
});

export const archiveCheckTemplate = mutation({
  args: { checkId: v.id("componentCheckTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.checkId, {
      archivedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.checkId;
  },
});

export const addWcagMapping = mutation({
  args: {
    componentTypeId: v.id("componentTypes"),
    wcagCriterionId: v.id("wcagCriteria"),
    relevance: v.union(
      v.literal("required"),
      v.literal("common"),
      v.literal("conditional"),
    ),
    notes: optionalString,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("componentTypeWcagMappings")
      .withIndex("by_component_type", (q) => q.eq("componentTypeId", args.componentTypeId))
      .take(200);
    const match = existing.find((mapping) => mapping.wcagCriterionId === args.wcagCriterionId);

    if (match) {
      await ctx.db.patch(match._id, {
        relevance: args.relevance,
        notes: args.notes,
        updatedAt: Date.now(),
      });
      return match._id;
    }

    return await ctx.db.insert("componentTypeWcagMappings", {
      componentTypeId: args.componentTypeId,
      wcagCriterionId: args.wcagCriterionId,
      relevance: args.relevance,
      notes: args.notes,
      updatedAt: Date.now(),
    });
  },
});

export const removeWcagMapping = mutation({
  args: { mappingId: v.id("componentTypeWcagMappings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.mappingId);
    return args.mappingId;
  },
});

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
