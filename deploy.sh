#!/usr/bin/env bash

# PeakTalk production deployment entrypoint.
# The CI runner transfers a verified source checkout plus an immutable image
# artifact. Production env files and TLS material stay outside Git.

set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-${APP_DIR}/docker-compose.yml}"
HEALTH_HOST="${DEPLOY_HEALTH_HOST:-${HEALTH_HOST:-peaktalk.ru}}"
DEPLOY_SHA="${DEPLOY_SHA:-}"
ARTIFACT_DIR="${ARTIFACT_DIR:-${APP_DIR}/.release}"
BACKUP_COMMAND="${BACKUP_COMMAND:-/usr/local/sbin/peaktalk-db-backup}"
STATE_DIR="${STATE_DIR:-/var/lib/peaktalk}"
LOCK_FILE="${LOCK_FILE:-${STATE_DIR}/deploy.lock}"
CURRENT_STATE="${STATE_DIR}/current-deploy"
PREVIOUS_STATE="${STATE_DIR}/previous-deploy"
MANIFEST="${ARTIFACT_DIR}/release-manifest"
IMAGE_ARCHIVE="${ARTIFACT_DIR}/images.tar.gz"
IMAGE_CHECKSUMS="${ARTIFACT_DIR}/images.sha256"

log() { printf '[deploy] %s\n' "$*"; }
fail() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

rollback_runtime() {
  local rollback_tag="${1:-}"
  [[ -n "$rollback_tag" ]] || return 1
  log "Attempting runtime rollback to ${rollback_tag}"
  IMAGE_TAG="$rollback_tag" docker compose -f "$COMPOSE_FILE" up -d --remove-orphans >/dev/null
  for attempt in {1..12}; do
    if curl --fail --silent --show-error --insecure \
        --resolve "${HEALTH_HOST}:443:127.0.0.1" \
        "https://${HEALTH_HOST}/health" >/dev/null; then
      log "Runtime rollback health check passed"
      return 0
    fi
    sleep 5
  done
  return 1
}

trap 'fail "Deployment failed at line ${LINENO}: ${BASH_COMMAND}"' ERR

[[ -f "$COMPOSE_FILE" ]] || fail "Compose file not found: $COMPOSE_FILE"
[[ -f "$MANIFEST" ]] || fail "Release manifest not found: $MANIFEST"
[[ -f "$IMAGE_ARCHIVE" ]] || fail "Image archive not found: $IMAGE_ARCHIVE"
[[ -f "$IMAGE_CHECKSUMS" ]] || fail "Image checksum file not found: $IMAGE_CHECKSUMS"
[[ "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "DEPLOY_SHA must be a 40-character commit SHA"
command -v docker >/dev/null 2>&1 || fail "Docker is not installed"
docker compose version >/dev/null 2>&1 || fail "Docker Compose is unavailable"
command -v flock >/dev/null 2>&1 || fail "flock is unavailable"
command -v curl >/dev/null 2>&1 || fail "curl is unavailable"

if [[ ! -d "$STATE_DIR" ]]; then
  sudo install -d -o "$(id -u)" -g "$(id -g)" -m 750 "$STATE_DIR"
fi

exec 9>"$LOCK_FILE"
flock -n 9 || fail "Another deployment is already running"

cd "$APP_DIR"

manifest_value() {
  local key="$1"
  awk -F= -v expected_key="$key" '$1 == expected_key { print substr($0, index($0, "=") + 1); exit }' "$MANIFEST"
}

[[ "$(manifest_value commit)" == "$DEPLOY_SHA" ]] || fail "Release manifest commit mismatch"
[[ "$(manifest_value api_tag)" == "peaktalk-backend:${DEPLOY_SHA}" ]] || fail "API image tag mismatch"
[[ "$(manifest_value worker_tag)" == "peaktalk-worker:${DEPLOY_SHA}" ]] || fail "Worker image tag mismatch"
[[ "$(manifest_value frontend_tag)" == "peaktalk-frontend:${DEPLOY_SHA}" ]] || fail "Frontend image tag mismatch"

log "Preparing verified deployment ${DEPLOY_SHA}"
(cd "$ARTIFACT_DIR" && sha256sum -c "$(basename "$IMAGE_CHECKSUMS")" >/dev/null) || fail "Image artifact checksum mismatch"
docker compose -f "$COMPOSE_FILE" config >/dev/null

if [[ ! -r backend/.env || ! -r frontend/.env.local ]]; then
  fail "Production env files are missing or unreadable"
fi

sudo -n test -x "$BACKUP_COMMAND" || fail "Required database backup command is missing or not executable: $BACKUP_COMMAND"

log "Loading verified application images"
gzip -dc "$IMAGE_ARCHIVE" | docker load >/dev/null

for image_key in api worker frontend; do
  image_name="$(manifest_value "${image_key}_tag")"
  image_id="$(manifest_value "${image_key}_id")"
  [[ -n "$image_name" && -n "$image_id" ]] || fail "Manifest missing ${image_key} image identity"
  [[ "$(docker image inspect "$image_name" --format '{{.Id}}')" == "$image_id" ]] || fail "Loaded ${image_key} image identity mismatch"
done

previous_tag=""
if [[ -r "$CURRENT_STATE" ]]; then
  previous_tag="$(sed -n '1p' "$CURRENT_STATE")"
fi

if [[ -z "$previous_tag" ]]; then
  previous_tag="legacy"
  for image_pair in \
    "peaktalk-backend:latest peaktalk-backend:${previous_tag}" \
    "peaktalk-worker:latest peaktalk-worker:${previous_tag}" \
    "peaktalk-frontend:latest peaktalk-frontend:${previous_tag}"; do
    set -- $image_pair
    docker image inspect "$1" >/dev/null 2>&1 || fail "No legacy image available for rollback: $1"
    docker tag "$1" "$2"
  done
else
  for image_name in peaktalk-backend peaktalk-worker peaktalk-frontend; do
    docker image inspect "${image_name}:${previous_tag}" >/dev/null 2>&1 || fail "Previous image missing: ${image_name}:${previous_tag}"
  done
fi

log "Validating Nginx configuration"
docker compose -f "$COMPOSE_FILE" run --rm --no-deps nginx nginx -t

log "Ensuring data services are ready"
docker compose -f "$COMPOSE_FILE" up -d postgres redis

log "Creating pre-deploy database backup"
sudo -n "$BACKUP_COMMAND"

export IMAGE_TAG="$DEPLOY_SHA"

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
    printf '%s\n' "$previous_tag" | sudo tee "$PREVIOUS_STATE" >/dev/null
    printf '%s\n' "$DEPLOY_SHA" | sudo tee "$CURRENT_STATE" >/dev/null
    exit 0
  fi
  sleep 5
done

if ! rollback_runtime "$previous_tag"; then
  fail "Health check failed and runtime rollback did not recover"
fi

fail "Health check failed after deployment ${DEPLOY_SHA}; runtime was rolled back"
