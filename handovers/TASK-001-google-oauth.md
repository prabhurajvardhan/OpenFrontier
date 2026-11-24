# Handover — TASK-001-CORRECTION

As of 2026-11-24, TASK-001-CORRECTION remains **PARTIALLY_COMPLETED**. The application auth implementation is already committed on `task/001-google-oauth`. During this continuation, the owner-authenticated Supabase dashboard showed no third-party provider; with the owner's authorization, the existing Firebase project was added to the existing OpenFrontier Supabase project. The dashboard confirmed the connection created and enabled. No database tables, migrations, rows, wallets, RLS policies, Firebase users, or deployments were modified. The readiness report is [`tasks/active/TASK-001-CORRECTION-readiness.md`](../tasks/active/TASK-001-CORRECTION-readiness.md).

## Existing implementation

Nanoware's existing Firebase Authentication is the sole identity authority in the application auth path. Supabase remains the OpenFrontier database/client. Verified Firebase UID (`sub`) is the canonical identity. The implementation uses Firebase Google popup/redirect sign-in, auth-state restoration, ID-token retrieval/refresh, logout, cancellation/error states, Firebase JWT signature/claim verification, and the Supabase JS `accessToken` callback. Request-body identity, emails, roles, and client-provided wallet ownership are not trusted. The implementation commit is `963204a6807c833643837fa753205b8372e609e4`; earlier task/handover commit is `62e80929e8072232342d2e38c13854eb4011c114`. A readiness documentation commit `0367e238ebd757e2ed0daca839c00a9bc434ba0c` was verified to match `origin/task/001-google-oauth` at the time of that push.

## Live configuration and blockers

The owner supplied the existing Firebase Web App settings; confirmed project ID is `nanoware-ai`. Values were not copied to source or Git. The expected variables are `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; optional Firebase variables are `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` and `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`. All eight were unset in this runtime, `.env.local` is absent, and the Vercel `open-frontier` environment-variable listing was empty. Runtime integration therefore remains unconfigured. Supabase URL and anon/publishable key also need to be added through the owner's approved configuration channel.

Google provider enablement, exact authorized Firebase hostnames, and `role: "authenticated"` custom claims have not been independently verified. Provider registration does not constitute a live sign-in or Data API test. No Firebase ID token was tested against the live Supabase project.

The repository contains no migration files and marks its model as proposed. The live Supabase `public` schema contains no application tables; the inspected 41-table inventory is Supabase-managed (`auth`, `realtime`, `storage`, `vault`). There is no authoritative profile/wallet schema, UID uniqueness/mapping, or application RLS policy to use. Provisioning remains unimplemented and blocked. Obtain actual schema/migrations, current row-preservation semantics, and safe non-production test access before any implementation. Never infer schema, create balances or records, or merge by email. RLS/cross-user isolation cannot be verified without application tables and test users; existing policies were not changed.

## Verification and branch state

The continuation checks passed: `npm test` (9 tests), `npm run lint`, `npm run typecheck`, `NEXT_TELEMETRY_DISABLED=1 npm run build`, `npm audit` (zero vulnerabilities), and `git diff --check`. Tests use generated local RSA keys and mocks; they do not prove live Firebase/Supabase integration, provisioning, or RLS. The branch was pushed only to `origin/task/001-google-oauth` and verified clean with the remote SHA above. Do not merge or deploy.

The separate `/home/ubuntu/OpenFrontier` checkout is on a dirty TASK-004 branch and must remain untouched.
