#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
harness_dir="$(cd "$script_dir/.." && pwd)"
workspace_dir="$(cd "$harness_dir/.." && pwd)"

node "$harness_dir/bin/harness.mjs" status
node "$harness_dir/bin/harness.mjs" audit
npm --prefix "$harness_dir" test

git -C "$workspace_dir" diff --check

tracked_secrets="$(git -C "$workspace_dir" ls-files | rg '(^|/)(\.env($|\.)|[^/]*\.(pem|key|p12|pfx)$|id_rsa|credentials)' | rg -v '\.env\.example$' || true)"
if [ -n "$tracked_secrets" ]; then
  echo "Potential secret-bearing files are tracked:" >&2
  echo "$tracked_secrets" >&2
  exit 1
fi

if command -v codegraph >/dev/null 2>&1; then
  codegraph status "$workspace_dir"
fi

if [ "${1:-}" != "--full" ]; then
  echo "Quick harness doctor passed. Use --full for application checks."
  exit 0
fi

npm run lint --prefix "$workspace_dir/frontend"
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key \
NEXT_PUBLIC_API_URL=http://localhost:8000 \
NEXT_PUBLIC_HCAPTCHA_SITEKEY=10000000-ffff-ffff-ffff-000000000001 \
  npm run build --prefix "$workspace_dir/frontend"
audit_passed=false
for audit_attempt in 1 2 3; do
  if npm audit --prefix "$workspace_dir/frontend" --omit=dev --audit-level=critical; then
    audit_passed=true
    break
  fi
  echo "npm audit attempt ${audit_attempt}/3 failed" >&2
done
if [ "$audit_passed" != true ]; then
  echo "npm audit did not complete successfully after three attempts" >&2
  exit 1
fi
"$workspace_dir/backend/.venv/bin/python" -m pytest "$workspace_dir/backend"

if command -v docker >/dev/null 2>&1; then
  docker compose -f "$workspace_dir/docker-compose.yml" config --quiet
else
  echo "Docker unavailable; Compose validation skipped."
fi

echo "Full harness doctor passed."
