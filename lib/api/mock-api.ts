import type { ConversationSummary, FrontendApi, LedgerEntryView, RewardShowView, TokenBalanceView } from "./types";

const conversations: ConversationSummary[] = [
  { id: "sample-1", title: "A good place to start", updatedAt: "Today" },
  { id: "sample-2", title: "What can Open Frontier do?", updatedAt: "Yesterday" },
  { id: "sample-3", title: "Notes on an idea", updatedAt: "Nov 18" },
];

const ledger: LedgerEntryView[] = [
  { id: "sample-ledger-1", type: "reward_credit", amount: 1200, status: "settled", createdAt: "Today · 9:40 AM", sourceLabel: "Example welcome grant" },
  { id: "sample-ledger-2", type: "debit", amount: -84, status: "settled", createdAt: "Yesterday · 4:12 PM", sourceLabel: "Example chat usage" },
  { id: "sample-ledger-3", type: "reward_credit", amount: 600, status: "pending", createdAt: "Nov 18 · 11:05 AM", sourceLabel: "Example reward · pending" },
];

export const mockApi: FrontendApi = {
  async listConversations() {
    return conversations;
  },
  async getTokenBalance(): Promise<TokenBalanceView> {
    return { availableTokens: 12480, asOf: "Sample data · not a real balance" };
  },
  async getTokenLedger() {
    return ledger;
  },
  async *submitChat() {
    const parts = [
      "This is a **local preview response**. No model provider was contacted and no tokens were used.\n\n",
      "Open Frontier is designed to make capable AI tools easier to access, with clear model choices and transparent usage. In this prototype, all conversations stay in your browser session.\n\n",
      "### What you can explore\n",
      "- Try the chat layout and model selector.\n",
      "- Review sample wallet and reward states.\n",
      "- See how pending verification is presented without promising a reward.\n\n",
      "When a backend is available, a server—not this screen—will verify identity, stream responses, and calculate token settlement.",
    ];
    for (const text of parts) {
      await new Promise((resolve) => setTimeout(resolve, 90));
      yield { type: "text_delta", text };
    }
    yield { type: "terminal", requestId: "mock-preview-only", inputTokens: 0, outputTokens: 0, settlementStatus: "settled" };
  },
  async createRewardShow(): Promise<RewardShowView> {
    return { showId: "mock-preview-only", status: "unavailable" };
  },
};
