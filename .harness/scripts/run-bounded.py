#!/usr/bin/env python3
"""Run a local verification command with a hard timeout and no orphan children."""

import argparse
import os
import signal
import subprocess
import sys


parser = argparse.ArgumentParser()
parser.add_argument("--timeout", type=float, required=True)
parser.add_argument("--cwd", required=True)
parser.add_argument("--env", action="append", default=[])
parser.add_argument("command", nargs=argparse.REMAINDER)
args = parser.parse_args()

if args.command[:1] == ["--"]:
    args.command = args.command[1:]
if not args.command:
    parser.error("a command is required")

environment = os.environ.copy()
for item in args.env:
    key, separator, value = item.partition("=")
    if not separator or not key:
        parser.error(f"invalid --env value: {item}")
    environment[key] = value

process = subprocess.Popen(
    args.command,
    cwd=args.cwd,
    env=environment,
    start_new_session=True,
)
try:
    exit_code = process.wait(timeout=args.timeout)
except subprocess.TimeoutExpired:
    print(f"TIMEOUT after {args.timeout:g}s: {' '.join(args.command)}", file=sys.stderr)
    os.killpg(process.pid, signal.SIGTERM)
    try:
        process.wait(timeout=3)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGKILL)
        process.wait()
    raise SystemExit(124)

raise SystemExit(exit_code)
