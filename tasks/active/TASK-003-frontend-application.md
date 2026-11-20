# TASK-003 — Open Frontier frontend application

- **Status:** In progress
- **Assignee:** Frontend Developer (Manus)
- **Created:** 2026-11-20
- **Updated:** 2026-11-20
- **Dependencies:** TASK-001 and TASK-002; current architecture/API proposals remain unapproved. This task authorizes bounded, non-production frontend scaffolding only.

## Objective

Deliver a responsive Open Frontier frontend prototype that follows the Nanoware AI visual identity, provides all requested primary screens, and is ready for later backend integration without claiming unimplemented services work.

## Context and requirements

- Inspect existing repository, `AGENTS.md`, architecture, database, API, and security documents before implementation; preserve existing project knowledge and avoid unnecessary replacement.
- Use https://nanowareai.in/ as a style reference. Use light surfaces, navy `#0F172A`, and gold `#CD9F4E`; keep the design premium and minimal. Avoid neon gradients, generic AI dashboard styling, and unnecessary dark UI.
- Build mobile-first responsive layouts for desktop, tablet, and mobile with reusable components, consistent typography/spacing, and accessible interactions.
- Develop the UI independently with mock data; do not wait for backend APIs. Keep mock data and real API interfaces/adapters separate.
- The chat is the primary interface. Model selection must be simple and accessible. Display token use transparently.
- Design loading, empty, error, disabled, pending, success, and verification states. Do not imply mock or unavailable functionality is live.
- Follow future backend API contracts, do not access the database directly, and never place API secrets/service-role credentials in the frontend.
- Keep unresolved architectural/API choices labeled Proposed; do not change their approval status.
- Keep commits focused, provide milestone reports, and create a separate pull request. Do not merge it.

## Scope

- Landing page: product introduction, core benefits, how it works, model-intelligence positioning, reward-supported access explanation, and “By Nanoware AI” branding.
- Authentication UI: sign in, sign up, Google authentication presentation, email-verification states, and guest/demo entry only as a clearly labeled non-production preview.
- Chat: new conversation, conversation history, explicitly labeled simulated streaming, model selector, composer, safe Markdown/code display, copy, regenerate, loading/error states, and responsive sidebar.
- Wallet/rewards: sample token balance, usage and transaction history, rewarded-ad presentation, and explicit pending/unavailable status; no client-side grant or claim of real balance.
- Account/settings: sample profile, account controls, privacy settings, and usage information.
- Typed frontend API interfaces, isolated mock adapter/data, setup documentation, verification, screenshots or preview link where available, and task handover.

## Out of scope

- Backend/API implementation, database/schema/migrations, real identity providers, production model inference, real advertising or rewards, payments, and production accounting.
- Changing or approving the proposed architecture or API contracts.
- Storing credentials, exposing secrets, or writing to shared/production data.
- Merging the pull request or implementing additional backend work.

## Files/components involved

- Application routes/components/styles and package/tooling at the repository root, preserving all existing documentation.
- `docs/architecture/` and `docs/api/` only as needed to record the implemented frontend boundary without promoting proposals to Accepted.
- `tasks/active/TASK-003-frontend-application.md`, `tasks/completed/TASK-003-frontend-application.md`, and a dated `handovers/` entry.

## Acceptance criteria

- [ ] A working responsive frontend provides the landing page, authentication, chat, wallet/rewards, and account/settings screens.
- [ ] Reusable UI components and a consistent design system use Nanoware-inspired light surfaces, `#0F172A` navy, and `#CD9F4E` gold; the chat remains the primary app interface.
- [ ] Chat includes conversation history, new conversation, model selection, composer, Markdown/code rendering, copy/regenerate controls, and loading/error presentation.
- [ ] Mock data and typed API contracts are separate; mock-only, simulated, pending, and unavailable behavior is visibly identified and is never presented as a live integration or actual token/reward grant.
- [ ] Wallet and chat usage are transparent, sample balances/transactions are labeled as examples, and no client control can claim or finalize a real balance/reward.
- [ ] Accessible interactions and mobile/tablet/desktop layouts are provided, with meaningful empty, loading, error, disabled, verification, and success/pending states.
- [ ] No backend/database implementation, secret, or service-role credential is added; architecture/API proposal statuses remain unchanged.
- [ ] Setup documentation, task status, architecture/API documentation as needed, and a handover accurately reflect implementation and open integration work.
- [ ] Applicable build, type-check, and lint checks pass, and the change is committed and pushed on `feat/frontend-application` with a separate unmerged PR.

## Testing requirements

- Run the project's install/build, type-check, and lint commands where configured.
- Inspect key mobile/tablet/desktop UI states and verify no UI labels mock behavior as live.
- Review `git diff` for unrelated changes, secrets, backend/database changes, and inaccurate status labels.

## Expected deliverables

- Working responsive frontend, reusable component system, primary screens, typed API interfaces, separate mock data/adapter, loading/error/verification states, setup documentation, build/type-check results, committed feature branch, separate PR, and repository handover.

## Progress / blockers

Repository onboarding complete. Existing repository contains documentation only, the requested feature branch did not exist, and the proposed architecture/API contracts are not approved or implemented. A bounded, mock-driven frontend scaffold is authorized by this task; real integrations remain out of scope.
