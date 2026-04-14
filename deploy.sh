#!/bin/bash
# =============================================================================
# PeakTalk — Deploy Script
# =============================================================================
# Runs on the VDS to pull latest code and restart all services.
# Called by GitHub Actions on every push to main.
#
# Flow:
#   1. git pull
#   2. Build Docker images (api + worker with cache, frontend no-cache)
#   3. Remove application containers by compose label (keeps postgres/redis)
#   4. docker compose up -d  (migrate runs before api via depends_on)
#   5. Health check
# =============================================================================

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo ""
echo "=============================================="
echo "  PeakTalk Deploy  —  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

# ── Step 1: Pull latest code ──────────────────────────────────────────────────
echo ""
echo "[1/4] Pulling latest code from main..."
git fetch origin main

CURRENT_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git rev-parse origin/main)"
CHANGED_FILES="$(git diff --name-only "$CURRENT_HEAD" "$REMOTE_HEAD" || true)"

if [ -z "$CHANGED_FILES" ]; then
    echo "  Already up to date. Nothing to deploy."
    exit 0
fi

echo "  Changed files:"
printf '    - %s\n' $CHANGED_FILES

need_backend=false
need_frontend=false
need_nginx=false
full_deploy=false

while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
        backend/tests/*|docs/*|walkthrough.md)
            ;;
        backend/*)
            need_backend=true
            ;;
        frontend/*)
            need_frontend=true
            ;;
        nginx/*)
            need_nginx=true
            ;;
        docker-compose.yml|deploy.sh|.github/workflows/*)
            full_deploy=true
            ;;
        *)
            ;;
    esac
done <<< "$CHANGED_FILES"

if [ "$full_deploy" = true ]; then
    need_backend=true
    need_frontend=true
    need_nginx=true
fi

git reset --hard "$REMOTE_HEAD"

# ── Step 2: Build Docker images ───────────────────────────────────────────────
echo ""
echo "[2/4] Building Docker images..."
if [ "$need_backend" = true ]; then
    echo "  Backend changed -> rebuilding api + worker images"
    docker compose up -d postgres redis
    docker compose build api worker
    echo "  Running migrations"
    docker compose run --rm migrate
else
    echo "  Backend unchanged -> skipping backend rebuild"
fi

if [ "$need_frontend" = true ]; then
    echo "  Frontend changed -> rebuilding frontend image with cache"
    docker compose build frontend
else
    echo "  Frontend unchanged -> skipping frontend rebuild"
fi

# ── Step 3: Start / update services ───────────────────────────────────────────
echo ""
echo "[3/4] Starting services..."
services_to_up=()

if [ "$need_backend" = true ]; then
    services_to_up+=(api worker beat)
fi

if [ "$need_frontend" = true ]; then
    services_to_up+=(frontend)
fi

if [ "$need_nginx" = true ] || [ "$need_backend" = true ] || [ "$need_frontend" = true ]; then
    services_to_up+=(nginx)
fi

if [ "${#services_to_up[@]}" -eq 0 ]; then
    echo "  No runtime-impacting changes detected. Code synced only."
else
    echo "  Updating services: ${services_to_up[*]}"
    docker compose up -d --remove-orphans "${services_to_up[@]}"

    # Force nginx to reconnect to recreated upstream containers.
    if printf '%s\n' "${services_to_up[@]}" | grep -qx 'nginx'; then
        docker compose restart nginx
    fi
fi

# ── Step 4: Health check ───────────────────────────────────────────────────────
echo ""
echo "[4/4] Checking API health..."

HEALTH_HOST="${DEPLOY_HEALTH_HOST:-peaktalk.ru}"

MAX_RETRIES=10
RETRY_DELAY=3
for i in $(seq 1 $MAX_RETRIES); do
    if curl -ksf --resolve "$HEALTH_HOST:443:127.0.0.1" "https://$HEALTH_HOST/health" > /dev/null 2>&1; then
        echo "  API is healthy ✓"
        break
    fi
    if [ "$i" -eq "$MAX_RETRIES" ]; then
        echo "  ERROR: API health check failed for host $HEALTH_HOST after $((MAX_RETRIES * RETRY_DELAY))s"
        echo "  Check logs with: docker compose logs api"
        exit 1
    fi
    echo "  Waiting for API... (attempt $i/$MAX_RETRIES)"
    sleep $RETRY_DELAY
done

echo ""
echo "Running containers:"
docker compose ps

echo ""
echo "=============================================="
echo "  Deploy complete!"
echo "=============================================="
