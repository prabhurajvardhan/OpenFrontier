# Frontend preview setup

## Requirements

Use Node.js 22 or newer and npm. This repository contains a bounded, UI-only frontend preview. The recommended application stack in `docs/decisions/ADR-0002-launch-technology.md` remains **Proposed**; this scaffold does not approve the production architecture.

## Run locally

```bash
npm ci
npm run dev
```

Open the local URL printed by Next.js. The landing page is `/`, the primary chat preview is `/chat`, sign-in preview is `/sign-in`, the wallet/rewards preview is `/wallet`, and account settings are at `/settings`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run lint` uses the ESLint flat configuration. The checked-in lockfile pins the dependency tree for reproducible installs.

## Preview limitations

The interface uses static sample data and an isolated local mock adapter. Chat responses are deterministic sample text presented with an explicitly simulated stream. Expandable controls on the chat and wallet pages expose local loading/error/empty and reward-status fixtures for inspection; changing a fixture does not call a backend. The sample account, balance, ledger, model names, token usage, and ad/reward states are not live services and do not represent a real account, inference request, token deduction, ad impression, or reward grant. Sign-in and Google authentication are presentation-only. The sign-up route can display simulated pending and successful email-verification states, but creates no account and sends no email. Profile and privacy controls are local preview state. No real authentication, database, backend API, payment, ad network, or model provider is connected. Do not add credentials to browser code. Future API types in `lib/api/types.ts` are a proposed frontend boundary based on repository documents, not a deployed or approved contract; the adapter in `lib/api/mock-api.ts` is sample-only.
