import { AuthPreview } from "@/components/auth-preview";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthPreview initialError={error === "auth_not_configured" || error === "oauth_callback_failed" ? error : null} />;
}
