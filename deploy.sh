#!/bin/bash
# =============================================================================
# PeakTalk — Deploy Script
# =============================================================================
# Runs on the VDS to pull latest code and restart all services.
# Called by GitHub Actions on every push to main.
#
# Can also be run manually on the VDS:
#   cd /opt/peaktalk && ./deploy.sh
#
# Flow:
#   1. git pull (get latest code)
#   2. Build Docker images (api, worker, frontend)
#   3. Start all services — migrate runs automatically before api
#      (api depends_on migrate: condition: service_completed_successfully)
#   4. Health check
# =============================================================================

set -euo pipefail

# Change to the directory containing this script (project root)
cd "$(dirname "${BASH_SOURCE[0]}")"

echo ""
echo "=============================================="
echo "  PeakTalk Deploy  —  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

# ── Step 1: Pull latest code ──────────────────────────────────────────────────
echo ""
echo "[1/4] Pulling latest code from main..."
git pull origin main

# ── Step 2: Build Docker images ───────────────────────────────────────────────
# api and worker use layer cache (Python deps rarely change).
# frontend is always built --no-cache: NEXT_PUBLIC_* vars are baked into
# the JS bundle at build time, and BuildKit cache on VDS can silently reuse
# a stale image even when source files changed.
echo ""
echo "[2/4] Building Docker images..."
docker compose build api worker
docker compose build --no-cache frontend

# ── Step 3: Start / update services ───────────────────────────────────────────
# docker compose up -d will:
#   - Recreate containers whose image changed
#   - Leave unchanged containers running (no downtime for postgres/redis)
#   - The migrate service runs first (api depends_on it via service_completed_successfully)
#   - Restart nginx after to force DNS re-resolution of upstream IPs
echo ""
echo "[3/4] Starting services..."
docker compose up -d --remove-orphans
docker compose restart nginx

# ── Step 4: Health check ───────────────────────────────────────────────────────
echo ""
echo "[4/4] Checking API health..."

MAX_RETRIES=10
RETRY_DELAY=3
for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        echo "  API is healthy ✓"
        break
    fi
    if [ "$i" -eq "$MAX_RETRIES" ]; then
        echo "  ERROR: API health check failed after $((MAX_RETRIES * RETRY_DELAY))s"
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
