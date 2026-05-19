# Automation Roadmap

The eventual webapp should support the audit process without pretending automated checks are the whole audit. The product should make manual expert review faster, more consistent, and easier to report.

## Phase 1: Documentation And Templates

Current goal:

- Audit process
- WCAG 2.2 reference
- Report template
- Issue severity model
- Retest workflow

## Phase 2: Project And Scope Builder

Core features:

- Create audit projects
- Define WCAG target
- Add environments and credentials notes
- Build page and flow inventory
- Define browser and assistive technology matrix
- Track included and excluded scope

Suggested data objects:

- Project
- Audit
- Environment
- Page
- Flow
- Component
- Test matrix entry

## Phase 3: Automated Collection

Core features:

- Crawl public or authenticated routes
- Run axe-core checks
- Capture DOM snapshots for findings
- Capture screenshots
- Extract headings, landmarks, links, buttons, forms, images, tables, dialogs, and ARIA patterns
- Detect route titles and language
- Flag likely focus-order and keyboard risks for manual review

Important constraint:

Automated results should be evidence and triage input, not final conformance claims.

## Phase 4: Guided Manual Testing

Core features:

- Keyboard testing checklist per page and flow
- Screen reader test scripts
- Focus management probes
- Form validation probes
- Modal/popover/menu/combobox test recipes
- Responsive, zoom, and reflow prompts
- Evidence capture while testing

Helpful interaction model:

- The app generates test prompts from detected components.
- The auditor records pass/fail/notes/evidence.
- The app maps observations to likely WCAG criteria but allows override.

## Phase 5: Findings And Reports

Core features:

- Finding editor
- WCAG criterion mapping
- Severity and priority fields
- Evidence attachments
- Suggested remediation patterns
- Acceptance criteria generation
- Export to Markdown, PDF, CSV, and issue trackers
- Retest workflow

Report sections:

- Executive summary
- Scope and methodology
- Testing matrix
- Severity summary
- WCAG summary
- Detailed findings
- Remediation plan
- Retest results

## Phase 6: Component Library Intelligence

Core features:

- Map findings to design-system components
- Detect repeated issues across pages
- Maintain known component patterns
- Store approved remediation examples
- Integrate with Storybook
- Run component-level accessibility regression checks

## Phase 7: CI And Regression Monitoring

Core features:

- Scheduled scans
- Pull request checks
- Baseline comparison
- New violation detection
- Route coverage reporting
- Alerting for regressions

Recommended policy:

- CI can block on new high-confidence automated violations.
- CI should warn on issues that need manual interpretation.
- Conformance status should remain audit-reviewed.

## Initial Technical Direction

Likely stack:

- React / Next.js front end using shadcn/ui components note: use the shadcn/ui MCP for reference
- TypeScript
- Playwright for crawling and browser automation
- axe-core for automated rules
- Convex for project data
- Markdown/HTML report generation first, PDF export later

Useful libraries and tools:

- `@axe-core/playwright`
- Playwright trace/screenshots
- Testing Library accessibility queries
- Storybook accessibility addon
- color contrast utilities
- Markdown or MDX report rendering

## Product Principles

- Evidence first.
- Manual expertise stays central.
- Findings must be reproducible.
- WCAG mapping must be editable.
- Automated claims should be carefully worded.
- Reports should help engineers fix issues, not just score them.
