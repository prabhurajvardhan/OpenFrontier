# Handover — TASK-001-CORRECTION

As of 2026-11-23, the correction is **PARTIALLY_COMPLETED**. The local implementation and documentation are ready for the requested branch commit/push. Work is isolated in `/home/ubuntu/OpenFrontier-task001` on `task/001-google-oauth`; it began at `b886fc42ddcff0917640aefb3ce42978b7d9b09c`, matching `origin/task/001-google-oauth`. The separate `/home/ubuntu/OpenFrontier` checkout is on a dirty TASK-004 branch; do not stage, commit, or push from it.

## Correction scope

Nanoware's existing Firebase Authentication is now the sole identity authority in the application auth path. Supabase remains the Open Frontier database/client. The verified Firebase UID (`sub`) is the canonical identity. The change replaces Supabase Google OAuth/cookie flows with Firebase Google popup/redirect sign-in, auth-state restoration, current ID-token retrieval/refresh, logout, cancellation/error states, and the required Nanoware account UI text. API authentication verifies Firebase JWT signatures and claims, then uses only the verified UID for ownership. The client does not get to choose IDs, emails, roles, or wallet ownership.

Key implementation files include `lib/firebase/client.ts`, `components/nanoware-auth.tsx`, `lib/server/firebase-id-token.ts`, `lib/server/auth-session.ts`, `lib/supabase/client.ts`, the auth/conversation/chat API routes, and `tests/firebase-id-token.test.ts` / `tests/services.test.ts`. Setup and limitations are documented in `docs/security/nanoware-firebase-auth.md`. The former Supabase OAuth callback/helpers and unsafe development-session bootstrap are removed.

## Verification completed

Final-tree checks passed: `npm test` (9 tests), `npm run lint`, `npm run typecheck`, `NEXT_TELEMETRY_DISABLED=1 npm run build`, `npm audit` (zero vulnerabilities), and `git diff --check`. The unit tests use generated local RSA keys and mocks; these results do not establish live Firebase authentication, Supabase registration, database persistence, or RLS behavior.

## Blockers

The exact existing Nanoware Firebase Project ID and Web App values are unavailable; nothing has been guessed. No live Firebase sign-in or Supabase Firebase third-party/RLS integration test has been performed. The repo's `docs/database/README.md` and `docs/database/data-model.md` confirm that the physical schema is Proposed and not implemented. No profile/wallet provisioning was written: the actual table definitions, UID uniqueness rule, existing row mapping, wallet preservation semantics, and deployed RLS are unknown. Obtain the actual schema/migrations and safe non-production Supabase access before implementing idempotent provisioning. Never merge accounts by email.

The owner needs to supply the exact existing Firebase Project ID/Web App configuration, confirm the existing Google provider and authorized domains, ensure the `role: "authenticated"` custom claim is safely assigned while preserving other claims, register that Firebase project in the existing Supabase Third-Party Auth settings, provide Preview/local configuration, and provide real schema plus safe test access. Then run live tests separately from unit tests. The precise instructions and official references are in `docs/security/nanoware-firebase-auth.md`.

## Git instructions

The correction and these status records are local and not yet committed or pushed. Restore the build-generated `next-env.d.ts` modification before staging; it was restored before the final verification but the production build can rewrite it. Stage only `/home/ubuntu/OpenFrontier-task001`, commit, push to `origin/task/001-google-oauth`, and verify the remote branch SHA. Do not merge or deploy. If GitHub credentials or push permissions fail, preserve the exact error and do not claim success.
