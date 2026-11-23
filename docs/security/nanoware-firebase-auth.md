# Nanoware Firebase identity for Open Frontier

**Status: Implemented for the application auth path; owner configuration and live verification are pending.** Firebase is the sole identity authority. Open Frontier retains its existing Supabase project/database, and Firebase UID (`sub`) is the canonical user identity. No new Firebase project, Google OAuth client, or Firebase user migration is part of this change.

## Application configuration

Copy `.env.example` to `.env.local` for local work. Use the **existing Nanoware Firebase Web App configuration** from Firebase Console → Project settings → General → Your apps. The app requires these public values:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=<existing Firebase Web App apiKey>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<existing Firebase Web App authDomain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<exact existing Nanoware Project ID>
NEXT_PUBLIC_FIREBASE_APP_ID=<existing Firebase Web App appId>
NEXT_PUBLIC_SUPABASE_URL=<existing Open Frontier Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<existing Supabase anon/publishable key>
```

`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` and `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` are optional and should be copied only if present in the existing Web App configuration. These browser configuration values are not service-account credentials. Never set a service-role key, Firebase Admin private key, or OAuth client secret in a `NEXT_PUBLIC_*` variable or commit one to the repository. Firebase Web configuration values are provided by Firebase when registering or inspecting a Web App [3].

### Vercel Preview environment

In Vercel → the Open Frontier project → Settings → Environment Variables, add the variables above to the **Preview** environment. Populate `NEXT_PUBLIC_FIREBASE_PROJECT_ID` with the existing Nanoware project ID, not a guessed value. Populate the Supabase URL and anon/publishable key with the existing Open Frontier project values. Keep Development and Production values separately scoped as appropriate; do not copy secrets into Preview. Redeploy the Preview deployment after saving variables because Next.js embeds `NEXT_PUBLIC_*` settings into the browser build.

In the existing Firebase project, make sure the exact hostname(s) used by the Vercel Preview deployment are present in Firebase Authentication's authorized domains. The actual Preview hostname is not available in this repository, so the owner must select it from Vercel and add that exact host. For local development, use `localhost` as required by Firebase's Google sign-in setup [4]. Do not broaden the domain allowlist unnecessarily.

## Firebase Google provider and custom role

Use Firebase Console → Authentication → Sign-in method to confirm that the existing **Google** provider is enabled in Nanoware's existing project. This app calls Firebase's Google provider through the Firebase Web SDK; it does not create a separate Google OAuth client [4].

Supabase requires the Firebase ID token to contain `role: "authenticated"` so Postgres Data API requests use the `authenticated` role. Firebase's default ID token does not include this custom claim [1]. The owner must:

1. In a trusted server-side Firebase Admin environment already controlled by Nanoware, arrange for every existing Firebase user allowed into Open Frontier to receive the custom claim `role: "authenticated"`.
2. Ensure newly created Firebase users receive that claim before Open Frontier access is granted. If the existing implementation assigns the claim asynchronously after user creation, force-refresh/reissue the ID token after assignment before retrying.
3. Preserve any other existing custom claims. Firebase documents that `setCustomUserClaims` overwrites the user's existing custom-claims object, so read and merge existing claims before adding `role`; do not replace unrelated roles or claims [5].
4. Ask users to refresh or sign in again after the claim is assigned. The app force-refreshes after interactive sign-in and denies access when the claim is missing.

Do not put Admin SDK credentials in this repository, Vercel browser variables, or client code. The application server verifies ID-token signatures with Google's published Firebase signing certificates and does not need a service-account private key. Firebase specifies the `RS256` algorithm, signing-key ID, expiration, issued-at, project audience, project issuer, subject, and authentication-time checks for third-party JWT verification [2].

## Supabase third-party authentication

In the **existing Open Frontier Supabase project**, open Authentication → Third-Party Auth and add Firebase as a provider. Enter the exact Nanoware Firebase Project ID from the existing project's Firebase settings. Do not create another Supabase project or change the database. Supabase's supported browser client integration passes the current Firebase ID token through the `accessToken` callback and requires the `authenticated` custom claim [1]. This repository now uses that callback while disabling Supabase-owned browser session persistence; Firebase owns login persistence and refresh.

Keep all existing RLS enabled and unchanged. Do not add permissive policies or use a service-role key to work around authorization. Supabase Hosted checks that a Firebase project is registered; the Firebase project's issuer and audience must match the configured project [1]. The repository contains no executable Supabase schema, migrations, or deployed RLS policies, so this code change cannot verify existing policy behavior against a live database. The owner must test each existing table, view, storage bucket, and realtime resource against current RLS before enabling it with Firebase tokens. Do not claim RLS verification based on this repository alone.

## Identity and server authorization behavior

The browser signs in through Firebase `GoogleAuthProvider`, restores Firebase's local auth state, obtains Firebase ID tokens through the Firebase SDK, and signs out through Firebase. The Supabase JS client requests a current Firebase ID token through `accessToken`. API routes independently require a bearer token and verify signature, key ID, `RS256`, expiry, issued-at, project audience and issuer, subject, authentication time, and the `authenticated` role claim. The verified Firebase `sub` is the only API ownership key. Request-body user IDs, email addresses, roles, and wallet ownership are not used for authorization.

The signed-in email is returned only for display by the session endpoint; it is not a database identity key and must never be used to merge accounts. Requests with missing, malformed, expired, wrong-project, wrong-signature, or insufficient-claim tokens fail closed. Unit tests use generated local RSA keys; no live Firebase identity has been tested in this environment.

## Profile and wallet provisioning is blocked on the real schema

Automatic profile provisioning is **not implemented**. `docs/database/README.md` states that there is no database schema or persistence implementation, and `docs/database/data-model.md` labels its conceptual model Proposed. There is no authoritative profile/wallet table definition, migration, uniqueness constraint, trigger, or RLS policy in this branch. Creating table or column names from the conceptual model would guess project-specific details and could create duplicate or orphaned wallet records.

Before implementing idempotent provisioning, the owner must provide the actual deployed profile and wallet schema/migrations (including existing uniqueness constraints and ownership/RLS policies) and a non-production Supabase project or safe test data. The implementation must use Firebase UID as a unique identity key, never match on email, and preserve any existing profile and wallet row. Do not merge or rewrite existing accounts until the UID-to-row mapping is understood and verified. Until then, the app's existing API/store remains an in-memory preview and no Supabase profile or wallet records are created or changed.

## Owner verification checklist

1. Supply the exact existing Nanoware Firebase Project ID and Web App config; use them for local and Vercel Preview values.
2. Confirm Google is enabled on that same Firebase project and allow the exact local/Preview hostnames.
3. Assign or validate `role: "authenticated"` for existing and newly authorized users while preserving their other custom claims.
4. Register that exact Firebase Project ID as a third-party auth provider in the existing Supabase project.
5. Verify existing RLS policies with a Firebase user and confirm one user's rows cannot be accessed by another UID. Do not weaken policies to make tests pass.
6. Provide the actual profile/wallet schema and safe test access before requesting provisioning implementation.
7. Test sign-in, cancellation, session restoration, token refresh, sign-out, invalid/expired/wrong-project tokens, RLS, and ownership against the non-production Firebase/Supabase configuration. Record live checks separately from unit tests.

## References

[1]: https://supabase.com/docs/guides/auth/third-party/firebase-auth "Supabase Firebase Auth third-party integration"
[2]: https://firebase.google.com/docs/auth/admin/verify-id-tokens "Firebase ID token verification"
[3]: https://firebase.google.com/docs/web/setup "Add Firebase to a JavaScript project"
[4]: https://firebase.google.com/docs/auth/web/google-signin "Firebase Google sign-in for JavaScript"
[5]: https://firebase.google.com/docs/auth/admin/custom-claims "Firebase custom claims"
