# Logto → Better Auth read-only audit

Status: audit accepted; local implementation authorized; production deploy and cleanup remain blocked

## Owner approval addendum (2026-08-12)

The owner explicitly authorized permanent deletion of the audited six Logto accounts and all related legacy Logto auth/session state during the later single gated cutover; preservation and user migration are not required. No production deletion or deploy is authorized in the current stage. Decision 0017 records the accepted local architecture and the remaining production PASS gates.

## Scope and safety

This report records a read-only repository and production preflight. No application code, runtime configuration, database row, Redis key, container, deployment, secret, or pre-existing uncommitted file was changed. Files matching `* 2*` were excluded. Secret values, connection strings, emails, tokens, cookies, JWTs, credentials, PII, and Redis values were neither collected nor recorded.

Repository and deployed commit: `5507396b9a60418862a29d34def326faf12d6984` on `codex/pre-pivot-harness`. Production `/opt/peaktalk` had four pre-existing dirty paths (`backend/.env.example`, `frontend/.env.example`, deleted `ops/logto/.env.example`, and `.release/`); they were not touched.

Navigation followed the required order: CodeGraph health and bounded exploration first (index current: 243 files, 4,043 nodes), then bounded CodeGraph CLI exploration, then focused Git/grep inspection.

## Gate reconciliation

The current explicit instruction authorizes the migration goal, this read-only production SSH audit, eventual deletion of **old Logto auth data only** after proving the relevant auth state empty, one later deploy after every mandatory gate passes, official Better Auth, secure HTTP-only cookies, CSRF/origin/redirect controls, rate limits, verification and recovery, and real non-mocked E2E. It also requires decisions 0013/0014 to remain as history and later be marked superseded.

That authorization resolves the earlier brief's prohibition on **read-only production access**. It does not authorize implementation or deployment in this stage. It also does not authorize deletion now: production Logto is not empty. The task contract correctly remains `awaiting-decision`; its stale “production access” non-goal is superseded only for this explicitly requested read-only audit and was not edited while the lifecycle is blocked.

Still unresolved before implementation:

1. Better Auth deployment topology, component/session ownership, exact database/schema boundary, public auth origin, mail transport ownership, monitoring, backup, and upgrade policy.
2. Exact FastAPI credential contract: server-side cookie/session verification versus a narrowly scoped signed API credential; expiry, revocation, key rotation, and audience semantics.
3. Identity mapping for the six existing Logto users: verified-email linking/collision behavior, subject mapping, reauthentication, admin mapping, and preservation of PeakTalk UUID ownership.
4. Session cutover behavior for existing Logto authorization/session records: forced logout versus bounded bridge, user messaging, and rollback window.
5. Named real-E2E environment, isolated mailbox/account ownership, browser matrix, operator, and evidence retention.
6. Exact deploy artifact/configuration manifest, migration order, maintenance behavior, verification window, rollback trigger, and owner.
7. A separate cleanup manifest and retention/backup decision. The user's conditional deletion authority is not exercisable because auth data is present.

## Repository inventory

### Frontend SDK, routes, session, and redirects

- Dependencies: `@logto/next` and `@logto/js` in `frontend/package.json` and lockfile.
- Configuration: `frontend/src/lib/logto.ts`; secure cookie mode is tied to production, API resource scope is configured, and internal return paths reject absent, non-rooted, and protocol-relative values.
- Entry routes: `/api/auth/logto/sign-in`, `/sign-up`, `/callback`, `/sign-out`; legacy `/auth/callback` redirects to the canonical callback.
- Login/register/recovery UI: `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`; recovery opens Logto's reset-password screen.
- Browser session API: `/api/auth/session` fetches Logto server context and exposes only signed-out, verification-required, or ready state.
- API credential bridge: `/api/auth/access-token` obtains the Logto resource token and emits a five-minute HMAC identity assertion only for a verified email. Responses are `no-store`.
- API client: `frontend/src/lib/api.ts` gets credentials with cookies included, sends bearer plus `X-PeakTalk-Identity`, retries once after a 401 if credentials changed, then forces reauthentication with a 30-second browser cooldown.
- Return-path controls exist in both `safeReturnPath` and `frontend/src/lib/return-path.ts`; callback return state is held in a secure, HTTP-only, SameSite=Lax, ten-minute cookie and deleted after use.
- Direct Logto dependencies also appear in settings, admin logout, simulation recovery, onboarding, verification, sidebars, maintenance UI, privacy/legal copy, and auth styles.

### Backend boundary

- `backend/app/config.py` permits only `AUTH_PROVIDER=logto` and defines issuer, JWKS, userinfo, audience, required scopes, assertion secret, and timeout.
- `backend/app/services/logto_auth.py` accepts only ES384/RS256, requires issuer/audience/expiry/issued-at/subject, validates required scopes, verifies assertion signature/audience/lifetime/verified email, binds assertion subject to bearer subject, and otherwise calls userinfo.
- `backend/app/dependencies.py` applies bearer authentication to protected API dependencies, validates every request, resolves `(provider=logto, subject)`, links by normalized email only after verification, and provisions a local UUID/user identity when absent.
- `backend/app/models/user_identity.py` stores provider, subject, normalized email, and stable local user ownership with unique provider+subject and indexed provider+email.
- Alembic `0022_add_user_identities.py` creates this table. There is no application auth-session table and no Better Auth schema/migration.
- CORS allows configured origins with credentials. SlowAPI and nginx provide general API/IP limits, but repository evidence does not show dedicated rate limits for the Next.js `/api/auth/*` routes.
- Auth warnings record rejection categories, but some existing auth log statements elsewhere include user identifiers/email; logging redaction must be part of implementation review.

### Runtime, CI, deploy, and documentation

- `docker-compose.yml` connects nginx to the external Logto network; `ops/logto/docker-compose.yml` runs pinned Logto and isolated PostgreSQL.
- `nginx/nginx.conf` exposes Logto public/admin origins, proxies `/api/auth/*` to Next.js, passes cookies, enforces TLS/security headers, and applies limits to general API/upload paths—not explicitly to auth paths.
- `.github/workflows/deploy.yml` requires Logto secret variable names, writes frontend auth configuration, activates the Logto backend provider, deploys an immutable SHA-tagged application image set, and checks public health.
- `deploy.sh` requires a database backup command, verified image archive/checksum, records deployment state, runs migration, verifies health, and can restore the prior application image tag. This is an application runtime rollback, not a tested Better Auth schema rollback.
- Operational authority is spread across decisions 0003, 0007, 0010–0014 and the two Logto runbooks. Decisions 0013/0014 must remain historical and may only be marked superseded after the replacement decision is accepted.
- Auth-focused coverage is concentrated in `backend/tests/test_logto_auth.py`; `frontend/src/lib/return-path.test.ts` covers return paths. Other backend fixtures bypass authentication for feature tests. No real browser/mailbox Better Auth E2E exists.

### Environment variable names only

Observed repository/runtime auth-related names include: `APP_BASE_URL`, `AUTH_PROVIDER`, `LOGTO_ADMIN_ENDPOINT`, `LOGTO_API_RESOURCE`, `LOGTO_APP_ID`, `LOGTO_APP_SECRET`, `LOGTO_AUDIENCE`, `LOGTO_COOKIE_SECRET`, `LOGTO_DB_NAME`, `LOGTO_DB_PASSWORD`, `LOGTO_DB_USER`, `LOGTO_ENDPOINT`, `LOGTO_IDENTITY_ASSERTION_SECRET`, `LOGTO_SECRET_VAULT_KEK`, `NODE_ENV`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, `POSTGRES_USER`, `REDIS_URL`, and `TRUST_PROXY_HEADER`. Values were not read or recorded.

## Current authentication lifecycle

1. **Register:** local `/register` preserves a validated internal return path and redirects to Logto sign-up. Logto owns password collection and email dispatch. Callback establishes the encrypted server session and returns to onboarding by default.
2. **Verification:** session state blocks unverified/missing email. `/verify-email` polls the server session and can force a fresh login. FastAPI independently refuses access without a verified profile/assertion.
3. **Login:** local `/login` redirects to Logto sign-in; a secure short-lived return cookie survives the callback. Login clears existing Logto tokens.
4. **Refresh/rotation:** the SDK manages the server-side Logto token/session. The application requests an access token per API operation, retries one 401 only if credentials changed, then enters bounded reauthentication. Rotation ownership and revocation latency are SDK/Logto behavior, not explicitly specified by application code.
5. **Logout:** GET `/api/auth/logto/sign-out` invokes Logto logout and validates the local return path. A state-changing GET and absence of an explicit app-level CSRF check should be redesigned for Better Auth.
6. **Recovery/reset:** the local recovery page opens Logto `reset_password`; email delivery, link TTL, resend throttling, and reset-session invalidation are Logto-owned and not asserted in repository tests.
7. **Onboarding:** after verified auth, `/onboarding` calls protected `/me`, skips completed profiles, preserves billing return paths, and stores onboarding/UTM through protected API calls.
8. **Protected frontend/API:** frontend state comes from `/api/auth/session`; API calls require audience-bound bearer plus verified identity resolution. FastAPI ownership checks and admin email authorization remain separate application boundaries.
9. **Return paths:** internal-only normalization plus secure callback cookie prevent obvious external open redirects. Production callback reconstruction uses the public base URL behind nginx.
10. **CSRF/origin:** SameSite=Lax and strict return paths provide partial protection; FastAPI CORS is allowlisted. There is no explicit CSRF token/origin assertion visible for auth mutations, so Better Auth must supply and test this boundary.
11. **Rate limiting:** nginx/SlowAPI protect general APIs; dedicated register/login/recovery/reset limits are currently delegated to Logto or undocumented.
12. **Expired/revoked sessions:** 401 triggers one refresh attempt and then forced reauthentication; expired identity assertions are rejected. Explicit revoked-session integration tests were not found.
13. **Errors/logging:** UI distinguishes 401, verification-required 403, 429, and service failures. Backend avoids logging token contents but existing identifier/email logging requires a privacy review.

## Production preflight

Read-only SSH inspected production without printing secrets.

- Application commit/image tag: `5507396b9a60418862a29d34def326faf12d6984`.
- Healthy: API, nginx, application PostgreSQL, Redis, Logto, and Logto PostgreSQL. Frontend/worker/beat had no Docker healthcheck. Migration container exited successfully. Logto had restart count 9; cause was not investigated in this read-only pass.
- Public checks: PeakTalk health returned 200; Logto status returned 204.
- Application PostgreSQL: public schema with 24 application tables. Aggregate counts: `users=0`, `user_identities=0`, Logto identities `=0`. These empty identity tables do **not** make unrelated application tables deletion candidates.
- Logto PostgreSQL: dedicated public schema with Logto configuration, application, connector, OIDC/session, verification, token, audit, role, organization, and user tables. Aggregates: users `6`, applications `5`, OIDC model instances `124`, OIDC session extensions `4`, passcodes `1`, one-time tokens `0`, subject tokens `0`, personal access tokens `0`, verification records `0`, SSO identities `0`.
- Redis DB0: 148 keys, 145 expiring. Safe pattern counts: `celery* = 145`; `session:*`, `auth:*`, `logto:*`, and `better-auth:*` each `0`. No keys or values were printed. Redis appears application-task oriented; this does not prove Logto sessions absent because Logto stores OIDC state in PostgreSQL.
- App-database backup command exists; deployment state, release manifest, and checksum exist. Timestamped application DB backups exist through the audit date. One historical 20-byte backup artifact is suspicious and must not be treated as recovery proof. No fresh isolated restore was performed.

## Data boundary and deletion allowlist candidates

No deletion is authorized. Current evidence positively shows Logto auth data, so the user's “delete only after confirming no users/sessions/auth data” condition fails.

Candidate allowlist for a **future, separately approved** cleanup manifest after cutover, retention, and verified backup/restore:

- Docker Compose project `peaktalk-logto` services `logto` and `logto-postgres`.
- Dedicated Docker volume `peaktalk-logto_logto_postgres_data` (exact runtime name must be revalidated).
- Dedicated network `peaktalk-logto_logto-internal` only after application nginx no longer references it.
- The dedicated Logto database/schema and all tables enumerated in this audit, as one provider-owned unit—not selected rows guessed by name.
- Application `user_identities` rows where `provider='logto'` only after a verified Better Auth mapping exists or emptiness is reconfirmed. Do not delete `users` through cascade.
- Logto-only runtime config/secret variable names, CI requirements, nginx virtual hosts/cert references, dependencies, routes, code, tests, and runbooks after replacement verification.

Explicitly excluded: all PeakTalk domain tables, local `users`, onboarding, documents, simulations, billing/subscriptions/payments, guest sessions, Redis Celery state, object storage, application PostgreSQL volume/backups, nginx/application services, and unrelated certificates/configuration.

## Rollback assessment

An existing application rollback procedure can restore the prior immutable image tag after failed health checks, and PostgreSQL recovery documentation requires a fresh dump plus isolated restore. The Logto runbook requires preserving Compose/image and restoring its database only when schema/data changed. However, a Better Auth cutover rollback has not been tested, no Better Auth schema compatibility plan exists, and no fresh Logto backup/isolated restore evidence was produced here. Therefore rollback documentation exists but the migration rollback gate remains open.

## Evidence summary and stop condition

Evidence came from bounded CodeGraph exploration, focused repository inspection, container metadata, information-schema table inventory, aggregate SQL counts, Redis `INFO keyspace` and pattern counts, deployment metadata, backup filenames/sizes/timestamps, and status-code-only health checks. No build, tests, E2E, deploy, mutation, backup creation, or restore was run because this stage was audit-only.

Stop before implementation: production contains six Logto users and non-zero OIDC/session state; architecture, identity/session cutover, E2E ownership, deploy manifest, and tested rollback decisions remain unresolved.
