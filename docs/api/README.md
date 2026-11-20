# API contracts

**Status: Proposed.** No API is implemented and no transport, framework, or versioning scheme is selected.

Future contracts should cover authentication/session lifecycle, conversations, model selection, token balance/history, rewarded-ad verification, usage/settlement, and administrative/support operations.

Every contract should specify authentication, authorization, request/response shapes, units, errors, idempotency, pagination, rate limits, privacy classification, and compatibility policy. Keep provider-specific details behind an internal boundary where possible.

Use [`endpoint-template.md`](endpoint-template.md) for new endpoint proposals. Link accepted contract decisions to ADRs.
