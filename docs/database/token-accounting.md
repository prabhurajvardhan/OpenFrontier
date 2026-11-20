# Token economy and accounting

**Status: Proposed; critical founder/security approval required.** Open Frontier's wallet uses a founder-approved spendable token unit backed by actual LLM usage. The database is authoritative. A browser, cache, ad callback, or model response cannot directly set a balance.

## Wallet denomination

The product must approve one integer wallet unit, tentatively named `microcredits`. It is not an arbitrary promotional credit: it is the smallest spendable unit used to represent the priced cost of actual model input/output usage. Raw model tokens remain observable usage dimensions, but tokens from different models and input/output classes are not assumed interchangeable.

For usage dimensions `i` (uncached input), `c` (cached/read input), `w` (cache-write input where billed), and `o` (output), with non-negative counts and effective prices `p_i`, `p_c`, `p_w`, and `p_o` expressed in wallet units per million tokens:

`charge_units = ceil((i*p_i + c*p_c + w*p_w + o*p_o) / 1,000,000)`

The price snapshot stores every dimension, provider/model identity, effective date, source, currency, FX information if applicable, and rounding version. Cached-token prices are not silently treated as ordinary input. If a provider does not expose a billable dimension, the approved policy must say whether it is conservatively charged, excluded, or held for reconciliation.

Users should see a predictable estimate before sending: selected model, estimated input/output/cached dimensions, maximum reservation, and the final actual charge. The UI must distinguish estimated reservation, final debit, release, reward, top-up, and refund. It must never present an arbitrary abstract credit as an LLM token balance.

## One signed-ledger convention

All ledger entries use signed integer `amount_units`: positive values increase spendable value and negative values decrease it. The derived projection is:

`available_units = Σ(all posted ledger amount_units)`

A reservation is a negative hold. A final debit is a negative consumption entry. A release is a positive return of unused reservation. For reservation `R`, actual charge `A`, and unused `U = R - A`:

`reservation = -R; debit = -A; release = +U; R = A + U; net = -A`

The balance projection is reduced by `R` at reservation time. At settlement it is increased only by `U`; it is **not** reduced again by `A`. This is the correction that prevents double counting. Maintain a separate derived `held_units` view for operational visibility:

`held_units = Σ(open reservations) - Σ(debits against open reservations) - Σ(releases against open reservations)`

Terminal requests must have zero held units. Stuck holds remain unavailable until resolved.

## State machine

`created → reserved → provider_running → settled`

`reserved/provider_running → released` is allowed only when authoritative evidence says no billable usage exists. `reserved/provider_running → pending_reconciliation` is required for timeout, lost terminal response, disputed usage, or unverifiable partial usage; the full outstanding hold remains unavailable. `pending_reconciliation → settled` requires authoritative usage, while `pending_reconciliation → released` requires authoritative no-bill evidence. A settled request may receive separate partial/full refund or correction entries, bounded by the settled debit. A reservation release is not a refund.

Every transition is conditional, idempotent, and append-only. Duplicate terminal callbacks replay the stored result. A conflicting payload for the same account-scoped idempotency key is rejected and audited.

## Reservation and settlement algorithm

1. Start a transaction and lock the account row, then the account-scoped request/idempotency row. Every accounting path uses this account-then-request lock order.
2. If the idempotency key exists with the same request fingerprint, replay its stored result. If the fingerprint differs, reject it as a conflict.
3. Calculate the policy-bounded worst-case reservation using the same price snapshot and upward rounding formula as settlement.
4. Reject if `available_units < reservation`; otherwise insert the reservation entry and reduce the projection atomically.
5. Commit before calling the provider.
6. On verified usage, lock account then request, require a non-terminal state, verify `0 <= actual <= reserved`, insert one debit and one release, return only unused units to the projection, and mark settled in the same transaction.
7. On verified no-bill failure, insert one full release and mark released.
8. On uncertainty, mark pending reconciliation and keep the full outstanding hold unavailable until a later authoritative decision.
9. For refunds/corrections, append a unique compensating positive entry tied to an external event/reason; cumulative refunds cannot exceed the settled debit.

## Worked examples

### Successful request

Opening available balance is `1,000` units. Reserve `R=100`: reservation `-100`, available `900`, held `100`. Verified usage is `A=65`, so unused `U=35`. Settlement inserts debit `-65` and release `+35`; available becomes `935`, held becomes `0`. Net ledger effect is `-65`, exactly once.

### Provider failure before billable usage

Reserve `100`: available `900`, held `100`. Authoritative no-bill evidence inserts release `+100`. Available returns to `1,000`; held is `0`. No debit or refund exists.

### Timeout or uncertain usage

Reserve `100`, then lose the terminal response. Mark pending reconciliation; available remains `900`, held `100`. Later verified usage of `40` inserts debit `-40` and release `+60`, yielding available `960`. Authoritative no-bill evidence instead releases `+100` and returns available to `1,000`.

### Cached pricing

If `p_i=10`, `p_c=2`, and `p_o=40` wallet units per million tokens, with `100,000` uncached input, `50,000` cached input, and `10,000` output:

`ceil((100,000×10 + 50,000×2 + 10,000×40) / 1,000,000) = ceil(1.6) = 2 units`.

The provider usage payload, price version, dimensions, formula inputs, and rounding result are stored.

### Refund

A settled charge of `65` has reduced available balance. A verified provider correction refunds `20` by appending `refund +20` with a unique event ID. Available increases by `20`; cumulative refunds cannot exceed `65`. The original reservation and release are unchanged.

## Corrected conceptual PostgreSQL SQL

These are conceptual examples, not migrations. They use the signed-ledger convention and account-then-request lock order.

```sql
-- Reservation: account scope and request fingerprint are mandatory.
begin;
select available_units
from account_balances
where account_id = :account_id
for update;

select id, status, request_fingerprint, result_json
from accounting_requests
where account_id = :account_id
  and idempotency_key = :key
for update;

-- Existing same-fingerprint row: replay its stored result.
-- Existing different fingerprint: reject as idempotency conflict.

insert into accounting_requests
  (account_id, idempotency_key, request_fingerprint, kind, status,
   reserved_units, pricing_version)
values
  (:account_id, :key, :fingerprint, 'inference', 'reserved',
   :reserve_units, :pricing_version);

update account_balances
set available_units = available_units - :reserve_units,
    updated_at = now()
where account_id = :account_id
  and available_units >= :reserve_units;
-- Require exactly one row; otherwise rollback for insufficient funds.

insert into token_ledger
  (account_id, request_id, entry_type, amount_units,
   pricing_version, operation_id, metadata)
values
  (:account_id, :request_id, 'reservation', -:reserve_units,
   :pricing_version, :reservation_operation_id, :reservation_metadata);
commit;
```

```sql
-- Settlement/release: same account->request lock order; one terminal transition.
begin;
select available_units
from account_balances
where account_id = :account_id
for update;

select id, status, reserved_units
from accounting_requests
where account_id = :account_id
  and idempotency_key = :key
for update;

-- Terminal status: replay stored result without new entries.
-- Otherwise require reserved/provider_running and 0 <= actual <= reserved.
-- unused = reserved - actual.

insert into token_ledger
  (account_id, request_id, entry_type, amount_units,
   pricing_version, operation_id, metadata)
values
  (:account_id, :request_id, 'debit', -:actual_units,
   :pricing_version, :debit_operation_id, :usage_metadata),
  (:account_id, :request_id, 'release', :unused_units,
   :pricing_version, :release_operation_id, :release_metadata);

-- Reservation already reduced available; return only the unused hold.
update account_balances
set available_units = available_units + :unused_units,
    updated_at = now()
where account_id = :account_id;

update accounting_requests
set status = 'settled', actual_units = :actual_units,
    settled_at = now(), result_json = :result
where account_id = :account_id
  and idempotency_key = :key
  and status in ('reserved', 'provider_running');
-- Require exactly one row; otherwise rollback/replay.
commit;
```

Required constraints include `unique(account_id, idempotency_key)`, request-fingerprint conflict detection, unique provider event/callback IDs, unique `(request_id, operation_id)` for ledger operations, non-negative component quantities, valid state transitions, and a refund aggregate cap. Partial refunds need separate operation IDs; do not use `(request_id, entry_type)` as the only uniqueness rule. Do not use `GREATEST(0, ...)`; it hides a failed accounting invariant.

## Reconciliation and verification

Projection updates and ledger inserts commit together. A rebuild computes account projections from immutable ledger entries. Reconciliation alerts on projection divergence, negative available/held units, orphan holds, duplicate events, conflicting idempotency payloads, provider/ledger usage mismatch, and pending holds beyond policy age. Concurrency tests must cover simultaneous reservations, duplicate settlement, settlement versus timeout, duplicate/out-of-order callbacks, partial refunds, and deadlock retry.

All denomination, cached-token treatment, rounding, safety factor, uncertain-usage policy, refund policy, and retention choices remain **Proposed / Awaiting founder approval** until recorded in an ADR.
