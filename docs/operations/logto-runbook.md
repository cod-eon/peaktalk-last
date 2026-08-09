# Logto OSS VDS runbook

Status: staged deployment definition; public cutover and application integration remain separate migration gates.

## Architecture

Logto is a separate Compose project under `/opt/peaktalk-logto` with its own persistent PostgreSQL volume and its own secret file. It must not share the PeakTalk application database or volume. The public and admin ports bind to loopback only; nginx is the TLS boundary.

The repository pins the Logto image to `ghcr.io/logto-io/logto:1.41.0` by immutable digest. Upgrades are explicit release changes with a database backup, migration check and rollback window.

## First installation on VDS

```bash
sudo install -d -m 750 -o peaktalk-agent -g peaktalk-agent /opt/peaktalk-logto
sudo install -d -m 750 -o peaktalk-agent -g peaktalk-agent /var/backups/peaktalk-logto
```

Install the compose file and `.env` from the verified repository artifact. Generate the database password and the 32-byte base64 Secret Vault KEK on VDS; do not generate or transport them in chat. The populated `.env` must be mode `600` and owned by `peaktalk-agent` or the operator account that runs the deployment.

Before starting, verify DNS and certificate readiness for `auth.peaktalk.ru` and `admin.auth.peaktalk.ru`. Until then, keep the ports loopback-only and use an SSH tunnel for bootstrap:

```bash
ssh -L 3002:127.0.0.1:3002 -L 3001:127.0.0.1:3001 codeon@89.169.169.98
```

## Initialize and start

```bash
cd /opt/peaktalk-logto
docker compose config
docker compose pull
docker compose up -d logto-postgres
docker compose run --rm logto npm run cli db seed -- --disable-admin-pwned-password-check
docker compose up -d logto
docker compose ps
curl --fail http://127.0.0.1:3001/api/status
```

Complete the one-time OSS admin bootstrap through the admin console. Logto OSS currently supports one initial admin account; this is an operational constraint, not an application authorization model. Store the admin recovery procedure in the password manager. Do not enable PeakTalk's Logto feature flag until registration, login, logout, expiry, recovery, protected-route and negative authorization checks pass.

The official Logto guidance requires a dedicated PostgreSQL database, recommends the CLI seed flow, supports `ENDPOINT`, `ADMIN_ENDPOINT`, `TRUST_PROXY_HEADER` and a 32-byte `SECRET_VAULT_KEK`, and warns against the demo Compose database for production: [deployment and configuration](https://docs.logto.io/logto-oss/deployment-and-configuration), [OSS getting started](https://docs.logto.io/logto-oss/get-started-with-oss).

## Backup and rollback

Before Logto upgrades or config changes:

1. Stop only the Logto application container if necessary; keep the database available for a consistent dump.
2. Create a compressed `pg_dump` custom-format backup of the dedicated Logto database into `/var/backups/peaktalk-logto`.
3. Record the image digest, Compose config hash and backup filename in the release evidence.
4. Apply the change, run health and auth smoke checks.
5. If health or auth checks fail, restore the previous Compose file and image, restart Logto, and restore the pre-change database backup only if the failed migration altered schema/data. Never roll back only the container across an incompatible schema migration.

Do not delete the Logto volume as a rollback mechanism. Volume deletion is a separate destructive action requiring an explicit inventory and decision.

## Cutover boundary

Supabase Auth remains the active provider until the application adapter and migration gate are complete. Logto deployment, application integration and Supabase retirement are separate releases. The feature flag must have an immediate legacy-provider fallback, and user identity mapping must be recorded before any password or session migration.
