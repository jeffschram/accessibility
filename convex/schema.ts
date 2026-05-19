import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const severity = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

const auditStatus = v.union(
  v.literal("draft"),
  v.literal("scoping"),
  v.literal("testing"),
  v.literal("reporting"),
  v.literal("remediation"),
  v.literal("retesting"),
  v.literal("complete"),
  v.literal("archived"),
);

const testStatus = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("blocked"),
  v.literal("tested"),
  v.literal("retest_needed"),
  v.literal("passed"),
);

const modality = v.union(
  v.literal("keyboard"),
  v.literal("screen_reader"),
  v.literal("zoom_reflow"),
  v.literal("responsive"),
  v.literal("forced_colors"),
  v.literal("reduced_motion"),
  v.literal("automated"),
  v.literal("manual_review"),
);

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    clientName: v.optional(v.string()),
    defaultWcagVersion: v.string(),
    defaultConformanceLevel: v.union(v.literal("A"), v.literal("AA"), v.literal("AAA")),
    createdBy: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  audits: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    status: auditStatus,
    wcagVersion: v.string(),
    conformanceLevel: v.union(v.literal("A"), v.literal("AA"), v.literal("AAA")),
    environmentName: v.optional(v.string()),
    environmentUrl: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    targetCompletionDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    summary: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]),

  scopeItems: defineTable({
    auditId: v.id("audits"),
    type: v.union(v.literal("page"), v.literal("flow"), v.literal("component"), v.literal("state")),
    name: v.string(),
    url: v.optional(v.string()),
    routePattern: v.optional(v.string()),
    description: v.optional(v.string()),
    included: v.boolean(),
    priority: severity,
    riskNotes: v.optional(v.string()),
    testStatus,
    updatedAt: v.number(),
  }).index("by_audit", ["auditId"]),

  auditPages: defineTable({
    auditId: v.id("audits"),
    name: v.string(),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: severity,
    testStatus,
    updatedAt: v.number(),
  }).index("by_audit", ["auditId"]),

  auditComponents: defineTable({
    auditId: v.id("audits"),
    name: v.string(),
    componentType: v.string(),
    scope: v.union(v.literal("global"), v.literal("shared"), v.literal("page_specific")),
    description: v.optional(v.string()),
    testStatus,
    updatedAt: v.number(),
  }).index("by_audit", ["auditId"]),

  componentInstances: defineTable({
    auditId: v.id("audits"),
    pageId: v.id("auditPages"),
    componentId: v.id("auditComponents"),
    notes: v.optional(v.string()),
    instanceStatus: v.union(
      v.literal("not_checked"),
      v.literal("spot_checked"),
      v.literal("issue_found"),
      v.literal("not_applicable"),
    ),
    updatedAt: v.number(),
  })
    .index("by_audit", ["auditId"])
    .index("by_page", ["pageId"])
    .index("by_component", ["componentId"]),

  componentChecks: defineTable({
    auditId: v.id("audits"),
    componentId: v.id("auditComponents"),
    templateKey: v.string(),
    title: v.string(),
    instructions: v.string(),
    expectedBehavior: v.string(),
    wcagCriteria: v.array(v.string()),
    status: v.union(
      v.literal("not_started"),
      v.literal("pass"),
      v.literal("fail"),
      v.literal("not_applicable"),
      v.literal("needs_review"),
    ),
    notes: v.optional(v.string()),
    order: v.number(),
    updatedAt: v.number(),
  })
    .index("by_audit", ["auditId"])
    .index("by_component", ["componentId"]),

  testMatrixEntries: defineTable({
    auditId: v.id("audits"),
    modality,
    assistiveTechnology: v.optional(v.string()),
    browser: v.optional(v.string()),
    operatingSystem: v.optional(v.string()),
    viewport: v.optional(v.string()),
    required: v.boolean(),
    notes: v.optional(v.string()),
  }).index("by_audit", ["auditId"]),

  testRuns: defineTable({
    auditId: v.id("audits"),
    scopeItemId: v.optional(v.id("scopeItems")),
    testMatrixEntryId: v.optional(v.id("testMatrixEntries")),
    testerId: v.optional(v.string()),
    status: v.union(
      v.literal("not_started"),
      v.literal("pass"),
      v.literal("fail"),
      v.literal("blocked"),
      v.literal("not_applicable"),
      v.literal("needs_expert_review"),
    ),
    guidanceTaskIds: v.array(v.string()),
    confidence: v.optional(
      v.union(
        v.literal("needs_guidance"),
        v.literal("comfortable"),
        v.literal("expert_review_needed"),
      ),
    ),
    notes: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_audit", ["auditId"]),

  observations: defineTable({
    auditId: v.id("audits"),
    scopeItemId: v.optional(v.id("scopeItems")),
    testRunId: v.optional(v.id("testRuns")),
    source: v.union(
      v.literal("automated"),
      v.literal("manual"),
      v.literal("screen_reader"),
      v.literal("keyboard"),
      v.literal("code_review"),
      v.literal("imported"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    rawTool: v.optional(v.string()),
    rawRuleId: v.optional(v.string()),
    suggestedWcag: v.array(v.string()),
    relatedGuidanceTaskId: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("triaged"),
      v.literal("dismissed"),
      v.literal("converted_to_finding"),
    ),
    evidenceIds: v.array(v.id("evidence")),
    updatedAt: v.number(),
  }).index("by_audit", ["auditId"]),

  findings: defineTable({
    auditId: v.id("audits"),
    projectId: v.id("projects"),
    title: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_remediation"),
      v.literal("ready_for_retest"),
      v.literal("passed_retest"),
      v.literal("failed_retest"),
      v.literal("accepted_risk"),
      v.literal("closed"),
    ),
    severity,
    priority: severity,
    wcagCriteria: v.array(v.string()),
    affectedScopeItemIds: v.array(v.id("scopeItems")),
    userImpact: v.optional(v.string()),
    stepsToReproduce: v.optional(v.string()),
    actualResult: v.optional(v.string()),
    expectedResult: v.optional(v.string()),
    recommendedFix: v.optional(v.string()),
    acceptanceCriteria: v.optional(v.string()),
    evidenceIds: v.array(v.id("evidence")),
    owner: v.optional(v.string()),
    targetDate: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_audit", ["auditId"]),

  evidence: defineTable({
    auditId: v.id("audits"),
    findingId: v.optional(v.id("findings")),
    observationId: v.optional(v.id("observations")),
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
    createdAt: v.number(),
  }).index("by_audit", ["auditId"]),

  wcagCriteria: defineTable({
    version: v.string(),
    criterion: v.string(),
    handle: v.string(),
    title: v.string(),
    level: v.union(v.literal("A"), v.literal("AA"), v.literal("AAA")),
    principle: v.string(),
    guideline: v.string(),
    url: v.string(),
    summary: v.string(),
    intent: v.optional(v.string()),
    whoBenefits: v.optional(v.string()),
    plainLanguageSummary: v.string(),
    manualTestingNotes: v.optional(v.string()),
    commonFailures: v.array(v.string()),
    relatedGuidanceTopicIds: v.array(v.string()),
    automationPotential: v.union(v.literal("high"), v.literal("partial"), v.literal("manual")),
  }).index("by_version_criterion", ["version", "criterion"]),

  guidanceTasks: defineTable({
    title: v.string(),
    modality,
    componentTypes: v.array(v.string()),
    relatedWcagCriteria: v.array(v.string()),
    guidanceTopicIds: v.array(v.string()),
    taskPrompt: v.string(),
    whyThisMatters: v.string(),
    howToTest: v.array(v.string()),
    expectedBehavior: v.string(),
    failureExamples: v.array(v.string()),
    passCriteria: v.string(),
    whenToEscalate: v.optional(v.string()),
    referenceUrls: v.array(v.string()),
    defaultSeverityHint: v.optional(severity),
    audienceLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    ),
  }).index("by_modality", ["modality"]),

  reports: defineTable({
    auditId: v.id("audits"),
    title: v.string(),
    status: v.union(v.literal("draft"), v.literal("review"), v.literal("final")),
    format: v.union(v.literal("markdown"), v.literal("html"), v.literal("pdf")),
    sections: v.any(),
    generatedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  }).index("by_audit", ["auditId"]),
});
