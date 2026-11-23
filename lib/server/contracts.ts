export type SafeErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "invalid_request"
  | "provider_unavailable"
  | "not_found"
  | "conflict"
  | "in_progress"
  | "request_failed";

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

export interface ChatRequest {
  conversationId: string | null;
  modelId: string;
  content: string;
  idempotencyKey: string;
}

export interface ChatTerminal {
  requestId: string;
  settlementStatus: "not_applicable";
  conversationId: string;
}

export type ChatOperationStatus = "processing" | "completed" | "failed";

export interface ChatOperation {
  fingerprint: string;
  requestId: string;
  userId: string;
  status: ChatOperationStatus;
  conversationId: string | null;
  terminal?: ChatTerminal;
  errorCode?: "provider_unavailable";
}

export interface InferenceAdapter {
  stream(input: { modelId: string; content: string }): AsyncIterable<string>;
}

export interface BackendStore {
  conversations: Map<string, Conversation>;
  messages: Map<string, Message[]>;
  chatOperations: Map<string, ChatOperation>;
}
