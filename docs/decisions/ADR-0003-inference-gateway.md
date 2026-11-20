# ADR-0003: Proposed OpenRouter-first inference gateway

- **Status:** Proposed; founder approval required
- **Date:** 2026-11-20
- **Decision owners/approvers:** Founder and Tech Lead
- **Related task:** TASK-002

## Context

Open Frontier wants one unified server-side gateway credential, broad model access, predictable usage accounting, streaming, failover, and operational simplicity. Vercel AI Gateway and OpenRouter both provide compatible interfaces but differ in catalogs, routing, billing, and operational controls.

## Decision

Recommend OpenRouter for the initial technical spike and possible launch, behind an application-owned gateway adapter and one server-side `OPENROUTER_API_KEY`. Keep gateway base URL, credential, model namespace, provider options, fallback, usage extraction, and error mapping configurable so Vercel AI Gateway can replace it without rewriting product code.

OpenRouter is recommended for explicitly documented model/provider breadth and routing controls. Vercel AI Gateway is the strongest alternative for Vercel-native logs, budgets, BYOK, zero token markup, and Vercel integration. Do not dual-route production merely to claim a unified key; two gateways require separate credentials and billing semantics.

## Consequences and risks

OpenRouter's reviewed pricing documents a 5.5% Standard or 8% Business platform fee on credit purchases, while Vercel documents no token markup/platform fee but has its own prepaid-credit/payment terms. Failure billing, data residency, retention/training, SLA, and exact model intersection require a workload-specific bake-off and commercial confirmation.

## Evidence

- https://openrouter.ai/pricing
- https://openrouter.ai/docs/faq
- https://openrouter.ai/docs/guides/routing/provider-selection
- https://openrouter.ai/docs/api_reference/authentication
- https://vercel.com/docs/ai-gateway
- https://vercel.com/docs/ai-gateway/pricing
- https://vercel.com/docs/ai-gateway/models-and-providers/provider-options
