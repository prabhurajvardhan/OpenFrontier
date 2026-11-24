# Founder approval register

**Status: Open decisions.** Recommendations in the architecture are not approvals. The founder should record an explicit decision, date, scope, and approver in an ADR before implementation begins.

1. Approve or reject the launch topology: one Next.js/Vercel application, Supabase as system of record, deferred Redis/workers, and the triggers for adding them.
2. Select the initial AI gateway and approve monthly spend ceiling, payment method, model/provider allowlist, fallback behavior, data terms, retention, residency, SLA, and migration policy.
3. Approve launch models/modalities, expected volume and concurrency, prompt/output limits, latency target, streaming/tool requirements, and maximum synchronous duration.
4. Approve whether guests exist, their exact capabilities/quotas, Google account requirements, account linking/recovery, supported regions, and acceptable false-positive/abuse-loss budget.
5. Approve token-unit conversion, reservation safety factor, model pricing policy, reward frequency/caps, reconciliation policy, and treatment of uncertain provider usage.
6. Approve rewarded-ad geography, eligible surfaces, GAM/other network strategy, callback verification standard, fraud budget, and whether unverified/estimated events can ever grant anything.
7. Approve affiliate launch scope and provider after testing merchant coverage, redirect behavior, disclosures, consent, ad blockers, attribution, reversals, and net economics.
8. Approve payment geography and provider: Razorpay for India-first, Stripe for global, both, or another route. Confirm denominations, fees, taxes/GST, KYC, settlement, refunds, disputes, and minimum viable top-up economics.
9. Approve privacy/data classification, conversation retention/deletion, audit retention, support access, third-party scripts, tracking identifiers, fingerprinting/reCAPTCHA posture, and incident response.
10. Approve availability and continuity requirements: backups, restore objectives, multi-region needs, durable background execution, provider outage behavior, and operational ownership.

Until these are resolved, implementation tasks may build only bounded spikes or non-production scaffolding explicitly authorized by the Tech Lead.

## Practical defaults for review

These are recommendations, not approvals. They are intended to make founder review concrete and prevent silent assumptions.

- **Topology:** start with one Next.js/Vercel application and Supabase PostgreSQL; defer Redis, workers, and microservices. This minimizes operational cost, but synchronous runtime and connection limits must be tested.
- **Inference:** run a gateway bake-off, with OpenRouter as the current candidate because of documented model/provider breadth, while retaining Vercel AI Gateway as the portability and Vercel-observability alternative. The consequence is one active gateway credential and an adapter, not dual production routing.
- **Wallet:** approve one integer spendable unit backed by priced model usage, with raw uncached input, cached input, cache-write input, and output retained as separate dimensions. The consequence is predictable user estimates and more explicit pricing configuration; it requires a rounding and conversion policy.
- **Accounting:** use an immutable signed ledger, account-then-request locking, account-scoped idempotency, pending reconciliation holds, and bounded compensating refunds. The consequence is safer correctness at the cost of more explicit states and operational reconciliation.
- **Access:** allow only constrained guests and require Google OIDC for durable/high-cost capabilities. The consequence is lower friction for exploration but stricter limits and identity gates for expensive features.
- **Rewards:** use server-verified GAM as the first technical spike, grant nothing from client callbacks, and make unknown payout events pending or conservatively capped. The consequence is lower fraud risk but less immediate reward certainty.
- **Affiliate:** pilot Skimlinks for web-first speed or Sovrn for server-side control; do not launch `/out` without disclosure, allowlists, and redirect tests. The consequence is a monetization dependency that should remain outside the first MVP unless economics justify it.
- **Payments:** defer micro-top-ups until free-access economics and accounting are proven; if required, choose Razorpay for India-first or Stripe for global scope after account-specific pricing/compliance review. The consequence is less early scope and fewer reconciliation paths.

Each default remains `Proposed` until the founder records an explicit decision in an ADR. A default is not permission to implement a production feature.
