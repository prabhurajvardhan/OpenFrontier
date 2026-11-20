# Component: Open Frontier frontend preview

- **Status:** Implemented
- **Owner/task:** TASK-003
- **Purpose:** A responsive frontend prototype demonstrating the Open Frontier landing page and primary chat experience while backend architecture and contracts remain Proposed and unapproved. The implementation is a UI scaffold only; it does not constitute production access to chat, authentication, rewards, token balances, or storage.
- **Responsibilities:** Present landing and chat UI; show a clear preview notice; provide accessible local navigation and model-selector affordance; render sample conversations and a deterministic mock response; expose typed future API interfaces separately from the mock adapter.
- **Inputs/outputs:** Uses `lib/api/types.ts` as a proposed frontend contract boundary and `lib/api/mock-api.ts` as sample-only local data. No current network API call is made. User input is used only to exercise local UI state; it is not persisted to a server or sent to a provider.
- **Dependencies:** Next.js/React/TypeScript scaffold chosen for this authorized prototype, but ADR-0002 remains Proposed and founder approval is still required before treating this as the approved launch stack. API shapes are derived from `docs/api/proposed-contracts.md`, which remains Proposed and unimplemented.
- **Failure and retry behavior:** The mock stream produces deterministic sample content. The UI reports local preview errors and no provider request is made. Real timeout, retries, idempotency, settlement, and reconciliation behavior are not implemented.
- **Security/privacy considerations:** Do not display the sample balance, ledger, or mock result as real; do not add provider credentials, client-authoritative balance/reward logic, or direct database access. A real client must treat all balance-affecting events as server-authoritative and follow `docs/security/README.md` and `docs/database/token-accounting.md`.
- **Observability:** No production telemetry, audit logs, or server persistence. Preview-only status labels are visible in the interface.
- **Implementation location:** `app/`, `components/`, and `lib/api/`.
- **Related ADRs:** [ADR-0002](../decisions/ADR-0002-launch-technology.md) (Proposed); [ADR-0004](../decisions/ADR-0004-identity-and-abuse.md) (Proposed); [ADR-0005](../decisions/ADR-0005-monetization-integrations.md) (Proposed).
