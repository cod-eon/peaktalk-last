# 0017 — Better Auth migration decision brief

Status: production cutover authorized; execution remains conditional on the release gates below

## Problem

PeakTalk currently relies on a production Logto authentication boundary documented by decisions 0007 and 0010–0014. The requested target is a production-ready migration to Better Auth, followed by removal of legacy Logto authentication data only after a production audit, real end-to-end verification, and one gated deploy.

This decision authorizes the local implementation and verification of the replacement architecture. Production execution authority was subsequently granted on 2026-08-13, within the bounded scope recorded below.

## Production execution authority (2026-08-13)

The owner explicitly authorized the Better Auth production configuration and deploy to the documented PeakTalk VDS. This authorizes only:

- creating or updating the Better Auth runtime variables in the existing restricted VDS environment files;
- building and deploying one immutable release artifact through the established GitHub Actions → VDS workflow;
- running additive migration `0023_add_better_auth_schema.py`, the existing backup command, Nginx runtime validation, health checks and the real browser/mailbox acceptance matrix;
- removing the inactive DevCycle runtime integration, because it has no callers beyond application startup and imports an unfixed vulnerable `wasmtime` transitively.

It does **not** authorize Logto data/runtime cleanup in this deploy. Logto remains the rollback path until the new production flow passes the real mailbox/browser matrix and the separate cleanup manifest is approved. No secret may be committed, printed, or copied into the decision record.

## Current facts

- FastAPI is the server-side authorization boundary and maps external subjects to local PeakTalk UUIDs through `user_identities`.
- Before this migration, the frontend used a server-side Logto session and sent an API resource bearer token to FastAPI; the local working tree now implements the Better Auth cookie/session boundary below.
- Existing decisions require verified email for safe linking, explicit issuer/audience/signature/expiry validation, negative authorization cases, bounded recovery, and preservation of local ownership.
- Auth and Storage migrations are separate releases.
- Production deploy and destructive cleanup require explicit execution-scoped authority, verified backup/recovery, an exact target manifest, and fresh evidence.
- The working tree already contains user changes, including auth-related files; this preparation must not overwrite or reinterpret them as migration work.

## Desired user outcome

A PeakTalk user can register, verify email, sign in, recover access, sign out, and use protected product flows through Better Auth without losing the local PeakTalk identity or ownership of documents, simulations, billing state, or Defense Briefs. Unauthorized, cross-user, stale-session, and legacy-provider access remains rejected.

## Options

### A. Keep Logto and harden the current integration

Lowest migration risk and operational change, but does not satisfy the requested Better Auth target.

### B. Replace Logto with Better Auth in one irreversible cutover

Shortest nominal path, but combines identity migration, session cutover, runtime changes, production deployment, and cleanup. Rollback and attribution of failures are weak. Rejected.

### C. Introduce Better Auth behind a reversible provider boundary, preserve local identities, audit production, then remove Logto in a later destructive step

Recommended direction. It preserves local UUID ownership, permits explicit compatibility and negative-case verification, and keeps cleanup separate from cutover. It costs temporary dual-provider operational complexity and requires an exact session/token bridge design before implementation.

## Recommendation

Proceed with the accepted single-provider replacement architecture above. Local implementation is approved; production execution remains blocked until the gates below have fresh PASS evidence. Use a single gated application deploy for the cutover, with preflight and rollback prepared before external action. Treat Logto-data deletion as an allowlisted final action in the one gated cutover, after replacement verification and immediately before retiring the provider runtime; it is authorized in scope but not authorized for execution in this stage.

## Accepted decision and owner approval (2026-08-12)

The owner explicitly approved permanent deletion of the six audited Logto accounts and all related legacy Logto auth/session data during the later gated cutover; no account preservation or identity migration is required. The approval quote is recorded as: “продолжай! подтверждаю, можешь бесстрашно удалять”. This closes the user-data cleanup decision gate only. It does not authorize deletion now and does not relax the requirement for one production deploy after every mandatory PASS gate.

Accepted architecture for local implementation:

- Better Auth runs inside the existing Next.js service at the same public origin as PeakTalk and owns browser registration, verified-email login, password recovery, session creation, rotation and revocation. PostgreSQL is the sole durable auth store, using Better Auth's generated schema in the existing application database; tables are additive and isolated from PeakTalk domain tables.
- The browser credential is Better Auth's host-only HTTP-only cookie with `Secure` in production, `SameSite=Lax`, path `/`, a seven-day absolute session lifetime, daily rolling update, database-backed revocation, POST logout, and revocation of all sessions after password reset. Cross-subdomain cookies and client-readable bearer tokens are prohibited.
- Next.js exposes the official Better Auth handler under `/api/auth/[...all]`. Better Auth `trustedOrigins` is the exact configured public origin allowlist; origin checking stays enabled. Application return paths remain internal-only. Nginx adds a dedicated auth rate limit while Better Auth applies database-backed endpoint rules.
- FastAPI remains the authorization and ownership boundary. For every protected request it forwards only the incoming cookie header to a private Next.js session-introspection endpoint, which uses the official `auth.api.getSession({headers})`; no custom signature, ROPC, browser token storage, or offline JWT is introduced. FastAPI accepts only a verified Better Auth email/subject, maps `(provider=better-auth, subject)` to a local UUID, and validates allowed Origin/Referer on unsafe cookie-authenticated methods. Authentication failures use stable machine-readable codes and logs contain rejection categories, not tokens, cookies, emails, or subjects.
- Verification and reset delivery run through Better Auth callbacks using a configured REG.RU SMTP mailbox or the existing Resend fallback. Secret values remain runtime-only. Verification is required before protected access; reset links have a bounded lifetime and reset revokes sessions.
- Because the audited application `users` and `user_identities` tables are empty, no local ownership migration or unsafe email linking is required for the six Logto-only accounts. New Better Auth identities provision new local UUIDs only after verified email. Existing Logto sessions are intentionally invalidated at cutover; no dual-provider bridge is built.
- Decisions 0013 and 0014 remain historical and are marked superseded by this decision. Runtime rollback restores the prior immutable application while leaving additive Better Auth tables intact. Destructive Logto cleanup is part of the same later gated cutover only after backup/restore, migration, health, real mailbox/browser E2E, rollback, and exact manifest gates pass.

Implementation may proceed locally. Production topology values, secrets, immutable artifact, operator, mailbox test account, verification window, fresh backup/restore evidence, and cleanup command manifest are execution facts that must be supplied and pass at deploy preflight; they do not justify guessing or production action now.

## Production execution gates (still required before the single deploy)

1. **Better Auth topology and ownership:** confirm where Better Auth runs, which component owns browser sessions, its database/schema boundary, public callback origin, email delivery, backup, monitoring, and upgrades.
2. **FastAPI credential contract:** choose and document how FastAPI authenticates Better Auth sessions (for example, server-side session verification or a narrowly scoped signed API credential), including issuer/key rotation, audience, expiry, revocation, CSRF, cookie, and CORS behavior. Do not assume the current Logto JWT contract transfers unchanged.
3. **Identity mapping:** approve provider/subject mapping, verified normalized-email linking rules, collision handling, reauthentication, admin authorization, and treatment of existing Logto identities. Local PeakTalk UUIDs and ownership must remain stable.
4. **Session cutover:** decide whether existing Logto sessions are intentionally invalidated or temporarily bridged, define user messaging and recovery, and set a bounded rollback window.
5. **Production audit baseline:** identify the authoritative inventories for active users, identities, sessions, admin bindings, callbacks, email flows, and recoverable backups without printing secrets or personal data.
6. **Real E2E environment and owner:** name the production-like/production execution environment, test accounts, email inbox control, browser coverage, evidence retention, and operator.
7. **Single gated deploy:** approve exact commit/artifact, configuration manifest, database migration sequence, maintenance behavior, health checks, rollback trigger, rollback owner, and verification window.
8. **Logto cleanup:** after successful audit and E2E, provide a separate exact deletion manifest, backup verification, retention period, owner, and explicit destructive authority. No Logto data deletion is authorized by this brief.

## Acceptance criteria for the future migration

- Registration, email verification, login, logout, password recovery, session expiry, and reauthentication pass in a real browser against the approved environment.
- A verified Better Auth identity resolves to the intended existing or newly provisioned local PeakTalk UUID without unsafe email auto-linking.
- Protected routes, onboarding, guest-to-user transition, document ownership, simulation, Defense Brief access, billing/admin boundaries, and typed core flow pass.
- Negative cases reject unverified email, missing/expired/revoked credentials, malformed signatures, wrong audience/origin, CSRF attempts, ordinary-user access to admin routes, cross-user object access, and legacy Logto credentials after cutover.
- Secrets, cookies, JWTs, credentials, and personal data do not appear in committed files, command output, CI logs, screenshots, or handoff evidence.
- Preflight identifies the exact immutable artifact, configuration hash, schema migration, backup, health checks, rollback trigger, owner, and prior artifact.
- One explicitly approved deploy completes; health and real E2E evidence pass within the verification window or rollback is executed.
- Logto runtime and data remain intact until the post-deploy production audit is accepted and a separate cleanup authorization names exact targets.

## Required evidence before production cutover can be called ready

- Acceptance criteria mapped to automated tests and real E2E steps.
- Better Auth threat review and auth-negative-case matrix.
- Environment/configuration and schema-migration review with no secret values.
- Deploy preflight, health-check plan, and tested rollback/recovery procedure.
- Production audit and cleanup manifests that identify categories/counts and exact targets without exposing sensitive values.

## Rollback and recovery direction

Before cutover, preserve the previous verified application artifact and configuration, take and verify required database backups, and define a schema-compatible rollback. Rollback restores the prior application/configuration without deleting Better Auth or Logto data. Any irreversible schema or identity transformation requires its own approved recovery proof before deploy.

## Non-goals

- Before the 2026-08-13 authority record, no production mutation, deploy, credential rotation, or cleanup was permitted. The bounded VDS configuration described above is now permitted; deployment still requires every applicable release gate to pass.
- No user import, credential exposure, data deletion, or Logto cleanup is authorized in this cutover.
- No Storage migration or product-flow redesign.
- No weakening of server-side authorization, verified-email requirements, or local ownership boundaries.
- No claim that Better Auth is production-ready before fresh build, test, environment, E2E, health, rollback, and risk evidence exists.


## Local implementation evidence

The implementation was first completed locally without production access, deploy, SSH, data mutation, secret reads, or commit. Under the later 2026-08-13 authority record, the VDS received only redacted Better Auth runtime configuration with protected backup copies; no mail password, deploy, migration, user data, or Logto runtime was changed.

- Better Auth is the Next.js auth authority through the official catch-all handler and React client, backed by the existing PostgreSQL database.
- Repository migration `0023_add_better_auth_schema.py` adds the isolated core Better Auth tables and reversible indexes/constraints.
- Verification and password-reset callbacks use the existing Resend transport contract; examples contain variable names only.
- Browser API calls now use the host-only cookie path with `credentials: include`; FastAPI forwards only `Cookie` to server-side session introspection and rejects unsafe methods from untrusted origins.
- Branded login, registration, verification, reset, loading and error states use allowlisted internal return paths. Logout uses the official session revocation endpoint; password reset revokes sessions.
- Active Logto application, Docker network, nginx virtual hosts and CI runtime wiring were removed. Decisions 0013/0014 remain historical and superseded; executable stale runbook instructions were replaced by historical pointers and `docs/operations/better-auth-runbook.md`.

Fresh local checks are recorded in the harness contract. The current required local gate set is full frontend lint, typecheck/build, full and focused backend tests, migration validation, active legacy-provider scan, diff check, and harness tests/audit. Browser/mailbox and deployment evidence cannot be replaced by mocked sessions or source inspection.

Production cutover, migrations against production data and deployment remain conditional on the release gates. Provider cleanup remains outside the authority of this cutover; secrets remain runtime-only.
