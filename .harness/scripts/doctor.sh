#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
harness_dir="$(cd "$script_dir/.." && pwd)"
workspace_dir="$(cd "$harness_dir/.." && pwd)"

node "$harness_dir/bin/harness.mjs" status
node "$harness_dir/bin/harness.mjs" audit
npm --prefix "$harness_dir" test

skill_python=""
if [ -x "$workspace_dir/backend/.venv/bin/python" ]; then
  skill_python="$workspace_dir/backend/.venv/bin/python"
elif command -v python3.13 >/dev/null 2>&1; then
  skill_python="$(command -v python3.13)"
elif command -v python3 >/dev/null 2>&1; then
  skill_python="$(command -v python3)"
fi
if [ -z "$skill_python" ]; then
  echo "Python is required to validate project skills" >&2
  exit 1
fi
for skill_dir in "$workspace_dir"/.agents/skills/*; do
  [ -d "$skill_dir" ] || continue
  "$skill_python" "/Users/codeon/.codex/skills/.system/skill-creator/scripts/quick_validate.py" "$skill_dir"
done

global_codegraph_registrations="$(rg -c '^\[mcp_servers\.codegraph\]$' "/Users/codeon/.codex/config.toml" || echo 0)"
project_codegraph_registrations="$(rg -c '^\[mcp_servers\.codegraph\]$' "$workspace_dir/.codex/config.toml" || echo 0)"
if [ "$global_codegraph_registrations" != 1 ] || [ "$project_codegraph_registrations" != 0 ]; then
  echo "Expected one global CodeGraph registration and no project duplicate" >&2
  exit 1
fi

node "$harness_dir/bin/harness.mjs" codegraph-health

git -C "$workspace_dir" diff --check

tracked_secrets="$(git -C "$workspace_dir" ls-files | rg '(^|/)(\.env($|\.)|[^/]*\.(pem|key|p12|pfx)$|id_rsa|credentials)' | rg -v '\.env\.example$' || true)"
if [ -n "$tracked_secrets" ]; then
  echo "Potential secret-bearing files are tracked:" >&2
  echo "$tracked_secrets" >&2
  exit 1
fi

if [ "${1:-}" != "--full" ]; then
  echo "Quick harness doctor passed. Use --full for application checks."
  exit 0
fi

runner="$harness_dir/scripts/run-bounded.py"
"$skill_python" "$runner" --timeout 60 --cwd "$workspace_dir/frontend" -- npm run lint
"$skill_python" "$runner" --timeout 60 --cwd "$workspace_dir/frontend" -- npm run typecheck
"$skill_python" "$runner" --timeout 180 --cwd "$workspace_dir/frontend" \
  --env NEXT_IGNORE_INCORRECT_LOCKFILE=1 \
  --env NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key \
  --env NEXT_PUBLIC_API_URL=http://localhost:8000 \
  --env NEXT_PUBLIC_HCAPTCHA_SITEKEY=10000000-ffff-ffff-ffff-000000000001 \
  -- npm run build
audit_passed=false
for audit_attempt in 1 2 3; do
  if "$skill_python" "$runner" --timeout 45 --cwd "$workspace_dir/frontend" -- npm audit --omit=dev --audit-level=critical; then
    audit_passed=true
    break
  fi
  echo "npm audit attempt ${audit_attempt}/3 failed" >&2
done
if [ "$audit_passed" != true ]; then
  echo "npm audit did not complete successfully after three attempts" >&2
  exit 1
fi
echo "Dependency audit limitation: npm audit is evaluated at critical severity; known non-critical findings remain documented in .harness/BASELINE.md. Do not run npm audit fix --force automatically."
"$workspace_dir/backend/.venv/bin/python" -m pytest "$workspace_dir/backend"

if command -v docker >/dev/null 2>&1; then
  docker compose -f "$workspace_dir/docker-compose.yml" config --quiet
else
  echo "Docker unavailable; Compose validation skipped."
fi

echo "Full harness doctor passed."
