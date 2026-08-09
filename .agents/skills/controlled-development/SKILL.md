---
name: controlled-development
description: Use for PeakTalk multi-file changes, product behavior implementation, harness work, refactors, debugging, and other changes that need bounded scope and fresh verification evidence.
---

# Controlled Development

Use this skill when a change can affect more than one file, observable behavior, a contract, or the harness itself.

## Process

1. Route the task and create a task contract when the change is multi-file, behavioral, architectural, or otherwise high risk. Keep acceptance criteria and non-goals concrete.
2. Inspect the current state and blast radius. In an indexed repository, use CodeGraph for the first code-navigation query; use its CLI and then `rg` if MCP is unavailable. Do not let a navigation outage block implementation.
3. Separate facts, assumptions, and implementation choices. Escalate product or costly architectural choices instead of deciding them silently.
4. Implement the smallest coherent change. Preserve unrelated work and do not broaden scope to clean up neighboring code.
5. Verify with targeted checks first, then the required checks from the route. Record command, result, and fresh evidence; `skipped` never satisfies a gate.
6. Review the diff against acceptance criteria, update durable docs when behavior or architecture changed, and complete the contract only after all gates and checks pass.

Use the lifecycle `draft → awaiting-decision → ready → in-progress → verifying → complete`. A plausible explanation is not completion evidence.
