export const demoProjects = [
  {
    name: "Aurora Commerce",
    slug: "aurora-commerce",
    description: "Demo product audit workspace.",
    clientName: "Internal demo",
    defaultWcagVersion: "2.2",
    defaultConformanceLevel: "AA" as const,
  },
  {
    name: "Customer Portal",
    slug: "customer-portal",
    description: "Reference audit workspace.",
    clientName: "Reference audit",
    defaultWcagVersion: "2.2",
    defaultConformanceLevel: "AA" as const,
  },
];

export const demoWcagCriteria = [
  {
    version: "2.2",
    criterion: "2.1.1",
    handle: "keyboard",
    title: "Keyboard",
    level: "A" as const,
    principle: "Operable",
    guideline: "2.1 Keyboard Accessible",
    url: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html",
    summary: "All functionality is operable through a keyboard interface.",
    intent:
      "Ensure users can operate content through keyboard or keyboard-like input.",
    whoBenefits:
      "Keyboard users, switch users, screen reader users, voice control users, and people who cannot use a pointer.",
    plainLanguageSummary:
      "All functionality must be available from a keyboard unless the interaction fundamentally requires path-based input.",
    manualTestingNotes:
      "Tab through the UI and operate every control with expected keys.",
    commonFailures: ["Clickable elements are not focusable.", "Custom controls only respond to pointer events."],
    relatedGuidanceTopicIds: ["keyboard-operable"],
    automationPotential: "partial" as const,
  },
  {
    version: "2.2",
    criterion: "2.1.2",
    handle: "no-keyboard-trap",
    title: "No Keyboard Trap",
    level: "A" as const,
    principle: "Operable",
    guideline: "2.1 Keyboard Accessible",
    url: "https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html",
    summary: "Keyboard focus can move away from components.",
    intent: "Ensure users do not become stuck in any part of the interface.",
    whoBenefits: "People navigating by keyboard or keyboard-like input.",
    plainLanguageSummary:
      "Keyboard focus must not get stuck in any part of the page or application.",
    manualTestingNotes:
      "Move into and out of dialogs, menus, widgets, embedded content, and custom components.",
    commonFailures: ["Focus cannot leave a modal.", "A custom widget captures Tab indefinitely."],
    relatedGuidanceTopicIds: ["keyboard-operable"],
    automationPotential: "partial" as const,
  },
  {
    version: "2.2",
    criterion: "2.4.3",
    handle: "focus-order",
    title: "Focus Order",
    level: "A" as const,
    principle: "Operable",
    guideline: "2.4 Navigable",
    url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html",
    summary: "Focusable components receive focus in a meaningful sequence.",
    intent: "Preserve meaning and operability as keyboard users move through content.",
    whoBenefits: "Keyboard and screen reader users navigating sequentially.",
    plainLanguageSummary:
      "Focusable elements should receive focus in an order that preserves meaning and operability.",
    manualTestingNotes:
      "Compare the keyboard sequence with the visual layout and task order.",
    commonFailures: ["Focus jumps to unrelated content.", "Focus moves behind an open dialog."],
    relatedGuidanceTopicIds: ["keyboard-operable"],
    automationPotential: "partial" as const,
  },
  {
    version: "2.2",
    criterion: "2.4.7",
    handle: "focus-visible",
    title: "Focus Visible",
    level: "AA" as const,
    principle: "Operable",
    guideline: "2.4 Navigable",
    url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html",
    summary: "Keyboard focus has a visible indicator.",
    intent: "Help users know where keyboard focus currently is.",
    whoBenefits: "Keyboard users, low vision users, and people with attention or memory limitations.",
    plainLanguageSummary:
      "People navigating by keyboard need to see which element currently has focus.",
    manualTestingNotes:
      "Tab through controls and verify focus is visible and not obscured.",
    commonFailures: ["CSS removes outlines.", "Focus indicators have insufficient contrast."],
    relatedGuidanceTopicIds: ["keyboard-operable"],
    automationPotential: "partial" as const,
  },
  {
    version: "2.2",
    criterion: "4.1.2",
    handle: "name-role-value",
    title: "Name, Role, Value",
    level: "A" as const,
    principle: "Robust",
    guideline: "4.1 Compatible",
    url: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
    summary: "UI components expose correct name, role, state, properties, and values.",
    intent: "Ensure assistive technologies can understand and operate controls.",
    whoBenefits: "Screen reader users and users of other assistive technologies.",
    plainLanguageSummary:
      "Custom controls must expose their role, accessible name, state, and value to assistive technologies.",
    manualTestingNotes:
      "Inspect accessibility tree and test screen reader announcements.",
    commonFailures: ["Icon-only buttons have no accessible name.", "Custom controls do not expose state."],
    relatedGuidanceTopicIds: ["keyboard-operable", "screen-reader-labels"],
    automationPotential: "high" as const,
  },
];

export const demoGuidanceTasks = [
  {
    title: "Verify all controls are keyboard operable",
    modality: "keyboard" as const,
    componentTypes: ["button", "link", "menu", "dialog", "form", "custom-control"],
    relatedWcagCriteria: ["2.1.1", "2.1.2", "2.4.3", "2.4.7", "4.1.2"],
    guidanceTopicIds: ["keyboard-operable"],
    taskPrompt: "Move through the component and operate every interactive control with the keyboard.",
    whyThisMatters:
      "Keyboard access supports people who cannot use a mouse and people using switch devices, screen readers, voice control, or other keyboard-like input.",
    howToTest: [
      "Start immediately before the component and move through it with Tab and Shift+Tab.",
      "Operate buttons and links with Enter, buttons and checkboxes with Space, and composite widgets with arrow keys where expected.",
      "Use Escape for dismissible overlays and confirm focus can leave the component predictably.",
    ],
    expectedBehavior:
      "Every interactive control receives visible focus, follows a logical order, exposes name/role/state/value, and can be operated without a pointer.",
    failureExamples: [
      "A clickable div never receives focus.",
      "Focus disappears behind a sticky header or overlay.",
      "A custom menu opens but cannot be closed with Escape.",
    ],
    passCriteria:
      "All interactive controls are reachable, visibly focused, operable with expected keys, and escapable when applicable.",
    whenToEscalate:
      "Escalate when expected keyboard behavior depends on a complex component pattern or competing ARIA pattern interpretations.",
    referenceUrls: [
      "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html",
      "https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html",
      "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html",
      "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html",
    ],
    defaultSeverityHint: "high" as const,
    audienceLevel: "beginner" as const,
  },
  {
    title: "Confirm controls expose useful names and states",
    modality: "screen_reader" as const,
    componentTypes: ["button", "input", "menu", "dialog", "custom-control"],
    relatedWcagCriteria: ["1.3.1", "2.4.6", "4.1.2"],
    guidanceTopicIds: ["screen-reader-labels"],
    taskPrompt: "Check that controls announce useful purpose, role, and state.",
    whyThisMatters:
      "Screen reader users need the same purpose, state, and relationship information that sighted users infer visually.",
    howToTest: [
      "Navigate to each control with the screen reader and keyboard.",
      "Listen for role, accessible name, current state, and any instructions.",
      "Compare the announcement with the visible label and current UI state.",
    ],
    expectedBehavior:
      "The announcement makes the control purpose clear and accurately reflects expanded, selected, checked, invalid, or disabled states.",
    failureExamples: [
      "Icon-only controls are announced as button with no name.",
      "Expanded menus do not expose expanded/collapsed state.",
      "Visible labels are different from accessible names.",
    ],
    passCriteria:
      "Controls expose useful names, accurate roles, and current states through the accessibility tree.",
    whenToEscalate:
      "Escalate when the component uses custom ARIA or when announcements differ significantly between screen reader/browser pairings.",
    referenceUrls: ["https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html"],
    defaultSeverityHint: "high" as const,
    audienceLevel: "intermediate" as const,
  },
];
