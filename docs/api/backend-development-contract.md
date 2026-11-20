# Backend development contract

**Status: Implemented for development only; not a production contract.** This contract is compatible with the corrected terminal-event proposal below. It uses a server-owned in-memory store because no database-agent schema or migration is available on this branch. Production persistence, accounting, and identity remain Proposed.

## Authentication

### `POST /api/auth/session`

Development only. In non-production mode, accepts `{ "userId": "dev-user" }` and returns a short-lived development session. The returned `session.id` must be sent as `Authorization: Bearer <session.id>` or `x-dev-session`. Production returns `403`.

## Health

### `GET /api/health`

Returns the actual runtime environment: `{ "status": "ok", "environment": "development|production|test", "service": "open-frontier-backend" }`.

## Conversations

### `GET /api/conversations`

Requires a development session. Returns user-owned conversations only.

### `POST /api/conversations`

Requires a development session. Request: `{ "title"?: string }`. The server creates the conversation and returns `{ "conversation": Conversation }`.

### `GET /api/conversations/:conversationId/messages`

Requires a development session and ownership. Returns `{ "messages": Message[] }`.

## Streaming chat

### `POST /api/chat`

Requires a development session. Request:

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

Supabase persistence, Google OIDC, application cookies, wallet reservation/settlement, provider billing, payments, rewarded ads, rate limiting, and production deployment are not implemented by this development slice. No database migration was created or modified.
