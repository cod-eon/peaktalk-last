#!/bin/bash
# PeakTalk VDS deploy script (Ubuntu 22.04)
# Usage: ./deploy.sh
set -e

echo "=== PeakTalk Deploy ==="

# 1. Pull latest
git pull origin main

# 2. Run migrations (separate one-shot container)
echo "→ Running migrations..."
docker compose run --rm migrate

# 3. Build & restart services
echo "→ Building images..."
docker compose build api worker frontend

echo "→ Restarting services..."
docker compose up -d api worker frontend

echo "→ Checking health..."
sleep 5
curl -sf http://localhost:8000/health && echo " API OK" || echo " API health check failed"

echo "=== Deploy complete ==="
