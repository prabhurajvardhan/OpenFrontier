import { NextResponse } from "next/server";
import { resolveRequestIdentity } from "@/lib/server/auth-session";
import { getOrCreateConversation, listUserConversations } from "@/lib/server/services";

export async function GET(request: Request) {
  const auth = await resolveRequestIdentity(request);
  if (!auth.identity) return authError(auth.error);
  return NextResponse.json({ conversations: listUserConversations(auth.identity.uid) });
}

export async function POST(request: Request) {
  const auth = await resolveRequestIdentity(request);
  if (!auth.identity) return authError(auth.error);
  const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "New conversation";
  const conversation = getOrCreateConversation(auth.identity.uid, null, title);
  return NextResponse.json({ conversation }, { status: 201 });
}

function authError(code: "unauthenticated" | "auth_not_configured" | "auth_unavailable") {
  const status = code === "unauthenticated" ? 401 : 503;
  const message = code === "unauthenticated" ? "A verified Firebase authentication token is required." : code === "auth_not_configured" ? "Firebase authentication is not configured." : "Authentication is temporarily unavailable.";
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}
