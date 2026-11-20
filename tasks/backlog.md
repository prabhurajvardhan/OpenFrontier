# Initial implementation backlog

**Status: Proposed backlog; implementation is gated by founder approval.** This backlog converts the corrected architecture into small, independently verifiable work. It does not authorize production implementation.

## Recommended sequence

`B0 Founder decision packet` → accepted ADR updates → bounded spikes `S1–S4` → launch-slice selection → implementation tasks → integrated security, load, and reconciliation verification.

| ID | Workstream | Class | Depends on | Outcome |
| --- | --- | --- | --- | --- |
| B0 | Governance and launch scope | Ready | None; founder response | Dated decisions for topology, gateway, models, identity, economics, ads, affiliate, payments, privacy, and continuity. |
| S1 | Application foundation | Blocked by founder decisions | B0 topology/runtime/database | Non-production Next.js/TypeScript skeleton, server-only configuration boundary, health route, build and deployment smoke test. |
| S2 | Inference and streaming | Requires technical spike | B0 gateway/models/limits; S1 | Adapter contract tests for streaming, usage, timeout, errors, model allowlist, and uncertain settlement. |
| S3 | Identity and sessions | Requires technical spike | B0 access/privacy; S1 | Non-production Google OIDC and guest-session flow with revocation and abuse-control matrix. |
| S4 | Wallet and accounting | Requires technical spike | B0 denomination/pricing; S1; S2 usage semantics | Disposable PostgreSQL harness proving reservation, settlement, release, refund, reconciliation, and concurrency invariants. |
| S5 | Rewarded advertising | Blocked by founder decisions | B0 ad policy; S4; explicit GAM authorization | Server-verification and dynamic-reward spike with replay protection and pending reconciliation. |
| D1 | Affiliate `/out` | Deferred | B0 affiliate/legal scope; S1 | Provider pilot, safe redirect design, disclosure, attribution, and merchant/geography evidence. |
| D2 | Payments/top-ups | Deferred | B0 payment scope; S4; legal/compliance | Hosted checkout/webhook spike with idempotent top-up, refund, and dispute ledger mapping. |
| D3 | Operational readiness | Deferred | B0 continuity; S1–S4; selected monetization | Threat model, load/concurrency, backup/restore, outage runbook, reconciliation drill, and release gates. |

## Task cards

### B0 — Founder decision packet

**Objective:** Resolve or explicitly defer the ten decisions in `docs/decisions/founder-decisions.md` without inferring product, commercial, privacy, or operational scope. **Deliverable:** Dated decision matrix and ADR updates. **Acceptance:** every item is Accepted, Rejected, or remains Awaiting founder approval; no document claims acceptance without an approver. **Verification:** link check and review against all register entries.

### S1 — Minimal application and environment spike

**Objective:** Prove the approved single-application topology and server-only configuration boundary. **Dependencies:** B0. **Deliverable:** non-production skeleton, environment contract, health route, and smoke test. **Acceptance:** no secret is bundled client-side, no real credentials or user data are used, and no second backend/Redis/worker is introduced. **Verification:** build, typecheck, lint, bundle inspection, and missing-secret negative test.

### S2 — Inference adapter and streaming contract spike

**Objective:** Validate one selected gateway behind an internal adapter. **Dependencies:** B0 and S1. **Deliverable:** stubbed/sandbox adapter, fixtures, and findings note. **Acceptance:** provider IDs/errors normalize, usage and uncertain settlement states are representable, unsupported models are rejected, and browser code never sees the gateway key. **Verification:** streaming, timeout, interrupted stream, malformed usage, duplicate idempotency, redaction, and provider-error tests.

### S3 — Identity/session and abuse-control spike

**Objective:** Validate constrained guests, Google OIDC, application-owned sessions, and baseline limits. **Dependencies:** B0 and S1. **Deliverable:** non-production flow and abuse-control matrix. **Acceptance:** state/nonce/issuer/audience/signature/expiry/sub are checked; cookies are secure and revocable; client cannot select account identity; risk signals are not sole authentication. **Verification:** negative OIDC, expiry, revocation, ownership, rate, concurrency, payload, and redaction tests.

### S4 — Token ledger and settlement spike

**Objective:** Prove the corrected accounting design under concurrency and uncertain provider outcomes. **Dependencies:** B0, S1, S2. **Deliverable:** disposable PostgreSQL schema/procedures or test harness. **Acceptance:** the signed-ledger invariant nets reservation/debit/release to actual charge once; no negative available/held units; duplicate and conflicting idempotency are safe; pending holds remain unavailable; refunds are bounded. **Verification:** race, retry, interruption, timeout, duplicate callback, partial-refund, reconciliation, and deadlock-retry tests.

### S5 — Rewarded-ad verification and dynamic reward spike

**Objective:** Validate the proposed GAM-first server-verified reward path. **Dependencies:** B0, S4, explicit authorization. **Deliverable:** sandbox callback verifier, replay/idempotency handling, versioned reward policy, and evidence note. **Acceptance:** client completion is UX-only; only verified non-replayed callbacks credit; unknown payout cannot exceed policy; pending/reconciliation is explicit. **Verification:** invalid/stale/wrong-show/replay/duplicate/out-of-order/missing-payout tests.

### D1 — Affiliate `/out` pilot

**Class:** Deferred. **Objective:** validate provider, merchant coverage, safe redirect, disclosure, and net economics. **Dependencies:** B0, legal review, S1. **Verification:** URL fuzzing, allowlist, signed-token tamper/expiry, disclosure, attribution, and provider-report checks.

### D2 — Payment/top-up integration

**Class:** Deferred. **Objective:** validate approved provider and one-time top-up state machine. **Dependencies:** B0, S4, legal/compliance. **Verification:** raw-body signature, duplicate/out-of-order/amount-mismatch/partial-refund/dispute/retry tests.

### D3 — Operational readiness and adversarial verification

**Class:** Deferred. **Objective:** establish launch observability, reconciliation, restore, outage, and security gates after selecting the core slice. **Dependencies:** B0 and selected spikes. **Verification:** restore drill, load/concurrency, incident simulation, RLS/service-role, key-rotation, redirect, webhook, and log-redaction reviews.

## Explicitly deferred

Redis, durable workers, microservices, read replicas, search/vector retrieval, multi-region infrastructure, multiple gateways/networks, and active-active continuity are not current implementation commitments. Create tasks only when a measured requirement or accepted decision justifies them.

## Next recommended task

`B0` is the next task. It is ready because it produces a founder-reviewable decision packet without implementing anything. Once the founder decisions are recorded, `S1`, `S2`, `S3`, and `S4` can be scheduled according to their dependencies; S4 should not proceed with an unapproved wallet denomination or pricing policy.
