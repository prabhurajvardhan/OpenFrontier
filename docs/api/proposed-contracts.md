# Proposed API contracts

**Status: Proposed; not implemented.** These are internal contract shapes for review. Transport, versioning, exact schemas, and public exposure remain open.

## `POST /api/chat`

Requires an application session and conversation ownership. The request contains `conversation_id`, approved `model_id`, user message content, an idempotency key, and optional client capabilities. The server validates size, context budget, model status, policy, and quotas. The response is a streaming assistant event sequence with a terminal event containing request ID, normalized usage, settlement status, and safe error state. It must never stream provider secrets, raw gateway errors, or an unverified final balance.

The server reserves before provider invocation. Retries with the same idempotency key return or resume the existing request rather than double-reserving.

## `POST /api/ad-shows` and `POST /api/ad-callbacks/{network}`

`POST /api/ad-shows` requires a valid guest or account session and returns a server-generated show ID, expiry, and network payload. The client callback endpoint is for UX and telemetry only. The network callback endpoint accepts only the provider's documented fields plus a server-side secret/signature mechanism. It validates show ID, nonce, network, timestamp, account/session association, replay state, and policy version, then performs one idempotent reward decision.

The response is a fast 2xx after durable receipt. It never returns a reward amount based solely on client input. A `pending_verification` or `rejected` state is explicit.

## `GET /api/token-balance` and `GET /api/token-ledger`

These endpoints return server projections and redacted ledger history for the current account. They accept no account identifier from the client. Pagination uses opaque cursors. Entries expose type, amount, status, timestamp, and safe source labels; provider secrets, fraud signals, and internal pricing credentials are excluded.

## `POST /api/out`

The server accepts a destination URL and source context. It normalizes and validates scheme, host, encoding, and length, checks allow/deny rules, selects direct affiliate wrapping or approved fallback, and returns a signed short-lived redirect token or safe destination. Arbitrary target URLs and open redirect parameters are rejected. The response includes the disclosure text or disclosure requirement for the UI.

## `POST /api/payments/checkout` and provider webhooks

The checkout endpoint accepts a top-up product ID and idempotency key, not an arbitrary amount. The server creates a pending payment intent and hosted provider session/order. Webhooks verify the raw body/signature, provider event ID, merchant account, amount, currency, and intent association. Only one successful transition can create a `topup_credit` ledger entry. Refunds and disputes create compensating entries.

## Common errors and controls

Use stable error codes such as `unauthenticated`, `forbidden`, `invalid_request`, `insufficient_tokens`, `rate_limited`, `concurrency_limited`, `provider_unavailable`, `settlement_pending`, `verification_pending`, and `reconciliation_required`. Every mutating request has a server request ID, redacted audit record, bounded payload, rate limit, timeout, and idempotency policy.

## Compatibility policy

Keep public contracts versioned or backward-compatible. Provider-specific model names, errors, usage metadata, and callback fields must be normalized behind internal adapters. Any accepted contract change requires an ADR or task-linked update and a migration/rollout note.
