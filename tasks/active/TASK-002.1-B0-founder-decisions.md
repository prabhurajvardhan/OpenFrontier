# TASK-002.1-B0 — Founder decision packet

- **Status:** Ready
- **Assignee:** Tech Lead / Founder review
- **Created:** 2026-11-20
- **Updated:** 2026-11-20
- **Dependencies:** None

## Objective

Resolve or explicitly defer the unresolved architecture and business decisions before implementation tasks begin.

## Deliverable

A dated decision matrix linked to `docs/decisions/founder-decisions.md`, with accepted decisions recorded in ADRs and unresolved items retained as Awaiting founder approval.

## Scope

Topology, gateway and spend, models/limits, guest identity, wallet denomination/pricing, rewarded ads, affiliate, payments, privacy/data, and continuity.

## Out of scope

Application code, credentials, migrations, provider onboarding, and irreversible production commitments.

## Acceptance criteria

- [ ] Each register item is Accepted, Rejected, or Awaiting founder approval.
- [ ] Every accepted choice names an approver, date, scope, and consequences.
- [ ] No architecture page silently changes a Proposed status to Accepted.
- [ ] Implementation dependencies and blockers are updated.

## Verification

Review every entry in `docs/decisions/founder-decisions.md`, run Markdown link checks, and inspect the diff for unapproved claims.

## Expected next step

After approval, create only the implementation/spike tasks whose prerequisites are satisfied. The next technical task should be S1 or S4 depending on whether the application boundary or accounting harness is prioritized.
