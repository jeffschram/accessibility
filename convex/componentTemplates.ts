export type ComponentCheckTemplate = {
  key: string;
  title: string;
  instructions: string;
  expectedBehavior: string;
  wcagCriteria: string[];
};

export type ComponentTypeTemplate = {
  key: string;
  name: string;
  description: string;
  exampleUrls: string[];
  checks: ComponentCheckTemplate[];
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

export const defaultComponentTypes: ComponentTypeTemplate[] = [
  {
    key: "navigation",
    name: "Navigation",
    description: "Site, section, or application navigation patterns.",
    exampleUrls: [
      "https://www.w3.org/WAI/ARIA/apg/patterns/menubar/",
      "https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/",
      "https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/",
    ],
    checks: [
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
  },
  {
    key: "dialog",
    name: "Dialog",
    description: "Modal or non-modal dialogs and overlays.",
    exampleUrls: [
      "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
      "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/",
    ],
    checks: [
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
  },
  {
    key: "datatable",
    name: "Data table",
    description: "Static tables, sortable tables, and table-like data presentations.",
    exampleUrls: [
      "https://www.w3.org/WAI/ARIA/apg/patterns/table/",
      "https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/table/",
    ],
    checks: [
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
        instructions: "Check the table at narrow widths and 200% zoom.",
        expectedBehavior:
          "Table content remains usable without loss of information or unexpected two-dimensional scrolling except where necessary.",
        wcagCriteria: ["1.4.10"],
      },
    ],
  },
  {
    key: "form",
    name: "Form",
    description: "Input groups, form sections, validation, and submission flows.",
    exampleUrls: ["https://www.w3.org/WAI/tutorials/forms/"],
    checks: [
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
  },
  {
    key: "accordion",
    name: "Accordion",
    description: "Sections that expand and collapse content panels.",
    exampleUrls: ["https://www.w3.org/WAI/ARIA/apg/patterns/accordion/"],
    checks: [
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
  },
  {
    key: "header",
    name: "Header",
    description: "Site or application header regions.",
    exampleUrls: ["https://www.w3.org/WAI/tutorials/page-structure/regions/"],
    checks: sharedChecks,
  },
  {
    key: "footer",
    name: "Footer",
    description: "Site or application footer regions.",
    exampleUrls: ["https://www.w3.org/WAI/tutorials/page-structure/regions/"],
    checks: sharedChecks,
  },
  {
    key: "custom",
    name: "Custom",
    description: "A component pattern that does not fit a predefined type.",
    exampleUrls: ["https://www.w3.org/WAI/ARIA/apg/patterns/"],
    checks: sharedChecks,
  },
];

const fallbackChecks = new Map(
  defaultComponentTypes.map((componentType) => [componentType.key, componentType.checks]),
);

export function getComponentChecks(componentType: string) {
  return fallbackChecks.get(componentType) ?? fallbackChecks.get("custom") ?? [];
}
