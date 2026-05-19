import type {
  Audit,
  Finding,
  GuidanceTask,
  Project,
  ScopeItem,
  WcagCriterion,
} from "./types";

export const projects: Project[] = [
  {
    id: "proj-aurora",
    name: "Aurora Commerce",
    clientName: "Internal demo",
    activeAuditId: "audit-q2",
    conformanceTarget: "WCAG 2.2 AA",
  },
  {
    id: "proj-portal",
    name: "Customer Portal",
    clientName: "Reference audit",
    activeAuditId: "audit-portal",
    conformanceTarget: "WCAG 2.2 AA",
  },
];

export const audits: Audit[] = [
  {
    id: "audit-q2",
    projectId: "proj-aurora",
    name: "Q2 product audit",
    status: "testing",
    environmentUrl: "https://staging.example.com",
    progress: 42,
    scopeCount: 18,
    findingCount: 9,
    updatedAt: "Today",
  },
  {
    id: "audit-portal",
    projectId: "proj-portal",
    name: "Portal baseline audit",
    status: "scoping",
    environmentUrl: "https://portal.example.com",
    progress: 14,
    scopeCount: 7,
    findingCount: 2,
    updatedAt: "Yesterday",
  },
];

export const findings: Finding[] = [
  {
    id: "find-filter-buttons",
    title: "Product filter icon buttons are announced as unlabeled buttons",
    severity: "high",
    status: "open",
    wcag: ["2.5.3", "4.1.2"],
    owner: "Design system",
  },
  {
    id: "find-modal-focus",
    title: "Checkout dialog does not return focus to the triggering button",
    severity: "medium",
    status: "ready for retest",
    wcag: ["2.4.3", "2.4.7"],
    owner: "Checkout",
  },
  {
    id: "find-errors",
    title: "Payment form errors are not associated with invalid fields",
    severity: "critical",
    status: "in remediation",
    wcag: ["3.3.1", "3.3.2"],
    owner: "Payments",
  },
];

export const scopeItems: ScopeItem[] = [
  {
    id: "scope-product-grid",
    name: "Product grid filters",
    type: "component",
    priority: "critical",
    status: "in_progress",
  },
  {
    id: "scope-checkout",
    name: "Checkout flow",
    type: "flow",
    priority: "critical",
    status: "retest_needed",
  },
  {
    id: "scope-account",
    name: "Account settings",
    type: "page",
    priority: "medium",
    status: "not_started",
  },
  {
    id: "scope-empty",
    name: "Empty search results",
    type: "state",
    priority: "low",
    status: "tested",
  },
];

export const guidanceTasks: GuidanceTask[] = [
  {
    id: "keyboard-operable",
    title: "Verify all controls are keyboard operable",
    modality: "keyboard",
    relatedWcag: ["2.1.1", "2.1.2", "2.4.3", "2.4.7", "4.1.2"],
    whyThisMatters:
      "Keyboard access supports people who cannot use a mouse and people using switch devices, screen readers, voice control, or other keyboard-like input.",
    howToTest: [
      "Start immediately before the component and move through it with Tab and Shift+Tab.",
      "Operate buttons and links with Enter, buttons and checkboxes with Space, and composite widgets with arrow keys where expected.",
      "Use Escape for dismissible overlays and confirm focus can leave the component predictably.",
    ],
    expectedBehavior:
      "Every interactive control receives visible focus, follows a logical order, exposes name/role/state/value, and can be operated without a pointer.",
    commonFailures: [
      "A clickable div never receives focus.",
      "Focus disappears behind a sticky header or overlay.",
      "A custom menu opens but cannot be closed with Escape.",
    ],
    learnerNote:
      "This is not only a keyboard-user check. It is also a strong proxy for whether the component exposes a reliable interaction model to assistive technology.",
  },
  {
    id: "screen-reader-labels",
    title: "Confirm controls expose useful names and states",
    modality: "screen_reader",
    relatedWcag: ["1.3.1", "2.4.6", "4.1.2"],
    whyThisMatters:
      "Screen reader users need the same purpose, state, and relationship information that sighted users infer visually.",
    howToTest: [
      "Navigate to each control with the screen reader and keyboard.",
      "Listen for role, accessible name, current state, and any instructions.",
      "Compare the announcement with the visible label and current UI state.",
    ],
    expectedBehavior:
      "The announcement makes the control purpose clear and accurately reflects expanded, selected, checked, invalid, or disabled states.",
    commonFailures: [
      "Icon-only controls are announced as button with no name.",
      "Expanded menus do not expose expanded/collapsed state.",
      "Visible labels are different from accessible names.",
    ],
    learnerNote:
      "Name, role, and value are the contract between custom UI and assistive technologies.",
  },
];

export const wcagCriteria: WcagCriterion[] = [
  {
    id: "2.1.1",
    title: "Keyboard",
    level: "A",
    principle: "Operable",
    plainLanguageSummary:
      "All functionality must be available from a keyboard unless the interaction fundamentally requires path-based input.",
  },
  {
    id: "2.1.2",
    title: "No Keyboard Trap",
    level: "A",
    principle: "Operable",
    plainLanguageSummary:
      "Keyboard focus must not get stuck in any part of the page or application.",
  },
  {
    id: "2.4.3",
    title: "Focus Order",
    level: "A",
    principle: "Operable",
    plainLanguageSummary:
      "Focusable elements should receive focus in an order that preserves meaning and operability.",
  },
  {
    id: "2.4.7",
    title: "Focus Visible",
    level: "AA",
    principle: "Operable",
    plainLanguageSummary:
      "People navigating by keyboard need to see which element currently has focus.",
  },
  {
    id: "4.1.2",
    title: "Name, Role, Value",
    level: "A",
    principle: "Robust",
    plainLanguageSummary:
      "Custom controls must expose their role, accessible name, state, and value to assistive technologies.",
  },
];
