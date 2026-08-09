# 0001 — Hybrid agent harness

Status: accepted
Date: 2026-08-09

## Decision

Use a hybrid PeakTalk-specific harness: compact repository instructions,
progressively disclosed durable documents, a small set of project skills, a
deterministic MCP/CLI router, machine-checked task contracts, a cold pinned AAS
catalog, and CodeGraph with bounded fallbacks.

## Alternatives considered

### Repository instructions and native skills only

Lower maintenance, but insufficient enforcement of decision gates, skill
selection, and completion evidence.

### Full agent orchestrator

Planner, implementer, reviewer, persistent memory, telemetry, and automatic
multi-agent workflows could add capability later. Today they add operational
cost and failure modes before PeakTalk has validated the need.

## Reasons

- Preserves agent autonomy for reversible technical decisions.
- Makes product and costly architecture decisions explicit.
- Avoids loading thousands of community skills into active context.
- Keeps completion tied to evidence.
- Remains understandable and maintainable by a solo founder.

## Consequences

- The custom router and fixture set require maintenance.
- Project documents must be kept current when decisions change.
- AAS content is supplemental and unavailable unless explicitly allowlisted.
- CodeGraph failure must be visible but cannot become a single point of failure.

## Rejected scope

- Installing the entire AAS catalog as active Codex skills.
- Executing third-party skill scripts through the router.
- Building a general-purpose agent platform.
- Introducing a full multi-agent orchestration layer now.
