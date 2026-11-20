import { NextResponse } from "next/server";
import { getOrCreateConversation, listUserConversations, resolveSession, safeError } from "@/lib/server/services";

export async function GET(request: Request) {
  const session = resolveSession(request);
  if (!session) return NextResponse.json({ error: safeError("unauthenticated") }, { status: 401 });
  return NextResponse.json({ conversations: listUserConversations(session.userId) });
}

export async function POST(request: Request) {
  const session = resolveSession(request);
  if (!session) return NextResponse.json({ error: safeError("unauthenticated") }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "New conversation";
  const conversation = getOrCreateConversation(session.userId, null, title);
  return NextResponse.json({ conversation }, { status: 201 });
}
