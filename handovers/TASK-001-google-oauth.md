# Handover — TASK-001-CORRECTION

As of 2026-11-23, the correction is **PARTIALLY_COMPLETED**. The implementation commit `963204a6807c833643837fa753205b8372e609e4` (`fix(auth): use Nanoware Firebase identity`) was pushed to `origin/task/001-google-oauth`; `git ls-remote` confirmed the remote SHA matched. The active task and this handover are included in a subsequent documentation-only commit on the same branch. No merge or deployment was performed. Work is isolated in `/home/ubuntu/OpenFrontier-task001` on `task/001-google-oauth`. The separate `/home/ubuntu/OpenFrontier` checkout is on a dirty TASK-004 branch; it was not staged or modified.

## Correction scope

Nanoware's existing Firebase Authentication is now the sole identity authority in the application auth path. Supabase remains the Open Frontier database/client. The verified Firebase UID (`sub`) is the canonical identity. The change replaces Supabase Google OAuth/cookie flows with Firebase Google popup/redirect sign-in, auth-state restoration, current ID-token retrieval/refresh, logout, cancellation/error states, and the required Nanoware account UI text. API authentication verifies Firebase JWT signatures and claims, then uses only the verified UID for ownership. The client does not get to choose IDs, emails, roles, or wallet ownership.

Key implementation files include `lib/firebase/client.ts`, `components/nanoware-auth.tsx`, `lib/server/firebase-id-token.ts`, `lib/server/auth-session.ts`, `lib/supabase/client.ts`, the auth/conversation/chat API routes, and `tests/firebase-id-token.test.ts` / `tests/services.test.ts`. Setup and limitations are documented in `docs/security/nanoware-firebase-auth.md`. The former Supabase OAuth callback/helpers and unsafe development-session bootstrap are removed.

## Verification completed

Final implementation-tree checks passed: `npm test` (9 tests), `npm run lint`, `npm run typecheck`, `NEXT_TELEMETRY_DISABLED=1 npm run build`, `npm audit` (zero vulnerabilities), and `git diff --check`. The unit tests use generated local RSA keys and mocks; these results do not establish live Firebase authentication, Supabase registration, database persistence, or RLS behavior.

## Blockers

The exact existing Nanoware Firebase Project ID and Web App values are unavailable; nothing has been guessed. No live Firebase sign-in or Supabase Firebase third-party/RLS integration test has been performed. The repo's `docs/database/README.md` and `docs/database/data-model.md` confirm that the physical schema is Proposed and not implemented. No profile/wallet provisioning was written: the actual table definitions, UID uniqueness rule, existing row mapping, wallet preservation semantics, and deployed RLS are unknown. Obtain the actual schema/migrations and safe non-production Supabase access before implementing idempotent provisioning. Never merge accounts by email.

The owner needs to supply the exact existing Firebase Project ID/Web App configuration, confirm the existing Google provider and authorized domains, ensure the `role: "authenticated"` custom claim is safely assigned while preserving other claims, register that Firebase project in the existing Supabase Third-Party Auth settings, provide Preview/local configuration, and provide real schema plus safe test access. Then run live tests separately from unit tests. The precise instructions and official references are in `docs/security/nanoware-firebase-auth.md`.

## Branch state

The implementation commit is pushed. The task and handover status updates are in the follow-on documentation commit on the same branch. The build-generated `next-env.d.ts` change was restored and is not part of the implementation commit. Do not merge or deploy.
