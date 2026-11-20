# Security

**Status: Proposed baseline.** There is no implementation to verify yet.

## Security objectives

- Keep authentication and authorization server-controlled.
- Make token accounting tamper-resistant, idempotent, auditable, and reconcilable.
- Prevent clients from minting, replaying, transferring, or double-spending inference tokens.
- Verify rewarded-ad completion using trusted provider evidence and replay protection.
- Apply rate limits, bot/fraud detection, model/provider spend controls, and abuse response.
- Minimize collection of personal data and define retention/deletion rules before launch.
- Protect provider credentials and operational secrets; never commit them.

## Threats requiring design work

Account takeover, session theft, reward replay, device/account farming, forged callbacks, race-condition double spend, provider retry duplication, prompt/content abuse, denial of service, data leakage, insider misuse, and unbounded inference spend.

## Required security decisions before implementation

Authentication/session design, authorization model, token ledger invariants, ad verification trust model, key/secrets management, privacy and retention, incident response, audit access, rate limits, and deployment/network boundaries are **awaiting founder/technical approval**. Each accepted choice belongs in an ADR and in the relevant API/database/architecture page.
