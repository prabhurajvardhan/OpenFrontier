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
