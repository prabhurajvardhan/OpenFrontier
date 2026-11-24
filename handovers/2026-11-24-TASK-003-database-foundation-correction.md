# Handover — TASK-003 database foundation correction

- **Date:** 2026-11-24
- **Branch:** `feat/database-foundation`
- **PR:** [#8 — database foundation draft](https://github.com/prabhurajvardhan/OpenFrontier/pull/8)
- **Scope:** Continue the read-only TASK-002 audit with owner-approved correction and validation of the existing PR architecture. No merge, deploy, or production database access.
- **Status:** Changes verified locally; commit and PR update are the remaining delivery actions.

## Changes made

The existing two-migration Supabase/PostgreSQL foundation was preserved and corrected rather than replaced. Firebase UID is the unique canonical identity while an internal UUID remains the profile key. Ownership functions validate issuer, audience, and role before mapping UID to profile; service-role provisioning is UID-only, preserves existing records, and does not create promotional balance.

Accounting RPCs now implement atomic reservations, provider-state changes, settlement, release, and refunds with idempotency and profile-then-request lock order. OFTen debit is exactly `input_tokens + 3 × output_tokens`; provider cost (including model-specific cached/uncached input and output rates) is independent. Over-reservation records complete provider usage and remains pending reconciliation rather than silently charging beyond the hold. Refund totals are capped by the settled debit. RLS, narrow grants, a redacted invoker-rights ledger view, and raw financial record protections are retained/tightened.

Rollback scripts were moved out of `supabase/migrations/` into `supabase/rollback/` so migration discovery sees only forward migrations. The correction rollback restores baseline functions, permissions, constraints, and policies. Disposable test files and the runner are under `tests/`.

## Verification

Executed `tests/run-disposable-postgres-tests.sh` successfully on local PostgreSQL 16. The run applied the foundation and correction, tested RLS using a test-only local `auth` shim, checked two-user isolation and issuer mismatch, view privacy and role grants, cross-account integrity, ledger immutability, OFTen/provider-cost behavior, reservation/settlement/release/refund invariants, concurrent reservations, duplicate concurrent settlement, capped concurrent refunds, correction rollback comparison, and reapplication. The harness dropped the generated database. Final log: `/tmp/task003-test-final2.log`.

No production or live Supabase database was accessed. No real Firebase JWT integration test was run. `TASK-001` Firebase application code and its worktree were not modified. No frontend code was changed. The repository has no `package.json` or configured app test/lint/typecheck/build targets on this SQL/documentation branch, so those checks are inapplicable. `git diff --check` is to be run before commit.

## Not approved / unresolved

The schema does not decide who absorbs or collects overage, timeout/hold-expiry behavior, or what evidence permits reconciliation. Rewarded-ad grants, payment/top-up funding, promotional credits, refund authority, provider-price sources/currency conversion, and retention/audit policy remain unapproved. No conversion from USD to OFTens and no promotional balance grants were added. These policies and a live Supabase/Firebase integration/security review remain gates before deployment.

## Remaining delivery actions

Run final diff and whitespace checks, drop any diagnostic database, verify the original TASK-001 worktree remains clean, commit only the tested `feat/database-foundation` changes, push that branch, and update PR #8 description with the scope and verification evidence. Confirm the final branch SHA and that PR #8 is still open and unmerged. Do not merge or deploy.
