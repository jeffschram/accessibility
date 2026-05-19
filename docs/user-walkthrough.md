# User Walkthrough: From New Project To Completed Audit

This walkthrough explains how to use Accessibility Audit Tracker from the first project setup through final reporting and retesting. It is written for both experienced auditors and people learning accessibility audit practice.

Some features described here are part of the intended workflow and may still be in progress. The current app already supports creating projects, viewing seeded audits, reviewing guided testing content, and browsing WCAG reference material.

## 1. Create A Project

A project represents the product, website, app, client, or internal team you are auditing.

1. Open **Projects**.
2. Select **New project**.
3. Enter a project name.
4. Optionally enter the client, team, or organization.
5. Optionally add a short description of the product or audit context.
6. Select **Create project**.

Why this matters:

The project is the long-term container for audit history. A product may have multiple audits over time, such as a baseline audit, a post-redesign audit, a quarterly audit, or a retest cycle.

Recommended project description:

```text
Customer-facing checkout and account management application. Audit includes authenticated flows, payment forms, dialogs, dynamic filtering, and responsive states.
```

## 2. Create An Audit

An audit represents one evaluation cycle for a project.

1. Open the project.
2. Select **New audit**.
3. Name the audit.
4. Confirm the WCAG target.
5. Add the environment URL.
6. Add notes about authentication, test data, or special setup.
7. Save the audit.

Recommended default:

- WCAG version: WCAG 2.2
- Conformance level: AA

Why this matters:

Different audits may use different environments, dates, scopes, and legal or contractual targets. Keeping audits separate prevents findings, retest notes, and reports from getting mixed together.

Example audit names:

- Baseline WCAG 2.2 AA audit
- Checkout redesign audit
- Q3 product accessibility audit
- Retest after remediation sprint

## 3. Define Audit Scope

Scope describes what you will and will not test.

Add scope items for:

- Pages
- Routes
- Components
- User flows
- Important states
- Error states
- Empty states
- Loading states
- Authenticated states
- Responsive layouts

For each scope item, record:

- Name
- Type
- URL or route
- Priority
- Included or excluded
- Risk notes
- Current test status

Why this matters:

Accessibility audits are only meaningful when the tested surface is clear. Scope also helps product teams understand whether a finding affects one page, a shared component, or an entire user journey.

Example scope items:

| Name | Type | Priority | Notes |
| --- | --- | --- | --- |
| Checkout flow | Flow | Critical | Legal/financial transaction with form validation |
| Product filter toolbar | Component | High | Custom controls and dynamic result updates |
| Account settings | Page | Medium | Forms, toggles, save states |
| Empty search results | State | Low | Recovery action and status messaging |

## 4. Build The Test Matrix

The test matrix defines how each item should be evaluated.

Common test modalities:

- Automated scan
- Keyboard testing
- Screen reader testing
- Browser zoom
- Reflow and responsive layout
- Forced colors or high contrast
- Reduced motion
- Manual WCAG review

Recommended baseline:

| Modality | Purpose |
| --- | --- |
| Automated scan | Finds high-confidence issues quickly |
| Keyboard | Confirms all functionality works without a pointer |
| Screen reader | Confirms role, name, state, structure, and announcements |
| Zoom/reflow | Confirms content remains usable at 200% zoom and narrow widths |
| Manual review | Covers judgment-based WCAG criteria automation cannot reliably answer |

Why this matters:

Automated tools are useful, but they cannot tell whether an interaction is understandable, whether focus order makes sense, whether alternative text is meaningful, or whether a user can complete a real task.

## 5. Run Automated Checks

Run automated checks against scoped pages or imported test results.

Automated results should be treated as observations first, not final findings.

For each automated observation:

1. Review the rule and affected element.
2. Confirm whether the issue is real in context.
3. Dismiss false positives or irrelevant results.
4. Merge duplicate observations.
5. Convert confirmed issues into findings.

Why this matters:

Tools such as axe are strong at detecting certain code-level failures, but they cannot complete the audit for you. Human review decides whether an observation is a true user-impacting defect and how it should be explained.

## 6. Perform Guided Manual Testing

Open **Testing** to work through guided tasks.

Each task should explain:

- What to test
- Why the test matters
- Who may be affected
- Related WCAG success criteria
- How to test
- Expected behavior
- Common failures
- When to ask for expert review

Record the result for each task:

- Pass
- Fail
- Blocked
- Not applicable
- Needs expert review

Also record notes and evidence when useful.

## 7. Example: Keyboard Audit Of A Component

Use this process when testing a component such as a filter toolbar, dialog, menu, combobox, tablist, carousel, or custom control.

Related WCAG criteria often include:

- 2.1.1 Keyboard
- 2.1.2 No Keyboard Trap
- 2.4.3 Focus Order
- 2.4.7 Focus Visible
- 4.1.2 Name, Role, Value

Steps:

1. Place focus immediately before the component.
2. Press `Tab` to move into the component.
3. Confirm every interactive element receives focus.
4. Confirm the focus indicator is visible.
5. Confirm focus order follows the visual and task order.
6. Operate controls with expected keys.
7. Use arrow keys for composite widgets where appropriate.
8. Use `Enter` and `Space` where expected.
9. Use `Esc` for dismissible overlays.
10. Confirm focus can leave the component.
11. Confirm focus is restored after closing dialogs or popovers.

Expected behavior:

Every interactive control can be reached and operated without a mouse. Focus is visible, logical, and not trapped. Custom controls expose the correct role, accessible name, state, and value.

Common failures:

- A clickable element is not keyboard focusable.
- Focus moves behind a modal.
- Focus disappears after closing a dialog.
- A menu opens but cannot be closed with `Esc`.
- A custom button does not respond to `Space`.
- Visible labels do not match accessible names.

Learning note:

Keyboard testing is not only for people who use a physical keyboard. It also supports users of switch devices, screen readers, voice control, and other keyboard-like input.

## 8. Create Observations

An observation is a raw note or piece of evidence before you decide whether it is a confirmed finding.

Create an observation when:

- You notice suspicious behavior.
- A tool reports a possible issue.
- A screen reader announcement seems confusing.
- You are unsure whether behavior violates WCAG.
- You need to capture evidence before writing a formal finding.

Useful observation notes:

- What you tested
- Browser and assistive technology
- Steps performed
- Actual behavior
- Why it may be a problem
- Related WCAG criteria
- Evidence links or screenshots
- Whether expert review is needed

Why this matters:

Observations let you preserve evidence without prematurely turning every note into a formal defect.

## 9. Convert Confirmed Issues Into Findings

A finding is a confirmed accessibility issue that should be remediated, accepted as risk, or otherwise resolved.

Each finding should include:

- Title
- Severity
- Status
- Affected scope item
- WCAG criteria
- User impact
- Steps to reproduce
- Actual result
- Expected result
- Evidence
- Recommended fix
- Acceptance criteria
- Owner

Good finding title:

```text
Product filter icon buttons are announced as unlabeled buttons
```

Poor finding title:

```text
Button issue
```

Why this matters:

Findings should be specific enough that an engineer can reproduce and fix them without needing to rediscover the whole problem.

## 10. Prioritize Findings

Use severity for user impact and priority for scheduling.

Suggested severity model:

| Severity | Meaning |
| --- | --- |
| Critical | Blocks task completion or affects a critical legal, financial, safety, or account flow |
| High | Major barrier with no reasonable workaround |
| Medium | Meaningful barrier with a workaround or limited scope |
| Low | Minor issue, edge case, or advisory improvement |

Why this matters:

Severity should describe the barrier. Priority can also include business timing, component reuse, engineering cost, release deadlines, and contractual obligations.

## 11. Track Remediation

Move findings through the remediation workflow.

Typical statuses:

- Open
- In remediation
- Ready for retest
- Passed retest
- Failed retest
- Accepted risk
- Closed

For each remediation update, record:

- Owner
- Notes from the implementation team
- Pull request or issue link
- Target date
- Any scope changes

Why this matters:

Accessibility work often fails when findings are written but not tracked through resolution. The audit is not complete until defects are fixed, accepted, or intentionally deferred.

## 12. Retest

Retest when a finding is marked ready.

For each retest:

1. Use the original reproduction steps.
2. Confirm the issue is fixed in the target environment.
3. Re-run relevant automated checks.
4. Re-test keyboard behavior for interaction issues.
5. Re-test screen reader behavior when announcements or semantics changed.
6. Check nearby states for regressions.
7. Record pass, fail, or partial.

Close a finding only when:

- The original issue is resolved.
- The fix does not introduce a similar barrier.
- Acceptance criteria are met.
- Evidence or notes are attached.

## 13. Generate The Report

When testing and triage are complete, generate the audit report.

A complete report should include:

- Executive summary
- Scope
- Methodology
- WCAG target
- Environment and assistive technology matrix
- Summary by severity
- Summary by WCAG criterion
- Detailed findings
- Remediation plan
- Retest results
- Appendix or references

Why this matters:

Reports should help teams make decisions and fix issues. A useful report explains impact, evidence, and next steps rather than only listing failures.

## 14. Complete The Audit

An audit can be considered complete when:

- Scope is finalized.
- Required testing is complete or documented as blocked.
- Observations are triaged.
- Findings are written and prioritized.
- Report content is reviewed.
- Retest status is recorded where applicable.
- Remaining risks are documented.

Final audit states may include:

- Complete
- Complete with accepted risks
- Paused or blocked
- Retest required

## Quick Checklist

Use this checklist to move through the whole workflow.

- Create project.
- Create audit.
- Confirm WCAG version and level.
- Add environment and setup notes.
- Define scope.
- Build test matrix.
- Run automated checks.
- Perform guided manual testing.
- Record observations.
- Convert confirmed issues into findings.
- Prioritize findings.
- Track remediation.
- Retest fixes.
- Generate report.
- Close or archive the audit.

## Official References

- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)
- [WCAG-EM Website Accessibility Conformance Evaluation Methodology](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/)
