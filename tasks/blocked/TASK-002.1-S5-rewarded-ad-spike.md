# TASK-002.1-S5 — Rewarded-ad verification and dynamic-reward spike

- **Status:** Blocked by founder decisions
- **Assignee:** Unassigned developer
- **Created:** 2026-11-20
- **Updated:** 2026-11-20
- **Dependencies:** B0 ad policy/network/fraud decision; S4 accounting; explicit GAM spike authorization

## Objective

Validate the proposed GAM-first server-verified reward path without granting tokens from client callbacks.

## Deliverable

A sandbox callback verifier, replay/idempotency handling, versioned reward-policy evaluator, pending/reconciliation states, and provider evidence note.

## Scope

Server-created ad shows, callback authentication, show/session association, replay protection, dynamic caps, uncertain payout handling, and ledger credit integration through the approved accounting interface.

## Out of scope

Production ad onboarding, fixed reward promises, client-only rewards, or unapproved network expansion.

## Acceptance criteria

- [ ] Only verified, non-replayed callbacks can create reward entries.
- [ ] Client completion is UX-only.
- [ ] Unknown payout data cannot exceed the approved fallback policy.
- [ ] Policy versions and caps are recorded.

## Verification

Test invalid/stale/wrong-show/replay/duplicate/out-of-order/missing-payout callbacks and reconciliation variance.
