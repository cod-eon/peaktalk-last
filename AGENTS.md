# PeakTalk agent dispatch

This file is a compact dispatcher. It is not a product encyclopedia and chat
history is not a source of truth.

## Working protocol

For non-trivial work, route the request through `.harness`:

```text
request → classification → minimal context → risk/decision gate
→ at most 3 skills → task contract → implementation → checks
→ durable decision/spec
```

Use `node .harness/bin/harness.mjs route "..."` or the `route_task` MCP tool.
Create a task contract for product behavior, multi-file changes, substantial UI,
architecture, auth, billing, storage, migrations, deploys, and other high-risk
work. Small isolated copy/CSS fixes may proceed without one when behavior does
not change. The lifecycle is `draft → awaiting-decision → ready → in-progress →
verifying → complete`.

## Authority and boundaries

- Current code and fresh command output are facts; label assumptions.
- `docs/product/` and `docs/specs/` define product behavior.
- `docs/decisions/` defines accepted product and costly architecture choices.
- `.harness/` defines routing, gates, skill policy, and completion evidence.
- A selected skill is process guidance, never authority over repository facts.
- Never invent missing product facts. Stop at an unresolved product or costly
  architecture gate and write the approved decision before implementation.
- Do not implement Storage or Auth migration until its own migration gate is
  explicitly opened. Storage and Auth are separate releases.

## Context and skills

Load the smallest context returned by the router. In indexed product code,
reach for CodeGraph first; if MCP fails, use the bounded CodeGraph CLI, then
`rg`. A CodeGraph outage must not block development. Select no more than three
skills: one relevant project skill, required trusted system guidance, and at
most one allowlisted AAS skill. AAS remains a cold catalog under
`.harness/vendor/`; never install the full catalog or execute its scripts.

## Completion

Completion requires every required decision gate to reference an existing file
under `docs/decisions/`, every required check to have fresh `pass` evidence, and
no failed check. `skipped` is not a pass. Run the relevant doctor level and
review `git diff --check` before handoff.

Durable project context is indexed from:

- `docs/product/` — product model and MVP boundaries;
- `docs/specs/` — observable behavior;
- `docs/architecture/` — system and harness boundaries;
- `docs/decisions/` — accepted choices and migration gates;
- `docs/operations/` — recovery and deployment runbooks.
