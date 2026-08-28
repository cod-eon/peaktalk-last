# Harness and CodeGraph recovery

## Normal checks

```bash
node .harness/bin/harness.mjs status
node .harness/bin/harness.mjs codegraph-health
./.harness/scripts/doctor.sh
```

The workspace intentionally keeps one CodeGraph registration: the global
`mcp_servers.codegraph` entry. The project `.codex/config.toml` registers only
`peaktalk-harness`. Codex starts the global server with the current project cwd;
the bounded smoke check must report the PeakTalk index as up to date.

## If CodeGraph is unhealthy

1. Do not delete `.codegraph/` and do not kill unrelated processes.
2. Continue using the harness fallback order: MCP, CodeGraph CLI, then `rg`.
3. Run `codegraph status /Users/codeon/Documents/peaktalk-ai-workspace` and
   `codegraph sync /Users/codeon/Documents/peaktalk-ai-workspace` only when the
   index is stale and the working tree is safe to re-index.
4. Restart Codex if old MCP processes remain after the configuration change.
5. If a duplicate workspace-scoped `serve --mcp` process remains, inspect it
   before stopping it; record the process state and rerun the bounded health
   check.

The harness must remain usable while this is repaired. The AAS catalog is not a
dependency of CodeGraph and is not an active skill installation.
