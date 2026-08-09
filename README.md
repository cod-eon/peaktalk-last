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

The product specification and durable agent instructions are intentionally not
defined yet. They will be created in a dedicated alignment session. Until then,
the harness provides process safety without pretending that unsettled product
decisions are settled.

## Harness quick start

```bash
./.harness/scripts/setup-aas.sh
node .harness/bin/harness.mjs status
node .harness/bin/harness.mjs route "Implement responsive document workspace UI"
npm --prefix .harness test
```

The AAS repository is a pinned read-only catalog. Its 2,000+ skills are not
installed into Codex and are not active by default. Only allowlisted skills can
be loaded by the local MCP router, and skill scripts are disabled.
