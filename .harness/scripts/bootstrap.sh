#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
harness_dir="$(cd "$script_dir/.." && pwd)"
workspace_dir="$(cd "$harness_dir/.." && pwd)"
python_bin=""

command -v node >/dev/null 2>&1 || { echo "Node.js is required" >&2; exit 1; }
command -v git >/dev/null 2>&1 || { echo "Git is required" >&2; exit 1; }

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 22 ]; then
  echo "Node.js 22 or newer is required; found $(node --version)" >&2
  exit 1
fi

if command -v python3.12 >/dev/null 2>&1; then
  python_bin="$(command -v python3.12)"
elif command -v python3 >/dev/null 2>&1; then
  python_bin="$(command -v python3)"
  echo "Warning: Python 3.12 is preferred; using $($python_bin --version 2>&1)" >&2
else
  echo "Python 3.12 is required" >&2
  exit 1
fi

"$script_dir/setup-aas.sh"
npm ci --prefix "$workspace_dir/frontend"

if [ ! -x "$workspace_dir/backend/.venv/bin/python" ]; then
  "$python_bin" -m venv "$workspace_dir/backend/.venv"
fi
"$workspace_dir/backend/.venv/bin/python" -m pip install --upgrade pip
"$workspace_dir/backend/.venv/bin/python" -m pip install -r "$workspace_dir/backend/requirements.txt"

if command -v codegraph >/dev/null 2>&1; then
  if [ -d "$workspace_dir/.codegraph" ]; then
    codegraph sync "$workspace_dir"
  else
    codegraph init "$workspace_dir"
  fi
else
  echo "Warning: CodeGraph is unavailable; code navigation will fall back to local search" >&2
fi

"$script_dir/doctor.sh"

if [ "${1:-}" = "--full" ]; then
  "$script_dir/doctor.sh" --full
fi
