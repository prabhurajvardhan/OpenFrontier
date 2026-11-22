# Google OAuth setup (TASK-001)

## Application configuration

Set these values in the application's local environment or deployment environment. They are public Supabase project configuration, not Google OAuth secrets:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase-publishable-or-anon-key>
```

The application uses Supabase Auth's PKCE flow through `@supabase/ssr`. Google client credentials belong only in the Supabase dashboard; do not add them to browser code or commit them. No project-specific URL or credentials were available during this implementation, so examples below contain placeholders and are not live configuration.

## Google Cloud Console

1. In Google Cloud Console, create or select an OAuth 2.0 Web application client and configure its consent screen as appropriate for the project.
2. Set an authorized JavaScript origin for each actual app origin used, for example `http://localhost:3000` for local development and the exact owner-controlled preview/production origins once known.
3. Add the Supabase provider callback as an authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. Use the actual project reference shown by Supabase; do not substitute the application's `/auth/callback` URL here.
4. Copy the Google client ID and client secret into the Supabase dashboard's Google provider settings over the dashboard's secure form. Never commit or place the client secret in `NEXT_PUBLIC_*` variables.

## Supabase dashboard

1. In **Authentication → Providers → Google**, enable Google and enter the Google client ID and secret.
2. In **Authentication → URL Configuration**, set the Site URL to the actual app origin. Add exact redirect URLs for each enabled environment, including `http://localhost:3000/auth/callback` for local use and the actual app-origin `/auth/callback` URL for each owner-configured preview or production host.
3. Do not add wildcard hosts or arbitrary redirect destinations. The application itself accepts only `/`, `/chat`, `/settings`, and `/wallet` after its same-origin callback; all other `next` values fall back to `/chat`.
4. Confirm provider/client configuration and allowed origins in the owner-controlled dashboards, then run a real sign-in and sign-out/session-refresh test with a non-production Google account.

The app code starts Google sign-in with `signInWithOAuth`, exchanges the PKCE authorization code server-side at `/auth/callback`, and uses the Supabase SSR cookie session. Provider cancellation, missing code, rejected exchanges, and unconfigured Supabase return a generic error state without trusting provider error text. The session endpoint uses `auth.getUser()` rather than trusting browser-supplied identity data.

## Verification boundary

Focused tests validate OAuth initiation arguments, the internal redirect allowlist, callback code-exchange decisions, and failure paths. Supabase/Google dashboard settings, real credentials, actual consent-screen behavior, and live OAuth were not available here and therefore are **not live-verified**.
