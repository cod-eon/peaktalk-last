---
name: peaktalk-autonomous-dev-gate
description: "Use for non-trivial PeakTalk code changes. Enforces controlled autonomy: inspect first, identify risk, implement narrowly, and verify with evidence."
risk: safe
source: project
---

# PeakTalk Autonomous Dev Gate

## When To Use

Use for any PeakTalk task that changes behavior, architecture, API contracts, auth, billing, simulation, dashboard, backend models, migrations, or more than one component.

Do not use for tiny copy edits or obvious one-line fixes unless they touch risky flows.

## Required Workflow

1. Inspect current code before deciding. Prefer `rg`, targeted file reads, and existing tests/docs.
2. State the working scope briefly: files/flows touched, user-visible behavior, risk level, verification plan.
3. Keep changes narrow. Follow existing project structure over new abstractions.
4. Preserve product narrative: professional pressure-testing for high-stakes work conversations.
5. Do not silently change data contracts, billing logic, auth behavior, route names, analytics events, or migration semantics.
6. Verify with fresh commands. Frontend changes usually need `npm run lint` and `npm run build`; backend changes need targeted `pytest`.

## Risk Escalation

Treat these as high risk:

- auth, Supabase identity, middleware, session persistence
- YooKassa, credits, plans, limits, billing store
- guest simulation and guest-to-user conversion
- simulation engine, AI prompts, message persistence
- Alembic migrations and existing production data
- admin endpoints, notifications, PWA/service worker
- deploy scripts, Docker, Nginx, env/secrets

For high-risk work, add edge cases and rollback notes before final response.

## Done Criteria

Do not claim completion unless you can name the commands or browser checks that passed. If a check was skipped, state the reason and residual risk.
