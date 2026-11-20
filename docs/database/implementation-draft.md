# Database foundation implementation draft

**Status: Proposed / not for production.** This is a reversible Supabase/PostgreSQL scaffold prepared from the corrected PR #1 accounting model. Founder, security, and backend-contract approval remain required before deployment or application integration.

## Scope

The draft migration covers the first implementation slice requested by the database assignment:

- `profiles` and `user_preferences` for server-owned identity data;
- `conversations` and `messages` with owner foreign keys and sequence uniqueness;
- `model_catalogue`, effective-dated `model_price_versions`, and normalized provider usage;
- `wallet_accounts` as a guarded read projection;
- `accounting_requests` for account-scoped idempotency and request fingerprints;
- `reservation_holds` as temporary authorization, separate from financial history;
- `token_ledger` as an immutable posted ledger containing only settled value movements;
- `inference_requests`, `provider_usage_records`, and `overage_reconciliations`;
- indexes, non-negative/check constraints, foreign keys, and baseline Supabase RLS policies.

No development seed rows are included because model pricing, wallet denomination, provider allowlist, and rounding policy are still awaiting founder approval. A populated seed would create an unapproved commercial contract.

## Accounting contract encoded by the draft

The posted balance is the sum of `token_ledger.amount_units`. The held balance is the sum of active `reservation_holds.reserved_units`. Available balance is `posted_units - held_units`, and the wallet check constraint rejects a negative result. Reservations and releases never appear in the posted financial ledger. A settled request closes its active hold and creates exactly one operation-level usage debit. Refunds and corrections use separate operation IDs and remain append-only.

The schema deliberately records provider usage dimensions separately: uncached input, cached input, cache-write input, and output. Usage above the reservation is not truncated; it is represented through `overage_reconciliations` for an approved resolution path. The draft contains no `GREATEST(0, ...)` balance update.

## Security posture

RLS is enabled on all tables in this draft. Policies derive ownership from `auth.uid()` rather than a client-supplied profile ID. Active model catalogue rows have an explicit public read policy; model prices, provider usage, and overage reconciliation records have no ordinary-client policy and have explicit grants revoked. Ordinary `anon` and `authenticated` roles have no write permissions on wallet, ledger, holds, inference, or accounting tables. Ledger metadata must be redacted in any user-facing API/view before launch.

The projection refresh function is `SECURITY DEFINER` with an explicit `pg_catalog, public, auth, pg_temp` search path. Execution is revoked from `PUBLIC`, `anon`, and `authenticated`, and granted only to the Supabase `service_role`. It rejects anonymous or mismatched profile IDs, locks the profile row, safely initializes a missing wallet row, and computes posted and held snapshots in that transaction. The refund trigger takes the accounting-request lock and prevents cumulative refunds from exceeding the settled usage debit.

The draft does not grant administrative access, expose service-role credentials, or touch a production database. The `*.down.sql` file is intended only for a disposable test database.

## Fresh database verification

With a disposable Supabase/PostgreSQL instance and the required `auth` schema available:

1. Apply `20261120120000_database_foundation_draft.sql` once; rerunning it should be rejected rather than silently changing an existing schema.
2. Confirm all tables, enum types, indexes, check constraints, foreign keys, and RLS flags exist.
3. As an authenticated user, verify that a user can read only their own profile, conversations, messages, wallet projection, holds, requests, and redacted ledger view.
4. Verify ordinary authenticated sessions cannot insert, update, or delete financial rows.
5. In a backend transaction harness, lock account rows before accounting request rows, race two reservations, retry settlement, submit conflicting idempotency payloads, and resolve a pending hold. Assert no negative `available_units` or duplicate operation is possible.
6. Rebuild `posted_units` and `held_units` from the immutable tables and compare them with `wallet_accounts`.
7. Apply `20261120120000_database_foundation_draft.down.sql` only after the disposable test completes, then confirm the objects are removed.

No live PostgreSQL runner is included in this repository yet; therefore this checkpoint records the migration and verification contract but does not claim runtime migration or concurrency tests have passed.

## Open decisions / blockers

- Founder approval of wallet unit, price scale, cached-token treatment, rounding, safety margin, uncertain usage, overage resolution, and retention.
- Backend agreement on request/settlement function signatures and application identity mapping. The required contract is: lock profile then accounting request; for settlement, close the hold, insert one usage debit, update the accounting state, and refresh the projection in one transaction; terminal retries return the stored result.
- Security review of Supabase RLS, service-role-only transaction functions, audit events, and redacted ledger reads.
- Selection and approval of development seed models/prices.
