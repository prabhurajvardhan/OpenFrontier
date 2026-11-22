export const ALLOWED_AUTH_DESTINATIONS = ["/", "/chat", "/settings", "/wallet"] as const;

export function safeAuthDestination(value: string | null): (typeof ALLOWED_AUTH_DESTINATIONS)[number] {
  return ALLOWED_AUTH_DESTINATIONS.find((path) => path === value) ?? "/chat";
}

export function googleOAuthCallbackUrl(origin: string): string {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeAuthDestination("/chat"));
  return callback.toString();
}
