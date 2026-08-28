# Auth migration stale-instruction removal report — 2026-08-12

Scope: repository documentation/runtime only; no production, SSH, deploy, secret, commit or provider-data action.

Removed or replaced:

- Retired frontend callback/sign-in/sign-out/access-token routes and provider client/runtime files (already represented as deletions in the working tree).
- Retired backend provider validation service/test (already represented as deletions in the working tree).
- Active Compose, nginx and deployment-workflow provider wiring (already removed in the working tree).
- Executable content in `docs/operations/logto-auth-runbook.md` and `docs/operations/logto-runbook.md`; both are now non-operational historical pointers.
- Stale active provider references in current domain/TLS and PostgreSQL recovery docs; dated audit/inventory and decisions remain historical evidence.

Preserved intentionally:

- Decisions 0013 and 0014, explicitly marked historical and superseded by decision 0017.
- Decision 0017 migration rationale and cleanup gates.
- Dated read-only audit/inventory records needed to explain the previous topology and later exact cleanup manifest.
- Protected files matching `* 2*`, untouched.
