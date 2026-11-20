# ADR-0004: Proposed two-tier access and layered abuse controls

- **Status:** Proposed; founder/legal/security approval required
- **Date:** 2026-11-20
- **Decision owners/approvers:** Founder, Tech Lead, legal/security reviewer
- **Related task:** TASK-002

## Context

Open Frontier's free model and rewarded tokens create incentives for account farming, reward replay, concurrent spend, and provider-cost abuse. Google OAuth alone does not establish benign behavior, and browser fingerprinting is not reliable authentication.

## Decision

Recommend constrained low-cost guest sessions plus Google OIDC for durable identity. Use Google `sub` as the account key, validate state/nonce and ID-token claims, then issue an application-owned Secure/HttpOnly/SameSite session with expiry and revocation. Apply independent limits by session, account subject, IP, endpoint, and where justified ASN/region. Add payload, execution-time, concurrent-job, account-creation, ad-show, and provider-spend controls with graduated responses.

Fingerprinting and reCAPTCHA may be privacy-reviewed risk signals, never sole authentication or authorization. Durable state, exports, high-cost models, sharing, and privileged actions require the authenticated tier.

## Evidence

- https://developers.google.com/identity/openid-connect/openid-connect
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://pages.nist.gov/800-63-4/sp800-63b.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html
- https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/
