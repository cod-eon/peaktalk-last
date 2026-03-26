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
#   3. Run Alembic migrations
#   4. Restart services with zero-downtime (rolling restart)
#   5. Health check
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
echo "[1/5] Pulling latest code from main..."
git pull origin main

# ── Step 2: Build Docker images ───────────────────────────────────────────────
# api and worker use layer cache (Python deps rarely change).
# frontend is always built --no-cache: NEXT_PUBLIC_* vars are baked into
# the JS bundle at build time, and BuildKit cache on VDS can silently reuse
# a stale image even when source files changed.
echo ""
echo "[2/5] Building Docker images..."
docker compose build api worker
docker compose build --no-cache frontend

# ── Step 3: Run database migrations ──────────────────────────────────────────
# The migrate service is a one-shot container that runs alembic upgrade head.
# It waits for postgres to be healthy before running.
echo ""
echo "[3/5] Running database migrations..."
docker compose run --rm migrate

# ── Step 4: Restart services ──────────────────────────────────────────────────
# docker compose up -d will:
#   - Start services that aren't running
#   - Restart services whose image has changed
#   - Leave services unchanged if nothing changed
# This gives us a near-zero-downtime restart (nginx keeps accepting requests
# while containers restart one by one).
echo ""
echo "[4/5] Restarting services..."
# Remove stale stopped containers to avoid name conflicts on recreation
docker compose rm -f api worker frontend 2>/dev/null || true
docker compose up -d api worker frontend nginx
# Restart nginx to force DNS re-resolution of upstream IPs after container recreation
docker compose restart nginx

# ── Step 5: Health check ──────────────────────────────────────────────────────
echo ""
echo "[5/5] Checking API health..."

# Wait up to 30 seconds for the API to respond
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

# Print running containers
echo ""
echo "Running containers:"
docker compose ps

echo ""
echo "=============================================="
echo "  Deploy complete!"
echo "=============================================="
