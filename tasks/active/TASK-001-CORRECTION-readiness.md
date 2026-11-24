# TASK-001-CORRECTION — Configuration and provisioning readiness

**Status: application auth path implemented; Firebase third-party provider registered; runtime configuration and data provisioning remain blocked.** This report records the continuation inspection on 2026-11-24. No database tables, migrations, wallet data, profiles, RLS policies, Firebase users, or deployments were changed.

## Firebase configuration readiness

The existing Nanoware Firebase Web App configuration was supplied by the owner. The confirmed project ID is `nanoware-ai`. No new Firebase project or Google OAuth client was created. No configuration values or API key were copied to source, committed, or installed in local or Vercel environment settings. The supplied Web API key was not repeated in this report.

The application expects these environment variables:

- Required: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Optional Firebase values: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.

All eight variables were unset in the current process. No local `.env.local` exists. The Vercel `open-frontier` project was inspected; its environment-variable list was empty. Consequently the app is not yet configured for a live runtime. The complete existing Firebase Web App values and existing OpenFrontier Supabase URL and anon/publishable key must be entered through owner-approved local ignored configuration and/or Vercel environment settings. Do not use a Supabase service-role key or Firebase Admin credential in browser-visible variables.

Google provider enablement and Firebase authorized domains were not independently confirmed. The Firebase custom `role: "authenticated"` claim for existing and new users is also unverified; no live token was tested.

## Supabase third-party auth

The existing OpenFrontier Supabase project was active and healthy. Its Third-Party Auth page initially showed no provider. With owner authorization, Firebase was registered using only the confirmed Firebase project ID. The dashboard confirmed “Successfully created a new Firebase Auth integration” and displayed the connection as enabled. No other provider settings were changed.

This completes provider registration, not end-to-end authentication validation. Supabase requires users' Firebase ID tokens to carry the `authenticated` role claim; that claim remains unverified. The existing application already passes Firebase ID tokens through the Supabase client's `accessToken` callback and verifies Firebase JWTs server-side, using verified Firebase UID as canonical identity. No live sign-in or Supabase data request was performed.

## Schema, profile/wallet provisioning, and RLS

The repository contains no migration files. Its existing database documentation describes the model as proposed rather than authoritative. The Supabase `public` schema contains no application tables; the inspected inventory consists only of 41 Supabase-managed tables in `auth`, `realtime`, `storage`, and `vault`. No authoritative profile or wallet table, constraints, application RLS policy, or data mapping could be identified.

Profile and wallet provisioning remains **not implemented and blocked**. Do not invent schema, rows, starting balances, or migrations. The required inputs are the authoritative deployed profile/wallet schema and migrations, the intended Firebase-UID uniqueness and relationship rules, existing-row preservation semantics, and a safe non-production environment for verification. Never merge accounts by email.

RLS and cross-user isolation are **not verified**. There are no application tables or applicable policies to test, and no test users were used. Existing policies were not modified. After the actual schema and safe test environment are provided, verify Firebase UID-scoped reads/writes and cross-user denial without weakening existing policy.

## Checks and branch

On `/home/ubuntu/OpenFrontier-task001`, branch `task/001-google-oauth`, the following checks passed: `npm test` (9/9), `npm run lint`, `npm run typecheck`, `NEXT_TELEMETRY_DISABLED=1 npm run build`, and `npm audit` (zero vulnerabilities). Unit tests use generated local RSA keys/mocks; they are not live Firebase, Supabase, provisioning, or RLS tests. The build-generated `next-env.d.ts` change was restored and `git diff --check` passed. No merge or deployment was performed.

The verified follow-up documentation commit and matching remote SHA will be recorded in the final handover after push.

## References

The implementation guidance cites official documentation in [`docs/security/nanoware-firebase-auth.md`](../../docs/security/nanoware-firebase-auth.md): Supabase Firebase third-party auth, Firebase ID-token verification, Firebase Web setup, Google sign-in, and custom claims.
