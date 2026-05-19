export type Severity = "critical" | "high" | "medium" | "low";

export type AuditStatus =
  | "scoping"
  | "testing"
  | "reporting"
  | "remediation"
  | "retesting"
  | "complete";

export type TestStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "tested"
  | "retest_needed"
  | "passed";

export type Modality =
  | "keyboard"
  | "screen_reader"
  | "zoom_reflow"
  | "responsive"
  | "forced_colors"
  | "reduced_motion"
  | "automated";

export type Project = {
  id: string;
  name: string;
  clientName: string;
  activeAuditId: string;
  conformanceTarget: string;
};

export type Audit = {
  id: string;
  projectId: string;
  name: string;
  status: AuditStatus;
  environmentUrl: string;
  progress: number;
  scopeCount: number;
  findingCount: number;
  updatedAt: string;
};

export type Finding = {
  id: string;
  title: string;
  severity: Severity;
  status: string;
  wcag: string[];
  owner: string;
};

export type ScopeItem = {
  id: string;
  name: string;
  type: "page" | "flow" | "component" | "state";
  priority: "critical" | "high" | "medium" | "low";
  status: TestStatus;
};

export type GuidanceTask = {
  id: string;
  title: string;
  modality: Modality;
  relatedWcag: string[];
  whyThisMatters: string;
  howToTest: string[];
  expectedBehavior: string;
  commonFailures: string[];
  learnerNote: string;
};

export type WcagCriterion = {
  id: string;
  title: string;
  level: "A" | "AA" | "AAA";
  principle: string;
  plainLanguageSummary: string;
};
