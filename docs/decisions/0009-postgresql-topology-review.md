# 0009 — PostgreSQL topology review

Status: accepted recommendation; no PostgreSQL topology migration approved.

Date: 2026-08-09

## Current facts

- PostgreSQL 16.14 runs in a Docker container on the existing VDS.
- The database is approximately 9 MB with 11 users and 1 simulation session.
- Data is on the named Docker volume `peaktalk_postgres_data`.
- A root cron invokes a daily dump at 03:17; recent dump files exist, but no
  isolated restore test or measured RPO/RTO evidence exists.
- SQLAlchemy uses `pool_pre_ping`, `pool_size=10`, and `max_overflow=20` for
  PostgreSQL. There is no explicit external pooler or connection budget in the
  current code.
- The VDS has 50 GB free and 31 GiB memory. The current schema is behind the
  workspace migration head.

## Options and trade-offs

### Keep PostgreSQL on the VDS and harden it

Lowest cost and smallest application change. It preserves current latency and
the existing Compose boundary, but leaves one-host failure risk and keeps
backup, restore, upgrades, and monitoring as PeakTalk responsibilities.

### Move to managed PostgreSQL

Higher recurring cost and a migration/network cutover, but reduces DB
operational burden and can provide replicas, automated backup/PITR, TLS, and
failover. Yandex Managed PostgreSQL documents daily backups, WAL-based PITR,
restore testing guidance, encrypted connections, and optional replicas; see
[backup](https://yandex.cloud/en/docs/managed-postgresql/concepts/backup) and
[managed PostgreSQL](https://yandex.cloud/en/services/managed-postgresql).

### Move to a separate self-managed PostgreSQL VDS

Improves application/DB resource isolation but adds another host, patching,
network security, monitoring, replication, and recovery burden without the
managed-service recovery guarantees.

## Recommendation

Keep the current PostgreSQL topology for this release and harden it. The
current dataset and capacity do not prove that a costly migration is needed.
Before production readiness, add and verify: migration preflight, explicit
connection limits, slow-query/lock observability, encrypted backup storage,
restore rehearsal, retention, RPO/RTO targets, and a tested upgrade/rollback
runbook. Reconsider managed PostgreSQL when the required RPO/RTO or availability
cannot be met on one VDS, or when measured connection/storage/load limits make
the current topology unsafe.

## Required review checks

- Schema and foreign keys match the approved migrations.
- Indexes cover current owner/session/report queries without unbounded scans.
- Migration execution is separate from application startup and is reversible or
  has a restore plan.
- Backup success is monitored, and a recent dump can be restored to an
  isolated database with row/count/checksum validation.
- Secrets are not in logs, process arguments, or Git.
- Connection pool plus worker concurrency fits the PostgreSQL max-connections
  budget.
- RPO/RTO and retention are written into the operations runbook.

## Non-goals

Do not migrate PostgreSQL merely because a managed product appears newer. Do
not combine this review with Auth or Storage migration.
