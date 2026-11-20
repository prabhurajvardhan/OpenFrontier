# Token economy and accounting

**Status: Proposed; critical founder/security approval required.** Open Frontier's wallet currency is actual LLM token units. The database is authoritative. A browser, cache, ad callback, or model response cannot directly set a balance.

## Representation

Store token quantities as signed integer counts in the smallest supported unit. Store input and output quantities separately. A model-price configuration contains effective-dated integer price-per-million-input and price-per-million-output values, currency metadata, source, and version. The ledger stores the pricing version and policy snapshot used for the decision, so future price changes cannot rewrite history.

If the product displays one balance while models have different costs, the product must define a conversion policy before launch. The safest initial policy is to reserve and settle the priced input/output units for the selected model, with a deterministic conversion into the account's spendable token unit. Do not call differently priced model tokens interchangeable without an approved conversion rule.

## Ledger states

A request creates a `reservation` entry with a unique request ID. Final usage creates a `debit` entry against that reservation. Unused reserved quantity creates a `release` entry. Provider failure before billable usage creates a full release. An uncertain or disputed provider charge creates a `pending_reconciliation` record rather than an untraceable balance change. Rewarded ads create `reward_credit` entries only after verified, non-replayed completion. Payments create `topup_credit` entries only after verified success. Refunds and administrative corrections are separate signed entries with a reason and actor.

The balance is a projection of immutable entries, optionally materialized for reads. Every balance-affecting operation has a unique idempotency key. The invariant is `available = grants + releases + refunds - reservations - debits`, subject to the chosen state model, and `available >= 0` must be enforced transactionally.

## Reservation and settlement algorithm

1. Begin a database transaction and lock the account balance row or use a serializable transaction.
2. Check the request idempotency record. Return the previous result if it already finalized.
3. Calculate a worst-case reservation from the selected model, context, maximum output, and approved safety margin.
4. Reject if available balance is less than the reservation.
5. Insert a reservation ledger entry and update the balance projection with a guarded subtraction.
6. Commit before calling the provider.
7. On terminal usage, begin another transaction, lock the request, insert exactly one debit for actual verified usage, insert a release for unused reservation, and mark the request settled.
8. On verified no-bill failure, release the full reservation. On uncertainty, mark reconciliation required and do not silently choose a favorable balance.

The design explicitly rejects `GREATEST(0, balance + delta)`: that operation can hide a negative-accounting condition while failing to produce a correct ledger record.

## Corrected SQL examples

These examples are conceptual PostgreSQL SQL, not migrations. They require review against the final schema and transaction isolation policy.

```sql
-- One reservation attempt. The guarded predicate prevents negative balance.
begin;
select available_tokens
from account_balances
where account_id = :account_id
for update;

select status, result_json
from accounting_requests
where idempotency_key = :key
for update;

-- If no prior request exists and available_tokens >= :reserve_tokens:
insert into accounting_requests
  (idempotency_key, account_id, kind, status, reserved_tokens)
values
  (:key, :account_id, 'inference', 'reserved', :reserve_tokens);

update account_balances
set available_tokens = available_tokens - :reserve_tokens,
    updated_at = now()
where account_id = :account_id
  and available_tokens >= :reserve_tokens;
-- Require exactly one updated row; otherwise rollback as insufficient balance.

insert into token_ledger
  (account_id, request_id, entry_type, amount_tokens, pricing_version, metadata)
values
  (:account_id, :request_id, 'reservation', -:reserve_tokens, :pricing_version, :metadata);
commit;
```

```sql
-- Settlement is idempotent and must run once for the locked request.
begin;
select * from accounting_requests
where idempotency_key = :key
for update;

-- If status is already settled/released, return the stored result.
-- Otherwise actual usage is verified and bounded by the reservation.
insert into token_ledger
  (account_id, request_id, entry_type, amount_tokens, pricing_version, metadata)
values
  (:account_id, :request_id, 'debit', -:actual_tokens, :pricing_version, :usage_metadata);

insert into token_ledger
  (account_id, request_id, entry_type, amount_tokens, pricing_version, metadata)
values
  (:account_id, :request_id, 'release', :unused_reserved_tokens, :pricing_version, :release_metadata);

update account_balances
set available_tokens = available_tokens + :unused_reserved_tokens,
    updated_at = now()
where account_id = :account_id;

update accounting_requests
set status = 'settled', actual_tokens = :actual_tokens,
    settled_at = now(), result_json = :result
where idempotency_key = :key and status = 'reserved';
commit;
```

The application must verify that the debit is non-negative, does not exceed the reservation without an approved additional-reservation path, and that all inserts have unique constraints on `(request_id, entry_type)` where one entry is allowed. A reconciliation job compares provider usage/cost metadata, gateway reports, ledger entries, and account projections.

## Accounting threat controls

Use row locks or serializable transactions, unique idempotency keys, immutable entries, append-only corrections, effective-dated pricing, request-level audit IDs, bounded reservations, provider spend limits, timeout handling, reconciliation states, and alerts for negative projections, duplicate callbacks, unknown usage, or ledger/projection divergence.
