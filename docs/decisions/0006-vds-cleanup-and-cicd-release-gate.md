# 0006 — VDS cleanup and CI/CD release gate

Status: accepted; destructive cleanup and production deploy remain execution-
scoped gates.

Date: 2026-08-09

## Problem

The VDS is serving PeakTalk, but the runtime is not provably tied to the
current Git commit. `/opt/peaktalk` has no `.git`, the application images use
`latest` and are from June, and local and remote deploy/Compose files differ.
The VDS also contains real application data: 11 users and 1 simulation. Blind
cleanup or an unverified redeploy could destroy recovery options or create an
untraceable production state.

## Options

### A. Keep building from the VDS checkout

Lowest immediate implementation cost, but it preserves source drift, mutable
`latest` tags, weak provenance, and no deterministic rollback. Rejected as the
production baseline.

### B. Build a verified immutable artifact in CI and transfer it over pinned SSH

CI checks out the exact commit, runs all required checks, builds tagged images
or an OCI archive, records the commit and digests, transfers only that artifact
to the VDS, runs migrations separately, and retains the previous image set.
This avoids introducing a registry immediately and is the recommended short-
term path. It still requires careful artifact retention and SSH bandwidth.

### C. Build and publish to a private container registry

Best provenance and rollback ergonomics at scale, but adds registry cost,
credentials, retention policy, and an additional external dependency. Consider
after the short-term pipeline is stable and registry ownership is decided.

## Recommendation

Adopt B for the next release. CI must fail closed on every required check and
must publish a manifest containing the verified commit, image digests, migration
revision, and configuration hash. The VDS deploy must refuse an artifact whose
manifest does not match the requested commit. Keep the previous application
image set and configuration until the health/smoke verification window closes.

## Cleanup gate

No cleanup target is approved by this file alone. A later approval must list
exact Docker image IDs, directories, and files. It must explicitly exclude
SSH users, DNS, TLS, system files, backups, credentials, unrelated services,
monitoring, firewall configuration, and all current data volumes. The current
11 users and 1 simulation require reconciliation before any data deletion.

## Acceptance criteria

- CI runs locked dependency installation, harness tests/router evals, five
  project-skill validation, backend tests, frontend lint/typecheck/build,
  dependency audit, Docker/Compose validation, and fails on skipped/failed
  required checks.
- Deployment accepts only a verified commit artifact, runs migrations as a
  separate explicit step, performs remote health and smoke checks, and records
  the deployed digest.
- Rollback restores the prior image set and configuration without dropping
  database/storage volumes.
- Cleanup has an exact target manifest, a verified backup, an owner, a trigger,
  and a recoverable rollback procedure.

## Deliberately not approved

- No application-data deletion.
- No Auth or Storage migration.
- No production-branch switch.
- No changes to SSH, DNS, TLS, firewall, unrelated services, or backups.
