# Database foundation implementation

**Status: Proposed; validated only against a disposable local PostgreSQL instance. Not applied to production and not yet a live Supabase/Firebase integration.** This PR preserves the existing Supabase/PostgreSQL architecture and adds an ordered integrity/privacy correction; it does not replace the foundation.

## Migration layout and schema

Forward-only migrations are in `supabase/migrations/`:

- `20261120120000_database_foundation_draft.sql` — profiles and preferences, conversations/messages, model catalogue and effective-dated model pricing, wallet projection, accounting requests, reservation holds, inference requests, provider usage, overage reconciliation, token ledger, constraints, triggers, and baseline RLS.
- `20261120130000_database_integrity_privacy_correction.sql` — cross-profile composite integrity, refund source/cap protections, ledger privacy and invoker-rights view, Firebase UID ownership, service-only provisioning and accounting RPCs, grants, and additional integrity controls.

Destructive rollback scripts are in `supabase/rollback/`, outside the migration discovery directory. They are for disposable databases only. The correction rollback restores the pre-correction functions, permissions, constraints, and policies captured by the verification harness. Never use these rollback scripts against production data.

No pricing seed, promotional credit, test profile, or wallet balance is included in the forward migrations. All runtime fixture data is confined to generated disposable test databases.

## Identity and ownership

Firebase UID (`sub`) is the canonical external identity. `profiles.id` is an internal UUID and `profiles.firebase_uid` is unique. Ownership helpers validate configured Firebase issuer, audience, and authenticated role before mapping the claim to the profile UUID; email is not an identity key. A service-role-only provisioning RPC accepts the Firebase UID, preserves an existing profile and its ledger-derived projection, and does not invent balance. Firebase token verification itself remains in the existing TASK-001 application code and was not changed here.

RLS remains enabled and ownership-based. The `wallet_ledger_public` view uses invoker rights and exposes only the permitted ledger columns. Raw ledger metadata and provider usage remain inaccessible to ordinary clients. Financial writes use narrow `service_role` RPCs rather than direct table grants; ordinary users receive only the limited profile-field update that is explicitly permitted.

## Accounting contract

The user debit is exactly `input_tokens + 3 * output_tokens` OFTens. Cached-input and cache-write dimensions affect provider-cost estimation only; they do not alter OFTens. Model-specific provider costs and provider-reported cost are stored separately, with no USD-to-OFTen conversion. No promotional credits are granted.

Reservation, provider-state, settlement, release, and refund paths are transactional and idempotent. Profile-then-request lock ordering serializes wallet operations; a settlement within its active hold closes the hold and posts one actual-usage debit. Duplicate identical terminal calls replay; conflicting payloads are rejected. Refunds require a settled source request and remain cumulatively capped by its usage debit. Verified usage over the active hold is retained and marked pending reconciliation; it is not truncated or silently charged beyond authorization. The overage resolution, reward, payment, and promotion policies remain unresolved and are not implied by the schema.

See [`token-accounting.md`](token-accounting.md) for the full contract and remaining founder decisions.

## Verification actually executed

`tests/run-disposable-postgres-tests.sh` completed successfully using local PostgreSQL 16. It applies the migrations to a generated disposable database, runs SQL assertions with a test-only shim for Supabase `auth` functions, runs separate-session concurrency checks, captures and compares the correction rollback state, executes the rollback, reapplies the correction, and drops the generated database on completion.

The suite covers migration application/reapplication; Firebase-claim ownership, independent user isolation, issuer mismatch denial, safe ledger view and role grants; cross-account integrity; append-only records; OFTen debit arithmetic and separate provider costs; reservation idempotency and concurrent reservation races; duplicate concurrent settlement; release; capped concurrent refunds; and rollback restoration. This is local PostgreSQL evidence only—not a live Supabase, Firebase JWT, production-data, or deployment test. The latest run log was `/tmp/task003-test-final2.log` in the sandbox and ended with `PASS: disposable PostgreSQL migrations, runtime checks, rollback comparison, and reapplication completed`.

The repository has no `package.json` or configured frontend test/lint/typecheck/build command on this SQL/documentation branch. Those checks are inapplicable here. `git diff --check` remains a required final repository check before commit.

## Production and integration blockers

Do not deploy or apply these migrations to a live database until authorized review and explicit policies exist for rewards/promotions, payment/top-up flows, overage resolution, timeouts/hold expiry, refund authority, provider pricing sources, and audit/retention requirements. A live Supabase RLS test and an end-to-end Firebase JWT-to-profile provisioning test remain future integration gates. Do not merge this PR as part of this task.
