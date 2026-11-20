import assert from "node:assert/strict";
import test from "node:test";
import { POST as authPost } from "../app/api/auth/session/route";
import { POST as chatPost } from "../app/api/chat/route";
import { createDevelopmentSession, getOrCreateConversation, resolveSession, setInferenceAdapterForTests, store, validateChatRequest } from "../lib/server/services";

function chatRequest(token: string, key: string, content = "hello", conversationId: string | null = null): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ conversationId, modelId: "frontier-fast", content, idempotencyKey: key }),
  });
}

async function readStream(response: Response): Promise<string> {
  return response.text();
}

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

test("concurrent same-key requests reserve one operation and do not duplicate messages", async () => {
  const session = createDevelopmentSession("concurrent-user");
  const first = chatPost(chatRequest(session.id, "concurrent-key-001"));
  const second = chatPost(chatRequest(session.id, "concurrent-key-001"));
  const [firstResponse, secondResponse] = await Promise.all([first, second]);
  const statuses = [firstResponse.status, secondResponse.status].sort();
  assert.deepEqual(statuses, [200, 202]);
  await Promise.all([readStream(firstResponse), readStream(secondResponse)]);
  const operation = [...store.chatOperations.entries()].find(([key]) => key === "concurrent-user:concurrent-key-001")?.[1];
  assert.equal(operation?.status, "completed");
  assert.equal(store.messages.get(operation?.conversationId ?? "")?.filter((message) => message.requestId === operation?.requestId).length, 2);
});

test("completed retry returns conflict without duplicating messages", async () => {
  const session = createDevelopmentSession("retry-user");
  const response = await chatPost(chatRequest(session.id, "completed-key-001"));
  await readStream(response);
  const retry = await chatPost(chatRequest(session.id, "completed-key-001"));
  assert.equal(retry.status, 409);
  const operation = store.chatOperations.get("retry-user:completed-key-001");
  assert.equal(store.messages.get(operation?.conversationId ?? "")?.filter((message) => message.requestId === operation?.requestId).length, 2);
});

test("same key with a different payload returns conflict", async () => {
  const session = createDevelopmentSession("conflict-user");
  const first = await chatPost(chatRequest(session.id, "payload-key-001", "one"));
  await readStream(first);
  const second = await chatPost(chatRequest(session.id, "payload-key-001", "two"));
  assert.equal(second.status, 409);
});

test("provider failure emits an error and same-key retry is explicitly rejected", async () => {
  setInferenceAdapterForTests({ async *stream() { throw new Error("provider failure"); } });
  const session = createDevelopmentSession("failure-user");
  const response = await chatPost(chatRequest(session.id, "failure-key-001"));
  const body = await readStream(response);
  assert.match(body, /\"type\":\"error\"/);
  assert.equal(store.chatOperations.get("failure-user:failure-key-001")?.status, "failed");
  const retry = await chatPost(chatRequest(session.id, "failure-key-001"));
  assert.equal(retry.status, 503);
  setInferenceAdapterForTests(null);
});

test("cross-user conversation access is rejected by the chat route", async () => {
  const owner = createDevelopmentSession("conversation-owner");
  const other = createDevelopmentSession("conversation-other");
  const conversation = getOrCreateConversation(owner.userId, null, "Private");
  const response = await chatPost(chatRequest(other.id, "cross-user-key-001", "hello", conversation.id));
  assert.equal(response.status, 404);
});

test("development session endpoint rejects production runtime", async () => {
  const previous = process.env.NODE_ENV;
  const environment = process.env as Record<string, string | undefined>;
  environment.NODE_ENV = "production";
  const response = await authPost(new Request("http://localhost/api/auth/session", { method: "POST", body: "{}" }));
  if (previous === undefined) delete environment.NODE_ENV;
  else environment.NODE_ENV = previous;
  assert.equal(response.status, 403);
});

test("terminal event has no fake usage and uses non-financial settlement status", async () => {
  const session = createDevelopmentSession("schema-user");
  const response = await chatPost(chatRequest(session.id, "schema-key-001"));
  const body = await readStream(response);
  const terminalLine = body.split("\n").find((line) => line.includes('"type":"terminal"'));
  assert.ok(terminalLine);
  const terminal = JSON.parse(terminalLine!.replace(/^data: /, "")) as Record<string, unknown>;
  assert.equal(terminal.settlementStatus, "not_applicable");
  assert.equal("usage" in terminal, false);
  assert.equal(typeof terminal.requestId, "string");
});
