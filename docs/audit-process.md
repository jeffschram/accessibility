# Accessibility Audit Process

This process is written for product teams building modern web apps: component-based front ends, API-backed workflows, design systems, authenticated states, dynamic UI, and real production constraints.

The default audit target is WCAG 2.2 Level AA. Adjust scope when a contract, regulator, procurement requirement, or internal policy names a different version or level.

## 1. Define Scope

Capture the audit boundaries before testing starts.

- Product or site name
- Environment URL and build/version
- Authentication requirements
- Browser and operating system matrix
- Assistive technology matrix
- WCAG version and conformance target
- Critical user journeys
- Page or component inventory
- Known exclusions
- Prior audit history
- Stakeholders and remediation owners

Useful scope categories:

- Public marketing pages
- Authenticated app shell
- Account creation, login, MFA, password reset
- Search, filtering, sorting, pagination
- Forms and validation
- Dashboards and charts
- Modals, popovers, menus, comboboxes, tooltips
- File upload/download
- Checkout, payment, subscription, billing
- Error, empty, loading, success, and permission states
- Mobile/responsive layouts

## 2. Build The Test Matrix

Recommended baseline:

- Desktop browser: Chrome, Firefox, Safari
- Mobile browser: Safari iOS, Chrome Android when relevant
- Keyboard only: no mouse or trackpad
- Screen readers: VoiceOver on macOS/iOS, NVDA on Windows, JAWS when required by client or sector
- Browser zoom: 200%
- Responsive width: 320 CSS px minimum
- Color modes: light, dark, high contrast or forced colors when supported
- Motion preferences: reduced motion enabled

Assistive technology pairing guidance:

- VoiceOver + Safari is the native Apple baseline.
- NVDA + Firefox or Chrome is a strong free Windows baseline.
- JAWS + Chrome or Edge is common in enterprise and government settings.
- Do not rely on one screen reader/browser pairing for final confidence when interaction complexity is high.

## 3. Create A Page And Flow Inventory

Create an inventory before testing so findings can be mapped to meaningful product surfaces.

For each page, route, or state:

- URL or route pattern
- Auth state
- Required data setup
- Primary user goal
- Components present
- Interaction complexity
- Known risk areas
- Whether it is in audit scope

For each critical flow:

- Entry point
- Required steps
- Expected completion state
- Failure and recovery states
- Blocking defects observed

## 4. Run Automated Checks

Automated tools are a first pass, not the audit.

Recommended tools:

- axe DevTools or axe-core
- WAVE
- Lighthouse accessibility checks
- Browser DevTools accessibility tree
- HTML validator where markup validity is relevant
- Color contrast tooling
- Storybook accessibility addon if auditing components

Automated checks are good at finding:

- Missing accessible names
- Missing form labels
- Low text contrast
- Invalid ARIA usage
- Missing document language
- Some heading and landmark problems
- Some image alternative text problems

Automated checks often miss:

- Whether alt text is meaningful
- Keyboard trap quality in complex widgets
- Logical focus order
- Screen reader announcement quality
- Custom control expectations
- Error prevention and recovery quality
- Cognitive clarity
- Target size context
- Meaning conveyed by layout, color, or proximity
- Real task completion barriers

## 5. Keyboard Audit

Test every in-scope page and critical flow without a mouse.

Core questions:

- Can every interactive element receive focus?
- Is the focus indicator visible and not obscured?
- Does focus order match visual and task order?
- Can every control be operated with expected keys?
- Can the user escape modals, menus, popovers, and dialogs?
- Is focus moved intentionally after route changes, dialog open/close, validation errors, and destructive actions?
- Are there keyboard traps?
- Does custom UI follow expected ARIA Authoring Practices patterns?

Common commands:

- `Tab` and `Shift+Tab` for sequential navigation
- `Enter` and `Space` for buttons and activations
- Arrow keys for menus, tabs, radio groups, sliders, and composite widgets
- `Esc` for dismissible overlays
- `Home` and `End` where list or slider patterns support them

## 6. Screen Reader Audit

Screen reader testing should validate task completion, not just announcement snippets.

For each flow:

- Navigate by headings, landmarks, links, buttons, form fields, and virtual cursor.
- Confirm page title and route changes are announced or discoverable.
- Confirm controls expose role, name, state, value, and instructions.
- Confirm validation errors are announced and associated with fields.
- Confirm live updates are announced when needed.
- Confirm visual relationships are present programmatically.
- Confirm dynamic UI does not create disorienting focus jumps.

Record:

- Screen reader and version
- Browser and version
- Operating system
- Exact reproduction steps
- Actual announcement when relevant
- Expected announcement or behavior

## 7. Manual WCAG Review

Use WCAG success criteria as the organizing frame, but evaluate user impact first. A technically precise violation is only useful when paired with the practical barrier it creates.

Manual review areas:

- Information structure and headings
- Landmark regions
- Form labels, instructions, errors, and recovery
- Name, role, value for custom controls
- Status messages and async updates
- Modal and popover focus management
- Table semantics
- Images, icons, charts, and non-text content
- Text resizing, reflow, zoom, orientation
- Color contrast and non-color indicators
- Touch target size and spacing
- Motion, animation, flashing, auto-updating content
- Authentication and cognitive load
- Consistency of navigation, help, and identification

## 8. Triage Findings

Use severity for user impact and priority for scheduling.

Suggested severity model:

- Critical: blocks task completion for one or more disability groups, affects legal/commercially critical paths, or creates severe safety/security risk.
- High: major barrier with no reasonable workaround.
- Medium: meaningful barrier with a workaround or limited scope.
- Low: minor issue, advisory improvement, or edge case.

Suggested priority inputs:

- User impact
- Frequency and reach
- Revenue, compliance, or contractual exposure
- Remediation complexity
- Whether the issue appears in shared components
- Whether the defect blocks additional testing

## 9. Write Findings

Each finding should include:

- Title
- Severity
- Affected URL, route, component, or flow
- WCAG success criterion and level
- User impact
- Steps to reproduce
- Actual result
- Expected result
- Evidence such as screenshots, DOM snippets, or screen reader notes
- Recommended fix
- Acceptance criteria
- Retest notes

Good finding titles are specific:

- Poor: "Button issue"
- Better: "Icon-only filter buttons have no accessible names"
- Best: "Product filter icon buttons are announced as unlabeled buttons"

## 10. Retest And Close

Retesting should verify the user experience, not just the patch.

For each remediated finding:

- Re-run the original reproduction steps.
- Re-run the relevant automated checks.
- Re-test keyboard behavior.
- Re-test at least one relevant screen reader pairing for interaction issues.
- Check neighboring states for regressions.
- Record pass, fail, or partially fixed.

Close a finding only when:

- The original barrier is removed.
- The fix does not introduce a comparable new barrier.
- Acceptance criteria are met.
- Evidence is attached.

## Audit Deliverables

Recommended deliverables:

- Executive summary
- Scope and methodology
- Environment and assistive technology matrix
- Issue summary by severity
- Issue summary by WCAG criterion
- Detailed findings
- Reproduction assets
- Remediation guidance
- Retest results
- Appendix with WCAG reference and tool output

## Sources

- [W3C/WAI WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [WCAG-EM methodology](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/)
- [WCAG 2.2 Understanding documents](https://www.w3.org/WAI/WCAG22/Understanding/)
