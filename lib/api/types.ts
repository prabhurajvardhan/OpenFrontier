/**
 * Proposed frontend contract boundary only. These shapes reflect docs/api/proposed-contracts.md
 * and are not a deployed API contract. Do not use client input as authority for balances or rewards.
 */
export type SafeErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "invalid_request"
  | "insufficient_tokens"
  | "rate_limited"
  | "concurrency_limited"
  | "provider_unavailable"
  | "settlement_pending"
  | "verification_pending"
  | "reconciliation_required";

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ChatSubmission {
  conversationId: string | null;
  modelId: string;
  content: string;
  idempotencyKey: string;
}

export type ChatStreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "terminal"; requestId: string; inputTokens?: number; outputTokens?: number; settlementStatus: "settled" | "pending_reconciliation" }
  | { type: "error"; code: SafeErrorCode; requestId?: string };

export interface TokenBalanceView {
  /** Server-projected balance. A UI mock must label this as sample data. */
  availableTokens: number;
  asOf: string;
}

export interface LedgerEntryView {
  id: string;
  type: "reward_credit" | "debit" | "release" | "topup_credit" | "refund" | "pending_reconciliation";
  amount: number;
  status: "settled" | "pending" | "rejected";
  createdAt: string;
  sourceLabel: string;
}

export interface RewardShowView {
  showId: string;
  status: "ready" | "pending_verification" | "rejected" | "unavailable";
  expiresAt?: string;
}

export interface FrontendApi {
  listConversations(): Promise<ConversationSummary[]>;
  getTokenBalance(): Promise<TokenBalanceView>;
  getTokenLedger(): Promise<LedgerEntryView[]>;
  submitChat(request: ChatSubmission): AsyncIterable<ChatStreamEvent>;
  createRewardShow(): Promise<RewardShowView>;
}
