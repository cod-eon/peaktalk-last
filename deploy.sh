#!/usr/bin/env bash

# PeakTalk production deployment entrypoint.
# The CI runner synchronizes an exact repository checkout to this directory,
# while production-only env files and TLS material stay outside Git.

set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-${APP_DIR}/docker-compose.yml}"
HEALTH_HOST="${DEPLOY_HEALTH_HOST:-${HEALTH_HOST:-peaktalk.ru}}"
DEPLOY_SHA="${DEPLOY_SHA:-}"
BACKUP_COMMAND="${BACKUP_COMMAND:-/usr/local/sbin/peaktalk-db-backup}"
STATE_DIR="${STATE_DIR:-/var/lib/peaktalk}"
LOCK_FILE="${LOCK_FILE:-${STATE_DIR}/deploy.lock}"

log() { printf '[deploy] %s\n' "$*"; }
fail() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

trap 'fail "Deployment failed at line ${LINENO}: ${BASH_COMMAND}"' ERR

[[ -f "$COMPOSE_FILE" ]] || fail "Compose file not found: $COMPOSE_FILE"
command -v docker >/dev/null 2>&1 || fail "Docker is not installed"
docker compose version >/dev/null 2>&1 || fail "Docker Compose is unavailable"
command -v flock >/dev/null 2>&1 || fail "flock is unavailable"

if [[ ! -d "$STATE_DIR" ]]; then
  sudo install -d -o "$(id -u)" -g "$(id -g)" -m 750 "$STATE_DIR"
fi

exec 9>"$LOCK_FILE"
flock -n 9 || fail "Another deployment is already running"

cd "$APP_DIR"

if [[ -n "$DEPLOY_SHA" && -d .git ]]; then
  checked_out_sha="$(git rev-parse HEAD)"
  [[ "$checked_out_sha" == "$DEPLOY_SHA" ]] || fail "Repository SHA mismatch: expected $DEPLOY_SHA, got $checked_out_sha"
fi

if [[ -z "$DEPLOY_SHA" ]]; then
  DEPLOY_SHA="$(git rev-parse HEAD 2>/dev/null || date -u +%Y%m%d%H%M%S)"
fi

log "Preparing deployment ${DEPLOY_SHA}"

# Never print the resolved Compose config: it contains env_file values.
docker compose -f "$COMPOSE_FILE" config >/dev/null

if [[ ! -r backend/.env || ! -r frontend/.env.local ]]; then
  fail "Production env files are missing or unreadable"
fi

if [[ ! -x "$BACKUP_COMMAND" ]]; then
  fail "Required database backup command is missing: $BACKUP_COMMAND"
fi

log "Validating Nginx configuration"
docker compose -f "$COMPOSE_FILE" run --rm --no-deps nginx nginx -t

log "Ensuring data services are ready"
docker compose -f "$COMPOSE_FILE" up -d postgres redis

log "Creating pre-deploy database backup"
sudo -n "$BACKUP_COMMAND"

export IMAGE_TAG="$DEPLOY_SHA"

log "Building immutable application images"
docker compose -f "$COMPOSE_FILE" build api worker frontend

log "Running database migrations"
docker compose -f "$COMPOSE_FILE" run --rm migrate

log "Starting application stack"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

log "Checking container state"
docker compose -f "$COMPOSE_FILE" ps

log "Checking local HTTPS health endpoint"
for attempt in {1..12}; do
  if curl --fail --silent --show-error --insecure \
      --resolve "${HEALTH_HOST}:443:127.0.0.1" \
      "https://${HEALTH_HOST}/health" >/dev/null; then
    log "Local health check passed"
    printf '%s\n' "$DEPLOY_SHA" | sudo tee "${STATE_DIR}/current-deploy" >/dev/null
    exit 0
  fi
  sleep 5
done

fail "Local health check failed after deployment ${DEPLOY_SHA}"
