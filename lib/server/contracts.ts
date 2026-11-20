export type SafeErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "invalid_request"
  | "provider_unavailable"
  | "not_found"
  | "conflict";

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  requestId?: string;
}

export interface NormalizedUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ChatRequest {
  conversationId: string | null;
  modelId: string;
  content: string;
  idempotencyKey: string;
}

export interface ChatTerminal {
  requestId: string;
  usage: NormalizedUsage;
  settlementStatus: "settled" | "pending_reconciliation";
}

export interface InferenceAdapter {
  stream(input: { modelId: string; content: string }): AsyncIterable<string>;
}

export interface BackendStore {
  sessions: Map<string, Session>;
  conversations: Map<string, Conversation>;
  messages: Map<string, Message[]>;
  idempotentChats: Map<string, ChatTerminal>;
}
