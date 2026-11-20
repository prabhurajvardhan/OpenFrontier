# Handover — Open Frontier database foundation security correction

- **Date:** 2026-11-20
- **Branch:** `feat/database-foundation`
- **Base:** `main`
- **Previous commit:** `9d29b7b`
- **PR:** [#8 — database foundation draft](https://github.com/prabhurajvardhan/OpenFrontier/pull/8)
- **Status:** Proposed / review-only / not production-ready

## Targeted corrections completed

The existing accounting separation and migration structure were preserved. The migration now restricts `refresh_wallet_projection` execution from `PUBLIC`, `anon`, and `authenticated`, grants it only to `service_role`, uses an explicit safe search path, rejects anonymous or mismatched profile IDs, locks the profile row, and initializes a missing wallet row safely.

All draft tables now have explicit RLS enabled. Active model catalogue reads use an explicit policy. Model prices, provider usage, and overage reconciliation records have no ordinary-client access, with explicit least-privilege grants/revokes added. Wallet, ledger, hold, inference, and accounting projections remain readable only where their existing ownership policies permit it, and ordinary clients cannot write financial records.

Financial ledger constraints now enforce credit/debit sign conventions and source references. Operation IDs are unique per profile as well as per accounting request. A transaction-level refund trigger locks the accounting request and rejects cumulative refunds above the settled usage debit. The migration documents the backend settlement contract: lock profile then accounting request, close the hold, insert one usage debit, update state, refresh the projection atomically, and replay the stored result on terminal retries.

## Files changed in this correction

- `supabase/migrations/20261120120000_database_foundation_draft.sql`
- `supabase/migrations/20261120120000_database_foundation_draft.down.sql`
- `docs/database/implementation-draft.md`
- This handover

## Verified checks

- Existing migration was targeted with focused corrections; the posted-ledger/reservation-hold separation was preserved.
- `git diff --check` was run after the correction.
- Static inspection confirms explicit RLS for model catalogue, model prices, provider usage, and overage reconciliation.
- Static inspection confirms function execution revoke/grant statements, explicit search path, profile authorization guard, profile-row lock, missing-wallet initialization, sign/source constraints, refund trigger, and rollback cleanup.
- Static inspection confirms no `GREATEST(0, ...)` balance update in `supabase/migrations`.
- No frontend/backend application source, production database, production migration, credentials, or pricing/wallet decisions were changed.

## Unverified checks

PostgreSQL/Supabase migration execution, rollback execution, live RLS checks with multiple authenticated users and `anon`, concurrent reservation tests, duplicate settlement tests, conflicting idempotency tests, refund-bound tests, and projection-rebuild tests remain unverified. PostgreSQL tooling is unavailable in this sandbox, so none of these are claimed as passed.

## Remaining blockers and backend contract

Founder approval remains required for wallet denomination, pricing, rounding, cached-token treatment, safety margin, uncertain usage, overage resolution, and retention. Backend review must agree on profile/account identity mapping and server-only reservation/settlement/refund function signatures. The settlement path must use profile-then-accounting-request lock order and make hold closure, debit insertion, state transition, and projection refresh one transaction; a terminal retry must return the stored result rather than create another debit.

## Next step

Commit this focused correction, push it to `feat/database-foundation`, and update PR #8. Do not deploy or merge until founder, backend, security, and disposable PostgreSQL verification gates are complete.
