import { NextResponse } from "next/server";
import { createDevelopmentSession, resolveSession, safeError } from "@/lib/server/services";
import { resolveVerifiedSession } from "@/lib/server/auth-session";
import { createSupabaseServerClient, hasSupabasePublicConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const supabase = await createSupabaseServerClient();
    const result = await resolveVerifiedSession(() => supabase.auth.getUser());
    return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

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
