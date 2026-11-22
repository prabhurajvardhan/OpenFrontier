import { safeAuthDestination } from "@/lib/supabase/oauth";

export type OAuthExchange = (code: string) => Promise<{ error: unknown | null }>;

export async function resolveOAuthCallback(
  requestUrl: string,
  isConfigured: boolean,
  exchangeCode: OAuthExchange,
): Promise<string> {
  const incoming = new URL(requestUrl);
  if (!isConfigured) return "/sign-in?error=auth_not_configured";

  const code = incoming.searchParams.get("code");
  const providerError = incoming.searchParams.get("error");
  if (providerError || !code) return "/sign-in?error=oauth_callback_failed";

  try {
    const { error } = await exchangeCode(code);
    if (error) return "/sign-in?error=oauth_callback_failed";
    return safeAuthDestination(incoming.searchParams.get("next"));
  } catch {
    return "/sign-in?error=oauth_callback_failed";
  }
}
