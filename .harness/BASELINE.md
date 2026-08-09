# Verified baseline — 2026-08-09

## Green checks

- Harness router: 8 protocol, policy, and lifecycle tests passed.
- Approved AAS skills: 12 checked, no policy findings.
- AAS catalog: 2,007 skills; pinned commit and index SHA-256 match.
- Codex discovery: project-scoped `peaktalk-harness` and `codegraph` MCP
  servers are enabled.
- CodeGraph: 225 files, 2,495 nodes, 4,890 edges; index up to date.
- Frontend lint: passed.
- Frontend production build: passed with non-secret placeholder values matching
  the variables declared in `frontend/.env.example`.
- Backend: 92 tests passed on Python 3.13.3.

## Known baseline findings

- A frontend build without environment values fails during prerender, as it
  should, because the Supabase client requires a URL and public anon key. No real
  `.env` file was copied.
- Production declares Python 3.12; local verification used Python 3.13.3 because
  3.12 is not installed on this machine.
- Backend requirements contain unbounded direct dependencies (`supabase>=2.10.0`
  and `openai>=1.0.0`). The fresh resolver selected Supabase 2.16.0 and OpenAI
  2.53.0 after substantial backtracking. A lock or constraints file is needed
  before reproducibility can be claimed.
- The production frontend dependency tree has 16 audit findings when dev
  dependencies are omitted: 15 high and 1 low, 0 critical. Direct findings
  include Next.js 16.1.6 and the old `next-pwa` chain. Do not run an automatic
  breaking `npm audit fix --force`; investigate and upgrade as a dedicated task.
- Next.js reports that the `middleware` convention is deprecated in favor of
  `proxy`.
- Supabase 2.16.0 emits deprecation warnings for its legacy `gotrue` and
  `supafunc` packages.
- Docker is not installed locally, so Compose parsing and image builds were not
  verified here.
