# Frontend preview setup

## Requirements

Use Node.js 22 or newer and npm. This repository contains a bounded, UI-only frontend preview. The recommended application stack in `docs/decisions/ADR-0002-launch-technology.md` remains **Proposed**; this scaffold does not approve the production architecture.

## Run locally

```bash
npm ci
npm run dev
```

## Google OAuth (Supabase)

Google sign-in uses Supabase Auth's PKCE flow. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the intended Supabase project. These are public project settings; do not put a service-role key or Google client secret in browser-visible environment variables.

In Google Cloud Console, create a Web OAuth client. Add the actual application origins (for local development, `http://localhost:3000`) as authorized JavaScript origins. Add the Supabase callback `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI. Enter the client ID and secret in **Supabase → Authentication → Providers → Google**.

In **Supabase → Authentication → URL Configuration**, set the Site URL to the actual app origin and allow exact callback URLs such as `http://localhost:3000/auth/callback` and the owner-configured app-origin `/auth/callback`. Do not use wildcard hosts. The application accepts only `/`, `/chat`, `/settings`, or `/wallet` as post-login destinations and defaults to `/chat`. Full setup and deployment-specific checks are in [`docs/security/google-oauth-setup.md`](docs/security/google-oauth-setup.md).

Open the local URL printed by Next.js. The landing page is `/`, the primary chat preview is `/chat`, sign-in preview is `/sign-in`, the wallet/rewards preview is `/wallet`, and account settings are at `/settings`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run lint` uses the ESLint flat configuration. The checked-in lockfile pins the dependency tree for reproducible installs.

## Preview limitations

The interface otherwise uses static sample data and an isolated local mock adapter. Chat responses are deterministic sample text presented with an explicitly simulated stream. The sample account, balance, ledger, model names, token usage, and ad/reward states are not live services and do not represent a real account, inference request, token deduction, ad impression, or reward grant. Google sign-in code now uses Supabase Auth when configured; it is not live-verified until the owner configures Google and Supabase dashboards and tests with real non-production credentials. Email/password sign-in and sign-up, profile and privacy controls, payments, ads, and model-provider functions remain preview-only. Do not add credentials to browser code. Future API types in `lib/api/types.ts` are a proposed frontend boundary based on repository documents, not a deployed or approved contract; the adapter in `lib/api/mock-api.ts` is sample-only.
