import { createHash, randomUUID } from "node:crypto";
import type { BackendStore, ChatOperation, ChatRequest, Conversation, InferenceAdapter, Message } from "./contracts";

const MAX_MESSAGE_LENGTH = 12_000;
const ALLOWED_MODELS = new Set(["frontier-balanced", "frontier-fast"]);

export const store: BackendStore = {
  conversations: new Map(),
  messages: new Map(),
  chatOperations: new Map(),
};

let testAdapter: InferenceAdapter | null = null;

export function setInferenceAdapterForTests(adapter: InferenceAdapter | null): void {
  testAdapter = adapter;
}

export function requestId(): string {
  return `req_${randomUUID()}`;
}

export function validateChatRequest(value: unknown): ChatRequest {
  if (!value || typeof value !== "object") throw new Error("invalid_request");
  const input = value as Record<string, unknown>;
  const conversationId = input.conversationId === null ? null : input.conversationId;
  if (conversationId !== null && typeof conversationId !== "string") throw new Error("invalid_request");
  if (typeof input.modelId !== "string" || !ALLOWED_MODELS.has(input.modelId)) throw new Error("invalid_request");
  if (typeof input.content !== "string" || input.content.trim().length === 0 || input.content.length > MAX_MESSAGE_LENGTH) throw new Error("invalid_request");
  if (typeof input.idempotencyKey !== "string" || input.idempotencyKey.length < 8 || input.idempotencyKey.length > 128) throw new Error("invalid_request");
  return { conversationId, modelId: input.modelId, content: input.content.trim(), idempotencyKey: input.idempotencyKey };
}

export function fingerprintChat(input: ChatRequest): string {
  return createHash("sha256").update(JSON.stringify([input.conversationId, input.modelId, input.content])).digest("hex");
}

export function reserveChatOperation(userId: string, input: ChatRequest, conversationId: string | null): { operation: ChatOperation; created: boolean } {
  const key = `${userId}:${input.idempotencyKey}`;
  const fingerprint = fingerprintChat(input);
  const existing = store.chatOperations.get(key);
  if (existing) {
    if (existing.fingerprint !== fingerprint) throw new Error("conflict");
    return { operation: existing, created: false };
  }
  const operation: ChatOperation = { fingerprint, requestId: requestId(), userId, status: "processing", conversationId };
  store.chatOperations.set(key, operation);
  return { operation, created: true };
}

export function markChatCompleted(userId: string, idempotencyKey: string, terminal: ChatOperation["terminal"]): void {
  const operation = store.chatOperations.get(`${userId}:${idempotencyKey}`);
  if (!operation || operation.status !== "processing") throw new Error("conflict");
  operation.status = "completed";
  operation.terminal = terminal;
}

export function markChatFailed(userId: string, idempotencyKey: string): void {
  const operation = store.chatOperations.get(`${userId}:${idempotencyKey}`);
  if (!operation || operation.status !== "processing") return;
  operation.status = "failed";
  operation.errorCode = "provider_unavailable";
}

export function getOrCreateConversation(userId: string, conversationId: string | null, firstMessage: string): Conversation {
  if (conversationId) {
    const existing = store.conversations.get(conversationId);
    if (!existing || existing.userId !== userId) throw new Error("not_found");
    return existing;
  }
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: `conv_${randomUUID()}`,
    userId,
    title: firstMessage.slice(0, 60),
    createdAt: now,
    updatedAt: now,
  };
  store.conversations.set(conversation.id, conversation);
  store.messages.set(conversation.id, []);
  return conversation;
}

export function appendMessage(message: Message): void {
  const messages = store.messages.get(message.conversationId) ?? [];
  messages.push(message);
  store.messages.set(message.conversationId, messages);
  const conversation = store.conversations.get(message.conversationId);
  if (conversation) conversation.updatedAt = message.createdAt;
}

export function listUserConversations(userId: string): Conversation[] {
  return [...store.conversations.values()].filter((item) => item.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function safeError(code: string): { code: string; message: string } {
  const messages: Record<string, string> = {
    unauthenticated: "A verified Firebase authentication token is required.",
    invalid_request: "The request could not be validated.",
    not_found: "The requested resource was not found.",
    provider_unavailable: "The inference provider is unavailable.",
    conflict: "The idempotency key was already used with a different payload.",
    in_progress: "A request with this idempotency key is already processing.",
    request_failed: "The previous request failed; retry with a new idempotency key.",
  };
  return { code, message: messages[code] ?? "The request could not be completed." };
}

export function developmentAdapter(): InferenceAdapter {
  if (testAdapter) return testAdapter;
  return {
    async *stream(input) {
      const response = `Development response for ${input.modelId}: I received “${input.content}”. The backend stream is active, but no provider credential is configured.`;
      for (const part of response.match(/.{1,48}(?:\s|$)/g) ?? [response]) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        yield part;
      }
    },
  };
}

export function hashSessionId(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}
