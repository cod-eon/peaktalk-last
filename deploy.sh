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

echo ""
echo "=============================================="
echo "  PeakTalk Deploy  —  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

# ── Step 1: Pull latest code ──────────────────────────────────────────────────
echo ""
echo "[1/4] Pulling latest code from main..."
git fetch origin main
git reset --hard origin/main

# ── Step 2: Build Docker images ───────────────────────────────────────────────
echo ""
echo "[2/4] Building Docker images..."
docker compose build api worker
docker compose build --no-cache frontend

# ── Step 3: Start / update services ───────────────────────────────────────────
echo ""
echo "[3/4] Starting services..."

# Полностью останавливаем и удаляем compose-контейнеры проекта, но сохраняем
# именованные volumes с данными Postgres/Redis. Это надежнее, чем ручной rm -f,
# который иногда оставляет контейнеры в состоянии "marked for removal" и ломает
# следующий docker compose up.
docker compose down --remove-orphans

docker compose up -d

# Restart nginx to force DNS re-resolution of upstream IPs after recreation
docker compose restart nginx

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
