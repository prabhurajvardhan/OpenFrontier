# Handover — Open Frontier database foundation correction 002

- **Date:** 2026-11-20
- **Branch:** `feat/database-foundation`
- **Base:** `main`
- **Previous commit:** `b7232f9`
- **PR:** [#8 — database foundation draft](https://github.com/prabhurajvardhan/OpenFrontier/pull/8)
- **Status:** Proposed / review-only / not production-ready

## Implemented corrections

The foundation migration was not rewritten. An ordered follow-up migration, `20261120130000_database_integrity_privacy_correction.sql`, addresses the four remaining review issues.

For cross-account integrity, composite unique keys and composite foreign keys bind profile ownership to inference requests, conversations, reservation holds, and ledger accounting-request references. Nullable conversation and accounting references remain nullable where the original model allowed them.

For refund correctness, the source constraint now requires every refund to reference an accounting request. The trigger requires that request to be settled, preserves the accounting-request row lock, and rejects cumulative refunds above the settled usage debit. Provider event IDs remain optional audit references rather than substitutes for the source request.

For ledger privacy, raw `token_ledger` SELECT is revoked from `anon` and `authenticated`. The `security_invoker` view `wallet_ledger_public` exposes only ID, entry type, amount, timestamp, and a safe reason label, with no metadata, provider event ID, or internal accounting identifier.

For wallet concurrency and mutation integrity, wallet-affecting inserts lock the profile first and accounting request second. Ledger updates/deletes are rejected by append-only triggers. Reservation hold identity is immutable and status transitions are guarded. The existing projection refresh function remains the rebuild path and its lock-order/atomic-settlement contract is documented.

## Files changed

- `supabase/migrations/20261120130000_database_integrity_privacy_correction.sql`
- `supabase/migrations/20261120130000_database_integrity_privacy_correction.down.sql`
- `tests/sql/database_foundation_correction_002.sql`
- `docs/database/implementation-draft.md`
- This handover

## Checks actually executed

Static checks were run for diff hygiene, presence of the correction migration and rollback, composite-FK declarations, refund source/trigger logic, redacted-view definition, raw ledger privilege revocation, append-only triggers, and correction rollback cleanup. No production database or application source was touched.

## Checks not executed

PostgreSQL/Supabase migration execution, rollback execution, cross-account runtime inserts, refund-bound runtime tests, concurrent refund races, raw-table privilege tests, two-user RLS isolation, concurrent reservation races, duplicate settlement retries, and projection rebuild tests were not run because PostgreSQL tooling is unavailable in this sandbox. The SQL suite is prepared but these results are not claimed as passed.

## Remaining risks and blockers

Founder approval remains required for wallet denomination, pricing, rounding, cached-token treatment, safety margin, uncertain usage, overage resolution, and retention. Backend review must agree on service-only reservation/settlement/refund functions and guarantee the profile-then-accounting-request lock order for every wallet mutation. The correction migration assumes PostgreSQL 15+ for `security_invoker` views and an authorized Supabase `service_role`.

## Next step

Commit this focused correction, push it to `feat/database-foundation`, and update PR #8. Run the migration, rollback, SQL suite, and separate-session concurrency/RLS tests only in a disposable PostgreSQL/Supabase environment. Do not deploy or merge until those gates and security review are complete.
