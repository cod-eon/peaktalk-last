---
name: peaktalk-deploy-gate
description: "Use before PeakTalk deploys or infra/env/migration changes. Requires green checks, migration awareness, health checks, and rollback thinking."
risk: critical
source: project
---

# PeakTalk Deploy Gate

## When To Use

Use before deploying PeakTalk, changing Docker/Nginx/env/secrets, running migrations, touching production config, or modifying billing/auth/admin/simulation behavior intended for production.

## Pre-Deploy Checklist

1. Review git diff and identify risky files.
2. Run relevant local checks:
   - frontend: `npm run lint`, `npm run build`
   - backend: targeted `pytest` or full suite when feasible
   - migrations: confirm Alembic order and downgrade/rollback implications
3. Confirm no secrets are added to tracked files.
4. Confirm env changes are documented and production values exist.
5. For UI changes, complete browser/screenshot review.
6. For billing/auth/admin/security, do not deploy with unresolved ambiguity.

## Deploy Rules

- Stop on red checks.
- Do not run destructive database operations without explicit user approval.
- Do not rotate secrets, prune data, or change production cron behavior unless the task clearly requires it.
- Keep deploy commands and verification commands explicit.

## Post-Deploy Checklist

1. Check containers/processes.
2. Check `/health` or equivalent endpoint.
3. Smoke-test affected route(s), especially guest simulation, auth, dashboard, billing.
4. Inspect recent logs for errors.
5. State rollback path if something fails.

## Final Response Evidence

Report what was deployed, commit/tree state if relevant, checks passed, prod health result, and any residual risk.
