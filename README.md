# PeakTalk AI Workspace

This is the clean PeakTalk development workspace. It preserves the original Git
history and runs the product snapshot from immediately before the Aura/Workspace
pivot, while excluding previous agent rules, project skills, generated
artifacts, secrets, and obsolete side projects.

The application remains split into:

- `frontend/` — Next.js application
- `backend/` — FastAPI application and Alembic migrations
- `nginx/`, Docker Compose files, and deployment scripts — runtime operations
- `.harness/` — deterministic task routing, risk gates, skill catalog access,
  and evidence recording

The discarded Aura/Workspace implementation remains recoverable from branch
`codex/backup-aura-workspace-2026-08-09` and from the verified external Git
bundle recorded in `.harness/MIGRATION.md`.

The durable product model, MVP boundaries, core flow, current architecture, and
migration placeholders live under `docs/`. The root `AGENTS.md` dispatches work
through the harness without replacing those documents.

## Harness quick start

```bash
./.harness/scripts/setup-aas.sh
node .harness/bin/harness.mjs status
node .harness/bin/harness.mjs route "Implement responsive document workspace UI"
node .harness/bin/harness.mjs codegraph-health
npm --prefix .harness test
```

The AAS repository is a pinned read-only catalog. Its 2,000+ skills are not
installed into Codex and are not active by default. PeakTalk project skills live
under `.agents/skills/`; only allowlisted AAS skills can be loaded by the local
MCP router, and third-party skill scripts are disabled.

Практическая инструкция по постановке задач, decision gates, task contracts и
проверкам: [`docs/operations/harness-guide.md`](docs/operations/harness-guide.md).
