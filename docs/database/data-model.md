# Conceptual data model

**Status: Proposed; not implemented.** The entities below are conceptual requirements, not a finalized schema.

| Entity | Purpose | Key questions |
| --- | --- | --- |
| Account | User identity and lifecycle | What identity provider, recovery, deletion, and region rules apply? |
| Conversation / Message | Chat history and metadata | What retention, export, deletion, and privacy guarantees apply? |
| Model / Provider | Eligible inference offerings | How are availability, cost, routing, and vendor terms represented? |
| Token ledger entry | Immutable grant, reservation, debit, refund, or correction | What unit, precision, ordering, and reconciliation rules apply? |
| Reward event | Verified ad completion and reward decision | Which provider callbacks/signatures and fraud signals are trusted? |
| Usage record | Provider usage and billing evidence | When is usage final, and how are unknown/estimated amounts handled? |
| Audit event | Security and administrative trace | Retention, access, redaction, and export requirements? |

## Recommended conceptual relationship

`Account` owns conversations and a token ledger. A `Reward event` may produce one or more ledger entries only after verification and idempotency checks. A model request creates a usage record and a corresponding ledger debit/reservation according to an approved transaction policy. The exact cardinalities and constraints remain open.

## Not yet decided

No table names, IDs, indexes, migrations, ORM, database engine, consistency level, or sharding strategy are selected. Record those choices in ADRs before implementation.
