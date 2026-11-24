# Token economy and accounting

**Status: Core accounting formula specified; reward, payment, and overage policies remain unapproved.** The database is authoritative for posted OFTens. Browsers, caches, provider callbacks, and model responses cannot set a balance directly.

## OFTen denomination and usage debit

The approved accounting rule for this foundation is:

- 1 input token = 1 OFTen.
- 1 output token = 3 OFTens.
- `actual_debit_oftens = actual_input_tokens + 3 × actual_output_tokens`.

Counts and posted movements are integers. Cached-input and cache-write counts are recorded as subdivisions of the provider's total input count for provider-cost reporting; they do not change the OFTen formula. The database rejects invalid subdivisions, negative counts, and values outside the supported integer range. A zero-usage settlement records usage but does not insert a zero-value ledger entry.

There is no USD-to-OFTen conversion, model-price-to-OFTen conversion, promotional-credit grant, or assumed exchange rate in these migrations. Rewards and top-ups are not implemented as automatic sources of balance. Their eligibility, amounts, verification, and accounting require separate approval and implementation.

## Provider costs are separate

`model_price_versions` stores effective-dated model/provider cost rates independently for uncached input, cached input, cache-write input, and output, with a provider-cost currency and source. The settlement RPC records provider-reported cost (when supplied) separately from estimated cost computed from the selected price version and verified usage dimensions. Neither provider-cost value determines the OFTen debit.

The cost estimate is computed from the relevant usage counts and per-million-token rates. Price versions and reported usage are retained for auditability. No currency conversion is performed. Missing or changing provider billing dimensions must be handled by a separately approved operational policy; the database does not infer an OFTen exchange rate.

## Profiles, wallet projection, ledger, and holds

Firebase UID is the canonical user identity. A profile has an internal UUID key and a unique Firebase UID; ownership helpers validate the Firebase issuer, audience, and authenticated role before mapping the UID to the internal key. Provisioning is restricted to a service-role RPC keyed by UID. It does not merge users by email or grant balance. Existing profiles and ledger-derived wallet state must be preserved.

`token_ledger` is append-only posted history. `reservation_holds` is temporary authorization, not a ledger movement. `wallet_accounts` is a projection: posted balance is the sum of ledger movements, held balance is the active holds, and available balance is posted less held. The client cannot write financial records or balances. A restricted `wallet_ledger_public` invoker-rights view exposes only approved ledger fields for an authenticated owner's rows; raw provider metadata and internal accounting identifiers are not exposed through it.

Reservation, provider-state, settlement, release, refund, and projection updates are performed through transactional RPCs. They lock the profile before the accounting request, enforce request fingerprints/idempotency, and avoid client-supplied identity as an authorization source. Same-payload retries replay stored results; conflicting retries fail. Refunds are append-only, tied to a settled accounting request, and cumulatively capped at its settled usage debit.

## Settlement and uncertainty

For verified usage within the active hold, settlement atomically closes the hold, records provider usage and cost fields, posts at most one debit for `input + 3 × output`, updates request state, and refreshes the wallet projection. Unused reserved OFTens become available when the hold closes. A verified no-bill outcome may release a hold without a debit. An uncertain provider outcome remains pending reconciliation with the hold retained.

If verified usage exceeds the hold, the system preserves provider usage and cost records and moves the request to `pending_reconciliation`; it does not truncate usage, silently debit beyond the authorized hold, invent credits, or let the balance become unauthorized negative. The overage record and hold remain available for an authorized resolution. The following are intentionally unresolved pending founder approval: who absorbs or collects overage, whether/when to restrict further requests, whether a user may ever authorize additional debit, timeout/expiry behavior, and the evidence/authority required for reconciliation. No platform-funded, user-billed, or write-off policy is implied.

## Testable invariants

The disposable PostgreSQL suite verifies migration application, UID ownership and issuer checks through a local `auth` shim, cross-user isolation, redacted ledger access and grants, exact OFTen arithmetic, separate provider-cost recording, duplicate reservation/settlement behavior, concurrent reservations, releases, capped concurrent refunds, correction rollback comparison, and reapplication. These local checks are not a live Supabase/Firebase integration test and do not certify production readiness.

## Decisions still required

Before production use, obtain explicit approval for reward and payment funding flows, promotional-credit policy, provider-cost currency/conversion/reporting requirements, overage resolution and timeout policy, refund authority and evidence, retention, audit access, and applicable security review. Do not seed prices or grant balances until their values and source are approved.
