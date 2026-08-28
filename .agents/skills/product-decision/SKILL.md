---
name: product-decision
description: Use for PeakTalk product behavior, positioning, pricing, onboarding, roadmap, or other choices that change the user outcome. Produce an explicit decision brief and durable record before implementation.
---

# Product Decision

Use this skill when the task changes what PeakTalk promises, who it serves, how a user completes the core job, or how the product is priced or positioned.

## Process

1. Read only the relevant files under `docs/product/` and `docs/specs/`. Treat repository facts as authoritative and label assumptions.
2. State the problem, affected user, desired outcome, constraints, and non-goals. Do not smuggle a solution into the problem statement.
3. Compare two or three realistic options, including trade-offs, failure modes, validation cost, and what each option deliberately leaves out.
4. Recommend one option with a falsifiable success signal. For the initial wedge, prefer a narrow professional outcome over generic coaching or gamification.
5. Stop at the decision gate until the user approves the choice. Write the accepted decision under `docs/decisions/` before implementation.
6. Convert the decision into observable acceptance criteria and route implementation through `controlled-development` when code changes are required.

Never invent customer evidence, market claims, metrics, or product facts. A durable decision is not complete until the decision file exists and the task contract records its path.
