# Frontend preview setup

## Requirements

Use Node.js 22 or newer and npm. This repository contains a bounded, UI-only frontend preview. The recommended application stack in `docs/decisions/ADR-0002-launch-technology.md` remains **Proposed**; this scaffold does not approve the production architecture.

## Run locally

```bash
npm ci
npm run dev
```

## Nanoware Account authentication

Open Frontier uses Nanoware's existing Firebase Authentication project and its existing Google provider as the identity authority. Supabase remains the existing database. Copy `.env.example` to `.env.local` and set the Firebase Web App values and exact Firebase Project ID from that existing project, plus the existing Open Frontier Supabase URL and anon/publishable key. Do not create another Firebase project or Google OAuth client. Never place service-role keys, Firebase Admin private keys, or OAuth secrets in browser variables or commit them.

In the existing Firebase project, confirm Google is enabled under Authentication → Sign-in method and allow the actual local/Preview domains. In the existing Supabase project's Authentication → Third-Party Auth settings, register Firebase with the exact Nanoware Project ID. Ensure the existing and newly authorized Firebase users have the `role: "authenticated"` custom claim, preserving any other claims. Supabase uses the current Firebase ID token through its supported `accessToken` callback.

For Vercel, set the public Firebase Web App config, exact Firebase Project ID, and existing Supabase public settings on the Preview environment. Add the exact Preview hostname to Firebase Authentication's authorized domains. Exact owner-controlled steps, required claim guidance, verification limits, and schema blockers are documented in [`docs/security/nanoware-firebase-auth.md`](docs/security/nanoware-firebase-auth.md).

Open the local URL printed by Next.js. The landing page is `/`, the primary chat preview is `/chat`, sign-in preview is `/sign-in`, the wallet/rewards preview is `/wallet`, and account settings are at `/settings`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run lint` uses the ESLint flat configuration. The checked-in lockfile pins the dependency tree for reproducible installs.

## Preview limitations

The interface otherwise uses static sample data and an isolated local mock adapter. Chat responses are deterministic sample text presented with an explicitly simulated stream. The sample account, balance, ledger, model names, token usage, and ad/reward states are not live services and do not represent a real account, inference request, token deduction, ad impression, or reward grant. Firebase sign-in is implemented but not live-verified because the owner-controlled Nanoware Project ID/configuration and Supabase third-party settings are unavailable here. Profile and wallet provisioning are blocked because the repository has no executable database schema or migration; do not infer table names from the proposed data model. Email/password sign-in, payments, ads, and model-provider functions remain preview-only. Do not add credentials to browser code. Future API types in `lib/api/types.ts` are a proposed frontend boundary; the adapter in `lib/api/mock-api.ts` is sample-only.
