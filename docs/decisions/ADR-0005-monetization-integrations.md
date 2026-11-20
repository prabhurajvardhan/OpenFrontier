# ADR-0005: Proposed staged monetization integrations

- **Status:** Proposed; founder/legal/security approval required
- **Date:** 2026-11-20
- **Decision owners/approvers:** Founder, Tech Lead, legal/security reviewer
- **Related task:** TASK-002

## Decision

Run a Google Ad Manager rewarded-ad technical spike first. It is the only evaluated option whose reviewed first-party material covers rewarded inventory, client completion, server-side verification, impression-level revenue signals, reporting, and fallback behavior. Client callbacks are UX only; the publisher-owned ledger grants nothing without verified server evidence. Monetag may be a conditional Telegram Mini App adapter after testing its postbacks and estimated-price reconciliation. Prebid is treated as auction/analytics infrastructure, not an independently verified browser rewarded network. Adsterra remains discovery-only until its rewarded callback/signature/payout contract is confirmed.

For `/out`, pilot Skimlinks for web-first speed or choose Sovrn where deterministic server-side wrapping, affiliation checks, and transaction ingestion are more important. Neither provider is approved until merchant/geography coverage, redirect behavior, disclosures, attribution, reversals, and net economics are tested.

## Evidence gaps

GAM signature semantics and key rotation need direct confirmation. Monetag estimated price is not established as final settlement. Adsterra rewarded callbacks were not found in reviewed first-party material. Skimlinks disclosure wording and comparative payout economics remain unresolved.

## Evidence

- https://support.google.com/admanager/answer/9116812?hl=en
- https://support.google.com/admanager/answer/7386053?hl=en
- https://support.google.com/admanager/answer/13404416?hl=en
- https://docs.monetag.com/docs/postbacks/
- https://docs.prebid.org/dev-docs/integrate-with-the-prebid-analytics-api.html
- https://docs.adsterratools.com/public/v3/publishers-api
- https://developer.sovrn.com/reference/building-affiliate-links
- https://developer.sovrn.com/reference/get_reports-transactions
- https://developers.skimlinks.com/link.html
- https://developers.skimlinks.com/reporting.html
