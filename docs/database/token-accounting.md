# Token economy and accounting

**Status: Proposed; critical founder/security approval required.** Open Frontier's wallet uses a founder-approved spendable token unit backed by actual LLM usage. The database is authoritative. A browser, cache, ad callback, or model response cannot directly set a balance.

## Wallet denomination

The product must approve one integer wallet unit, tentatively named `microcredits`. It is not an arbitrary promotional credit: it is the smallest spendable unit used to represent the priced cost of actual model input/output usage. Raw model tokens remain observable usage dimensions, but tokens from different models and input/output classes are not assumed interchangeable.

For usage dimensions `i` (uncached input), `c` (cached/read input), `w` (cache-write input where billed), and `o` (output), with non-negative counts and effective prices `p_i`, `p_c`, `p_w`, and `p_o` expressed in wallet units per million tokens:

`charge_units = ceil((i*p_i + c*p_c + w*p_w + o*p_o) / 1,000,000)`

The price snapshot stores every dimension, provider/model identity, effective date, source, currency, FX information if applicable, and rounding version. Cached-token prices are not silently treated as ordinary input. If a provider does not expose a billable dimension, the approved policy must say whether it is conservatively charged, excluded, or held for reconciliation.

Users should see a predictable estimate before sending: selected model, estimated input/output/cached dimensions, maximum reservation, and the final actual charge. The UI must distinguish the temporary hold, final debit, hold closure, reward, top-up, and refund. It must never present an arbitrary abstract credit as an LLM token balance.

## Posted ledger and reservation holds

Temporary reservations are not financial ledger entries. Keep them in a separate `reservation_holds` structure. The posted financial ledger contains only settled value movements: `reward_credit`, `topup_credit`, `usage_debit`, `refund`, and audited `admin_adjustment`. All posted entries use signed integer `amount_units`: positive values increase spendable value and negative values decrease it.

The projections are:

`posted_balance = Σ(all posted financial ledger amount_units)`

`held_units = Σ(reserved_units of active reservation holds)`

`available_units = posted_balance - held_units`

For a reservation `R`, actual charge `A`, and unused amount `U = R - A`, the hold is closed and exactly one posted `usage_debit = -A` is added. There is no posted reservation entry and no posted release entry. Closing the hold automatically removes `R` from `held_units`, so the final available balance is `posted_balance - held_units = (opening balance - A) - 0`. This prevents double counting while keeping temporary authorization separate from financial history.

Terminal requests must have no active hold. Stuck holds remain unavailable until resolved or explicitly expired under an approved policy.

## State machine

`created → reserved → provider_running → settled`

`reserved/provider_running → released` is allowed only when authoritative evidence says no billable usage exists. `reserved/provider_running → pending_reconciliation` is required for timeout, lost terminal response, disputed usage, or unverifiable partial usage; the full outstanding hold remains unavailable. `pending_reconciliation → settled` requires authoritative usage, while `pending_reconciliation → released` requires authoritative no-bill evidence. A settled request may receive separate partial/full refund or correction entries, bounded by the settled debit. A reservation release is not a refund.

Every transition is conditional, idempotent, and append-only. Duplicate terminal callbacks replay the stored result. A conflicting payload for the same account-scoped idempotency key is rejected and audited.

## Reservation and settlement algorithm

1. Start a transaction and lock the account row, then the account-scoped request/idempotency row. Every accounting path uses this account-then-request lock order.
2. If the idempotency key exists with the same request fingerprint, replay its stored result. If the fingerprint differs, reject it as a conflict.
3. Calculate the policy-bounded worst-case reservation using the same price snapshot and upward rounding formula as settlement.
4. Reject if `available_units < reservation`; otherwise insert one active reservation hold atomically. The available projection becomes `posted_balance - held_units`; no financial ledger entry is created.
5. Commit before calling the provider.
6. On verified usage, lock account then request, close the existing hold, insert exactly one posted `usage_debit = -actual`, and mark settled in the same transaction. The hold closure returns the unused amount automatically; no release entry is created.
7. On verified no-bill failure, close the hold without a posted debit and mark released.
8. On uncertainty, mark pending reconciliation and keep the full outstanding hold unavailable until a later authoritative decision.
9. For refunds/corrections, append a unique compensating positive entry tied to an external event/reason; cumulative refunds cannot exceed the settled debit.

## Worked examples

### Successful request

Opening posted balance is `1,000` units. Create a `100`-unit active hold: posted balance remains `1,000`, held is `100`, and available is `900`. Verified usage is `65`. Settlement closes the hold and posts one `usage_debit = -65`; posted balance becomes `935`, held becomes `0`, and available is `935`. The final cost is `65`, exactly once.

### Provider failure before billable usage

Create a `100`-unit hold: posted balance is `1,000`, held is `100`, and available is `900`. Authoritative no-bill evidence closes the hold without a posted debit. Posted balance remains `1,000`, held becomes `0`, and available returns to `1,000`. No release entry or refund exists.

### Timeout or uncertain usage

Create a `100`-unit hold, then lose the terminal response. Mark pending reconciliation; posted balance remains `1,000`, held is `100`, and available is `900`. Later verified usage of `40` closes the hold and posts debit `-40`, yielding posted balance `960`, held `0`, and available `960`. Authoritative no-bill evidence instead closes the hold without a debit and returns available to `1,000`.

### Cached pricing

If `p_i=10`, `p_c=2`, and `p_o=40` wallet units per million tokens, with `100,000` uncached input, `50,000` cached input, and `10,000` output:

`ceil((100,000×10 + 50,000×2 + 10,000×40) / 1,000,000) = ceil(1.6) = 2 units`.

The provider usage payload, price version, dimensions, formula inputs, and rounding result are stored.

### Refund

A settled charge of `65` has reduced posted balance. A verified provider correction appends `refund +20` with a unique event ID. Available increases by `20`; cumulative refunds cannot exceed `65`. The original hold is already closed and is not modified.

### Usage above the reservation

The request should prevent overage by enforcing maximum output, context limits, cached-token assumptions, and an approved safety margin. If authoritative provider usage still exceeds the hold, record the complete actual usage and close the hold; do not truncate cost or create an unauthorized negative balance. Create an `overage_reconciliation` record for the excess. Until a founder-approved policy resolves it, the platform absorbs the excess in an explicit platform-funded state or restricts further high-cost requests. A user must never be silently charged beyond an authorized policy.

## Corrected conceptual PostgreSQL SQL

These are conceptual examples, not migrations. They use separate reservation holds, a posted signed financial ledger, and account-then-request lock order.

```sql
-- Reservation hold: account scope and request fingerprint are mandatory.
begin;
select posted_balance, held_units
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

-- Require available = posted_balance - held_units >= :reserve_units.
insert into reservation_holds
  (hold_id, account_id, request_id, reserved_units, status,
   created_at, expires_at)
values
  (:hold_id, :account_id, :request_id, :reserve_units, 'active',
   now(), :expires_at);

update account_balances
set held_units = held_units + :reserve_units,
    available_units = posted_balance - (held_units + :reserve_units),
    updated_at = now()
where account_id = :account_id;
-- Require available_units >= 0; hold insert and projection update commit together.
commit;
```

```sql
-- Settlement: same account->request lock order; one terminal transition.
begin;
select posted_balance, held_units
from account_balances
where account_id = :account_id
for update;

select id, status, reserved_units
from accounting_requests
where account_id = :account_id
  and idempotency_key = :key
for update;

-- Terminal status: replay stored result without new entries.
-- Otherwise require reserved/provider_running. Close the hold and post actual usage.

update reservation_holds
set status = 'settled', settled_at = now()
where hold_id = :hold_id
  and account_id = :account_id
  and status = 'active';
-- Require exactly one row; this removes the temporary hold.

insert into token_ledger
  (account_id, request_id, entry_type, amount_units,
   pricing_version, operation_id, metadata)
values
  (:account_id, :request_id, 'debit', -:actual_units,
   :pricing_version, :debit_operation_id, :usage_metadata);

update account_balances
set posted_balance = posted_balance - :actual_units,
    held_units = held_units - :reserved_units,
    available_units = (posted_balance - :actual_units)
                    - (held_units - :reserved_units),
    updated_at = now()
where account_id = :account_id;
-- Hold closure, posted debit, and projection update commit together.

update accounting_requests
set status = 'settled', actual_units = :actual_units,
    settled_at = now(), result_json = :result
where account_id = :account_id
  and idempotency_key = :key
  and status in ('reserved', 'provider_running');
-- Require exactly one row; otherwise rollback/replay.
commit;
```

Required constraints include `unique(account_id, idempotency_key)`, request-fingerprint conflict detection, unique provider event/callback IDs, unique `(request_id, operation_id)` for posted ledger operations, unique `hold_id`, non-negative hold/usage quantities, valid state transitions, and a refund aggregate cap. Partial refunds need separate operation IDs; do not use `(request_id, entry_type)` as the only uniqueness rule. Do not use `GREATEST(0, ...)`; it hides a failed accounting invariant.

## Reconciliation and verification

Hold state, projection updates, and posted ledger inserts commit together. A rebuild computes `posted_balance` from immutable ledger entries and `available_units` as posted balance minus active holds. Reconciliation alerts on projection divergence, negative available/held units, orphan holds, duplicate events, conflicting idempotency payloads, provider/ledger usage mismatch, and pending holds beyond policy age. Concurrency tests must cover simultaneous reservations, duplicate settlement, settlement versus timeout, duplicate/out-of-order callbacks, partial refunds, over-reservation, and deadlock retry.

All denomination, cached-token treatment, rounding, safety factor, uncertain-usage policy, refund policy, and retention choices remain **Proposed / Awaiting founder approval** until recorded in an ADR.
