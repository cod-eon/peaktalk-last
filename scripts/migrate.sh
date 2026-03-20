#!/bin/bash
# =============================================================================
# PeakTalk — Run Alembic Migrations
# =============================================================================
# Runs database migrations inside a temporary Docker container.
#
# Usage:
#   ./scripts/migrate.sh                     # Apply all pending migrations
#   ./scripts/migrate.sh current             # Show current revision
#   ./scripts/migrate.sh history             # Show full migration history
#   ./scripts/migrate.sh downgrade -1        # Downgrade one revision (careful!)
#
# This script is called by deploy.sh and the GitHub Actions workflow.
# You can also run it manually on the VDS when needed.
# =============================================================================

set -euo pipefail

# Change to project root (so docker-compose.yml is found correctly)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "=== PeakTalk Migrations ==="

if [ $# -eq 0 ]; then
    # Default: apply all pending migrations
    echo "Command: alembic upgrade head"
    echo "Starting migrate container..."
    # docker compose run --rm <service> [override command]
    # We override the service command entirely so we control it here
    docker compose run --rm --entrypoint="" migrate alembic upgrade head
else
    # Custom alembic command passed as arguments
    echo "Command: alembic $*"
    echo "Starting migrate container..."
    docker compose run --rm --entrypoint="" migrate alembic "$@"
fi

echo "=== Migrations complete ==="
