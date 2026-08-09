---
name: deploy-safety
description: Use for PeakTalk releases, production deploys, infrastructure changes, migrations, rollback planning, and health verification.
---

# Deploy Safety

Use this skill whenever an action can change production state, external infrastructure, runtime configuration, or migration state.

## Process

1. Confirm the exact commit, target environment, scope, required approvals, and current backup/recovery path. Never print secrets or infer missing environment values.
2. Run the preflight: tests, production build, configuration validation, migration review, health-check expectations, and dependency/runtime constraints.
3. Write or reference a rollback plan with a clear trigger, owner, data implications, and the fastest safe recovery path. Treat storage and auth migrations as separate gates and releases.
4. Ask for explicit authority before the external or destructive action. Do not convert a local dry run into a deploy.
5. After deployment, verify health, logs, critical user flow, and migration outcome. Record fresh evidence and preserve the rollback option until the verification window closes.
