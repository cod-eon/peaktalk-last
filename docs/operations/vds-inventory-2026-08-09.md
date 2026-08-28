# PeakTalk VDS inventory — 2026-08-09

Status: audit snapshot with Logto staging and approved application-database
cleanup completed. Runtime volumes, backups, and unrelated services were
preserved.

## Scope and method

- Target: `codeon-vm`, `89.169.169.98`, application directory `/opt/peaktalk`.
- Read-only inventory was collected over SSH. The temporary private key was
  used locally and its contents were never printed, copied to the VDS, or
  committed.
- Current workspace commit: `00db556` on `codex/pre-pivot-harness`.
- The VDS is not a Git checkout. The remote directory has no `.git`, so its
  runtime cannot currently prove which commit produced the deployed images.

## Facts

### Host and access

- SSH access as `codeon` works with non-interactive sudo.
- `codeon` is in `docker` and `google-sudoers`.
- SSH password and keyboard-interactive authentication are disabled; root SSH
  login is disabled; public-key authentication is enabled.
- A dedicated `peaktalk-agent` user was created after the inventory:
  password locked, no sudo, SSH public key only, member of `docker`.
  Docker membership is effectively root-equivalent and must be treated as a
  privileged production credential.
- UFW is active with default deny for inbound traffic. Explicit inbound TCP
  ports are 22, 80, and 443. `fail2ban` is running.
- Host filesystem: 58 GB total, 8.4 GB used, 50 GB free. Memory: 31 GiB;
  swap is disabled.

### Runtime

- Docker 29.1.3 and Docker Compose 2.40.3 are installed.
- Running PeakTalk services: nginx, frontend, API, worker, beat, PostgreSQL,
  and Redis. The one-shot migration container exited with code 0.
- All three data-service healthchecks are currently healthy where defined.
- PostgreSQL is `16.14` in Docker, database `peaktalk`, with database size
  approximately 9 MB.
- Alembic revision on VDS: `0020_guest_migration_state`. The workspace contains
  newer migrations, so the VDS schema is behind the current repository.
- Before the approved cleanup, `users` had 11 rows and
  `simulation_sessions` had 1 row. The user then explicitly authorized
  deletion of the application database after backup and isolated restore
  verification. The post-reset counts are users=0 and simulations=0.
- On 2026-08-09 at approximately 18:15 UTC, only database `peaktalk` was
  dropped and recreated inside `peaktalk-postgres-1`; migration `0020` was
  applied and the API returned healthy. The fresh pre-reset dump remains at
  `/var/backups/peaktalk/peaktalk-20260809T181532Z.dump.gz`.
- Redis is `redis:7-alpine` with a named volume.
- No native Logto, Supabase, or host-native PostgreSQL/Redis service was found.
  The application still has Supabase Auth and Supabase Storage environment
  keys.
- Logto OSS is now staged as a separate Compose project at
  `/opt/peaktalk-logto`. Its PostgreSQL data is in the separate named volume
  `peaktalk-logto_logto_postgres_data`; the Logto and admin endpoints are bound
  to `127.0.0.1:3001` and `127.0.0.1:3002` respectively. The pinned image is
  `ghcr.io/logto-io/logto:1.41.0` with digest
  `sha256:7f79547e3d1fe569a3ecae757968a7cfc579687aa8164eec35113c0adc983c5b`.
- Logto database seed and alteration deployment completed, and
  `http://127.0.0.1:3001/api/status` returned success. It is not publicly
  exposed and is not integrated into PeakTalk authentication yet.

### Images, volumes, and deploy state

- Application images are tagged `latest` and were created on 2026-06-16/17:
  `peaktalk-backend`, `peaktalk-worker`, and `peaktalk-frontend`.
- Named volumes present: `peaktalk_postgres_data`, `peaktalk_redis_data`, and
  `peaktalk_certbot_webroot`. They are active and must be preserved.
- Docker reports 2.332 GB reclaimable image space, but no exact image IDs have
  been approved for removal.
- A daily root cron job runs `/usr/local/sbin/peaktalk-db-backup` at 03:17
  Moscow time. Three recent PeakTalk dumps are present in
  `/var/backups/peaktalk/`; the fresh pre-reset dump was restored into an
  isolated PostgreSQL 16.14 instance successfully.
- `/opt/peaktalk` has mode `755`, while production `.env` files have mode
  `600`. Environment variable names were inventoried without reading values.
- Local and remote hashes differ for `deploy.sh`, `docker-compose.yml`, and
  `.github/workflows/deploy.yml`; `nginx/nginx.conf` and
  `scripts/migrate.sh` matched in this snapshot.
- Remote Compose config validates, but the current deployment path builds on
  the VDS and has no verified immutable source checkout or rollback artifact.

### Network, TLS, and health

- Listening public ports are 22, 80, and 443. PostgreSQL and Redis are not
  published on the host.
- `peaktalk.ru/health` returned HTTP 200 with
  `{"status":"ok","service":"peaktalk-api"}` on 2026-08-09.
- `peaktalk.ru/` returned HTTP 200. Nginx is running inside Docker; no
  host-native `nginx.service` exists.
- TLS certificate covers `peaktalk.ru` and `www.peaktalk.ru`, issued by Let's
  Encrypt, and expires 2026-09-16. TLS is currently valid.
- Journal errors in the previous 24 hours totalled 136; the majority were
  attributed to `sshd`. No application log contents were copied into this
  report.

## Classification

| Classification | Exact objects | Action now |
| --- | --- | --- |
| Preserve | `codeon`, `peaktalk-agent`, root SSH policy, UFW, fail2ban, TLS material, `/var/backups`, backup cron, monitoring/system services, all active PeakTalk containers and named volumes, staged Logto containers, Logto env file, Logto PostgreSQL volume, and Logto backup directory | Preserve |
| Replace | `/opt/peaktalk` deploy artifact, `latest` application image tags, migration/deploy mechanism | Only through verified artifact release and rollback window |
| Remove candidate | Application database named `peaktalk` inside the existing PostgreSQL runtime; this exact target was deleted and recreated after backup/restore verification. Old artifact files remain individually gated | Completed only for `peaktalk` |
| Unknown | Supabase bucket/object inventory, exact backup restore quality, PostgreSQL connection pressure, old `/opt/peaktalk` documents, GitHub secret values, Yandex bucket/IAM/KMS state, Logto admin/SMTP bootstrap state | Requires evidence or explicit decision |

## Exact cleanup scope executed

The user approved deletion of the exact application database `peaktalk` only,
after preflight and restore evidence. That operation is complete. The
PostgreSQL container, `peaktalk_postgres_data`, all backups, all other
databases, Logto, firewall, TLS, and SSH configuration were preserved. No
`docker compose down -v` was run, and no image or application directory was
deleted.

## Required next evidence

1. Export a sanitized remote file/image/volume manifest with stable IDs,
   including the staged Logto project.
2. Make the deploy artifact carry the exact commit identity and retain the
   previous image set for rollback.
3. Inventory Supabase Storage and Auth only with the required scoped credentials;
   do not print or commit those credentials.
4. Complete DNS/TLS and Logto admin/SMTP bootstrap before any public Auth
   exposure or application integration.
