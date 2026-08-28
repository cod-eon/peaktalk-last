# Workspace migration and rollback record

## Clean workspace creation

- Created: 2026-08-09
- Source working tree: `/Users/codeon/peaktalk-last`
- Pre-pivot product commit: `7c533af6d008bb0aced46701635f2c33233c06f0`
- Canonical remote: `https://github.com/cod-eon/peaktalk-last.git`
- Active branch: `codex/pre-pivot-harness`

The clean workspace retains the pre-pivot frontend and backend product code,
the newer deployment hardening, and the new harness. Legacy agent rules, old
skills, stale docs, screenshots, generated artifacts, and the standalone
Remotion project are not active.

## Aura/Workspace backup

Before rollback, the complete Aura/Workspace working state and harness were
committed as:

- Branch: `codex/backup-aura-workspace-2026-08-09`
- Commit: `ff1228cbf1f21ea7426dc1ab4cc8c9f81ff5ba72`
- Commit message: `backup: preserve Aura workspace and harness before rollback`

An independent full-history Git bundle was created and verified:

- File: `/Users/codeon/Documents/peaktalk-backups/peaktalk-before-prepivot-rollback-2026-08-09.bundle`
- SHA-256: `769fb87c044e6aec9c200b406e967ddc84a899df5700a3f36955547190ad48f7`
- Verification: `git bundle verify` reported a complete history.

The original `/Users/codeon/peaktalk-last` directory was not modified and
remains another local recovery source.

## Active-tree policy

- Product code comes from the pre-pivot snapshot.
- Harness files come from the verified backup commit.
- CI, deploy, Docker Compose, and Nginx hardening come from the latest preserved
  working state because reverting operational safety was not part of the product
  rollback.
- `frontend/.env.local` and `backend/.env` were copied from the preserved source
  workspace with mode `0600`; both are ignored and must never be committed.
