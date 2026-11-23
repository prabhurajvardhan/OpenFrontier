import { NextResponse } from "next/server";
import { resolveRequestIdentity } from "@/lib/server/auth-session";
import { safeError, store } from "@/lib/server/services";

export async function GET(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  const auth = await resolveRequestIdentity(request);
  if (!auth.identity) {
    const status = auth.error === "unauthenticated" ? 401 : 503;
    return NextResponse.json({ error: { code: auth.error, message: "A verified Firebase authentication token is required." } }, { status, headers: { "Cache-Control": "no-store" } });
  }
  const { conversationId } = await context.params;
  const conversation = store.conversations.get(conversationId);
  if (!conversation || conversation.userId !== auth.identity.uid) return NextResponse.json({ error: safeError("not_found") }, { status: 404 });
  return NextResponse.json({ messages: store.messages.get(conversationId) ?? [] });
}
