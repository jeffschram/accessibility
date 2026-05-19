import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { getComponentChecks } from "./componentTemplates";

const priority = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

const componentScope = v.union(
  v.literal("global"),
  v.literal("shared"),
  v.literal("page_specific"),
);

export const getByAudit = query({
  args: { auditId: v.id("audits") },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("auditPages")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(100);

    const components = await ctx.db
      .query("auditComponents")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(100);

    const instances = await ctx.db
      .query("componentInstances")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .take(200);

    return { pages, components, instances };
  },
});

export const getPageDetail = query({
  args: { pageId: v.id("auditPages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      return null;
    }

    const components = await ctx.db
      .query("auditComponents")
      .withIndex("by_audit", (q) => q.eq("auditId", page.auditId))
      .take(100);

    const instances = await ctx.db
      .query("componentInstances")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .take(100);

    const checks = await ctx.db
      .query("componentChecks")
      .withIndex("by_audit", (q) => q.eq("auditId", page.auditId))
      .take(500);

    return { page, components, instances, checks };
  },
});

export const getComponentDetail = query({
  args: { componentId: v.id("auditComponents") },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.componentId);
    if (!component) {
      return null;
    }

    const instances = await ctx.db
      .query("componentInstances")
      .withIndex("by_component", (q) => q.eq("componentId", args.componentId))
      .take(100);

    const pages = await ctx.db
      .query("auditPages")
      .withIndex("by_audit", (q) => q.eq("auditId", component.auditId))
      .take(100);

    const checks = await ctx.db
      .query("componentChecks")
      .withIndex("by_component", (q) => q.eq("componentId", args.componentId))
      .take(100);

    return { component, instances, pages, checks };
  },
});

export const createPage = mutation({
  args: {
    auditId: v.id("audits"),
    name: v.string(),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    priority,
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    return await ctx.db.insert("auditPages", {
      ...args,
      testStatus: "not_started",
      updatedAt: Date.now(),
    });
  },
});

export const createComponent = mutation({
  args: {
    auditId: v.id("audits"),
    pageId: v.optional(v.id("auditPages")),
    name: v.string(),
    componentType: v.string(),
    scope: componentScope,
    description: v.optional(v.string()),
    instanceNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found.");
    }

    if (args.pageId) {
      const page = await ctx.db.get(args.pageId);
      if (!page || page.auditId !== args.auditId) {
        throw new Error("Page not found for this audit.");
      }
    }

    const componentId = await ctx.db.insert("auditComponents", {
      auditId: args.auditId,
      name: args.name,
      componentType: args.componentType,
      scope: args.scope,
      description: args.description,
      testStatus: "not_started",
      updatedAt: Date.now(),
    });

    await createChecksForComponent(ctx, {
      auditId: args.auditId,
      componentId,
      componentType: args.componentType,
    });

    if (args.pageId) {
      await ctx.db.insert("componentInstances", {
        auditId: args.auditId,
        pageId: args.pageId,
        componentId,
        notes: args.instanceNotes,
        instanceStatus: "not_checked",
        updatedAt: Date.now(),
      });
    }

    return componentId;
  },
});

export const attachComponentToPage = mutation({
  args: {
    auditId: v.id("audits"),
    pageId: v.id("auditPages"),
    componentId: v.id("auditComponents"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    const component = await ctx.db.get(args.componentId);

    if (!page || page.auditId !== args.auditId) {
      throw new Error("Page not found for this audit.");
    }

    if (!component || component.auditId !== args.auditId) {
      throw new Error("Component not found for this audit.");
    }

    const existing = await ctx.db
      .query("componentInstances")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .take(100);

    const alreadyAttached = existing.find(
      (instance) => instance.componentId === args.componentId,
    );

    if (alreadyAttached) {
      await ctx.db.patch(alreadyAttached._id, {
        notes: args.notes,
        updatedAt: Date.now(),
      });
      return alreadyAttached._id;
    }

    return await ctx.db.insert("componentInstances", {
      ...args,
      instanceStatus: "not_checked",
      updatedAt: Date.now(),
    });
  },
});

export const removePage = mutation({
  args: { pageId: v.id("auditPages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      return null;
    }

    const instances = await ctx.db
      .query("componentInstances")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .take(100);

    for (const instance of instances) {
      await ctx.db.delete(instance._id);
    }

    await ctx.db.delete(args.pageId);
    return args.pageId;
  },
});

export const removeComponent = mutation({
  args: { componentId: v.id("auditComponents") },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.componentId);
    if (!component) {
      return null;
    }

    const instances = await ctx.db
      .query("componentInstances")
      .withIndex("by_component", (q) => q.eq("componentId", args.componentId))
      .take(100);

    for (const instance of instances) {
      await ctx.db.delete(instance._id);
    }

    const checks = await ctx.db
      .query("componentChecks")
      .withIndex("by_component", (q) => q.eq("componentId", args.componentId))
      .take(100);

    for (const check of checks) {
      await ctx.db.delete(check._id);
    }

    await ctx.db.delete(args.componentId);
    return args.componentId;
  },
});

export const ensureComponentChecks = mutation({
  args: { componentId: v.id("auditComponents") },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.componentId);
    if (!component) {
      throw new Error("Component not found.");
    }

    const existingChecks = await ctx.db
      .query("componentChecks")
      .withIndex("by_component", (q) => q.eq("componentId", args.componentId))
      .take(1);

    if (existingChecks.length) {
      return args.componentId;
    }

    await createChecksForComponent(ctx, {
      auditId: component.auditId,
      componentId: component._id,
      componentType: component.componentType,
    });

    return args.componentId;
  },
});

export const updateComponentCheck = mutation({
  args: {
    checkId: v.id("componentChecks"),
    status: v.union(
      v.literal("not_started"),
      v.literal("pass"),
      v.literal("fail"),
      v.literal("not_applicable"),
      v.literal("needs_review"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.checkId, {
      status: args.status,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    return args.checkId;
  },
});

async function createChecksForComponent(
  ctx: MutationCtx,
  args: {
    auditId: Id<"audits">;
    componentId: Id<"auditComponents">;
    componentType: string;
  },
) {
  const checks = getComponentChecks(args.componentType);
  for (const [index, check] of checks.entries()) {
    await ctx.db.insert("componentChecks", {
      auditId: args.auditId,
      componentId: args.componentId,
      templateKey: check.key,
      title: check.title,
      instructions: check.instructions,
      expectedBehavior: check.expectedBehavior,
      wcagCriteria: check.wcagCriteria,
      status: "not_started",
      order: index,
      updatedAt: Date.now(),
    });
  }
}
