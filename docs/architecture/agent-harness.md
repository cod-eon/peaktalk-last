# PeakTalk agent harness

Status: accepted design
Date: 2026-08-09

## Understanding

- PeakTalk needs a local control plane that turns a request into bounded context,
  risk-aware autonomy, relevant skills, decision gates, and fresh verification.
- The agent owns reversible technical decisions and implementation details.
- Product choices and costly-to-reverse architecture require an explicit,
  critical decision brief before implementation.
- The harness must accelerate a solo founder rather than create process for its
  own sake.
- Third-party skills are optional guidance. Repository facts, accepted product
  decisions, and test evidence have higher authority.
- Completion is a machine-checked state, not a confident narrative.

## Assumptions

- The primary environment is Codex working in this repository with one founder.
- PeakTalk is the only project this harness needs to optimize for.
- The pinned Awesome Antigravity Skills catalog can be unavailable without
  blocking normal development.
- Runtime task records are local operational state and do not belong in Git.
- Product and architecture documents will evolve, but accepted decisions must
  remain traceable.

## Non-functional requirements

- Routing is deterministic, local, and normally completes in under one second.
- Unknown or unapproved third-party skill content is denied by default.
- Third-party skill scripts are never executed by the router.
- No task may complete while a required decision or passing check is missing.
- MCP failures degrade to CLI and then ordinary repository search without
  blocking the task.
- Secrets, environment files, runtime records, and generated indexes remain
  outside version control.
- Maintenance stays small enough for one founder and one agent.

## Architecture

### Durable context

`AGENTS.md` is a compact dispatcher, not an encyclopedia. It defines the working
protocol, authority boundaries, source precedence, and where to load more
context.

Durable knowledge is split by responsibility:

```text
docs/
  product/       product model, ICP, JTBD, MVP, boundaries
  specs/         observable behavior of important user flows
  architecture/  current system boundaries and integration maps
  decisions/     accepted product and technical decisions
  operations/    deploy, migration, backup, and recovery runbooks
```

Chat history is never the source of truth. Only reviewed repository documents
and current code are durable project knowledge.

### Skills

Project skills contain reusable process, not duplicated product facts:

```text
.agents/skills/
  product-decision/
  controlled-development/
  ui-quality/
  deploy-safety/
  product-copy/
```

Selection priority is:

1. One relevant PeakTalk project skill.
2. A relevant trusted system skill when needed.
3. At most one approved AAS skill for narrow supplemental expertise.

The router selects no more than three skills total. The full AAS repository is a
cold, pinned catalog under `.harness/vendor/`; its skill bodies are not installed
into Codex discovery or injected into every conversation.

### Router

The router accepts the task, optional explicit mode, affected paths, acceptance
criteria, and non-goals. It returns:

- mode, domains, and risk;
- required context documents;
- selected skills with reasons;
- autonomy and decision gates;
- required verification checks.

Classification uses path-aware rules and specific signals before general text
signals. `harness` is a first-class domain. Loose words such as `router`,
`page`, or `check` must not independently classify a task as API, UI, or test.

The router constrains process and evidence. It does not choose implementation
details for reversible technical work.

### Task contracts

A task contract is required for product behavior changes, multi-file changes,
substantial UI, architecture, auth, billing, storage, migrations, deploys, and
other high-risk work. It is optional for copy edits, obvious isolated fixes, and
small CSS changes.

```text
draft -> awaiting-decision -> ready -> in-progress -> verifying -> complete
```

Required decision gates reference a reviewed file under `docs/decisions/`.
Required checks need current passing evidence. A skipped or stale check cannot
satisfy completion.

### CodeGraph

CodeGraph is the primary code-navigation layer for indexed product code. It must
have exactly one active MCP registration for this workspace.

- Product code is indexed; `.harness/vendor` and generated/runtime content are
  excluded. The harness itself may be excluded if CodeGraph cannot reliably
  scope product queries away from control-plane symbols.
- `doctor` verifies index freshness and performs a bounded semantic smoke test.
- MCP calls use a short timeout. After one MCP failure, the agent retries through
  the CodeGraph CLI. If CLI also fails, it uses `rg` and records the fallback.
- A CodeGraph outage degrades navigation quality but never blocks development.
- Duplicate or wedged MCP processes are treated as a health failure.

Current diagnosis: the index is healthy and CLI responds quickly, but CodeGraph
is registered both globally and in the project, producing duplicate MCP server
processes. Generic queries are also polluted by harness symbols.

### Verification and evals

Router behavior is validated against a committed fixture set of representative
PeakTalk requests. Each fixture defines expected mode, domains, risk, gates,
required checks, and allowed or forbidden skills. A false-positive skill is a
test failure.

The doctor has two levels:

- quick: harness tests, skill audit, secret filename scan, Git diff check, and
  CodeGraph health;
- full: quick checks plus frontend lint/build, backend tests, dependency audit,
  and Compose validation when Docker is available.

## Failure handling

- Missing AAS: continue with project and system skills.
- Router uncertainty: return no supplemental skill instead of guessing.
- Missing required document: surface the gap; do not invent project facts.
- Unresolved product or costly-architecture gate: pause implementation.
- Failed verification: task remains incomplete.
- Tool outage: use the documented fallback and report reduced confidence.

## Explicit non-goals

- A universal harness for unrelated repositories.
- A large autonomous multi-agent organization.
- Automatic execution of community skill scripts.
- Persistent conversational memory as a substitute for specifications.
- A task contract for every trivial edit.
- A literal promise of zero hallucinations.

## Acceptance criteria

- Representative routing fixtures pass without irrelevant skill selection.
- AAS remains pinned, integrity-checked, and absent from native skill discovery.
- Product and architecture gates cannot be bypassed during completion.
- CodeGraph has one registration and passes status plus semantic smoke checks.
- A clean bootstrap followed by the quick doctor succeeds.
- A concise user guide explains the normal workflow without requiring harness
  expertise.
