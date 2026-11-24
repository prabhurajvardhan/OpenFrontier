# TASK-001-CORRECTION — Nanoware Firebase identity

**Status: PARTIALLY_COMPLETED.** The application auth path is implemented with Nanoware's existing Firebase Authentication as the identity authority and Supabase as database client. Firebase UID (`sub`) is the canonical identity. On 2026-11-24, Firebase third-party auth was registered and confirmed enabled in the existing OpenFrontier Supabase project using the owner's confirmed project ID. No database or wallet changes were made. See [`TASK-001-CORRECTION readiness report`](TASK-001-CORRECTION-readiness.md) for exact findings.

## Implemented and verified

- Replaced Supabase-owned Google OAuth and cookie sessions with Firebase Google sign-in, Firebase session restoration/token refresh, logout, mobile redirect and desktop popup flows, cancellation/error handling, and Nanoware account sign-in copy.
- Kept Supabase as database client and configured it to request the current Firebase ID token. Server routes verify Firebase JWT signatures and required claims and use only verified Firebase UID for identity and ownership. Client-provided IDs, emails, roles, and wallet ownership are not trusted.
- Removed obsolete Supabase OAuth callback/helpers and development-session bootstrap that accepted client-provided user IDs.
- Added setup/security guidance and generated-key unit tests for token validation and UID ownership.
- Replaced Firebase umbrella/Admin dependencies with Web App/Auth modules and `jose`; no private credentials are included.
- Confirmed the Supabase dashboard now shows the Firebase third-party connection enabled for the existing Nanoware project.

## Current blockers and explicit non-claims

The complete expected environment-variable names are recorded in the readiness report. All eight Firebase/Supabase variables are unset in this runtime, no `.env.local` is present, and Vercel `open-frontier` has no environment variables. The existing Firebase Web App values must be added through an owner-approved secure configuration channel; no API key or config values were put in source or Git. The Supabase URL and anon/publishable key are also still missing from runtime configuration.

Firebase Google provider state, authorized hostnames, and `role: "authenticated"` custom claims were not independently verified. The Supabase registration alone does not prove end-to-end sign-in or data API access. No live user sign-in or data request was run.

The repository has no migration files and its database model documentation is proposed, not authoritative. The deployed Supabase `public` schema has no application tables; inspected tables are Supabase-managed only. Profile/wallet provisioning is not implemented. Do not invent table/column names, migrations, wallet balances, or records. Obtain the authoritative profile/wallet schema, UID uniqueness/mapping rules, existing-row semantics, and safe non-production test access before implementing provisioning. Never merge accounts by email.

RLS and cross-user isolation remain unverified: there are no application tables/policies to test and no test users were used. No policies or data were modified.

## Verification

- `npm test` — passed, 9 tests.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` — passed.
- `npm audit` — passed, zero vulnerabilities reported.
- `git diff --check` — rerun before the follow-up commit.

These are local unit/static/build checks. Generated-key token tests are not live Firebase/Supabase integration tests.

## Owner actions still required

1. Configure all required Firebase and Supabase public runtime variables through a secure local ignored file and/or Vercel environment settings. Do not commit them or use privileged credentials as browser variables.
2. Confirm Google is enabled in the existing Firebase project and authorize the exact local and Vercel Preview hostnames.
3. Verify trusted server-side assignment of `role: "authenticated"` for existing and new users while preserving other custom claims.
4. Provide the authoritative profile/wallet schema, mappings, RLS policies, and safe non-production test access.
5. After configuration/schema are available, run separate live tests for sign-in, claims, token refresh/logout, existing-record preservation, and cross-user RLS isolation.

The existing implementation and handover commits are on `task/001-google-oauth`. The current documentation continuation will be committed and pushed only to that branch. No merge or deployment is authorized or planned. The unrelated dirty `/home/ubuntu/OpenFrontier` TASK-004 checkout remains untouched.
