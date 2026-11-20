# System overview

**Status: Proposed.** No application code or technology stack exists in the repository as of the initial RKS commit.

## Product boundary

Open Frontier is intended to provide a global AI chat experience. The future system will need to coordinate:

1. a client experience for conversations and account/token visibility;
2. an application/API boundary for authenticated requests;
3. model-provider integrations for inference;
4. server-authoritative token accounting and settlement;
5. rewarded-ad verification and reward issuance;
6. abuse prevention, rate limiting, and safety controls; and
7. operational observability and support workflows.

These are capability boundaries, not commitments to services, languages, vendors, deployment topology, or storage technologies.

## High-level flow

```text
User client
   | authenticated request
   v
Application/API boundary
   |-- conversation and policy checks
   |-- token availability/reservation
   |-- model-provider request
   |-- usage settlement
   |-- audit/observability events
   |
   |<-- verified rewarded-ad event -- advertising integration
   |
   +--> server-authoritative account/token records
```

The exact transaction boundaries, retry behavior, idempotency keys, and consistency model are **awaiting founder/technical approval** and must be recorded in ADRs before implementation.

## Explicit non-decisions

The repository does not yet select a frontend framework, backend language, database, hosting provider, model vendors, ad network, authentication provider, queue, cache, analytics platform, or deployment model. Agents must not treat examples in this document as selected technologies.

## Open questions

- Which geographies, age requirements, and regulatory obligations are in scope for launch?
- What is the identity and account-recovery model?
- Which models and providers are eligible, and how are model costs represented in token units?
- How are token grants, reservations, debits, expirations, refunds, and corrections modeled?
- What ad events are trusted, and how is duplicate/fraudulent reward issuance prevented?
- What are the launch SLOs, retention requirements, and support/admin controls?
