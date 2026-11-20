import { NextResponse } from "next/server";
import { resolveSession, safeError, store } from "@/lib/server/services";

export async function GET(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  const session = resolveSession(request);
  if (!session) return NextResponse.json({ error: safeError("unauthenticated") }, { status: 401 });
  const { conversationId } = await context.params;
  const conversation = store.conversations.get(conversationId);
  if (!conversation || conversation.userId !== session.userId) return NextResponse.json({ error: safeError("not_found") }, { status: 404 });
  return NextResponse.json({ messages: store.messages.get(conversationId) ?? [] });
}
