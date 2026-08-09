# 0007 — Self-hosted Logto OSS Auth migration brief

Status: accepted migration plan; Logto OSS is deployed and upgraded to v1.42.0.
The application cutover is authorized by the owner, the repository no longer
contains a Supabase Auth/Storage runtime path, and production cutover remains
blocked only on creating the PeakTalk Logto application/API resource and
installing its credentials.

Date: 2026-08-09

## Current constraints and facts

- The production VDS has no active PeakTalk users after the approved
  application-database reset; Logto admin data is separate and preserved.
- The backend validates bearer tokens through Logto and maps the Logto subject
  through `user_identities` to a local PeakTalk UUID.
- The frontend uses Logto Authorization Code flow through same-origin server
  routes; access tokens are never stored in browser local storage.

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

Use `AUTH_PROVIDER=logto` as the production provider. Rollback is a runtime
image/config rollback to the previously verified application release; it does
not restore Supabase as an active auth path. Cut over with an internal smoke
account first, then run registration, login, logout, expiry, recovery,
verification, protected routes, guest flow, text simulation, and negative
authorization checks.

## Approval gate

Approval requires named owner, Logto hostname, deployment location, database
backup destination, SMTP connector, admin bootstrap procedure, identity import
mapping, feature-flag owner, rollback window, and fresh smoke/regression
evidence. Logto may remain staged privately after persistence, seed,
alteration, and loopback health checks; until the remaining evidence exists, do
not enable the application's hosted sign-in route or claim production auth
readiness.

## Current gate evidence — 2026-08-09

- Logto OSS is deployed in a separate Compose project with persistent
  PostgreSQL, loopback-only container ports, public TLS routes, and a verified
  admin account.
- Official Logto v1.42.0 is pinned by amd64 digest
  `sha256:a624bfe87e2928c9f3832957bcebbef1bb38eec7789ca04b4ce43e002aea0756`.
  Three v1.42.0 database alterations deployed successfully.
- Fresh remote evidence: loopback `/api/status`, public auth status, public
  admin status and `/console/welcome` all pass after restart.
- Fresh local evidence: 98 backend tests passed; frontend lint, typecheck and
  production build passed; frontend and backend contain no Supabase runtime
  imports or dependency.
- The migration gate remains closed for application traffic until a PeakTalk
  Logto web application/API resource, email connector, password recovery and
  verification smoke, frontend PKCE flow, protected-route checks, and full
  negative authorization evidence exist.

## Logto v1.42.0 release evidence — 2026-08-10

- Pre-upgrade dedicated Logto PostgreSQL backup:
  `/var/backups/peaktalk-logto/logto-postgres-before-20260809T211334Z.dump.gz`
  with SHA-256
  `f99ed2a95f7c86453dcac2d2ebe88fa8086da175d4e019f9fa09b381f002dfa9`.
- Previous Compose file is preserved alongside the backup; the previous
  application image remains available by digest for runtime rollback.

## Owner authorization — 2026-08-10

The owner explicitly authorized a full reset/cutover because the current
PeakTalk application database contains no important data and there are no
active users. The approved scope is:

- preserve the Logto installation, its admin account, persistent Logto
  PostgreSQL, TLS, DNS, backups, SSH users, firewall, and unrelated services;
- delete or recreate only the PeakTalk application database when the final
  cutover release requires it;
- remove Supabase Auth and legacy Storage runtime dependencies after the
  Logto/Yandex smoke checks pass;
- do not invent or print missing Logto application credentials.

This authorization does not permit deleting the Logto admin account or its
database merely because PeakTalk application data is disposable.

## Non-goals

No voice simulation, speech scoring, generic coaching, new product features,
or combined Storage/Auth release.
