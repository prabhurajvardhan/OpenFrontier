# TASK-001 — Establish the Repository Knowledge System

- **Status:** Completed
- **Assignee:** Tech Lead
- **Created:** 2026-11-20
- **Updated:** 2026-11-20
- **Dependencies:** None

## Objective

Create a practical, operational RKS for Open Frontier so developers can collaborate without prior chat history.

## Context and requirements

The repository starts empty. The product mission and business directions are documented in `README.md`, while implementation and technology choices remain unselected. The RKS must cover onboarding, architecture, database, API, security, ADRs, tasks, and handovers.

## Scope

- Establish the repository overview and mandatory agent workflow.
- Add usable documentation indexes, templates, and current-state architecture/security/data guidance.
- Record the RKS operating model as an ADR.
- Provide this task and a completion handover.

## Out of scope

- Building the AI chat application.
- Selecting or implementing a frontend, backend, database, model provider, ad network, or deployment platform.
- Claiming product features are implemented.

## Files/components involved

- `README.md`, `AGENTS.md`
- `docs/architecture/`, `docs/database/`, `docs/api/`, `docs/security/`, `docs/decisions/`
- `tasks/`, `handovers/`

## Acceptance criteria

- [ ] Repository has a clear RKS and source-of-truth index.
- [ ] `AGENTS.md` gives enforceable onboarding, scope, testing, and handover rules.
- [ ] Architecture, data, API, security, and ADR documents distinguish unknown/proposed/accepted/implemented status.
- [ ] Task and handover protocols and templates exist.
- [ ] A new agent can understand the current state without chat history.
- [ ] No application feature or technology choice is fabricated.

## Testing requirements

- Inspect the final tree and links.
- Review `git diff --check`.
- Verify every acceptance criterion against repository evidence.

## Expected deliverables

- The RKS files and directories.
- An ADR recording the operating model.
- A completion handover with commit reference after commit.

## Progress / blockers

Initial repository inspection complete: repository was empty with no prior commits. Acceptance criteria are satisfied by the initial RKS commit. No blocker to the RKS foundation. Founder approval is still needed for product and technology decisions listed in the documentation.
