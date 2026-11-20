# Handover — TASK-002 — Open Frontier system architecture and technical design

- **Date:** 2026-11-20
- **Agent:** Tech Lead
- **Task:** [TASK-002](../tasks/completed/TASK-002-system-architecture.md)
- **Status:** Completed

## Completed work

Created a founder-reviewable architecture without implementing the application. The design covers the single-application launch topology, trust boundaries, streaming chat, server-authoritative token accounting, rewarded ads, dynamic economics, affiliate `/out`, payments, identity, abuse prevention, database/RLS, API contracts, operational controls, and staged technology choices.

Research covered Vercel AI Gateway/OpenRouter, Next.js/TypeScript/Vercel AI SDK, Supabase/Upstash, Google OAuth/OIDC, OWASP/NIST controls, Google Ad Manager, Prebid, Monetag, Adsterra, Sovrn, Skimlinks, Razorpay, and Stripe using current first-party documentation. Recommendations remain Proposed.

## Changed files

- `docs/architecture/system-overview.md`
- `docs/architecture/data-flows.md`
- `docs/database/data-model.md`
- `docs/database/token-accounting.md`
- `docs/api/proposed-contracts.md`
- `docs/security/README.md`
- `docs/economics.md`
- `docs/decisions/ADR-0002-launch-technology.md`
- `docs/decisions/ADR-0003-inference-gateway.md`
- `docs/decisions/ADR-0004-identity-and-abuse.md`
- `docs/decisions/ADR-0005-monetization-integrations.md`
- `docs/decisions/founder-decisions.md`
- `tasks/completed/TASK-002-system-architecture.md`

## Decisions and recommendations

The recommended launch shape is one Next.js/Vercel application with Supabase PostgreSQL as the durable source of truth and no Redis or microservice fleet initially. OpenRouter is the proposed first gateway behind an adapter, with Vercel AI Gateway retained as an alternative. GAM is the proposed rewarded-ad spike, Skimlinks/Sovrn require a pilot decision, and Razorpay/Stripe depends on India-first versus global scope. Google OIDC plus constrained guests and layered abuse controls is proposed.

## Tests and checks

- Initial repository inspection — passed; existing RKS preserved.
- Research synthesis — completed with no failed tracks and first-party source URLs.
- Architecture diagrams — added as Mermaid source.
- Economics scenario arithmetic — reviewed against explicit formulas and assumptions.
- Implementation/migrations/integrations — intentionally not performed per assignment scope.

## Blockers and outstanding work

No blocker to architecture documentation. Founder, legal, privacy, and security approval is required for all major decisions listed in [`../docs/decisions/founder-decisions.md`](../docs/decisions/founder-decisions.md). Before implementation, recheck current provider pricing, catalog, regional eligibility, data terms, signature semantics, payout evidence, payment economics, and workload limits.

## Next steps

1. Founder reviews and resolves the approval register.
2. Tech Lead converts accepted decisions into bounded implementation tasks.
3. Run an authorized gateway, accounting, rewarded-ad, redirect, and payment technical spike before production integration.
4. Update ADR statuses only when approval and implementation evidence exist.
