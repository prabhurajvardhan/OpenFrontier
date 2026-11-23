# TASK-001-CORRECTION — Nanoware Firebase identity

**Status: PARTIALLY_COMPLETED.** The application auth path is corrected to use Nanoware's existing Firebase Authentication as its sole identity authority while retaining Open Frontier's Supabase client/database. Firebase UID (`sub`) is the canonical identity. The implementation was committed and pushed to `origin/task/001-google-oauth` as `963204a6807c833643837fa753205b8372e609e4`; the remote SHA was verified to match. The task/handover status update is a follow-on documentation commit on the same branch. Work is isolated in `/home/ubuntu/OpenFrontier-task001` on `task/001-google-oauth`.

## Implemented in this correction

- Replaced Supabase-owned Google OAuth and cookie sessions with Firebase Google sign-in, Firebase session restoration/token refresh, logout, mobile redirect and desktop popup flows, cancellation/error handling, and the Nanoware account sign-in copy.
- Kept Supabase as the database client and configured it to request the current Firebase ID token. Server routes verify Firebase JWT signatures and required claims and use only the verified Firebase UID for identity and ownership. Client-provided IDs, emails, roles, and wallet ownership are not trusted.
- Removed obsolete Supabase OAuth callback/helpers and the development-session bootstrap that accepted client-provided user IDs.
- Added setup/security guidance in `docs/security/nanoware-firebase-auth.md`, refreshed related setup/API/security docs, and added generated-key unit tests for token validation and UID ownership.
- Replaced Firebase umbrella/Admin dependencies with the Web App/Auth modules and `jose`; no private credentials are included.

## Verification completed on the implementation tree

- `npm test` — passed, 9 tests.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` — passed.
- `npm audit` — passed, zero vulnerabilities reported.
- `git diff --check` — passed.

These are local unit/static/build checks. Generated-key token tests are not live Firebase/Supabase integration tests.

## Blockers and explicit non-claims

The exact existing Nanoware Firebase Project ID and Web App values are not available. They are deliberately not guessed. Consequently, live Firebase authentication, Supabase third-party registration, Vercel Preview configuration, and RLS behavior remain unverified.

Automatic profile/wallet provisioning is **not implemented**. The repository describes its data model as Proposed and contains no authoritative executable profile/wallet schema, migration, uniqueness constraint, or deployed RLS policy. Do not guess table/column names or create rows. To implement idempotent provisioning safely, obtain the actual deployed schema/migrations and safe non-production Supabase access. Use Firebase UID as the unique identity key, never merge by email, and preserve existing profile and wallet rows.

## Owner actions required

1. Supply the exact existing Nanoware Firebase Project ID and existing Firebase Web App configuration; do not create another project or OAuth client.
2. In the existing Firebase project, confirm Google is enabled and authorize the exact local and Vercel Preview hostnames.
3. In a trusted Nanoware server environment, ensure authorized existing and newly created users have `role: "authenticated"` while preserving other custom claims.
4. Register that exact Firebase project in the existing Supabase project's Third-Party Auth settings, configure the existing Open Frontier Supabase URL/key, and test existing RLS without weakening it.
5. Provide the actual profile/wallet schema and a safe non-production test environment before profile provisioning is implemented.
6. Run live non-production tests for sign-in/cancel, restoration, refresh, logout, claim rejection, cross-user isolation, and RLS; report these separately from unit tests.

The branch was pushed without merging or deploying. The unrelated dirty `/home/ubuntu/OpenFrontier` TASK-004 checkout was not touched.
