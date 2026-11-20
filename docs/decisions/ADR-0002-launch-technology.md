# ADR-0002: Proposed simplest viable launch technology

- **Status:** Proposed; founder approval required
- **Date:** 2026-11-20
- **Decision owners/approvers:** Founder and Tech Lead
- **Related task:** TASK-002

## Context

Open Frontier needs streaming chat, secure accounting, rewarded ads, affiliate redirects, and optional payments without premature infrastructure. The repository has no implementation or selected stack.

## Decision

Recommend one Next.js App Router application with strict TypeScript, Vercel deployment, Vercel AI SDK 7 on Node.js 22+, Supabase PostgreSQL as the durable source of truth, and no Redis or worker fleet at launch. Add Upstash Redis only after a measured need for bounded distributed rate limiting, idempotency, cache, or ephemeral coordination. Keep provider integrations behind internal adapters.

## Alternatives considered

A separate backend and microservices add deployment and interface complexity before scale evidence. Redis as an authoritative wallet store is rejected because durable relational accounting and auditability belong in PostgreSQL. A queue/worker fleet is deferred until requests need durable resumability or exceed synchronous runtime constraints.

## Consequences

This is simpler to operate and review, but synchronous function duration, connection pooling, and serverless concurrency must be load-tested. A later extraction remains possible if boundaries are preserved.

## Evidence

- https://nextjs.org/docs/app/api-reference/config/typescript
- https://nextjs.org/docs/app/getting-started/deploying
- https://vercel.com/docs/ai-sdk
- https://vercel.com/docs/functions/limitations
- https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits
- https://upstash.com/docs/redis/overall/billing
