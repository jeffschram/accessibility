import { mutation } from "./_generated/server";
import { demoGuidanceTasks, demoProjects, demoWcagCriteria } from "./seedData";

export const demo = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const projectIds = [];
    for (const project of demoProjects) {
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_slug", (q) => q.eq("slug", project.slug))
        .unique();

      if (existing) {
        projectIds.push(existing._id);
        await ctx.db.patch(existing._id, { ...project, updatedAt: now });
      } else {
        const projectId = await ctx.db.insert("projects", {
          ...project,
          updatedAt: now,
        });
        projectIds.push(projectId);
      }
    }

    const auroraProjectId = projectIds[0];
    const portalProjectId = projectIds[1];

    const existingAudits = await ctx.db.query("audits").take(20);
    if (existingAudits.length === 0) {
      const auroraAuditId = await ctx.db.insert("audits", {
        projectId: auroraProjectId,
        name: "Q2 product audit",
        status: "testing",
        wcagVersion: "2.2",
        conformanceLevel: "AA",
        environmentName: "Staging",
        environmentUrl: "https://staging.example.com",
        summary: "Baseline product audit focused on commerce flows and design-system components.",
        startedAt: now,
        updatedAt: now,
      });

      const portalAuditId = await ctx.db.insert("audits", {
        projectId: portalProjectId,
        name: "Portal baseline audit",
        status: "scoping",
        wcagVersion: "2.2",
        conformanceLevel: "AA",
        environmentName: "Production",
        environmentUrl: "https://portal.example.com",
        summary: "Initial scope pass for authenticated customer portal workflows.",
        startedAt: now,
        updatedAt: now,
      });

      const productGridId = await ctx.db.insert("scopeItems", {
        auditId: auroraAuditId,
        type: "component",
        name: "Product grid filters",
        description: "Filter toolbar and product result grid.",
        included: true,
        priority: "critical",
        riskNotes: "Custom controls and dynamic result updates.",
        testStatus: "in_progress",
        updatedAt: now,
      });

      const checkoutId = await ctx.db.insert("scopeItems", {
        auditId: auroraAuditId,
        type: "flow",
        name: "Checkout flow",
        description: "Cart, shipping, payment, confirmation, and error states.",
        included: true,
        priority: "critical",
        riskNotes: "Legal/financial transaction with validation and dialogs.",
        testStatus: "retest_needed",
        updatedAt: now,
      });

      await ctx.db.insert("scopeItems", {
        auditId: portalAuditId,
        type: "page",
        name: "Account settings",
        description: "Profile settings and notification preferences.",
        included: true,
        priority: "medium",
        testStatus: "not_started",
        updatedAt: now,
      });

      await ctx.db.insert("scopeItems", {
        auditId: portalAuditId,
        type: "state",
        name: "Empty search results",
        description: "Empty state messaging and recovery actions.",
        included: true,
        priority: "low",
        testStatus: "tested",
        updatedAt: now,
      });

      await ctx.db.insert("findings", {
        auditId: auroraAuditId,
        projectId: auroraProjectId,
        title: "Product filter icon buttons are announced as unlabeled buttons",
        status: "open",
        severity: "high",
        priority: "high",
        wcagCriteria: ["2.5.3", "4.1.2"],
        affectedScopeItemIds: [productGridId],
        userImpact:
          "Screen reader users cannot determine the purpose of icon-only filter actions.",
        actualResult: "Several filter controls are announced only as button.",
        expectedResult: "Each control exposes an accessible name matching its visible purpose.",
        evidenceIds: [],
        owner: "Design system",
        updatedAt: now,
      });

      await ctx.db.insert("findings", {
        auditId: auroraAuditId,
        projectId: auroraProjectId,
        title: "Checkout dialog does not return focus to the triggering button",
        status: "ready_for_retest",
        severity: "medium",
        priority: "medium",
        wcagCriteria: ["2.4.3", "2.4.7"],
        affectedScopeItemIds: [checkoutId],
        userImpact:
          "Keyboard and screen reader users can lose their place after closing the dialog.",
        actualResult: "Focus moves to the document body after the dialog closes.",
        expectedResult: "Focus returns to the button that opened the dialog.",
        evidenceIds: [],
        owner: "Checkout",
        updatedAt: now,
      });

      await ctx.db.insert("findings", {
        auditId: auroraAuditId,
        projectId: auroraProjectId,
        title: "Payment form errors are not associated with invalid fields",
        status: "in_remediation",
        severity: "critical",
        priority: "critical",
        wcagCriteria: ["3.3.1", "3.3.2"],
        affectedScopeItemIds: [checkoutId],
        userImpact:
          "Screen reader users may not know which payment fields failed validation.",
        actualResult: "Error messages are visually near fields but not programmatically associated.",
        expectedResult:
          "Invalid fields expose error state and reference their error messages.",
        evidenceIds: [],
        owner: "Payments",
        updatedAt: now,
      });
    }

    for (const criterion of demoWcagCriteria) {
      const existing = await ctx.db
        .query("wcagCriteria")
        .withIndex("by_version_criterion", (q) =>
          q.eq("version", criterion.version).eq("criterion", criterion.criterion),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, criterion);
      } else {
        await ctx.db.insert("wcagCriteria", criterion);
      }
    }

    const existingGuidance = await ctx.db.query("guidanceTasks").take(20);
    if (existingGuidance.length === 0) {
      for (const task of demoGuidanceTasks) {
        await ctx.db.insert("guidanceTasks", task);
      }
    }

    return { seeded: true };
  },
});
