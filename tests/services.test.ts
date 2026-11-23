import assert from "node:assert/strict";
import test from "node:test";
import { GET as authGet } from "../app/api/auth/session/route";
import { POST as chatPost } from "../app/api/chat/route";
import { GET as conversationsGet } from "../app/api/conversations/route";
import { getOrCreateConversation, listUserConversations, store, validateChatRequest } from "../lib/server/services";

const PROJECT_ID = "nanoware-test-project";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = PROJECT_ID;

function unauthenticatedRequest(path: string, method = "GET"): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    ...(method === "POST" ? { body: JSON.stringify({ userId: "attacker-chosen-id" }) } : {}),
  });
}

test("session endpoint never trusts request-body identity and reports no session without a token", async () => {
  const response = await authGet(unauthenticatedRequest("/api/auth/session"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { authenticated: false });
});

test("protected chat and conversation APIs reject missing and malformed Firebase bearer tokens", async () => {
  const missing = await chatPost(unauthenticatedRequest("/api/chat", "POST"));
  assert.equal(missing.status, 401);
  const malformed = await conversationsGet(new Request("http://localhost/api/conversations", { headers: { authorization: "Bearer not-a-valid-jwt" } }));
  assert.equal(malformed.status, 401);
});

test("chat validation rejects unknown models and short idempotency keys", () => {
  assert.throws(() => validateChatRequest({ conversationId: null, modelId: "unknown", content: "hello", idempotencyKey: "valid-key" }), /invalid_request/);
  assert.throws(() => validateChatRequest({ conversationId: null, modelId: "frontier-fast", content: "hello", idempotencyKey: "short" }), /invalid_request/);
});

test("Firebase UID is the ownership key and another UID cannot read or continue a conversation", () => {
  const conversation = getOrCreateConversation("firebase-uid-owner", null, "Owned");
  assert.equal(store.conversations.get(conversation.id)?.userId, "firebase-uid-owner");
  assert.equal(listUserConversations("firebase-uid-owner").length, 1);
  assert.equal(listUserConversations("firebase-uid-other").length, 0);
  assert.throws(() => getOrCreateConversation("firebase-uid-other", conversation.id, "Nope"), /not_found/);
});
