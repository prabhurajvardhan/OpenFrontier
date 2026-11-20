# Backend development contract

**Status: Implemented for development only; not a production contract.** This contract is compatible with the frontend types in `lib/api/types.ts`. It uses a server-owned in-memory store because no database-agent schema or migration is available on this branch. Production persistence, accounting, and identity remain Proposed.

## Authentication

### `POST /api/auth/session`

Development only. In non-production mode, accepts `{ "userId": "dev-user" }` and returns a short-lived development session. The returned `session.id` must be sent as `Authorization: Bearer <session.id>` or `x-dev-session`. Production returns `403`.

### Common errors

```json
{ "error": { "code": "unauthenticated", "message": "A development session is required." } }
```

## Health

### `GET /api/health`

Returns `{ "status": "ok", "environment": "development", "service": "open-frontier-backend" }`.

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

`modelId` is limited to the development allowlist `frontier-balanced` and `frontier-fast`. The response is `text/event-stream` with JSON events:

```text
data: {"type":"text_delta","text":"..."}

data: {"type":"terminal","requestId":"req_...","usage":{"inputTokens":5,"outputTokens":42},"settlementStatus":"settled","conversationId":"conv_..."}
```

The server persists user and assistant messages in the development store, scopes idempotency by user, checks conversation ownership, and never accepts client balance or usage values. Reusing an idempotency key returns `409 conflict`. The default adapter is deterministic and does not call a provider. `OPENROUTER_API_KEY` is not sufficient by itself to enable provider calls; provider/model policy and usage semantics remain a separate spike.

## Explicitly not implemented

Supabase persistence, Google OIDC, application cookies, wallet reservation/settlement, provider billing, payments, rewarded ads, rate limiting, and production deployment are not implemented by this development slice. No database migration was created or modified.
