# TASK-002.1-S3 — Identity, sessions, and abuse-control spike

- **Status:** Blocked by founder decisions
- **Assignee:** Unassigned developer
- **Created:** 2026-11-20
- **Updated:** 2026-11-20
- **Dependencies:** B0 guest/privacy/region decision; S1 application boundary

## Objective

Validate constrained guest sessions, Google OIDC, application-owned sessions, and baseline layered abuse controls.

## Deliverable

A non-production flow with validated OIDC claims, hashed revocable sessions, guest expiry/limits, and an abuse-control matrix.

## Scope

State/nonce, issuer/audience/signature/expiry/sub validation, secure cookies, session rotation/revocation, guest limits, ownership checks, rate/concurrency/payload controls, and redacted risk signals.

## Out of scope

Production OAuth clients, durable user migrations, fingerprinting as identity, or automated blocking policy without approval.

## Acceptance criteria

- [ ] Client cannot select account identity.
- [ ] Sessions are Secure/HttpOnly/SameSite, expiring, and revocable.
- [ ] Risk signals are not sole authentication or authorization.
- [ ] Limits are independently keyed as approved.

## Verification

Test invalid OIDC claims, replay/nonce failure, session expiry/revocation, guest expiry, authorization ownership, rate/concurrency/payload limits, and log redaction.
