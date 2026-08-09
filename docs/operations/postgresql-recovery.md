# PeakTalk PostgreSQL recovery and application-database cleanup

This runbook is intentionally narrower than a storage-volume reset. The
approved cleanup target is only the application database `peaktalk` in the
existing `peaktalk-postgres-1` container. Preserve the PostgreSQL runtime,
`peaktalk_postgres_data`, the Logto PostgreSQL volume, backup files, the backup
cron, and unrelated databases/services.

## Preflight

Run from an SSH session as `codeon` or `peaktalk-agent` with Docker access. Do
not print environment files or passwords.

```sh
cd /opt/peaktalk
docker compose ps
docker exec peaktalk-postgres-1 pg_isready -U peaktalk -d postgres
docker exec peaktalk-postgres-1 psql -U peaktalk -d postgres -Atc \
  "select datname from pg_database order by datname;"
```

Create a fresh custom-format dump before any destructive action. The existing
root-owned backup helper is the canonical command:

```sh
sudo /usr/local/sbin/peaktalk-db-backup
sudo find /var/backups/peaktalk -maxdepth 1 -type f -name 'peaktalk-*.dump.gz' \
  -printf '%TY-%Tm-%TdT%TH:%TM:%TS %s %p\n' | sort | tail -1
```

Record the exact file path, size, and SHA-256 in the release evidence. Never
copy its contents into chat or the repository.

## Isolated restore verification

Restore into a temporary PostgreSQL container or an isolated temporary
database, never into production. The restore must complete without errors and
the verification must confirm at least the migration revision and expected
application tables. Remove only the explicitly named temporary container,
network, volume, and database after recording the result.

The restore is a gate: a missing, unreadable, or unverified dump blocks cleanup.

## Approved application-database reset

Only after the fresh dump and isolated restore pass:

1. Stop `api`, `worker`, `beat`, and `migrate` in the PeakTalk Compose project.
2. Confirm the target is exactly database `peaktalk` on
   `peaktalk-postgres-1`; do not stop or modify Logto.
3. Revoke new connections, terminate existing connections to `peaktalk`,
   drop only that database, and recreate it with the application owner.
4. Run the reviewed migration command explicitly.
5. Start the application services and run database, API, frontend, and
   critical-flow health checks.
6. Retain the pre-reset dump and the previous immutable application artifact
   through the rollback window.

Illustrative commands (substitute no secrets and verify names immediately
before execution):

```sh
docker compose stop api worker beat migrate
docker exec peaktalk-postgres-1 psql -U peaktalk -d postgres -v ON_ERROR_STOP=1 \
  -c "revoke connect on database peaktalk from public;" \
  -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = 'peaktalk' and pid <> pg_backend_pid();" \
  -c "drop database peaktalk;" \
  -c "create database peaktalk owner peaktalk;"
docker compose run --rm migrate
docker compose up -d api worker beat
```

Do not use `docker compose down -v`, remove the PostgreSQL volume, or delete
backup files.

## Rollback

If the migration or smoke checks fail, stop application writers, recreate an
empty `peaktalk` database owned by `peaktalk`, and restore the retained
pre-reset custom dump with `pg_restore --clean --if-exists` into that database.
Then start the previous immutable artifact and verify health. If the failure
is an application artifact issue rather than data loss, use the deployment
rollback in `deploy.sh` without changing the database.

## Recovery objectives

The current daily backup schedule gives a provisional maximum RPO of 24 hours;
it is not yet a production guarantee. Record measured restore duration and
agree the final RPO/RTO after the first restore test. The production gate is
not complete until backup freshness, restore success, retention, and measured
RTO are evidenced.
