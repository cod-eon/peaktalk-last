# Logto migration gate - 2026-06-16

Purpose: choose a safe auth migration path before replacing Supabase Auth in PeakTalk.

Status: research gate, not implementation. P0 payment/upload/checkout/TLS gates are now materially closed; do not start production cutover until the Logto host/DNS credentials are available.

## 2026-06-18 docs re-check

Official Logto docs were re-checked after closing the YooKassa and TLS P0 gates.

Current conclusions still hold:

- Do not use Logto's quick Docker Compose command for production. The docs explicitly warn that the bundled Postgres composition is not production-safe because rerunning it can recreate the database and lose persisted data.
- Use a controlled production deployment with a separate PostgreSQL database, persistent volumes, backups, pinned image version, and explicit env:
  - `DB_URL`;
  - `ENDPOINT`;
  - `ADMIN_ENDPOINT`;
  - `PORT` / `ADMIN_PORT` as needed;
  - `REDIS_URL` only if/when central cache is intentionally added.
- Logto's `ENDPOINT` affects the OIDC issuer, so changing `auth.peaktalk.ru` later is an auth-breaking event. Pick the domain before wiring the app.
- Next.js App Router integration should use `@logto/next` with app id, app secret, endpoint, base URL, `cookieSecret`, and secure cookies in production.
- FastAPI should be treated as a protected API resource. Validate access tokens by JWKS signature, issuer, audience, expiration, and scopes. Do not accept an ID token as the API bearer token.
- Email delivery can start through the SMTP connector, but magic-link/sign-in reliability must be seed-tested before real validation traffic.
- Yandex ID remains a second-phase connector spike through Logto's OAuth 2.0 connector, not part of the first cutover.

Updated source checks:

- Logto OSS get started / production Docker warning: https://docs.logto.io/logto-oss/get-started-with-oss
- Logto deployment and env configuration: https://docs.logto.io/logto-oss/deployment-and-configuration
- Logto central cache / Redis: https://docs.logto.io/logto-oss/central-cache
- Logto Next.js App Router quick start: https://docs.logto.io/quick-starts/next-app-router
- Logto API token validation: https://docs.logto.io/authorization/validate-access-tokens
- Logto email connectors: https://docs.logto.io/connectors/email-connectors

## Decision

Use Logto OSS self-hosted, not Logto Cloud, if the goal is to avoid dependence on foreign auth providers for Russian-market authorization.

Do not deploy Logto on the current VDS as-is.

Current VDS check on 2026-06-16:

- CPU: 2 vCPU.
- RAM: 3.8 GiB total, 2.2 GiB available, no swap.
- Disk: 30 GiB total, 5.2 GiB free, 82% used.

Logto OSS docs list minimum recommended hosting resources as 2 vCPU, 8 GiB RAM, and 256 GiB disk. The current server matches CPU but is materially short on RAM and disk. Adding Logto, its DB workload, connectors, logs, and backups on this host risks hurting the product while we are trying to validate payments.

Recommended infra path:

1. Prefer the separate Timeweb Cloud-80 RU server for auth over the current PeakTalk VDS.
2. Minimum practical target for validation: 2 vCPU, 8 GiB RAM, materially larger disk than the current VDS, swap, backups, and monitoring.
3. The available Timeweb Cloud-80 server shown by the user has 4 x 3.3 GHz CPU, 8 GiB RAM, and 80 GiB NVMe. It satisfies the CPU/RAM validation target and is a reasonable Logto host candidate, but the 80 GiB disk is below Logto's 256 GiB recommendation. This is acceptable for validation only if backups/log retention are controlled.
4. Use a dedicated empty Postgres database/user for Logto. Do not mix Logto tables into the PeakTalk app database schema.

User migration stance:

- The user explicitly said there is no meaningful production user base and existing auth/users may be deleted if that leads to a better architecture.
- This removes the need for careful preservation of Supabase Auth accounts.
- It does not remove the need for a clean internal identity model. Keep PeakTalk's local `users.id` as an internal UUID and map Logto/Yandex/Supabase subjects separately. This protects billing, guest-to-paid conversion, documents, simulations, and future provider linking.

## Target topology

Domains:

- `auth.peaktalk.ru` -> Logto core endpoint.
- `auth-admin.peaktalk.ru` -> Logto Admin Console.
- `peaktalk.ru` -> existing app.

Logto runtime:

- Container image: `ghcr.io/logto-io/logto:latest` only after pinning a specific version during implementation.
- Core port: `3001`.
- Admin port: `3002`.
- Reverse proxy: Nginx with HTTPS in front of both ports.
- Required env shape:
  - `TRUST_PROXY_HEADER=1`
  - `ENDPOINT=https://auth.peaktalk.ru`
  - `ADMIN_ENDPOINT=https://auth-admin.peaktalk.ru`
  - `DB_URL=postgres://...`
  - `SECRET_VAULT_KEK=<base64 AES-256 key>`
- Admin hardening:
  - strong unique admin password;
  - restrict `auth-admin.peaktalk.ru` by IP/VPN if operationally possible;
  - backups before every Logto upgrade/alteration.

Important Logto OSS limitation: self-hosted OSS allows only one initial admin account. This is acceptable for PeakTalk's current stage, but it should be written into ops notes.

## Email/magic-link plan

Start with REG.RU domain mail only for low-volume validation if deliverability tests pass.

Configuration direction:

- Sender: `noreply@peaktalk.ru` or `auth@peaktalk.ru`.
- Connector: Logto SMTP connector first.
- DNS: SPF, DKIM, DMARC aligned for `peaktalk.ru`.
- Seed tests: Gmail, Yandex, Mail.ru, corporate mailbox.
- Required observability: delivery success, spam placement, failed auth attempts, user complaints.

Escalation path:

- If REG.RU deliverability is weak, move auth emails to UniSender Go or another transactional sender.
- Logto supports SMTP and HTTP email connectors, so UniSender can be connected later through SMTP if supported or through an HTTP bridge if needed.

Do not run important validation traffic on an untested mailbox-only SMTP setup.

## Yandex ID later

Yandex ID is documented as an OAuth-based flow: user redirects to Yandex OAuth, Yandex returns an OAuth token, and the app can request profile data including email, phone, and unique ID depending on scopes.

Logto has a generic OAuth 2.0 social connector and supports Authorization Code flow for OAuth providers. Therefore Yandex ID should be feasible later through Logto's OAuth 2.0 connector, assuming Yandex app registration provides the required authorization endpoint, token endpoint, client id, client secret, scopes, and user profile mapping.

Implementation caveat:

- Treat Yandex ID as a dedicated spike, not a promise.
- Validate field mapping before enabling it publicly:
  - external subject/user id;
  - email;
  - email verification semantics;
  - profile name;
  - account linking with existing email users.

## Current code impact map

Frontend Supabase Auth usage to replace:

- `frontend/src/lib/supabase/client.ts`
- `frontend/src/lib/supabase/server.ts`
- `frontend/src/lib/supabase/middleware.ts`
- `frontend/src/middleware.ts`
- `frontend/src/components/providers/auth-provider.tsx`
- `frontend/src/store/authStore.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(auth)/register/page.tsx`
- `frontend/src/app/(auth)/forgot-password/page.tsx`
- `frontend/src/app/auth/callback/route.ts`
- sign-out calls in dashboard/sidebar/settings/admin surfaces
- token reads in scenario start, WebSocket, and simulation beforeunload paths

Backend Supabase Auth usage to replace:

- `backend/app/dependencies.py`
- `backend/app/config.py`
- `backend/app/routers/users.py`
- `backend/app/routers/webhooks.py` Supabase user-deleted webhook
- `backend/app/routers/notifications.py` direct token lookup

Keep separate for now:

- `backend/app/services/storage.py` uses Supabase Storage, not Supabase Auth. This belongs to the later Supabase Storage/S3 audit and should not be removed in the auth migration unless storage is explicitly replaced.

## Required data-model change

Current `users.id` is UUID and is documented as matching the Supabase Auth `sub` claim. Logto's `sub` is a string OIDC subject and must not be assumed to be a UUID.

Do not force Logto subject into `users.id`.

Recommended model:

- keep `users.id` as local UUID primary key;
- add `users.auth_provider` string, initially `supabase`, later `logto`;
- add `users.auth_subject` string, unique with provider;
- add optional `email_verified`, `last_login_at`;
- backfill existing rows as `auth_provider='supabase'`, `auth_subject=<old uuid string>`;
- after cutover, provision new users with local UUID and `auth_subject=<Logto sub>`.

This keeps billing, documents, simulations, guest migration, and payments anchored to local UUIDs instead of external identity-provider ids.

Because PeakTalk has no meaningful production user base yet, destructive user reset is possible, but still avoid unnecessary schema shortcuts. A clean local-id model is safer for future Yandex ID and account linking.

## Frontend integration direction

Use the official Logto Next.js App Router SDK:

- install `@logto/next`;
- configure app id, app secret, endpoint, base URL, cookie secret, production secure cookies;
- use redirect-based sign-in/sign-out;
- configure callback route and post sign-out redirect URI in Logto Console;
- request email scope;
- configure a PeakTalk API resource, for example `https://api.peaktalk.ru`;
- fetch an access token for that API resource before calling FastAPI.

PeakTalk-specific constraints:

- preserve existing `return` behavior through login/register/paywall;
- `/login` and `/register` should become controlled redirects or thin local pages, not full local password forms;
- do not reintroduce Google OAuth;
- do not add team/enterprise/org features during this migration.

## Backend integration direction

Replace Supabase `auth.get_user(token)` calls with local JWT validation:

- fetch OIDC discovery from `https://auth.peaktalk.ru/oidc/.well-known/openid-configuration`;
- cache JWKS from `https://auth.peaktalk.ru/oidc/jwks`;
- validate signature, issuer, audience, expiration, and required scopes;
- use Logto `sub` only as `auth_subject`;
- auto-provision or find local `User` by `(auth_provider, auth_subject)`;
- if email exists and no local auth mapping exists, define an explicit account-linking policy instead of silently merging.

Recommended env shape:

- `LOGTO_ENDPOINT=https://auth.peaktalk.ru`
- `LOGTO_ISSUER=https://auth.peaktalk.ru/oidc`
- `LOGTO_JWKS_URI=https://auth.peaktalk.ru/oidc/jwks`
- `LOGTO_API_RESOURCE=https://api.peaktalk.ru`

## Migration sequence

1. Close P0 YooKassa webhook/payment e2e and authenticated `/upload` QA first.
2. Provision or upgrade auth infrastructure.
3. Deploy Logto on the separate Timeweb Cloud-80 host behind `auth.peaktalk.ru` and `auth-admin.peaktalk.ru`.
4. Configure SMTP and pass seed deliverability tests.
5. Create Logto traditional web app and API resource.
6. Add backend auth model migration and JWT validator behind a feature flag.
7. Add Next.js Logto integration behind a feature flag or branch-only env.
8. Run local and staging auth smoke:
   - sign up;
   - sign in;
   - sign out;
   - forgot/reset or passwordless/magic-code flow;
   - `return` preservation from `/billing` and `/simulation/from-guest`;
   - authenticated `/upload`;
   - dashboard API calls;
   - payment creation;
   - guest-to-paid migration.
9. Cut over production auth only after smoke passes.
10. Remove Supabase Auth dependencies and direct OAuth remnants after Logto is stable.

## Tests/checks required before merge

Backend:

- JWT valid token creates/fetches local user.
- Missing token returns 401.
- Invalid issuer/audience/signature returns 401.
- Expired token returns 401.
- Local user id remains UUID and is not Logto subject.
- Billing endpoints still create payments for authenticated user.
- Guest migration still consumes one paid credit and binds to the local user.

Frontend:

- middleware protects dashboard/upload/billing and preserves return target.
- `/login` and `/register` redirect correctly.
- callback handles success and error.
- `api.ts` attaches Logto API access token.
- sign out clears local session and Logto session.

Production smoke:

- `https://auth.peaktalk.ru/oidc/.well-known/openid-configuration` is reachable.
- `https://auth.peaktalk.ru/oidc/jwks` is reachable.
- `https://peaktalk.ru/health` remains 200.
- `/login`, `/register`, `/billing?plan=per_session`, `/simulation/guest`, `/upload` smoke pass.
- recent logs show no auth callback/JWT validation errors.

## Do not do in this migration

- Do not build team auth, organizations, SSO, enterprise roles, or admin portals.
- Do not migrate Supabase Storage in the same changeset.
- Do not rewrite billing/credits.
- Do not add Yandex ID in the first cutover; make it a second connector spike.
- Do not deploy Logto on the current VDS without resource upgrade or separate auth host.

## Sources checked

- Logto OSS get started: https://docs.logto.io/logto-oss/get-started-with-oss
- Logto OSS deployment/configuration: https://docs.logto.io/logto-oss/deployment-and-configuration
- Logto core configuration: https://docs.logto.io/concepts/core-service/configuration
- Logto Next.js App Router quick start: https://docs.logto.io/quick-starts/next-app-router
- Logto FastAPI API protection: https://docs.logto.io/api-protection/python/fastapi
- Logto access token validation: https://docs.logto.io/authorization/validate-access-tokens
- Logto email connectors: https://docs.logto.io/connectors/email-connectors
- Logto SMTP connector: https://docs.logto.io/integrations/smtp
- Logto HTTP email connector: https://docs.logto.io/integrations/http-email
- Logto OAuth 2.0 connector: https://docs.logto.io/integrations/oauth2
- Yandex ID OAuth docs: https://yandex.com/dev/id/doc/en/
