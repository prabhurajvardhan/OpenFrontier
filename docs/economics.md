# Dynamic margin protection

**Status: Proposed model; not a guaranteed margin.** The founder target is approximately 30% of ad revenue allocated to worst-case inference cost and approximately 70% gross margin before other operating expenses. The design must reduce or deny rewards when the modeled cost budget cannot support them.

## Formula

For an ad event, let `R` be expected net ad revenue in USD after invalid/fraud adjustment, `c` be the inference-cost allocation fraction (target 0.30), and `B = R × c` be the maximum inference-cost budget. Let `p_in` and `p_out` be the selected model's USD price per million input/output tokens. A worst-case reward cap is:

`max_input_tokens = floor((B - reserved_output_tokens × p_out / 1,000,000) × 1,000,000 / p_in)`

The system should reserve against the larger of expected and policy-defined worst-case usage, and it should apply safety factors for payout uncertainty, currency conversion, provider price changes, fraud, and reconciliation error. Rewards are denominated in actual token units only after a versioned policy converts revenue budget into the chosen model/token unit.

## Illustrative scenarios

These numbers are examples for design testing, not vendor quotes or forecasts.

| Scenario | Net ad revenue/event | 30% cost budget | Assumed usage | Inference cost | Implied gross margin before other opex |
| --- | ---: | ---: | ---: | ---: | ---: |
| Low payout | $0.002 | $0.0006 | 15k input + 3k output | $0.0027 | -35.0% |
| Mid payout | $0.005 | $0.0015 | 15k input + 3k output | $0.0027 | 46.0% |
| High payout | $0.010 | $0.0030 | 15k input + 3k output | $0.0027 | 73.0% |

The assumed prices are `$0.10/M input` and `$0.40/M output`, matching the founder's indicative range for this illustration. The low and mid cases fail the 70% target because a reward's cost budget is too small. The system must therefore reduce the reward, require a lower-cost model/context, cap output, or withhold the reward rather than promise a fixed token amount.

At the mid payout, the maximum cost-supported usage at the target 30% allocation is roughly 15,000 input tokens with no output cost, or fewer when output is reserved. At the high payout, the example workload fits the 30% budget with a small safety margin. A production policy should use lower effective budgets after fraud, fill, payout, and FX uncertainty.

## Dynamic inputs

The policy engine should use region and network payout evidence, net rather than gross revenue, currency conversion at a recorded rate, model-specific prices, provider price-version dates, invalid-impression rates, chargebacks or clawbacks, maximum reward frequency, account/session limits, and a safety factor. If payout is estimated or unavailable, use a conservative policy tier and reconcile later; never claim guaranteed 70% margin.

## Controls

Each reward policy is versioned and effective-dated. It defines maximum token reward, maximum cost per verified event, per-account and per-session daily caps, model eligibility, safety factor, and behavior when revenue is unknown. A circuit breaker pauses or reduces rewards when realized cost/revenue ratios, fraud rates, provider prices, or reconciliation variance exceed thresholds. Founder approval is required for thresholds and the loss budget.
