# Frontend preview setup

## Requirements

Use Node.js 22 or newer and npm. This repository currently contains a bounded UI-only preview. The recommended application stack in `docs/decisions/ADR-0002-launch-technology.md` is still Proposed, so this scaffold must not be treated as approval of the production architecture.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. The root route is the product landing page; `/chat` opens the primary chat preview. Wallet, authentication, and settings screens will be added as the frontend task progresses.

## Checks

```bash
npm run typecheck
npm run build
```

## Preview limitations

The user interface uses static sample data and a local mock adapter. The chat response is deterministic sample text. The sample account, balance, ledger, model names, and ad/reward states are not live services and do not represent a real account, inference request, token deduction, ad impression, or reward grant. No real authentication, database, backend API, payment, ad network, or model provider is connected. Do not add credentials to browser code. Future API types in `lib/api/types.ts` are proposals based on the current repository documents, not a deployed contract.
