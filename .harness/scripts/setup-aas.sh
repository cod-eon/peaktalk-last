#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
harness_dir="$(cd "$script_dir/.." && pwd)"
lock_file="$harness_dir/catalogs/aas.lock.json"
vendor_dir="$harness_dir/vendor/aas"

repository="$(node -e 'const x=require(process.argv[1]); process.stdout.write(x.repository)' "$lock_file")"
commit="$(node -e 'const x=require(process.argv[1]); process.stdout.write(x.commit)' "$lock_file")"

mkdir -p "$harness_dir/vendor"

if [ ! -d "$vendor_dir/.git" ]; then
  git clone --filter=blob:none --no-checkout "$repository" "$vendor_dir"
fi

git -C "$vendor_dir" sparse-checkout init --cone
git -C "$vendor_dir" sparse-checkout set data skills LICENSE LICENSE-CONTENT
git -C "$vendor_dir" fetch --depth 1 origin "$commit"
git -C "$vendor_dir" checkout --detach "$commit"

actual="$(git -C "$vendor_dir" rev-parse HEAD)"
if [ "$actual" != "$commit" ]; then
  echo "AAS checkout mismatch: expected $commit, got $actual" >&2
  exit 1
fi

node "$harness_dir/bin/harness.mjs" status
node "$harness_dir/bin/harness.mjs" audit
