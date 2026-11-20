import { createHash, randomUUID } from "node:crypto";
import type { BackendStore, ChatRequest, Conversation, InferenceAdapter, Message, Session } from "./contracts";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 12_000;
const ALLOWED_MODELS = new Set(["frontier-balanced", "frontier-fast"]);

export const store: BackendStore = {
  sessions: new Map(),
  conversations: new Map(),
  messages: new Map(),
  idempotentChats: new Map(),
};

export function requestId(): string {
  return `req_${randomUUID()}`;
}

export function parseBearer(request: Request): string | null {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  return value.slice("Bearer ".length).trim() || null;
}

export function createDevelopmentSession(userId: string): Session {
  const now = Date.now();
  const session: Session = {
    id: `dev_${randomUUID()}`,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };
  store.sessions.set(session.id, session);
  return session;
}

export function resolveSession(request: Request): Session | null {
  const token = parseBearer(request) ?? request.headers.get("x-dev-session");
  if (!token) return null;
  const session = store.sessions.get(token);
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  return session;
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
    unauthenticated: "A development session is required.",
    invalid_request: "The request could not be validated.",
    not_found: "The requested resource was not found.",
    provider_unavailable: "The inference provider is unavailable.",
    conflict: "The idempotency key was already used for another request.",
  };
  return { code, message: messages[code] ?? "The request could not be completed." };
}

export function developmentAdapter(): InferenceAdapter {
  return {
    async *stream(input) {
      const configured = process.env.OPENROUTER_API_KEY;
      if (configured) {
        yield "Development OpenRouter wiring is reserved for the provider adapter spike. ";
        yield "No provider call is made by this safe default until model and usage policy are configured.";
        return;
      }
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
