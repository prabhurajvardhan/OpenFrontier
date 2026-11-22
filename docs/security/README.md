# Security controls

**Status: Proposed baseline; security and founder approval required.** This page defines the minimum design posture before production approval. TASK-001 has implemented a limited Google OAuth path through Supabase Auth with PKCE callback exchange, verified `getUser()` session reads, and an internal redirect allowlist. That scoped implementation does not accept this proposed baseline wholesale or constitute a production security review.

## Identity and sessions

Use two access tiers. Guests receive a short-lived, server-generated session with low-cost, non-sensitive capabilities and no unrestricted durable state. Durable accounts use Google OpenID Connect. Validate state and nonce, verify ID-token signature, issuer, audience, and expiry locally using cached Google keys, and use the stable Google `sub` as the identity key. Do not use email as the primary identity key. If Workspace restriction is required, enforce the validated `hd` claim. The TASK-001 app flow delegates OAuth validation and session issuance to Supabase Auth; the Supabase project and actual provider configuration still require owner setup and live verification.

After login, issue an application-owned session with a hashed token, Secure, HttpOnly, SameSite cookie, preferably `__Host-` scoped, idle and absolute expiry, rotation on privilege change, and server-side revocation. Never treat browser fingerprints as authentication.

## Token and spend protection

All balance-affecting actions are server-side, transactional, idempotent, and append-only in the ledger. Reservations are bounded by model/context/output policy and account state. Enforce row locking or serializable transactions, unique request/event IDs, provider spend budgets, maximum concurrent requests, timeouts, and reconciliation alerts. Never use a saturating balance update that hides an accounting error.

## Rewarded-ad controls

Create the ad show server-side with a nonce and policy snapshot. Accept rewards only from the documented server callback/postback after authentication or signature verification, timestamp/expiry checks, provider and show association, replay detection, and fraud policy. Store raw callback evidence with restricted access and redact it from user-facing output. Client callbacks may update UX but cannot grant entitlement. Unknown payout data produces a pending/reconciliation state, not an invented guaranteed reward.

## Payments

Use provider-hosted checkout/order creation. Verify webhooks using the raw request body and provider signature/secret, acknowledge quickly after durable idempotent receipt, and tolerate at-least-once delivery and out-of-order events. Match provider event to merchant, intent, amount, currency, and account. Credit only after trusted success. Model refunds, disputes, and partial refunds as compensating ledger entries.

## Affiliate and redirect safety

Accept only normalized HTTPS destinations subject to host, path, encoding, and length policy. Prefer an allowlisted provider transformation or an unmodified safe destination. Never redirect to an arbitrary client-supplied URL without validation. Use short-lived signed redirect tokens, preserve disclosure, avoid personal data in tracking identifiers, and keep provider keys server-side. Record only the analytics needed for attribution and abuse review.

## Abuse prevention

Apply layered controls across edge, application, and business levels. Key limits independently by guest session, authenticated subject, IP, endpoint, and where justified ASN/region. Enforce token-bucket or sliding-window limits, payload and context limits, execution timeouts, maximum in-flight jobs, account creation velocity, ad-show frequency, provider spend ceilings, and global concurrency. Use graduated actions: allow, slow/queue, step-up, restrict, temporary block, review.

Risk signals such as reCAPTCHA or privacy-governed fingerprinting may inform the decision but are not sole authentication, authorization, or proof of fraud. Retain risk signals briefly, hash/truncate where appropriate, document purpose and consent, and provide an appeal path for material false positives.

## Secrets, data, and operations

Store gateway, OAuth, ad, affiliate, and payment secrets outside the repository. Use separate environments, rotation, least privilege, and access audit. Redact prompts, tokens, payment details, callback secrets, and identity claims from logs. Define data classification, retention, deletion, backups, restore tests, incident response, key compromise response, provider outage behavior, and support access before launch.

## Required security review gates

Before production: threat model the chat, reward, `/out`, and payment flows; test concurrent reservations and duplicate callbacks; verify RLS and service-role boundaries; load-test rate and concurrency controls; test secret rotation; perform redirect fuzzing; validate webhook signatures against raw bodies; run restore/reconciliation drills; and obtain founder/legal/security approval for identity, privacy, advertising, payments, regions, and data-provider terms.

## Evidence

The controls follow Google OIDC guidance, NIST session guidance, OWASP session and anti-automation guidance, and OWASP API resource-consumption guidance. Source links are recorded in [`../decisions/ADR-0004-identity-and-abuse.md`](../decisions/ADR-0004-identity-and-abuse.md).
