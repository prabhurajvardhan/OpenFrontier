# Open Frontier

Open Frontier is Nanoware AI's proposed global AI chat platform. Its mission is to make frontier-class AI intelligence accessible to everyone, regardless of geography or financial background.

The product direction is **free access without subscriptions or referral gimmicks**. The current business direction proposes rewarded advertising as the primary way users earn inference tokens, with contextual affiliate partnerships, developer/technology advertising, and optional one-time micro-top-ups as possible complementary revenue streams. These are product requirements and proposals—not implemented features.

## Repository Knowledge System

This repository is the single source of truth for requirements, architecture, technical decisions, work, and agent handovers. Start with [`AGENTS.md`](AGENTS.md), then consult the relevant section below.

| Need | Location |
| --- | --- |
| Agent rules and onboarding | [`AGENTS.md`](AGENTS.md) |
| System shape and data flows | [`docs/architecture/`](docs/architecture/) |
| Data model and accounting invariants | [`docs/database/`](docs/database/) |
| External and internal API contracts | [`docs/api/`](docs/api/) |
| Security, identity, abuse prevention | [`docs/security/`](docs/security/) |
| Decisions and their status | [`docs/decisions/`](docs/decisions/) |
| Assigned work | [`tasks/active/`](tasks/active/) |
| Completed and blocked work | [`tasks/completed/`](tasks/completed/) and [`tasks/blocked/`](tasks/blocked/) |
| Continuity between agents | [`handovers/`](handovers/) |

## Current repository state

The repository began with no commits, source code, or technology decisions. This initial change establishes the operational RKS only; it does **not** implement the AI chat application.

## Status vocabulary

Documentation must label each decision or capability as one of:

- **Proposed** — a candidate direction, not approved.
- **Accepted** — explicitly approved as project direction, but not necessarily implemented.
- **Implemented** — present in code and verified by tests or inspection.
- **Superseded** — replaced by a later accepted decision; link the replacement.

When facts are unknown, write `Unknown` or `Awaiting founder approval`; do not infer them from convention.

## RKS maintenance

Every implementation task must leave the RKS at least as accurate as it was before the task. Update affected contracts and decisions in the same change, and add a handover before declaring work complete. See [`AGENTS.md`](AGENTS.md) for the required workflow.
