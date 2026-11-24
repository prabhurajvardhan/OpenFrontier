# Handover — PR #1 — Founder review corrections

- **Date:** 2026-11-20
- **Branch:** `docs/assignment-002-1-corrections`
- **Pull request:** [PR #1](https://github.com/prabhurajvardhan/OpenFrontier/pull/1)
- **Correction commit:** `4f49285`
- **Status:** Ready for founder review; do not merge without founder approval

## Corrections completed

The accounting model now separates temporary `reservation_holds` from the posted financial ledger. Posted balance is the sum of settled financial entries, held units are active holds, and available units equal posted balance minus active holds. Settlement closes the hold and posts exactly one usage debit; it does not create reservation or release ledger entries.

The accounting design now documents over-reservation handling, cached-token arithmetic, account/request lock order, account-scoped idempotency, multiple partial refunds, hold expiry/reconciliation, and complete provider usage recording without silently creating a negative balance.

The data model now describes `reservation_holds`, posted financial ledger contents, active-hold indexes, operation-level uniqueness, and overage reconciliation. The economics document now includes hypothetical India and Tier-1 RPM examples, the RPM/1,000 formula, callback-versus-settlement distinction, conservative unknown-payout handling, and safety-margin factors.

## Changed files

- `docs/database/token-accounting.md`
- `docs/database/data-model.md`
- `docs/economics.md`
- `tasks/backlog.md`
- This handover

## Verification

- Cached-token arithmetic checked programmatically: `1,000,000 + 100,000 + 400,000 = 1,500,000`; `ceil(1.5) = 2`.
- Regional examples checked programmatically: India midpoint `$2.75 RPM → $0.00275/ad → $0.000825` cost budget; Tier-1 midpoint `$25 RPM → $0.025/ad → $0.0075` cost budget.
- Cross-document markers reviewed for posted ledger, reservation holds, available/held formulas, overage reconciliation, refund uniqueness, and Proposed status.
- Markdown link validation and `git diff --check` are required before push.
- No application code, migrations, credentials, production integrations, or ADR approvals were created.

## Founder approval remains required

The wallet denomination, cached-token treatment, rounding, safety factor, uncertain-usage/overage policy, reward caps, regional revenue estimates, and all other Proposed decisions remain awaiting founder approval. PR #1 must not be merged automatically.

## Next action

Founder reviews PR #1. After approval, merge the documentation corrections and schedule the S4 wallet-accounting technical spike only after the wallet and overage decisions are recorded.
