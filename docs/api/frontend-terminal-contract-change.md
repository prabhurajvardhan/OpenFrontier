# Frontend terminal contract change proposal

**Status: Proposed; frontend owner action required.** Backend correction B2 removes fabricated character-count token usage and financial settlement claims from development SSE terminal events.

Update `lib/api/types.ts` on the frontend branch as follows:

```ts
export type ChatStreamEvent =
  | { type: "text_delta"; text: string }
  | {
      type: "terminal";
      requestId: string;
      conversationId: string;
      settlementStatus: "not_applicable" | "settled" | "pending_reconciliation";
      inputTokens?: number;
      outputTokens?: number;
    }
  | { type: "error"; code: SafeErrorCode; requestId?: string };
```

For the current development backend, clients must handle `settlementStatus: "not_applicable"` and must not expect `inputTokens` or `outputTokens`. Production values remain optional until a provider returns tokenizer-verified usage and the database accounting integration is implemented. The backend does not alter frontend source files under this task.
