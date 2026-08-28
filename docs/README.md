# Durable project knowledge

This directory is the durable project context. Keep product facts, observable
flow behavior, architecture boundaries, accepted decisions, and recovery
runbooks here. Chat history is not the source of truth.

Chat history is not the source of truth. A decision becomes durable only after it
is reviewed and written here. The previous documents remain recoverable through
Git history but are not active guidance in this workspace.

## Active documents

- [`architecture/agent-harness.md`](architecture/agent-harness.md) — accepted
  harness design, constraints, failure behavior, and acceptance criteria.
- [`decisions/0001-hybrid-agent-harness.md`](decisions/0001-hybrid-agent-harness.md)
  — decision to use the hybrid control-plane architecture.
- [`product/product-model.md`](product/product-model.md) — positioning, ICP,
  JTBD, wedge, and validation target.
- [`product/mvp-boundaries.md`](product/mvp-boundaries.md) — explicit MVP
  non-goals.
- [`specs/core-flow.md`](specs/core-flow.md) — initial observable preparation
  flow.
- [`architecture/current-system.md`](architecture/current-system.md) — current
  application boundaries.
- [`operations/harness-recovery.md`](operations/harness-recovery.md) — CodeGraph
  and harness recovery procedure.
- [`operations/harness-guide.md`](operations/harness-guide.md) — practical
  task-writing, contract, evidence, skills, and recovery guide.
