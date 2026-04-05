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

# Удаляем контейнеры приложения по compose-label — это находит в том числе
# контейнеры с хеш-префиксом ({hash}_peaktalk-*), которые Docker Compose
# оставляет после неудачных пересозданий и которые блокируют следующий деплой.
# Postgres и Redis не трогаем — их данные в именованных volumes, контейнеры
# перезапустятся автоматически через depends_on.
# Удаляем ВСЕ контейнеры проекта по compose-label.
# Данные хранятся в именованных volumes (postgres_data, redis_data) —
# они переживают удаление контейнеров. docker compose up пересоздаст всё с нуля.
docker ps -aq --filter "label=com.docker.compose.project=peaktalk" \
  | xargs -r docker rm -f 2>/dev/null || true

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
