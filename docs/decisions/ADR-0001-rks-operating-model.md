# ADR-0001: Use the repository as the project continuity system

- **Status:** Accepted
- **Date:** 2026-11-20
- **Decision owners/approvers:** Assignment 001; founder approval of product/technology decisions still required
- **Related task:** TASK-001

## Context

Multiple AI developers must collaborate without depending on previous chat histories. The repository is initially empty, so it needs a small, explicit structure for requirements, architecture, decisions, work, and handovers.

## Decision

Use the repository as the single source of truth. Every agent reads `AGENTS.md` and its assigned task before work; architecture, database, API, and security knowledge lives under `docs/`; decisions are recorded as ADRs with status labels; work is organized under `tasks/`; and each work unit leaves a handover under `handovers/`.

The Tech Lead is the only fixed role. Other agents remain interchangeable developers and are assigned work dynamically.

## Alternatives considered

1. Rely on chat history — rejected because it is not durable or available to all agents.
2. Create a large project-management system first — rejected because it adds unnecessary infrastructure before product technology is selected.
3. Keep only templates — rejected because this repository needs an immediately usable index, status vocabulary, workflow, and initial task/handover records.

## Consequences

### Positive

- A new agent can continue work from repository files alone.
- Uncertainty is visible instead of becoming accidental architecture.
- Documentation changes can be reviewed alongside implementation.

### Negative or risks

- The RKS can become stale if handovers and docs are skipped.
- Markdown does not enforce workflow mechanically; review discipline is required.

## Implementation and verification

- **Implementation:** `README.md`, `AGENTS.md`, `docs/`, `tasks/`, and `handovers/`.
- **Verification:** Initial repository inspection found no prior files or commits; the created structure covers the assignment's required areas.
- **Follow-up:** Add repository checks for required task/handover fields when implementation tooling is introduced.
