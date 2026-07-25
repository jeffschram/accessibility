export type DefaultWcagCriterion = {
  criterion: string;
  title: string;
  level: "A" | "AA" | "AAA";
  principle: string;
  guideline: string;
  guidelineTitle: string;
  handle: string;
  automationPotential: "high" | "partial" | "manual";
};

const principles: Record<string, string> = {
  "1": "Perceivable",
  "2": "Operable",
  "3": "Understandable",
  "4": "Robust",
};

const guidelines: Record<string, string> = {
  "1.1": "Text Alternatives",
  "1.2": "Time-based Media",
  "1.3": "Adaptable",
  "1.4": "Distinguishable",
  "2.1": "Keyboard Accessible",
  "2.2": "Enough Time",
  "2.3": "Seizures and Physical Reactions",
  "2.4": "Navigable",
  "2.5": "Input Modalities",
  "3.1": "Readable",
  "3.2": "Predictable",
  "3.3": "Input Assistance",
  "4.1": "Compatible",
};

const criteria = [
  ["1.1.1", "Non-text Content", "A", "partial"],
  ["1.2.1", "Audio-only and Video-only (Prerecorded)", "A", "manual"],
  ["1.2.2", "Captions (Prerecorded)", "A", "partial"],
  ["1.2.3", "Audio Description or Media Alternative (Prerecorded)", "A", "manual"],
  ["1.2.4", "Captions (Live)", "AA", "manual"],
  ["1.2.5", "Audio Description (Prerecorded)", "AA", "manual"],
  ["1.2.6", "Sign Language (Prerecorded)", "AAA", "manual"],
  ["1.2.7", "Extended Audio Description (Prerecorded)", "AAA", "manual"],
  ["1.2.8", "Media Alternative (Prerecorded)", "AAA", "manual"],
  ["1.2.9", "Audio-only (Live)", "AAA", "manual"],
  ["1.3.1", "Info and Relationships", "A", "partial"],
  ["1.3.2", "Meaningful Sequence", "A", "manual"],
  ["1.3.3", "Sensory Characteristics", "A", "manual"],
  ["1.3.4", "Orientation", "AA", "partial"],
  ["1.3.5", "Identify Input Purpose", "AA", "partial"],
  ["1.3.6", "Identify Purpose", "AAA", "manual"],
  ["1.4.1", "Use of Color", "A", "partial"],
  ["1.4.2", "Audio Control", "A", "partial"],
  ["1.4.3", "Contrast (Minimum)", "AA", "high"],
  ["1.4.4", "Resize Text", "AA", "partial"],
  ["1.4.5", "Images of Text", "AA", "partial"],
  ["1.4.6", "Contrast (Enhanced)", "AAA", "high"],
  ["1.4.7", "Low or No Background Audio", "AAA", "manual"],
  ["1.4.8", "Visual Presentation", "AAA", "partial"],
  ["1.4.9", "Images of Text (No Exception)", "AAA", "partial"],
  ["1.4.10", "Reflow", "AA", "partial"],
  ["1.4.11", "Non-text Contrast", "AA", "partial"],
  ["1.4.12", "Text Spacing", "AA", "partial"],
  ["1.4.13", "Content on Hover or Focus", "AA", "manual"],
  ["2.1.1", "Keyboard", "A", "manual"],
  ["2.1.2", "No Keyboard Trap", "A", "manual"],
  ["2.1.3", "Keyboard (No Exception)", "AAA", "manual"],
  ["2.1.4", "Character Key Shortcuts", "A", "manual"],
  ["2.2.1", "Timing Adjustable", "A", "manual"],
  ["2.2.2", "Pause, Stop, Hide", "A", "partial"],
  ["2.2.3", "No Timing", "AAA", "manual"],
  ["2.2.4", "Interruptions", "AAA", "manual"],
  ["2.2.5", "Re-authenticating", "AAA", "manual"],
  ["2.2.6", "Timeouts", "AAA", "manual"],
  ["2.3.1", "Three Flashes or Below Threshold", "A", "partial"],
  ["2.3.2", "Three Flashes", "AAA", "partial"],
  ["2.3.3", "Animation from Interactions", "AAA", "manual"],
  ["2.4.1", "Bypass Blocks", "A", "partial"],
  ["2.4.2", "Page Titled", "A", "high"],
  ["2.4.3", "Focus Order", "A", "manual"],
  ["2.4.4", "Link Purpose (In Context)", "A", "partial"],
  ["2.4.5", "Multiple Ways", "AA", "manual"],
  ["2.4.6", "Headings and Labels", "AA", "partial"],
  ["2.4.7", "Focus Visible", "AA", "partial"],
  ["2.4.8", "Location", "AAA", "manual"],
  ["2.4.9", "Link Purpose (Link Only)", "AAA", "partial"],
  ["2.4.10", "Section Headings", "AAA", "partial"],
  ["2.4.11", "Focus Not Obscured (Minimum)", "AA", "partial"],
  ["2.4.12", "Focus Not Obscured (Enhanced)", "AAA", "partial"],
  ["2.4.13", "Focus Appearance", "AAA", "partial"],
  ["2.5.1", "Pointer Gestures", "A", "manual"],
  ["2.5.2", "Pointer Cancellation", "A", "manual"],
  ["2.5.3", "Label in Name", "A", "partial"],
  ["2.5.4", "Motion Actuation", "A", "manual"],
  ["2.5.5", "Target Size (Enhanced)", "AAA", "partial"],
  ["2.5.6", "Concurrent Input Mechanisms", "AAA", "manual"],
  ["2.5.7", "Dragging Movements", "AA", "manual"],
  ["2.5.8", "Target Size (Minimum)", "AA", "partial"],
  ["3.1.1", "Language of Page", "A", "high"],
  ["3.1.2", "Language of Parts", "AA", "partial"],
  ["3.1.3", "Unusual Words", "AAA", "manual"],
  ["3.1.4", "Abbreviations", "AAA", "manual"],
  ["3.1.5", "Reading Level", "AAA", "manual"],
  ["3.1.6", "Pronunciation", "AAA", "manual"],
  ["3.2.1", "On Focus", "A", "manual"],
  ["3.2.2", "On Input", "A", "manual"],
  ["3.2.3", "Consistent Navigation", "AA", "manual"],
  ["3.2.4", "Consistent Identification", "AA", "manual"],
  ["3.2.5", "Change on Request", "AAA", "manual"],
  ["3.2.6", "Consistent Help", "A", "manual"],
  ["3.3.1", "Error Identification", "A", "partial"],
  ["3.3.2", "Labels or Instructions", "A", "partial"],
  ["3.3.3", "Error Suggestion", "AA", "manual"],
  ["3.3.4", "Error Prevention (Legal, Financial, Data)", "AA", "manual"],
  ["3.3.5", "Help", "AAA", "manual"],
  ["3.3.6", "Error Prevention (All)", "AAA", "manual"],
  ["3.3.7", "Redundant Entry", "A", "manual"],
  ["3.3.8", "Accessible Authentication (Minimum)", "AA", "manual"],
  ["3.3.9", "Accessible Authentication (Enhanced)", "AAA", "manual"],
  ["4.1.2", "Name, Role, Value", "A", "partial"],
  ["4.1.3", "Status Messages", "AA", "partial"],
] as const;

export const defaultWcagCriteria: DefaultWcagCriterion[] = criteria.map(
  ([criterion, title, level, automationPotential]) => {
    const [principleNumber, guidelineNumber] = criterion.split(".");
    const guideline = `${principleNumber}.${guidelineNumber}`;
    const handle = title
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return {
      criterion,
      title,
      level,
      principle: principles[principleNumber] ?? "",
      guideline,
      guidelineTitle: guidelines[guideline] ?? "",
      handle,
      automationPotential,
    };
  },
);
