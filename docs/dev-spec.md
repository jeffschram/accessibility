# Accessibility Audit Tracker Development Spec

## Summary

Accessibility Audit Tracker is a webapp for planning, running, tracking, learning, and reporting accessibility audits. It combines project/audit management, WCAG-based structure, automated evidence collection, guided manual testing, contextual reference material, findings management, remediation tracking, and report generation.

The product should explicitly avoid presenting automated test results as a complete accessibility audit. Automated checks are evidence and triage inputs. Expert manual review remains the core of the audit workflow.

The app should also function as an applied accessibility reference. A beginner should be able to learn from the workflow itself: what they are testing, why it matters, which WCAG success criteria are related, how users are affected, what good behavior looks like, and when expert judgment is required.

## Goals

- Give auditors a repeatable structure for WCAG-based audits.
- Help newer accessibility practitioners learn audit concepts while doing real audit work.
- Track audit scope, progress, findings, remediation, and retesting.
- Guide manual testing for keyboard, screen reader, zoom/reflow, forms, dynamic UI, and complex components with inline references and rationale.
- Run or import automated checks where they are useful.
- Produce consistent implementation-friendly audit reports.
- Support solo auditors first, then teams and client-facing workflows.

## Non-goals For MVP

- Full legal conformance certification.
- Replacing expert judgment with automated scoring.
- Browser farm infrastructure for every assistive technology pairing.
- Native screen reader automation for NVDA, JAWS, or VoiceOver.
- Deep issue tracker integrations before the core workflow is solid.
- PDF-perfect report design before Markdown/HTML reports work well.

## Target Users

- Experienced accessibility auditors.
- Beginners learning how to perform accessibility audits.
- Front-end engineers performing internal audits.
- Product teams tracking accessibility remediation.
- Agencies or consultants producing repeatable client reports.

The product should support different confidence levels without splitting into separate apps. Experienced users need efficient workflows, fast entry, filters, and bulk actions. Beginners need explanations, examples, references, and guidance that helps them understand the reason behind each task.

## Product Principles

- Evidence first.
- Manual expertise stays central.
- Teach while tracking.
- Every finding should be reproducible.
- WCAG mappings should be suggested but editable.
- References should be close to the work, not buried in a separate documentation area.
- Beginner guidance should explain purpose and expected behavior without hiding nuance from experienced auditors.
- Progress should be visible at project, audit, page, flow, and finding levels.
- Reports should help engineers fix issues, not merely score pages.
- The app should distinguish "automated violation", "manual observation", "finding", and "confirmed defect".

## Tech Stack

- Framework: Next.js App Router with React and TypeScript.
- UI: shadcn/ui components, Tailwind CSS, lucide-react icons.
- Data: Convex for reactive application data, server functions, and file metadata.
- Browser automation: Playwright.
- Automated accessibility rules: axe-core, likely through `@axe-core/playwright`.
- Report rendering: Markdown/HTML first, PDF export later.
- Auth: TBD, likely Clerk with Convex integration or Convex Auth depending on project preference.
- Package manager: TBD during scaffold; use one consistently.

Official references:

- [Next.js App Router](https://nextjs.org/docs/app)
- [Convex Next.js Quickstart](https://docs.convex.dev/quickstart/nextjs)
- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation)
- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- [WCAG-EM](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/)

## Architecture

### Application Shape

Use the Next.js App Router for route structure and layouts. Prefer server components for static shell, navigation, and page composition. Use client components for interactive audit workflows, Convex subscriptions, forms, drag/drop, filters, dialogs, and dashboards.

Convex should own application state:

- Projects
- Audits
- Scope inventory
- Test plans
- Test runs
- Observations
- Findings
- Evidence metadata
- Report drafts
- Activity history
- Reference content
- Guided test templates

Playwright and axe work should run outside the browser UI. Early development can use local scripts or server-side job functions. Longer term, scans may need a worker process or queue-like job model so crawling does not block the app.

### Suggested Directory Structure

```text
app/
  (app)/
    layout.tsx
    dashboard/page.tsx
    projects/page.tsx
    projects/[projectId]/page.tsx
    projects/[projectId]/audits/[auditId]/page.tsx
    projects/[projectId]/audits/[auditId]/scope/page.tsx
    projects/[projectId]/audits/[auditId]/testing/page.tsx
    projects/[projectId]/audits/[auditId]/findings/page.tsx
    projects/[projectId]/audits/[auditId]/reports/page.tsx
  api/
components/
  app/
  audit/
  findings/
  reports/
  scope/
  testing/
  ui/
convex/
  schema.ts
  projects.ts
  audits.ts
  scope.ts
  findings.ts
  testRuns.ts
  reports.ts
  wcag.ts
  guidance.ts
lib/
  accessibility/
  reports/
  validations/
  utils.ts
scripts/
  scans/
docs/
```

## Core Domain Model

### Project

Represents a product, client, website, or application being audited.

Fields:

- `name`
- `slug`
- `description`
- `clientName`
- `defaultWcagVersion`
- `defaultConformanceLevel`
- `createdBy`
- `createdAt`
- `updatedAt`
- `archivedAt`

### Audit

Represents one audit cycle for a project.

Fields:

- `projectId`
- `name`
- `status`: `draft`, `scoping`, `testing`, `reporting`, `remediation`, `retesting`, `complete`, `archived`
- `wcagVersion`: default `2.2`
- `conformanceLevel`: `A`, `AA`, or `AAA`
- `environmentName`
- `environmentUrl`
- `startedAt`
- `targetCompletionDate`
- `completedAt`
- `summary`

### Environment

Represents a testable deployment or context.

Fields:

- `projectId`
- `auditId`
- `name`
- `baseUrl`
- `authNotes`
- `dataSetupNotes`
- `browserNotes`

### Scope Item

Represents a page, route, screen, component, or state in audit scope.

Fields:

- `auditId`
- `type`: `page`, `flow`, `component`, `state`
- `name`
- `url`
- `routePattern`
- `description`
- `included`
- `priority`: `critical`, `high`, `medium`, `low`
- `riskNotes`
- `testStatus`: `not_started`, `in_progress`, `blocked`, `tested`, `retest_needed`, `passed`

### Flow

Represents a multi-step user journey.

Fields:

- `auditId`
- `name`
- `entryScopeItemId`
- `description`
- `steps`
- `expectedOutcome`
- `criticality`
- `status`

### Test Matrix Entry

Represents a required testing configuration.

Fields:

- `auditId`
- `modality`: `keyboard`, `screen_reader`, `browser_zoom`, `responsive`, `forced_colors`, `reduced_motion`, `automated`
- `assistiveTechnology`
- `browser`
- `operatingSystem`
- `viewport`
- `required`
- `notes`

### Test Run

Represents execution of one testing pass.

Fields:

- `auditId`
- `scopeItemId`
- `flowId`
- `testMatrixEntryId`
- `testerId`
- `status`: `not_started`, `pass`, `fail`, `blocked`, `not_applicable`
- `startedAt`
- `completedAt`
- `notes`
- `guidanceTaskIds`
- `confidence`: `needs_guidance`, `comfortable`, `expert_review_needed`

### Observation

Represents raw evidence or notes before becoming a finding.

Fields:

- `auditId`
- `scopeItemId`
- `testRunId`
- `source`: `automated`, `manual`, `screen_reader`, `keyboard`, `code_review`, `imported`
- `title`
- `description`
- `rawTool`
- `rawRuleId`
- `suggestedWcag`
- `status`: `new`, `triaged`, `dismissed`, `converted_to_finding`
- `evidenceIds`
- `relatedGuidanceTaskId`

### Finding

Represents a confirmed accessibility issue.

Fields:

- `auditId`
- `projectId`
- `title`
- `status`: `open`, `in_remediation`, `ready_for_retest`, `passed_retest`, `failed_retest`, `accepted_risk`, `closed`
- `severity`: `critical`, `high`, `medium`, `low`
- `priority`
- `wcagCriteria`
- `affectedScopeItemIds`
- `affectedFlowIds`
- `userImpact`
- `stepsToReproduce`
- `actualResult`
- `expectedResult`
- `recommendedFix`
- `acceptanceCriteria`
- `evidenceIds`
- `owner`
- `targetDate`
- `createdAt`
- `updatedAt`

### Evidence

Represents screenshots, DOM snippets, scan output, screen reader notes, videos, or trace references.

Fields:

- `auditId`
- `findingId`
- `observationId`
- `type`: `screenshot`, `dom`, `tool_output`, `screen_reader_notes`, `video`, `trace`, `link`
- `label`
- `storageId`
- `url`
- `text`
- `metadata`
- `createdAt`

### Report

Represents a generated or editable audit report.

Fields:

- `auditId`
- `title`
- `status`: `draft`, `review`, `final`
- `format`: `markdown`, `html`, `pdf`
- `sections`
- `generatedAt`
- `publishedAt`

### Guidance Topic

Represents instructional/reference content for a testing concept, WCAG topic, component pattern, or audit technique.

Fields:

- `title`
- `slug`
- `category`: `keyboard`, `screen_reader`, `forms`, `structure`, `color_contrast`, `dynamic_ui`, `media`, `authentication`, `reporting`
- `summary`
- `whyItMatters`
- `userImpact`
- `relatedWcagCriteria`
- `sourceUrls`
- `examples`
- `commonFailures`
- `remediationPatterns`
- `audienceLevel`: `beginner`, `intermediate`, `advanced`
- `updatedAt`

### Guidance Task

Represents one guided manual testing task. Guidance tasks are reusable templates that can be attached to scope items, flows, or component types.

Fields:

- `title`
- `modality`: `keyboard`, `screen_reader`, `zoom_reflow`, `responsive`, `forced_colors`, `reduced_motion`, `manual_review`
- `componentTypes`
- `relatedWcagCriteria`
- `guidanceTopicIds`
- `taskPrompt`
- `whyThisMatters`
- `howToTest`
- `expectedBehavior`
- `failureExamples`
- `passCriteria`
- `whenToEscalate`
- `referenceUrls`
- `defaultSeverityHint`
- `audienceLevel`

Example keyboard guidance task:

- Title: "Verify all controls are keyboard operable"
- Related WCAG: 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 2.4.7 Focus Visible, 4.1.2 Name, Role, Value
- Why this matters: Users who cannot use a mouse need to reach and operate every interactive control with a keyboard or keyboard-like input.
- How to test: Use `Tab`, `Shift+Tab`, `Enter`, `Space`, arrow keys where expected, and `Esc` for dismissible overlays.
- Expected behavior: Focus reaches controls in a logical order, visible focus is present, controls operate with expected keys, and focus never becomes trapped.

## WCAG Data

Store WCAG reference data as versioned seed data, not hardcoded UI strings.

Minimum fields:

- `version`
- `criterion`
- `handle`
- `title`
- `level`
- `principle`
- `guideline`
- `url`
- `summary`
- `intent`
- `whoBenefits`
- `plainLanguageSummary`
- `manualTestingNotes`
- `commonFailures`
- `relatedGuidanceTopicIds`
- `automationPotential`: `high`, `partial`, `manual`

The app should start with WCAG 2.2. It may later support filtering or report modes for WCAG 2.0 and 2.1 when required by client/legal scope.

WCAG reference views should be available from inside relevant tasks. For example, a keyboard audit task should expose concise explanations and links for 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 2.4.7 Focus Visible, and related component semantics such as 4.1.2 Name, Role, Value.

## Primary Workflows

### 1. Create Project

User creates a project with a name, optional client, default WCAG target, and notes.

Acceptance criteria:

- Project appears in dashboard.
- Project can be archived.
- Project owns one or more audits.

### 2. Create Audit

User creates an audit under a project, choosing WCAG version, level, environment, and high-level dates.

Acceptance criteria:

- Audit starts in `draft` or `scoping`.
- Audit has empty scope, test matrix, observations, findings, and report areas.
- Audit dashboard shows progress placeholders.

### 3. Define Scope

User adds pages, flows, components, and states. User marks each item included or excluded and assigns risk/priority.

Acceptance criteria:

- Scope can be filtered by type, inclusion, priority, and test status.
- Critical flows can reference one or more scope items.
- Excluded items remain visible for reporting.

### 4. Build Test Matrix

User defines which modalities and environments must be tested.

Acceptance criteria:

- Audit can require keyboard, screen reader, zoom/reflow, responsive, forced colors, reduced motion, and automated scans.
- Test matrix entries create checklist coverage expectations.
- Progress can be summarized by scope item and modality.

### 5. Run Automated Scan

User runs or imports automated results for selected scope items.

Acceptance criteria:

- Scan stores tool, rule id, affected element, WCAG mapping when available, screenshot/DOM evidence when available, and raw output.
- Results become observations, not findings by default.
- User can dismiss, merge, or convert observations into findings.

### 6. Guided Manual Testing

User works through generated checklists by scope item, flow, and modality. Each task includes practical instructions and reference material so users can understand what they are testing and why.

Acceptance criteria:

- Keyboard checklist covers focus order, focus visibility, traps, expected key behavior, and overlays.
- Screen reader checklist records AT/browser/OS pairing and supports announcement notes.
- Forms checklist covers labels, instructions, errors, suggestions, prevention, and redundant entry.
- Dynamic UI checklist covers dialogs, popovers, menus, tabs, comboboxes, live regions, loading states, and route changes.
- Each checklist task shows related WCAG success criteria, plain-language intent, why the test matters, how to test, expected behavior, common failure examples, and source links.
- Users can mark task results as pass, fail, blocked, not applicable, or needs expert review.
- Users can record confidence or uncertainty separately from pass/fail status.
- User can create observations or findings from any checklist item.

### 7. Manage Findings

User confirms findings, writes remediation guidance, assigns severity/status, and tracks remediation.

Acceptance criteria:

- Finding editor supports WCAG criteria, evidence, reproduction steps, expected/actual results, user impact, recommendations, and acceptance criteria.
- Findings can be grouped by severity, status, WCAG criterion, scope item, owner, and component.
- Status changes are recorded in activity history.

### 8. Retest

User marks findings ready for retest and records pass/fail/partial results.

Acceptance criteria:

- Retest records environment, tester, date, notes, and evidence.
- Failed retests can reopen findings.
- Passed retests can close findings.

### 9. Generate Report

User generates a Markdown/HTML report from audit data.

Acceptance criteria:

- Report includes executive summary, scope, methodology, test matrix, severity summary, WCAG summary, findings, remediation plan, and retest results.
- User can edit report narrative before finalizing.
- Findings retain links back to source data.

## MVP Screens

### Dashboard

- Recent projects
- Active audits
- Findings by severity
- Audits needing retest
- Quick create project/audit

### Projects

- Project list
- Project detail
- Audit history
- Project-level notes

### Audit Overview

- Status
- WCAG target
- Environment
- Scope progress
- Testing progress
- Findings summary
- Report status

### Scope

- Table of pages, flows, components, and states
- Add/edit scope item
- Inclusion/exclusion notes
- Priority/risk fields

### Testing

- Test matrix
- Checklist runner
- Inline guidance/reference panel
- Related WCAG criteria and source links
- Expected behavior and common failures for the selected task
- Observations panel
- Evidence capture/import controls

### Reference

- WCAG 2.2 criteria browser
- Guidance topics by modality and component type
- Search across WCAG criteria, audit tasks, examples, and remediation patterns
- Beginner-friendly explanations with links to official sources

### Findings

- Findings table
- Finding detail/editor
- Severity/status filters
- WCAG filters
- Retest workflow

### Reports

- Report builder
- Generated Markdown preview
- Export controls

## UI Direction

Use shadcn/ui as a local component foundation, not as a black-box design system. The app should feel like a focused professional tool: dense, calm, and optimized for repeated audit work.

Recommended shadcn/ui components:

- `button`
- `card` for repeated project/audit/finding summaries only
- `dialog`
- `sheet`
- `dropdown-menu`
- `select`
- `tabs`
- `table`
- `badge`
- `textarea`
- `input`
- `checkbox`
- `radio-group`
- `separator`
- `toast` or `sonner`
- `command`
- `popover`
- `calendar`
- `tooltip`

UI rules:

- Prefer tables and split panes for operational screens.
- Avoid marketing-style hero layouts inside the app.
- Keep status visible and scannable.
- Use badges for severity, status, WCAG level, and modality.
- Keep finding and observation creation close to the testing workflow.
- Keep task instructions, rationale, and references visible near the active checklist item.
- Let experienced users collapse guidance panels and move quickly through tasks.
- Make keyboard accessibility excellent from the first build.
- Ensure every custom component keeps accessible names, focus states, and expected keyboard behavior.

## Automation Design

### Automated Scan Inputs

- URL or scope item
- Viewport
- Auth/session strategy
- Ruleset
- Include/exclude selectors
- Crawl depth for later phases

### Automated Scan Outputs

- Tool name and version
- Rule id
- Impact
- Help text
- WCAG tags
- Target selector
- HTML snippet
- Screenshot reference when possible
- DOM snapshot or serialized node context when useful
- Raw JSON payload

### Scan Result Lifecycle

1. Scan result is saved as an observation.
2. Auditor reviews the observation.
3. Auditor dismisses, merges, or converts it into a finding.
4. Converted finding receives human-written impact and remediation notes.

## Manual Testing Design

Manual test plans should be generated from scope and detected components. For example:

- A page with forms gets labels, validation, error recovery, autocomplete, and redundant entry prompts.
- A page with dialogs gets focus trap, escape, return focus, name/description, and screen reader prompts.
- A page with tables gets header associations, caption/summary context, navigation, and responsive behavior prompts.
- A flow with authentication gets accessible authentication and timeout prompts.

Each manual task should include:

- What to test.
- Why the test matters.
- Who is affected when it fails.
- Related WCAG success criteria.
- Official source links.
- Step-by-step test instructions.
- Expected behavior.
- Common failure examples.
- Notes about judgment calls or limits of the test.
- Suggested remediation patterns when a failure is found.

Manual results should be structured enough to report coverage without forcing the auditor into busywork. Guidance should be collapsible and searchable so experienced auditors can move quickly while beginners can learn in place.

Example keyboard component audit task:

- Task: Verify every interactive control can be reached and operated by keyboard.
- Related WCAG: 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 2.4.7 Focus Visible, 4.1.2 Name, Role, Value.
- Instructions: Start before the component, use `Tab` and `Shift+Tab` to move through it, use `Enter`, `Space`, arrow keys, and `Esc` according to the component pattern, then confirm focus exits predictably.
- Expected behavior: All controls receive visible focus in a logical order, controls operate with expected keys, focus is not trapped, and custom controls expose appropriate name, role, state, and value.
- Learning note: Keyboard access supports users who navigate with keyboards, switch devices, voice control, screen readers, and other keyboard-like input methods.

## Reporting Design

Reports should be generated from structured data and then editable.

Default sections:

- Executive summary
- Scope
- Methodology
- Environment and assistive technology matrix
- Results summary by severity
- Results summary by WCAG criterion
- Detailed findings
- Remediation plan
- Retest summary
- Appendix

Export phases:

1. Markdown
2. HTML
3. PDF
4. CSV findings export
5. Issue tracker export

## Permissions And Auth

MVP can start with a single-user or simple authenticated model, but the data model should not block team support.

Future roles:

- Owner: manages project settings and access.
- Auditor: creates and edits audits, findings, evidence, and reports.
- Developer: views findings, updates remediation status, adds implementation notes.
- Reviewer: comments and approves report content.
- Client: read-only access to final reports and remediation status.

## Implementation Phases

### Phase 0: App Scaffold

- Create Next.js app in this repo.
- Add TypeScript, Tailwind, shadcn/ui, linting, and formatting.
- Add Convex and local dev setup.
- Create base app shell and navigation.

### Phase 1: Core Audit Tracker

- Projects CRUD.
- Audits CRUD.
- Scope item CRUD.
- Test matrix CRUD.
- Audit overview progress.
- Basic WCAG reference data available in the app.

### Phase 2: Findings Workflow

- Observations model.
- Findings CRUD.
- WCAG criterion picker.
- Severity/status workflow.
- Evidence notes and links.

### Phase 3: Guided Manual Testing

- Checklist runner.
- Keyboard and screen reader test templates.
- Inline guidance content for each checklist task.
- WCAG references connected to checklist tasks.
- Manual observation creation.
- Progress tracking by scope item and modality.

### Phase 4: Automated Checks

- Local Playwright + axe scan for a single URL.
- Store results as observations.
- Convert observations to findings.
- Scan history per scope item.

### Phase 5: Reports

- Markdown report generation.
- Editable report draft.
- HTML preview.
- Export file generation.

### Phase 6: Collaboration And Integrations

- Team auth and roles.
- Comments/activity.
- Issue tracker export.
- Scheduled scans.
- Storybook/component-level checks.

## Open Decisions

- Auth provider: Clerk, Convex Auth, or another provider.
- Package manager: npm, pnpm, bun, or yarn.
- Whether Playwright scans run inside Next server actions, Convex actions, separate Node workers, or a hybrid.
- File/evidence storage location: Convex file storage, object storage, or repo-local during development.
- Whether WCAG reference data starts as Convex seed data or versioned JSON imported into Convex.
- Whether guidance content should be stored fully in Convex, generated from versioned Markdown/MDX, or seeded into Convex from Markdown/JSON.
- How much beginner guidance appears by default versus behind expandable panels or a learner mode.
- Whether reports should use MDX components or plain Markdown plus templates.

## Early Acceptance Criteria

The first usable version is successful when an auditor can:

- Create a project and audit.
- Define scope.
- Define required test modalities.
- Track testing progress.
- Read task-level guidance explaining why each manual test matters.
- Record manual observations.
- Convert observations into WCAG-mapped findings.
- Track finding status through retest.
- Generate a basic Markdown report.

The first automation-enhanced version is successful when an auditor can:

- Run an axe scan against a scoped URL.
- Review results as observations.
- Convert relevant observations into findings.
- Preserve evidence and raw scan output.
- See automated coverage alongside manual coverage without conflating the two.
