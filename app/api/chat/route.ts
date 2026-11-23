import { NextResponse } from "next/server";
import { resolveRequestIdentity } from "@/lib/server/auth-session";
import { appendMessage, developmentAdapter, getOrCreateConversation, markChatCompleted, markChatFailed, reserveChatOperation, safeError, store, validateChatRequest } from "@/lib/server/services";

function event(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request) {
  const auth = await resolveRequestIdentity(request);
  if (!auth.identity) {
    const status = auth.error === "unauthenticated" ? 401 : 503;
    const message = auth.error === "auth_not_configured" ? "Firebase authentication is not configured." : auth.error === "auth_unavailable" ? "Authentication is temporarily unavailable." : "A verified Firebase authentication token is required.";
    return NextResponse.json({ error: { code: auth.error, message } }, { status, headers: { "Cache-Control": "no-store" } });
  }
  const session = { userId: auth.identity.uid };
  let input;
  try {
    input = validateChatRequest(await request.json());
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid_request";
    return NextResponse.json({ error: safeError(code) }, { status: 400 });
  }

  let operation;
  const operationKey = `${session.userId}:${input.idempotencyKey}`;
  const existing = store.chatOperations.get(operationKey);
  if (existing) {
    try {
      const reserved = reserveChatOperation(session.userId, input, existing.conversationId);
      operation = reserved.operation;
    } catch (error) {
      return NextResponse.json({ error: safeError(error instanceof Error ? error.message : "conflict") }, { status: 409 });
    }
    if (operation.status === "processing") {
      return NextResponse.json({ status: "in_progress", requestId: operation.requestId }, { status: 202 });
    }
    if (operation.status === "failed") {
      return NextResponse.json({ error: safeError("request_failed"), requestId: operation.requestId, retryPolicy: "new_idempotency_key" }, { status: 503 });
    }
    return NextResponse.json({ error: safeError("conflict"), terminal: operation.terminal }, { status: 409 });
  }

  if (input.conversationId) {
    try {
      getOrCreateConversation(session.userId, input.conversationId, input.content);
    } catch {
      return NextResponse.json({ error: safeError("not_found") }, { status: 404 });
    }
  }
  try {
    operation = reserveChatOperation(session.userId, input, input.conversationId).operation;
  } catch (error) {
    return NextResponse.json({ error: safeError(error instanceof Error ? error.message : "conflict") }, { status: 409 });
  }
  const conversation = getOrCreateConversation(session.userId, input.conversationId, input.content);
  operation.conversationId = conversation.id;
  const requestId = operation.requestId;
  appendMessage({ id: `msg_${requestId}`, conversationId: conversation.id, role: "user", content: input.content, createdAt: new Date().toISOString(), requestId });

  let connected = true;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let output = "";
      const send = (payload: unknown): boolean => {
        if (!connected) return false;
        try {
          controller.enqueue(encoder.encode(event(payload)));
          return true;
        } catch {
          connected = false;
          return false;
        }
      };
      try {
        for await (const chunk of developmentAdapter().stream({ modelId: input.modelId, content: input.content })) {
          output += chunk;
          if (!send({ type: "text_delta", text: chunk })) break;
        }
        if (!connected) {
          markChatFailed(session.userId, input.idempotencyKey);
          return;
        }
        appendMessage({ id: `msg_${requestId}_assistant`, conversationId: conversation.id, role: "assistant", content: output, createdAt: new Date().toISOString(), requestId });
        const terminal = { requestId, settlementStatus: "not_applicable" as const, conversationId: conversation.id };
        markChatCompleted(session.userId, input.idempotencyKey, terminal);
        send({ type: "terminal", ...terminal });
      } catch {
        markChatFailed(session.userId, input.idempotencyKey);
        send({ type: "error", ...safeError("provider_unavailable"), requestId });
      } finally {
        if (connected) {
          try {
            controller.close();
          } catch {
            connected = false;
          }
        }
      }
    },
    cancel() {
      connected = false;
    },
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Request-Id": requestId } });
}
