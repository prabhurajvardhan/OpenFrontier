# TASK-002.1-S2 — Inference adapter and streaming contract spike

- **Status:** Blocked by founder decisions
- **Assignee:** Unassigned developer
- **Created:** 2026-11-20
- **Updated:** 2026-11-20
- **Dependencies:** B0 gateway/models/spend/limits decision; S1 server boundary

## Objective

Validate one selected inference gateway behind an internal adapter for streaming, usage, errors, timeouts, and model allowlisting.

## Deliverable

A stubbed or sandbox adapter, normalized contract tests, redacted fixtures, and a findings note on usage semantics, fallback, failure billing, data terms, and limits.

## Scope

Server-only credential use, model/provider normalization, streaming events, terminal usage, error mapping, timeout/interruption states, and request idempotency.

## Out of scope

Production routing, multiple gateways, real credentials in the repository, frontend chat UI, and unapproved fallback behavior.

## Acceptance criteria

- [ ] Browser code never receives gateway credentials.
- [ ] Provider IDs and errors normalize behind the adapter.
- [ ] Terminal usage and uncertain settlement states are representable.
- [ ] Unsupported models/options are rejected.

## Verification

Test streaming success, provider error/timeout, interrupted stream, malformed usage, duplicate requests, redaction, and secret-leak failure cases.
