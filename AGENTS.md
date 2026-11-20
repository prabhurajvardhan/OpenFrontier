# Instructions for AI developer agents

These rules apply to every agent working in Open Frontier.

## Source of truth

Do not rely on chat history, memory, or unstated assumptions. The repository is authoritative. If repository knowledge conflicts with a request, identify the conflict and update the relevant documentation only when the change is authorized.

## Required onboarding

Before changing anything:

1. Read this file and the assigned task specification.
2. Read the relevant architecture, database, API, and security documents.
3. Inspect the actual repository state and existing code.
4. Read related active, completed, and blocked tasks; check dependencies.
5. Identify uncertain decisions and record them as proposed or awaiting approval rather than silently choosing.

## Scope and implementation rules

- Implement only the assigned scope. Do not start the AI application as part of the RKS foundation task.
- Do not overwrite or delete existing work without explicit authorization.
- Do not fabricate completed features, tests, integrations, metrics, or approvals.
- Prefer small, independently reviewable changes.
- Keep documentation synchronized with code and label status accurately.
- Never expose secrets, tokens, personal data, or credentials in repository files.
- Treat token balances, grants, debits, settlements, and ad rewards as security-sensitive even before implementation.

## Before handoff

Run the applicable tests, checks, and documentation validation. Review the diff for unrelated changes. Update task status and affected RKS pages. Every completed work unit must include a handover in `handovers/` containing:

- completed work and changed files;
- commit and PR references, or `Not created`;
- decisions made or updated;
- tests/checks run and results;
- outstanding work and blockers;
- concrete next steps for the next agent.

A task is not complete merely because files were edited; its acceptance criteria must be evidenced.

## Collaboration protocol

The Tech Lead is the only fixed role. Developers are interchangeable and are assigned work dynamically. Before starting work, claim or confirm the task in its task specification. Do not modify another active task's scope. If a dependency or interface is unclear, stop at the boundary, document the blocker, and notify the Tech Lead through the task/handover rather than inventing a contract.

Use branches and pull requests where appropriate. Keep commits focused and use repository-relative paths in handovers.

## Documentation status labels

Use exactly these labels when describing decisions or capabilities: `Proposed`, `Accepted`, `Implemented`, or `Superseded`. `Accepted` is not the same as `Implemented`. Any item needing founder input must say `Awaiting founder approval` and name the decision required.

## Tech Lead workflow

The Tech Lead:

1. understands incoming requirements;
2. inspects the RKS and actual code;
3. decomposes work into independently executable tasks;
4. assigns tasks dynamically;
5. coordinates dependencies and shared interfaces;
6. reviews implementation and integration;
7. synchronizes documentation with code; and
8. verifies that every agent leaves a usable handover.

At each transition, the repository—not a private conversation—is the continuity mechanism.
