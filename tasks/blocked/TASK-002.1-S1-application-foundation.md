# TASK-002.1-S1 — Minimal application and environment spike

- **Status:** Blocked by founder decisions
- **Assignee:** Unassigned developer
- **Created:** 2026-11-20
- **Updated:** 2026-11-20
- **Dependencies:** B0 topology/runtime/database decision

## Objective

Prove the approved single-application topology and server-only configuration boundary without starting product implementation.

## Deliverable

A non-production Next.js/TypeScript skeleton with a health route, environment contract, server/client boundary check, and build/deployment smoke test.

## Scope

Project setup, strict typing, server-only secret access, safe configuration validation, and a minimal health check.

## Out of scope

Real credentials, durable user data, provider integrations, migrations, Redis, worker fleets, and feature UI.

## Acceptance criteria

- [ ] Approved runtime builds and runs in a non-production environment.
- [ ] Secrets are not present in client bundles.
- [ ] Missing server configuration fails safely.
- [ ] No second backend, Redis, or worker is introduced without an accepted decision.

## Verification

Build, typecheck, lint, inspect the client bundle/config, and run a missing-secret negative test.
