# PeakTalk Harness

The harness is a small local control plane for agent work. It is deliberately
separate from future product specifications and `AGENTS.md` instructions.

## What it enforces

1. Deterministic task classification: mode, domain, and risk, including a
   first-class `harness` domain and path-aware signals.
2. User gates for product decisions and costly-to-reverse architecture.
3. A maximum of three task-relevant skills: one PeakTalk project skill, trusted
   system guidance, and at most one approved AAS skill.
4. Read-only AAS content; no skill scripts or unapproved skill content.
5. Evidence requirements derived from the affected domains and risk.
6. A compact ignored runtime log for completed checks.
7. Task contracts that cannot reach `complete` until required decision gates and
   verification checks have concrete passing evidence.

## What it does not claim

- It cannot reduce hallucinations to literal zero.
- A catalog `safe` label is not a security certificate.
- A selected skill does not override repository facts, user decisions, or test
  results.
- The router does not decide PeakTalk positioning or feature scope. It stops and
  asks for an explicit decision brief when those questions arise.

## MCP tools

- `route_task`
- `code_context` — MCP → bounded CodeGraph CLI → `rg` fallback
- `codegraph_health` — status, semantic smoke, and duplicate-process check
- `search_skills`
- `inspect_skill`
- `read_skill_reference`
- `harness_status`
- `audit_approved_skills`
- `record_outcome`
- `start_task`, `begin_task`, `get_task`, `record_decision`, `record_check`,
  `complete_task`

The same functions are available through `node .harness/bin/harness.mjs` for
debugging and CI without Codex.

## Automation

- `./.harness/scripts/bootstrap.sh` restores the pinned catalog, frontend and
  backend dependencies, refreshes CodeGraph, and runs the quick doctor.
- `./.harness/scripts/bootstrap.sh --full` also runs the full application gate.
- `./.harness/scripts/doctor.sh --full` runs router/eval tests, project skill
  validation, AAS audit, secret filename check, CodeGraph health, frontend
  lint/typecheck/build/audit, backend tests, and Compose validation when Docker
  is available.

## Normal task usage

```bash
node .harness/bin/harness.mjs route "..." --mode plan --path path/to/file
node .harness/bin/harness.mjs context "specific symbol or flow"
node .harness/bin/harness.mjs codegraph-health
```

For non-trivial work create a contract, close any durable decision gate, begin
the task, record fresh checks, and complete it only when every required check is
`pass`. Use `AGENTS.md` as the short dispatch protocol and load facts from
`docs/`.

Практическая инструкция для пользователя: `docs/operations/harness-guide.md`.
Она содержит шаблон задачи, MCP/CLI lifecycle, decision gates, evidence и
recovery steps.
