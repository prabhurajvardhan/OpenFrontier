import { NextResponse } from "next/server";
import { resolveOAuthCallback } from "@/lib/server/oauth-callback";
import { createSupabaseServerClient, hasSupabasePublicConfig } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const configured = hasSupabasePublicConfig();
  try {
    const supabase = configured ? await createSupabaseServerClient() : null;
    const destination = await resolveOAuthCallback(
      request.url,
      configured,
      async (code) => {
        if (!supabase) return { error: new Error("Supabase is not configured") };
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        return { error };
      },
    );
    const response = NextResponse.redirect(new URL(destination, "https://same-origin.invalid"));
    response.headers.set("Location", destination);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/sign-in?error=oauth_callback_failed", "https://same-origin.invalid"));
    response.headers.set("Location", "/sign-in?error=oauth_callback_failed");
    return response;
  }
}
