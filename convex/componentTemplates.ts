type ComponentCheckTemplate = {
  key: string;
  title: string;
  instructions: string;
  expectedBehavior: string;
  wcagCriteria: string[];
};

const sharedChecks: ComponentCheckTemplate[] = [
  {
    key: "keyboard-operable",
    title: "Keyboard operation",
    instructions:
      "Move to each interactive control with the keyboard and operate it using the expected keys.",
    expectedBehavior:
      "All functionality is reachable and operable without a pointer, with no keyboard trap.",
    wcagCriteria: ["2.1.1", "2.1.2"],
  },
  {
    key: "focus-visible",
    title: "Visible focus",
    instructions:
      "Tab through the component and confirm the focused element is visually apparent.",
    expectedBehavior:
      "Keyboard focus is visible and not obscured while moving through the component.",
    wcagCriteria: ["2.4.7", "2.4.11"],
  },
  {
    key: "name-role-value",
    title: "Name, role, value",
    instructions:
      "Inspect the accessibility tree or screen reader output for interactive controls.",
    expectedBehavior:
      "Controls expose useful names, correct roles, and accurate state/value information.",
    wcagCriteria: ["4.1.2"],
  },
];

const templates: Record<string, ComponentCheckTemplate[]> = {
  navigation: [
    ...sharedChecks,
    {
      key: "nav-landmark-label",
      title: "Navigation landmark and label",
      instructions:
        "Confirm the navigation region is marked up semantically and has a useful label when multiple nav regions exist.",
      expectedBehavior:
        "Users can identify the navigation purpose and distinguish it from other navigation regions.",
      wcagCriteria: ["1.3.1", "2.4.1", "2.4.6"],
    },
    {
      key: "current-page",
      title: "Current page indication",
      instructions:
        "Check that the current page or section is indicated visually and programmatically.",
      expectedBehavior:
        "Current location is conveyed without relying on color alone.",
      wcagCriteria: ["1.3.1", "1.4.1", "2.4.4"],
    },
    {
      key: "dropdown-behavior",
      title: "Dropdown behavior",
      instructions:
        "If navigation has dropdowns, test open/close behavior, Escape, focus movement, and expanded/collapsed state.",
      expectedBehavior:
        "Dropdowns can be opened, closed, and navigated predictably, and state is exposed.",
      wcagCriteria: ["2.1.1", "2.1.2", "2.4.3", "4.1.2"],
    },
  ],
  dialog: [
    ...sharedChecks,
    {
      key: "dialog-name",
      title: "Accessible dialog name",
      instructions:
        "Open the dialog and confirm it has a programmatic name from its visible title or label.",
      expectedBehavior: "The dialog has a useful accessible name.",
      wcagCriteria: ["2.4.6", "4.1.2"],
    },
    {
      key: "dialog-focus-management",
      title: "Dialog focus management",
      instructions:
        "Open and close the dialog. Confirm focus moves into it, remains in it while modal, and returns to the trigger.",
      expectedBehavior:
        "Focus is managed predictably when the dialog opens and closes.",
      wcagCriteria: ["2.1.2", "2.4.3"],
    },
  ],
  datatable: [
    {
      key: "table-semantics",
      title: "Table semantics",
      instructions:
        "Inspect table structure and confirm headers are associated with data cells.",
      expectedBehavior:
        "Rows, columns, captions, and headers are programmatically determinable.",
      wcagCriteria: ["1.3.1"],
    },
    {
      key: "sort-controls",
      title: "Sorting controls",
      instructions:
        "Operate sortable columns with the keyboard and check how sort state is conveyed.",
      expectedBehavior:
        "Sort controls are keyboard operable and expose current sort state.",
      wcagCriteria: ["2.1.1", "4.1.2"],
    },
    {
      key: "responsive-table",
      title: "Responsive table behavior",
      instructions:
        "Check the table at narrow widths and 200% zoom.",
      expectedBehavior:
        "Table content remains usable without loss of information or unexpected two-dimensional scrolling except where necessary.",
      wcagCriteria: ["1.4.10"],
    },
  ],
  form: [
    ...sharedChecks,
    {
      key: "labels-instructions",
      title: "Labels and instructions",
      instructions:
        "Check that each input has a visible/programmatic label and needed instructions.",
      expectedBehavior:
        "Users can understand what information is required before submitting.",
      wcagCriteria: ["1.3.1", "3.3.2", "4.1.2"],
    },
    {
      key: "errors",
      title: "Validation errors",
      instructions:
        "Submit invalid data and verify errors are identified, associated, and recoverable.",
      expectedBehavior:
        "Errors are described in text and associated with invalid fields.",
      wcagCriteria: ["3.3.1", "3.3.3"],
    },
  ],
  accordion: [
    ...sharedChecks,
    {
      key: "expanded-state",
      title: "Expanded/collapsed state",
      instructions:
        "Toggle each accordion item and inspect whether expanded/collapsed state is exposed.",
      expectedBehavior:
        "Accordion controls expose current expanded or collapsed state.",
      wcagCriteria: ["4.1.2"],
    },
  ],
  header: sharedChecks,
  footer: sharedChecks,
  custom: sharedChecks,
};

export function getComponentChecks(componentType: string) {
  return templates[componentType] ?? templates.custom;
}
