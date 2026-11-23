# Backend development contract

**Status: Implemented for development only; not a production contract.** This contract is compatible with the corrected terminal-event proposal below. It uses a server-owned in-memory store because no database schema or migration is available on this branch. Firebase ID-token authentication is implemented but requires owner configuration and is not live-verified; Supabase persistence and profile provisioning remain unimplemented.

## Authentication

### `GET /api/auth/session`

Accepts an `Authorization: Bearer <Firebase ID token>` header, verifies the token against the configured Nanoware Firebase project and requires `role: "authenticated"`. Returns the verified Firebase UID as `user.id`. The request body is not accepted as an identity source; missing or invalid tokens return `authenticated: false`. Firebase and Supabase values are documented in [`../security/nanoware-firebase-auth.md`](../security/nanoware-firebase-auth.md).

## Health

### `GET /api/health`

Returns the actual runtime environment: `{ "status": "ok", "environment": "development|production|test", "service": "open-frontier-backend" }`.

## Conversations

### `GET /api/conversations`

Requires a valid Firebase bearer token with the authenticated role. Returns conversations scoped to the verified Firebase UID in the development-only in-memory store.

### `POST /api/conversations`

Requires a valid Firebase bearer token with the authenticated role. Request: `{ "title"?: string }`. The server creates a conversation scoped to the verified Firebase UID and returns `{ "conversation": Conversation }`.

### `GET /api/conversations/:conversationId/messages`

Requires a valid Firebase bearer token with the authenticated role and matching Firebase UID ownership. Returns `{ "messages": Message[] }`.

## Streaming chat

### `POST /api/chat`

Requires a valid Firebase bearer token with the authenticated role. Ownership and idempotency use the verified Firebase UID; request-body IDs, emails, roles, and wallet ownership are not trusted. Request:

```json
{
  "conversationId": null,
  "modelId": "frontier-balanced",
  "content": "Hello",
  "idempotencyKey": "client-generated-key-1"
}
```

`modelId` is limited to the development allowlist `frontier-balanced` and `frontier-fast`. The server hashes `(conversationId, modelId, content)` as the payload fingerprint and atomically reserves the user-scoped idempotency operation before inference.

A concurrent duplicate receives HTTP `202` and a deterministic body:

```json
{ "status": "in_progress", "requestId": "req_..." }
```

A completed retry receives HTTP `409`. Reusing the key with a different payload receives HTTP `409`. A failed operation receives HTTP `503` and must be retried with a new idempotency key. These development semantics avoid duplicate inference and duplicate messages without pretending failed work completed.

Successful responses are `text/event-stream` with JSON events:

```text
data: {"type":"text_delta","text":"..."}

data: {"type":"terminal","requestId":"req_...","settlementStatus":"not_applicable","conversationId":"conv_..."}
```

The terminal event deliberately omits usage because the development adapter does not provide tokenizer-verified provider usage. `not_applicable` does not mean settled and does not create a wallet or ledger entry. Provider usage, reservation, and settlement remain Proposed until the provider/database integration exists.

The server persists one user message and, only after a complete stream, one assistant message in the development store. A provider failure marks the operation `failed`, emits an SSE error when the client is connected, and never emits a terminal event.

## Frontend coordination

The existing frontend branch defines the older terminal shape with required `inputTokens`, `outputTokens`, and `settlementStatus` values that exclude `not_applicable`. The exact required update is documented in [`frontend-terminal-contract-change.md`](frontend-terminal-contract-change.md). Backend source does not modify frontend files.

## Explicitly not implemented

Supabase persistence, automatic profile/wallet provisioning, wallet reservation/settlement, provider billing, payments, rewarded ads, rate limiting, and production deployment are not implemented by this development slice. No database migration was created or modified. Profile provisioning is blocked until the owner provides the actual schema and safe test access; do not infer tables from the proposed model.
