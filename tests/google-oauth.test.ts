import assert from "node:assert/strict";
import test from "node:test";
import { resolveOAuthCallback } from "@/lib/server/oauth-callback";
import { startGoogleOAuth } from "@/lib/supabase/google-oauth";
import { ALLOWED_AUTH_DESTINATIONS, googleOAuthCallbackUrl, safeAuthDestination } from "@/lib/supabase/oauth";

test("Google OAuth initiation selects Google and uses the fixed internal callback destination", async () => {
  let received: unknown;
  const result = await startGoogleOAuth(async (options) => {
    received = options;
    return { error: null };
  }, "https://app.example.test");
  assert.deepEqual(received, {
    provider: "google",
    options: { redirectTo: "https://app.example.test/auth/callback?next=%2Fchat" },
  });
  assert.deepEqual(result, { error: null });
});

test("callback URL builder preserves local origins and uses a same-origin route", () => {
  assert.equal(googleOAuthCallbackUrl("http://localhost:3000"), "http://localhost:3000/auth/callback?next=%2Fchat");
});

test("redirect allowlist accepts only known application destinations", () => {
  for (const path of ALLOWED_AUTH_DESTINATIONS) assert.equal(safeAuthDestination(path), path);
  for (const path of ["https://attacker.example", "//attacker.example", "/\\attacker.example", "/chat?next=https://attacker.example", "javascript:alert(1)", null]) {
    assert.equal(safeAuthDestination(path), "/chat");
  }
});

test("callback exchanges the one-time code and redirects to the allowed app page", async () => {
  const codes: string[] = [];
  const destination = await resolveOAuthCallback(
    "https://app.example.test/auth/callback?code=one-time-code&next=%2Fsettings",
    true,
    async (code) => { codes.push(code); return { error: null }; },
  );
  assert.deepEqual(codes, ["one-time-code"]);
  assert.equal(destination, "/settings");
});

test("unconfigured callback does not attempt an exchange", async () => {
  let called = false;
  const destination = await resolveOAuthCallback("https://app.example.test/auth/callback?code=x", false, async () => {
    called = true;
    return { error: null };
  });
  assert.equal(called, false);
  assert.equal(destination, "/sign-in?error=auth_not_configured");
});

test("provider cancellation and missing code fail without creating a session", async () => {
  let called = false;
  const exchange = async () => { called = true; return { error: null }; };
  assert.equal(await resolveOAuthCallback("https://app.test/auth/callback?error=access_denied", true, exchange), "/sign-in?error=oauth_callback_failed");
  assert.equal(await resolveOAuthCallback("https://app.test/auth/callback?next=%2Fchat", true, exchange), "/sign-in?error=oauth_callback_failed");
  assert.equal(called, false);
});

test("callback exchange failures and thrown errors return a safe sign-in error", async () => {
  const rejected = await resolveOAuthCallback("https://app.test/auth/callback?code=x", true, async () => ({ error: new Error("provider details") }));
  const thrown = await resolveOAuthCallback("https://app.test/auth/callback?code=x", true, async () => { throw new Error("secret details"); });
  assert.equal(rejected, "/sign-in?error=oauth_callback_failed");
  assert.equal(thrown, "/sign-in?error=oauth_callback_failed");
});


test("verified session lookup returns only the identity supplied by Supabase getUser", async () => {
  const { resolveVerifiedSession } = await import("@/lib/server/auth-session");
  const result = await resolveVerifiedSession(async () => ({ data: { user: { id: "google-subject-123", email: "person@example.test" } }, error: null }));
  assert.deepEqual(result, {
    status: 200,
    body: { authenticated: true, user: { id: "google-subject-123", email: "person@example.test" } },
  });
});

test("missing or invalid session is never represented as authenticated", async () => {
  const { resolveVerifiedSession } = await import("@/lib/server/auth-session");
  const missing = await resolveVerifiedSession(async () => ({ data: { user: null }, error: null }));
  const rejected = await resolveVerifiedSession(async () => ({ data: { user: null }, error: new Error("invalid session") }));
  assert.deepEqual(missing, { status: 200, body: { authenticated: false } });
  assert.deepEqual(rejected, { status: 200, body: { authenticated: false } });
});

test("session lookup exceptions are reported as unavailable, not authenticated", async () => {
  const { resolveVerifiedSession } = await import("@/lib/server/auth-session");
  const result = await resolveVerifiedSession(async () => { throw new Error("network unavailable"); });
  assert.deepEqual(result, { status: 503, body: { error: "auth_unavailable" } });
});
