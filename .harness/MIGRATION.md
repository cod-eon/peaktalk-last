# Workspace migration record

- Created: 2026-08-09
- Source working tree: `/Users/codeon/peaktalk-last`
- Source commit: `7c533af6d008bb0aced46701635f2c33233c06f0`
- Canonical remote: `https://github.com/cod-eon/peaktalk-last.git`
- Working branch: `codex/harness-bootstrap`
- Migration mode: independent Git clone plus a selective overlay of the source
  working tree

## Preserved

- Complete Git history.
- Current tracked and untracked frontend Aura/Workspace rewrite.
- Backend application, tests, Alembic migrations, and dependency manifests.
- Docker, Nginx, deploy, CI workflow, and operational scripts that are still part
  of the application runtime.

## Deliberately omitted from the active tree

- Previous `AGENTS.md`, `CLAUDE.md`, design rules, agent definitions, and project
  skills.
- Old internal docs, research transcripts, visual QA artifacts, and root
  screenshots.
- The standalone Remotion marketing animation project.
- PDF rendering scripts and an isolated enum test script.
- Local `.env` files, the temporary key file, dependencies, virtual
  environments, generated PWA files, build output, and tool caches.
- The old CodeGraph database; a new path-correct index was built instead.

All tracked omissions remain recoverable from Git history. The source directory
was not modified and remains an additional rollback copy.

The target uses HTTPS because the machine's SSH GitHub host key was not trusted;
HTTPS fetch was verified successfully. The local snapshot commit is one commit
ahead of the fetched `origin/main` baseline.
