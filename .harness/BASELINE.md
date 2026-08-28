# Verified harness baseline — 2026-08-09

## Green checks

- Harness router, committed evals, and durable-context checks: 20 tests passed.
- Approved AAS skills: 12 checked, no policy findings.
- AAS catalog: 2,007 skills; pinned commit and index SHA-256 match.
- Project skills: 5/5 `SKILL.md` and `agents/openai.yaml` validations passed.
- Codex discovery: project-scoped `peaktalk-harness` is enabled; CodeGraph is
  registered globally once, with no project duplicate.
- CodeGraph: 223 files, 2,915 nodes, 5,800 edges; status and semantic smoke
  passed, with one workspace-scoped MCP process detected.
- Backend: 94 tests passed on Python 3.13.3.
- Frontend: lint, TypeScript, and production build pass after removing the
  incompatible `next-pwa` integration and replacing broad `date-fns` barrel
  imports with direct module imports.

## Known baseline findings

- `frontend/.env.local` and `backend/.env` were copied locally from the preserved
  source workspace with mode `0600`. Both remain ignored by Git; their contents
  were not printed or committed.
- Production declares Python 3.12; local verification used Python 3.13.3 because
  3.12 is not installed on this machine.
- Backend requirements contain unbounded direct dependencies (`supabase>=2.10.0`
  and `openai>=1.0.0`). The fresh resolver selected Supabase 2.16.0 and OpenAI
  2.53.0 after substantial backtracking. A lock or constraints file is needed
  before reproducibility can be claimed.
- The frontend production dependency tree currently has 5 high and 0 critical
  audit findings. The old `next-pwa` chain is removed. Remaining findings
  include Next.js 16.1.6, `nanoid`, `postcss`, `sharp`, and `ws`; the safe
  framework upgrade was attempted but the npm registry reset the connection.
  Do not run an automatic breaking `npm audit fix --force`. Treat a framework
  security upgrade as a separate release gate before public production traffic.
- Next.js reports that the `middleware` convention is deprecated in favor of
  `proxy`; this is a non-blocking framework migration warning and is not being
  changed as part of harness hardening.
- `npm audit --omit=dev --audit-level=critical` completes locally, but its high
  findings remain unresolved as documented above. The harness intentionally
  does not auto-apply force upgrades.
- Supabase 2.16.0 emits deprecation warnings for its legacy `gotrue` and
  `supafunc` packages.
- Docker is not installed locally, so Compose parsing and image builds were not
  verified here.
