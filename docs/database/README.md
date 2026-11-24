# Database and data model

**Status: Proposed implementation on PR #8; locally verified only, not production-applied.** The existing Supabase/PostgreSQL foundation and its ordered correction are available in this branch. This does not mean production schema or application provisioning is live.

The database is authoritative for profile ownership, conversations, usage, OFTen movements, holds, and settlement. The current migrations preserve Firebase UID as the canonical identity and provide transaction/RLS protections for the initial accounting slice. Rewards, payments/top-ups, promotional credits, and overage resolution remain unapproved and are not automatically funded or charged.

## Required invariants

- A client cannot set/finalize a token balance or mutate financial records directly.
- Firebase UID is the canonical identity; never merge accounts by email.
- Every balance-affecting event is attributable, idempotent, and auditable.
- Usage debits use `input_tokens + 3 * output_tokens` OFTens; provider cost is tracked independently.
- Reservations are temporary holds, not ledger movements; uncertain or over-reserved usage is not silently charged beyond authorization.
- Corrections are append-only or otherwise explainable; history must not be rewritten invisibly.

See [`data-model.md`](data-model.md) for the conceptual entities and open questions. See [`token-accounting.md`](token-accounting.md) for the OFTen formula, provider-cost separation, transaction rules, and unresolved policies. See [`implementation-draft.md`](implementation-draft.md) for migration layout, RLS/RPC details, local test evidence, and integration blockers.
