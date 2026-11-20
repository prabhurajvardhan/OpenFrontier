# TASK-002 — Open Frontier system architecture and technical design

- **Status:** Completed
- **Assignee:** Tech Lead
- **Created:** 2026-11-20
- **Updated:** 2026-11-20
- **Dependencies:** TASK-001; founder approval required before implementation

## Objective

Produce a complete, evidence-backed, founder-reviewable technical architecture before application development.

## Scope

Document system boundaries, chat streaming, token accounting, rewards, margin protection, affiliate `/out`, identity and abuse prevention, database design, API contracts, security controls, technology trade-offs, diagrams, ADRs, and unresolved approvals.

## Out of scope

Frontend/backend implementation, migrations, real provider integrations, credentials, production ad/payment/model onboarding, and fixed role-credit budgets.

## Acceptance criteria

- [x] Major components and relationships documented.
- [x] Chat, reward, accounting, affiliate, and payment flows documented end to end.
- [x] Token accounting rejects negative balances, duplicate deductions, double spending, and saturating-update errors.
- [x] Economics are calculated with explicit assumptions and no guaranteed-margin claim.
- [x] Technology recommendations include trade-offs and evidence.
- [x] Major recommendations are ADRs marked Proposed.
- [x] Founder decisions and evidence gaps are explicit.
- [x] Complete handover provided.

## Deliverables

See the architecture, database, API, security, economics, decisions, and handover documents linked from `README.md`.

## Outstanding work

Founder approval and implementation-specific tasks. Recheck provider documentation, catalogs, prices, terms, and regional eligibility immediately before implementation.
