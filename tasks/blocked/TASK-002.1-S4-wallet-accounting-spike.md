# TASK-002.1-S4 — Wallet and token-accounting technical spike

- **Status:** Blocked by founder decisions
- **Assignee:** Unassigned developer
- **Created:** 2026-11-20
- **Updated:** 2026-11-20
- **Dependencies:** B0 wallet denomination/pricing approval; S1 database boundary; S2 usage semantics

## Objective

Prove the corrected server-authoritative accounting design under concurrency, retries, uncertain provider outcomes, and refunds.

## Deliverable

A disposable PostgreSQL harness or reviewed procedure test suite derived from `docs/database/token-accounting.md` and `docs/database/data-model.md`. It must not be a production migration.

## Scope

Signed ledger convention, available/held projections, reservations, debits, releases, pending reconciliation, bounded refunds, account-scoped idempotency, cached-token dimensions, price snapshots, lock order, and rebuild/reconciliation checks.

## Out of scope

Production schema, live model/ad/payment providers, arbitrary credit denominations, or UI implementation.

## Acceptance criteria

- [ ] Reservation + debit + release nets to actual charge exactly once.
- [ ] Concurrent reservations cannot create negative available or held units.
- [ ] Duplicate and conflicting idempotency payloads are safe.
- [ ] Pending holds remain unavailable until authoritative resolution.
- [ ] Partial/full refunds are unique, append-only, and bounded by settled debit.
- [ ] Projection rebuild equals the immutable ledger.

## Verification

Run concurrent reservation races, duplicate settlement, timeout/interruption, duplicate/out-of-order callback, partial-refund, projection-divergence, and deadlock-retry tests. Confirm no `GREATEST(0, ...)` balance update exists.

## Blocker

Founder approval is required for the wallet unit, price scale, cached-token treatment, rounding, safety factor, and uncertain-usage policy.
