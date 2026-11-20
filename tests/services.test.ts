import assert from "node:assert/strict";
import test from "node:test";
import { createDevelopmentSession, getOrCreateConversation, resolveSession, store, validateChatRequest } from "../lib/server/services";

test("development sessions resolve only with the issued token", () => {
  const session = createDevelopmentSession("test-user");
  const request = new Request("http://localhost", { headers: { Authorization: `Bearer ${session.id}` } });
  assert.equal(resolveSession(request)?.userId, "test-user");
  assert.equal(resolveSession(new Request("http://localhost", { headers: { Authorization: "Bearer invalid" } })), null);
});

test("chat validation rejects unknown models and short idempotency keys", () => {
  assert.throws(() => validateChatRequest({ conversationId: null, modelId: "unknown", content: "hello", idempotencyKey: "valid-key" }), /invalid_request/);
  assert.throws(() => validateChatRequest({ conversationId: null, modelId: "frontier-fast", content: "hello", idempotencyKey: "short" }), /invalid_request/);
});

test("conversation ownership is enforced by the service boundary", () => {
  const conversation = getOrCreateConversation("owner-a", null, "Owned");
  assert.equal(store.conversations.get(conversation.id)?.userId, "owner-a");
  assert.throws(() => getOrCreateConversation("owner-b", conversation.id, "Nope"), /not_found/);
});
