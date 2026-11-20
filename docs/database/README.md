# Database and data model

**Status: Proposed.** No database schema or persistence implementation exists yet.

The eventual data model must support server-authoritative identity, conversations, usage, token grants/debits, rewarded-ad verification, settlement, auditability, and abuse controls. The choice of database technology and physical schema is **awaiting founder/technical approval**.

## Required invariants to preserve

- A client cannot directly set or finalize its token balance.
- Every balance-affecting event is attributable, idempotent, and auditable.
- Usage debits cannot be silently lost on retries or provider failures.
- Rewarded-ad grants require a verifiable event and duplicate protection.
- Corrections are append-only or otherwise explainable; history must not be rewritten invisibly.
- Monetary or inference-token quantities use explicit units and precision.

See [`data-model.md`](data-model.md) for the conceptual entities and open questions.
See [`token-accounting.md`](token-accounting.md) for reservations, settlement, immutable ledger rules, and conceptual SQL.
See [`implementation-draft.md`](implementation-draft.md) for the reversible, non-production schema migration proposal and verification plan.
