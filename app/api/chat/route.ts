import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { appendMessage, developmentAdapter, getOrCreateConversation, resolveSession, safeError, store, validateChatRequest } from "@/lib/server/services";

function event(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request) {
  const session = resolveSession(request);
  if (!session) return NextResponse.json({ error: safeError("unauthenticated") }, { status: 401 });
  let input;
  try {
    input = validateChatRequest(await request.json());
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid_request";
    return NextResponse.json({ error: safeError(code) }, { status: 400 });
  }
  const key = `${session.userId}:${input.idempotencyKey}`;
  const prior = store.idempotentChats.get(key);
  if (prior) {
    return NextResponse.json({ error: safeError("conflict"), terminal: prior }, { status: 409 });
  }
  let conversation;
  try {
    conversation = getOrCreateConversation(session.userId, input.conversationId, input.content);
  } catch (error) {
    return NextResponse.json({ error: safeError(error instanceof Error ? error.message : "not_found") }, { status: 404 });
  }
  const requestId = `req_${randomUUID()}`;
  const userMessage = { id: `msg_${randomUUID()}`, conversationId: conversation.id, role: "user" as const, content: input.content, createdAt: new Date().toISOString(), requestId };
  appendMessage(userMessage);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let output = "";
      try {
        for await (const chunk of developmentAdapter().stream({ modelId: input.modelId, content: input.content })) {
          output += chunk;
          controller.enqueue(encoder.encode(event({ type: "text_delta", text: chunk })));
        }
        const assistantMessage = { id: `msg_${randomUUID()}`, conversationId: conversation.id, role: "assistant" as const, content: output, createdAt: new Date().toISOString(), requestId };
        appendMessage(assistantMessage);
        const terminal = { requestId, usage: { inputTokens: input.content.length, outputTokens: output.length }, settlementStatus: "settled" as const };
        store.idempotentChats.set(key, terminal);
        controller.enqueue(encoder.encode(event({ type: "terminal", ...terminal, conversationId: conversation.id })));
      } catch {
        controller.enqueue(encoder.encode(event({ type: "error", ...safeError("provider_unavailable"), requestId })));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Request-Id": requestId } });
}
