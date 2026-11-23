import { NextResponse } from "next/server";
import { resolveFirebaseSession } from "@/lib/server/auth-session";

export async function GET(request: Request) {
  const result = await resolveFirebaseSession(request);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
