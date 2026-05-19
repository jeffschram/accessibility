# WCAG 2.2 Reference

WCAG 2.2 is the current W3C Recommendation version of WCAG as of May 18, 2026. It was published as a W3C Recommendation on October 5, 2023. WCAG 2.0 and 2.1 remain W3C Recommendations, but W3C/WAI advises using WCAG 2.2 to improve future applicability.

Use WCAG 2.2 Level AA as the default audit baseline unless a project specifies a different legal, contractual, or procurement target.

Important WCAG 2.2 note: Success Criterion 4.1.1 Parsing is obsolete and removed in WCAG 2.2. It may still appear in older WCAG 2.0 or 2.1 checklists.

## Levels

- Level A: minimum requirements that address severe barriers.
- Level AA: common legal/procurement target and the usual product audit baseline.
- Level AAA: enhanced requirements that are not generally expected across an entire complex product unless explicitly scoped.

## Principle 1: Perceivable

Information and user interface components must be presentable to users in ways they can perceive.

### Guideline 1.1: Text Alternatives

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 1.1.1 | A | Non-text Content | Images, icons, charts, CAPTCHA, controls, and media alternatives have meaningful text alternatives or are correctly ignored. |

### Guideline 1.2: Time-based Media

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 1.2.1 | A | Audio-only and Video-only (Prerecorded) | Prerecorded audio/video-only content has equivalent alternatives. |
| 1.2.2 | A | Captions (Prerecorded) | Synchronized captions exist for prerecorded video with audio. |
| 1.2.3 | A | Audio Description or Media Alternative (Prerecorded) | Visual information in prerecorded video is available through audio description or equivalent media alternative. |
| 1.2.4 | AA | Captions (Live) | Live video with audio has captions. |
| 1.2.5 | AA | Audio Description (Prerecorded) | Prerecorded video includes audio description where visual information is needed. |
| 1.2.6 | AAA | Sign Language (Prerecorded) | Sign language interpretation is provided for prerecorded audio content. |
| 1.2.7 | AAA | Extended Audio Description (Prerecorded) | Extended audio description is available when pauses are insufficient. |
| 1.2.8 | AAA | Media Alternative (Prerecorded) | Full media alternatives exist for prerecorded synchronized media. |
| 1.2.9 | AAA | Audio-only (Live) | Live audio-only content has equivalent alternatives. |

### Guideline 1.3: Adaptable

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 1.3.1 | A | Info and Relationships | Structure conveyed visually is programmatic: headings, labels, lists, tables, groups, and relationships. |
| 1.3.2 | A | Meaningful Sequence | Reading and focus sequences preserve meaning. |
| 1.3.3 | A | Sensory Characteristics | Instructions do not rely only on shape, size, visual location, orientation, or sound. |
| 1.3.4 | AA | Orientation | Content does not require a single display orientation unless essential. |
| 1.3.5 | AA | Identify Input Purpose | Common input fields expose autocomplete/input purpose where applicable. |
| 1.3.6 | AAA | Identify Purpose | UI components, icons, and regions expose purpose in a machine-readable way where supported. |

### Guideline 1.4: Distinguishable

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 1.4.1 | A | Use of Color | Color is not the only way information, state, or instructions are conveyed. |
| 1.4.2 | A | Audio Control | Auto-playing audio longer than 3 seconds can be paused, stopped, or controlled independently. |
| 1.4.3 | AA | Contrast (Minimum) | Text and images of text meet minimum contrast ratios. |
| 1.4.4 | AA | Resize Text | Text can resize up to 200% without loss of content or functionality. |
| 1.4.5 | AA | Images of Text | Images of text are avoided except where essential or customizable. |
| 1.4.6 | AAA | Contrast (Enhanced) | Text meets enhanced contrast ratios. |
| 1.4.7 | AAA | Low or No Background Audio | Speech audio has low/no background audio or controls. |
| 1.4.8 | AAA | Visual Presentation | Blocks of text support enhanced readability preferences. |
| 1.4.9 | AAA | Images of Text (No Exception) | Images of text are used only for pure decoration or where essential. |
| 1.4.10 | AA | Reflow | Content reflows at 320 CSS px width without two-dimensional scrolling except where necessary. |
| 1.4.11 | AA | Non-text Contrast | Controls, states, focus indicators, and meaningful graphics have sufficient contrast. |
| 1.4.12 | AA | Text Spacing | Content remains usable when users override text spacing. |
| 1.4.13 | AA | Content on Hover or Focus | Hover/focus content is dismissible, hoverable, and persistent when required. |

## Principle 2: Operable

User interface components and navigation must be operable.

### Guideline 2.1: Keyboard Accessible

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 2.1.1 | A | Keyboard | All functionality is operable by keyboard. |
| 2.1.2 | A | No Keyboard Trap | Keyboard focus can always move away from components. |
| 2.1.3 | AAA | Keyboard (No Exception) | All functionality is keyboard operable without exception. |
| 2.1.4 | A | Character Key Shortcuts | Single-character shortcuts can be turned off, remapped, or require focus. |

### Guideline 2.2: Enough Time

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 2.2.1 | A | Timing Adjustable | Time limits can be turned off, adjusted, or extended unless an exception applies. |
| 2.2.2 | A | Pause, Stop, Hide | Moving, blinking, scrolling, or auto-updating content can be controlled. |
| 2.2.3 | AAA | No Timing | Timing is not an essential part of the activity. |
| 2.2.4 | AAA | Interruptions | Interruptions can be postponed or suppressed. |
| 2.2.5 | AAA | Re-authenticating | Users can continue without data loss after re-authentication. |
| 2.2.6 | AAA | Timeouts | Users are warned about inactivity timeout duration when data loss may occur. |

### Guideline 2.3: Seizures and Physical Reactions

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 2.3.1 | A | Three Flashes or Below Threshold | Content does not flash more than allowed thresholds. |
| 2.3.2 | AAA | Three Flashes | Content does not flash more than three times per second. |
| 2.3.3 | AAA | Animation from Interactions | Motion triggered by interaction can be disabled unless essential. |

### Guideline 2.4: Navigable

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 2.4.1 | A | Bypass Blocks | Users can bypass repeated content. |
| 2.4.2 | A | Page Titled | Pages have descriptive titles. |
| 2.4.3 | A | Focus Order | Focus order preserves meaning and operability. |
| 2.4.4 | A | Link Purpose (In Context) | Link purpose is clear from link text or context. |
| 2.4.5 | AA | Multiple Ways | More than one way exists to locate pages in a set, with exceptions. |
| 2.4.6 | AA | Headings and Labels | Headings and labels describe topic or purpose. |
| 2.4.7 | AA | Focus Visible | Keyboard focus is visible. |
| 2.4.8 | AAA | Location | Users can determine their location within a set of pages. |
| 2.4.9 | AAA | Link Purpose (Link Only) | Link purpose is clear from link text alone. |
| 2.4.10 | AAA | Section Headings | Section headings organize content. |
| 2.4.11 | AA | Focus Not Obscured (Minimum) | Focused components are not entirely hidden by author-created content. |
| 2.4.12 | AAA | Focus Not Obscured (Enhanced) | Focused components are not hidden at all by author-created content. |
| 2.4.13 | AAA | Focus Appearance | Focus indicators meet size and contrast requirements. |

### Guideline 2.5: Input Modalities

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 2.5.1 | A | Pointer Gestures | Complex pointer gestures have single-pointer alternatives unless essential. |
| 2.5.2 | A | Pointer Cancellation | Pointer actions can be canceled or are triggered safely. |
| 2.5.3 | A | Label in Name | Accessible names include visible labels for controls. |
| 2.5.4 | A | Motion Actuation | Motion-based functionality has conventional input alternatives and can be disabled. |
| 2.5.5 | AAA | Target Size (Enhanced) | Pointer targets meet enhanced size requirements. |
| 2.5.6 | AAA | Concurrent Input Mechanisms | Content does not restrict available input methods. |
| 2.5.7 | AA | Dragging Movements | Dragging has a single-pointer alternative unless essential. |
| 2.5.8 | AA | Target Size (Minimum) | Pointer targets meet minimum size or spacing requirements unless an exception applies. |

## Principle 3: Understandable

Information and operation of the user interface must be understandable.

### Guideline 3.1: Readable

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 3.1.1 | A | Language of Page | The page language is programmatically identified. |
| 3.1.2 | AA | Language of Parts | Language changes within content are identified. |
| 3.1.3 | AAA | Unusual Words | Definitions are available for unusual words or jargon. |
| 3.1.4 | AAA | Abbreviations | Expanded forms or meanings are available. |
| 3.1.5 | AAA | Reading Level | Supplemental content or simpler text is provided when needed. |
| 3.1.6 | AAA | Pronunciation | Pronunciation help is available when meaning is ambiguous. |

### Guideline 3.2: Predictable

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 3.2.1 | A | On Focus | Receiving focus does not unexpectedly change context. |
| 3.2.2 | A | On Input | Changing input values does not unexpectedly change context. |
| 3.2.3 | AA | Consistent Navigation | Repeated navigation appears in a consistent relative order. |
| 3.2.4 | AA | Consistent Identification | Components with the same function are identified consistently. |
| 3.2.5 | AAA | Change on Request | Context changes happen only by user request or can be disabled. |
| 3.2.6 | A | Consistent Help | Help mechanisms appear in a consistent order when present across pages. |

### Guideline 3.3: Input Assistance

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 3.3.1 | A | Error Identification | Input errors are identified and described in text. |
| 3.3.2 | A | Labels or Instructions | Labels or instructions are provided when user input is required. |
| 3.3.3 | AA | Error Suggestion | Error suggestions are provided when known and appropriate. |
| 3.3.4 | AA | Error Prevention (Legal, Financial, Data) | Important submissions are reversible, checked, or confirmed. |
| 3.3.5 | AAA | Help | Context-sensitive help is available. |
| 3.3.6 | AAA | Error Prevention (All) | Submissions are reversible, checked, or confirmed for all user-submitted data. |
| 3.3.7 | A | Redundant Entry | Users are not required to re-enter information already provided unless an exception applies. |
| 3.3.8 | AA | Accessible Authentication (Minimum) | Cognitive function tests are not required for authentication unless an exception applies. |
| 3.3.9 | AAA | Accessible Authentication (Enhanced) | Authentication avoids cognitive function tests without the broader minimum-level exceptions. |

## Principle 4: Robust

Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

### Guideline 4.1: Compatible

| SC | Level | Name | Audit focus |
| --- | --- | --- | --- |
| 4.1.2 | A | Name, Role, Value | UI components expose correct name, role, state, properties, and values. |
| 4.1.3 | AA | Status Messages | Status messages are programmatically determinable without receiving focus when appropriate. |

## WCAG 2.2 Success Criteria Added Since 2.1

| SC | Level | Name |
| --- | --- | --- |
| 2.4.11 | AA | Focus Not Obscured (Minimum) |
| 2.4.12 | AAA | Focus Not Obscured (Enhanced) |
| 2.4.13 | AAA | Focus Appearance |
| 2.5.7 | AA | Dragging Movements |
| 2.5.8 | AA | Target Size (Minimum) |
| 3.2.6 | A | Consistent Help |
| 3.3.7 | A | Redundant Entry |
| 3.3.8 | AA | Accessible Authentication (Minimum) |
| 3.3.9 | AAA | Accessible Authentication (Enhanced) |

## Automation Potential

Automation can provide strong signals for some criteria and weak or no signal for others.

High automation potential:

- 1.1.1 for missing text alternatives
- 1.3.1 for many structural failures
- 1.4.3 contrast
- 1.4.11 non-text contrast in some cases
- 2.4.2 page titles
- 3.1.1 page language
- 4.1.2 invalid ARIA and missing accessible names

Partial automation potential:

- 1.3.2 meaningful sequence
- 1.4.10 reflow
- 2.1.1 keyboard access
- 2.4.3 focus order
- 2.4.6 headings and labels
- 2.4.7 focus visible
- 2.4.11 focus not obscured
- 2.5.3 label in name
- 3.3.1 error identification
- 4.1.3 status messages

Mostly manual review:

- Whether alternative text is appropriate
- Whether instructions are understandable
- Whether flow completion is possible with assistive technology
- Whether errors are helpful
- Whether authentication creates cognitive barriers
- Whether timing, motion, and interruption controls are sufficient in context

## Sources

- [W3C/WAI WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- [What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)
