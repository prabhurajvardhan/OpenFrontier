import { NextResponse } from "next/server";
import { createDevelopmentSession, resolveSession, safeError } from "@/lib/server/services";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: safeError("forbidden") }, { status: 403 });
  }
  const existing = resolveSession(request);
  if (existing) return NextResponse.json({ session: existing, developmentOnly: true });
  const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
  const userId = typeof body?.userId === "string" && body.userId.trim() ? body.userId.trim() : "dev-user";
  const session = createDevelopmentSession(userId);
  return NextResponse.json({ session, developmentOnly: true }, { status: 201 });
}
