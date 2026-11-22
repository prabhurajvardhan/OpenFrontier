import { googleOAuthCallbackUrl } from "@/lib/supabase/oauth";

type OAuthResult = { error: { message: string } | null };
type OAuthInitiator = (options: {
  provider: "google";
  options: { redirectTo: string };
}) => Promise<OAuthResult>;

export function startGoogleOAuth(signInWithOAuth: OAuthInitiator, origin: string): Promise<OAuthResult> {
  return signInWithOAuth({
    provider: "google",
    options: { redirectTo: googleOAuthCallbackUrl(origin) },
  });
}
