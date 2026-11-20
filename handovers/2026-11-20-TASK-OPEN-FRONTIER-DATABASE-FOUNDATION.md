# Handover — Open Frontier database foundation draft

- **Date:** 2026-11-20
- **Branch:** `feat/database-foundation`
- **Remote feature branch:** Not present on the supplied remote; work was based on the corrected PR #1 commit fetched from `docs/assignment-002-1-corrections`.
- **Commit:** Not created
- **PR:** Not created
- **Status:** Proposed / ready for founder, security, and backend review; not production-ready

## Completed work

- Added a reversible Supabase/PostgreSQL draft migration for profiles, preferences, conversations, messages, model catalogue/pricing, inference requests, provider usage, wallet projections, accounting requests, reservation holds, posted token ledger, and overage reconciliation.
- Applied the corrected PR #1 accounting posture: active reservation holds are separate from posted financial ledger entries; posted/held/available projections are explicit; operation-level uniqueness supports multiple refunds; usage dimensions and overage evidence are retained.
- Added indexes, foreign keys, non-negative/state constraints, and baseline RLS policies. Ordinary client roles cannot write financial or accounting tables.
- Added a matching disposable-database rollback script.
- Added schema documentation and fresh-database/concurrency verification instructions.

## Changed files

- `supabase/migrations/20261120120000_database_foundation_draft.sql`
- `supabase/migrations/20261120120000_database_foundation_draft.down.sql`
- `docs/database/README.md`
- `docs/database/implementation-draft.md`
- This handover

## Decisions and boundaries

- The migration is explicitly **Proposed / not for production**. No production database was touched.
- No model/pricing seed rows were added because wallet denomination, pricing, rounding, cached-token treatment, safety margin, and uncertain-usage policy remain awaiting founder approval.
- No frontend/backend files, credentials, live providers, or irreversible production commitments were added.
- Backend transaction-function signatures and redacted ledger views remain an integration contract to agree with the backend agent before implementation.

## Checks run

- Repository instructions, architecture, data model, API contracts, security guidance, active/blocked tasks, and PR #1 correction handover were inspected.
- Confirmed the requested remote branch `feat/database-foundation` does not exist; available remote branches are `main` and `docs/assignment-002-1-corrections`.
- Confirmed the draft contains no `GREATEST(0, ...)` balance update.
- PostgreSQL binaries and `psycopg` are not available in the sandbox, so fresh-database execution and concurrency tests were not run. This is intentionally not claimed as passed.
- Remaining before acceptance: run the migration and rollback on a disposable Supabase/PostgreSQL instance, execute RLS and concurrent-accounting tests, perform security review, obtain founder approval, and coordinate exact backend contracts.

## Next steps

1. Backend agent reviews table names, ownership mapping, idempotency fields, and transaction boundaries.
2. Founder/security reviewers approve or revise the open accounting and retention decisions.
3. Add server-only reservation/settlement/refund functions and automated PostgreSQL tests only after those contracts are accepted.
4. Commit and open a PR after review; do not merge automatically.
