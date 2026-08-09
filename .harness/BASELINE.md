# Verified baseline — 2026-08-09

## Green checks

- Harness router: 8 protocol, policy, and lifecycle tests passed.
- Approved AAS skills: 12 checked, no policy findings.
- AAS catalog: 2,007 skills; pinned commit and index SHA-256 match.
- Codex discovery: project-scoped `peaktalk-harness` and `codegraph` MCP
  servers are enabled.
- CodeGraph: 215 files, 2,865 nodes, 5,688 edges; index up to date.
- Frontend lint: passed.
- Frontend production build: passed and generated 33 static pages.
- Backend: 92 tests passed on Python 3.13.3.

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
- The frontend dependency tree has 17 audit findings: 16 high and 1 low, 0
  critical. Direct findings
  include Next.js 16.1.6 and the old `next-pwa` chain. Do not run an automatic
  breaking `npm audit fix --force`; investigate and upgrade as a dedicated task.
- Next.js reports that the `middleware` convention is deprecated in favor of
  `proxy`.
- Supabase 2.16.0 emits deprecation warnings for its legacy `gotrue` and
  `supafunc` packages.
- Docker is not installed locally, so Compose parsing and image builds were not
  verified here.
