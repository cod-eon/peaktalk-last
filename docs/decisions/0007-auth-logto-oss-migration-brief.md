# 0007 — Self-hosted Logto OSS Auth migration brief

Status: accepted migration plan; Logto OSS staging is complete, while public
exposure and application Auth cutover remain credential and smoke-test gated.

Date: 2026-08-09

## Current constraints and facts

- Supabase Auth is a live runtime dependency in the frontend and backend.
- The backend validates bearer tokens through Supabase and maps the Supabase
  subject to the local `users.id` UUID.
- The frontend uses Supabase browser/server clients and Supabase `User` and
  `Session` types.
- Current production data includes 11 local users and 1 simulation; identity
  continuity matters even though there is no validated user migration export.

## Options

1. Keep Supabase Auth and harden the existing integration. Lowest migration
   risk, but does not satisfy the self-hosted Logto target.
2. Deploy Logto OSS on the same VDS in a separate Compose project and migrate
   behind a provider flag. Lowest cost and simplest network path, but shares a
   single host failure domain and adds PostgreSQL/Logto operational burden.
3. Deploy Logto OSS on a separate VDS with its own database and TLS endpoint.
   Better isolation and independent restart/backup, but higher cost and more
   networking/monitoring work.

Recommendation for a controlled MVP migration: option 2 as a temporary,
explicitly monitored release, provided the VDS has a separate persistent
Logto database, TLS hostname, backups, and capacity headroom. Revisit option 3
when availability or operational isolation becomes a measured requirement.

## Required design

### Identity mapping

Do not replace local `users.id` with Logto IDs in place. Import or provision
Logto users and keep a durable mapping of provider plus Logto subject to the
existing local user UUID. Match by a verified, normalized unique email only
under a controlled import rule; never auto-link an unverified email. Preserve
local documents, simulations, billing, and Defense Brief ownership.

Logto supports user import through its Management API and custom data, but
sensitive application data must remain in PeakTalk PostgreSQL rather than JWT
custom data. See the official [Logto user migration
guide](https://docs.logto.io/user-management/user-migration).

### Sessions and tokens

Use OIDC Authorization Code with PKCE in the browser. The backend validates
issuer, audience, signature through Logto JWKS, expiry, and required scopes;
the local mapping then resolves the application user. Do not accept a token
solely because it is structurally a JWT. Session expiry and logout must clear
local state and reject expired/old-provider tokens.

### Recovery and verification

Logto must have a persistent email connector, verified sender, password-recovery
test, email-verification test, rate limits, and a recovery runbook before
cutover. Admin bootstrap credentials must be injected out-of-band and rotated
after first login.

### Authorization

Preserve server-side authorization boundaries. Admin access must require an
explicit Logto role/permission or a temporary server-side mapping; email-only
frontend hiding is insufficient. Negative cases must cover ordinary user to
admin routes, cross-user documents/simulations, missing scopes, wrong issuer,
expired tokens, and legacy Supabase tokens after cutover.

### Deployment and operations

Logto requires persistent PostgreSQL storage, separate public endpoint and
admin endpoint handling, TLS behind Nginx, one-time database initialization,
shared connector persistence, restart checks, and backup/restore. Official
Logto production guidance documents separate proxy ports for the auth and admin
endpoints and recommends a PostgreSQL database; see [deployment and
configuration](https://docs.logto.io/logto-oss/deployment-and-configuration).

### Cutover and rollback

Implement `AUTH_PROVIDER=legacy|logto|dual-validate` as an operational flag,
with legacy as the default until evidence passes. Keep Supabase Auth available
through a rollback window. Cut over a small controlled cohort or internal
smoke account first, then run registration, login, logout, expiry, recovery,
verification, protected routes, guest flow, text simulation, and negative
authorization checks. Rollback disables Logto authentication and restores
legacy token validation without changing local product data.

## Approval gate

Approval requires named owner, Logto hostname, deployment location, database
backup destination, SMTP connector, admin bootstrap procedure, identity import
mapping, feature-flag owner, rollback window, and fresh smoke/regression
evidence. Logto may remain staged privately after persistence, seed,
alteration, and loopback health checks; until the remaining evidence exists, do
not expose it publicly, integrate it into application Auth, or remove
Supabase dependencies.

## Current gate evidence — 2026-08-09

- Logto OSS is deployed in a separate Compose project with persistent
  PostgreSQL, loopback-only container ports, public TLS routes, and a verified
  admin account.
- The application remains `AUTH_PROVIDER=legacy`; Supabase Auth is not
  disabled and no user migration has been performed.
- Backend preparation is implemented locally behind the flag: strict Logto
  JWT validation (signature, issuer, audience, expiry, required scopes),
  verified-email userinfo lookup, and a `user_identities` mapping table.
- Fresh local evidence: 99 backend tests passed, including Logto scope
  rejection, identity provisioning/reuse, and invalid-token 401 behavior.
- The migration gate remains closed for production cutover. A Logto
  application/API resource, email connector, password recovery and
  verification smoke, frontend PKCE flow, protected-route checks, and full
  negative authorization evidence are still required before moving to
  `dual-validate`.

## Non-goals

No voice simulation, speech scoring, generic coaching, new product features,
or combined Storage/Auth release.
