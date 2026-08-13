Status: superseded by decision 0017 (retained for historical context)

# Decision 0013: Email verification and stable PeakTalk auth experience

Status: accepted
Date: 2026-08-10

## Context

PeakTalk now uses self-hosted Logto OSS for browser authentication and a
separate FastAPI resource API. A browser can have a valid Logto session before
the email identity is verified and before the API has accepted the resource
token plus PeakTalk identity assertion. The current frontend collapses these
states into a generic `Сессия не готова` error after `/me` returns `401`, which
can send the user back through sign-in repeatedly and make onboarding appear to
refresh or loop.

PeakTalk registration must collect an email address, verify it through the
configured SMTP connector, and only then provision an API user. There are no
active users or application records that require migration in this task.

## Decision

1. Email is a required sign-up and sign-in identifier in Logto. Password login
   remains enabled; email verification at sign-up is mandatory.
2. Yandex Cloud Postbox remains the transactional email provider for Logto.
   The existing `auth.peaktalk.ru` sender and DKIM setup are retained.
3. The frontend models three explicit runtime states:
   `signed_out`, `email_verification_required`, and `ready`. An authenticated
   but unverified user is sent to a stable verification page, never to the
   login page or onboarding API.
4. The resource API and `/me` provision or accept a user only when the email is
   verified and the identity assertion is valid. The access-token route returns
   a machine-readable verification-required response instead of silently
   returning unusable credentials.
5. Onboarding starts only in `ready` state, preserves its local draft, and
   performs no periodic page reload. Retry actions are explicit and bounded.
6. PeakTalk-hosted auth pages use the existing PeakTalk logo and visual system.
   The hosted Logto screen is configured separately through Logto application
   branding and sign-in experience; application code will not pretend to
   replace hosted Logto markup that it does not control.
7. SMS, social login, voice features, and other product features are out of
   scope. Typed input and the existing text simulation flow remain unchanged.
8. Until the WebSocket handshake is moved to a short-lived ticket, access logs
   must never include query parameters. Nginx and Gunicorn therefore log the
   normalized path only; the existing WebSocket behavior is retained for this
   release with this containment control.

## Alternatives considered

- Provisioning unverified emails was rejected: it creates accounts that cannot
  reliably receive recovery mail and weakens the API authorization boundary.
- SMS verification was rejected for this release: it adds sender registration,
  delivery cost, a second connector, and operational complexity without being
  required by the PeakTalk wedge.
- A fully custom headless/Bring Your UI Logto flow was rejected for now: it
  would expand the migration surface and duplicate hosted authentication
  behavior. The hosted Logto flow remains the source of truth.
- Keeping a generic retry-on-401 screen was rejected: it hides the actionable
  cause and is the direct source of the observed loop.

## Scoped implementation authority

This accepted decision authorizes reversible local application work needed to
implement and test the lifecycle above. It does not authorize an Auth or Storage
migration, production deployment, hosted Logto/Postbox/VDS mutation, destructive
data action, or secret access. Decisions 0002 and 0003 remain closed migration
gates and cannot be used as implementation authority.

The overlapping harness tasks are coordinated as follows:

- `auth-email-verification-and-onboarding` owns the end-to-end application
  lifecycle, backend authorization boundary, protected-route behavior, and the
  integrated release evidence plan.
- `hosted-logto-ui-and-auth-recovery` owns hosted-experience requirements,
  local auth entry/recovery UX, and evidence about externally configured Logto
  behavior.
- Shared auth UI and sign-in/sign-out routes are changed once under the first
  task and reviewed against both decisions; the second task must not create a
  parallel credential flow or duplicate implementation.

## Acceptance criteria

1. Registration visibly requires email and reaches
   `email_verification_required` before any `/api/me`, protected API, dashboard,
   or onboarding access; denial is machine-readable and does not expose secrets.
2. A verified account reaches `ready`, obtains an API-accepted resource token,
   opens onboarding without periodic polling/reload, preserves its draft across
   refresh, completes onboarding once, and remains complete after reload.
3. `signed_out`, malformed/expired token, unverified identity, callback failure,
   session expiry, and service-unavailable cases have deterministic status/code,
   bounded retry, and no redirect loop or swallowed `ApiError`.
4. Login, callback, refresh, browser back/forward, deterministic logout,
   password recovery, return-path preservation, existing unfinished Logto SSO,
   and “Войти заново” are covered; return URLs are allowlisted against open
   redirects.
5. Issuer, audience, signature, identity claim mapping, `email`, and
   `email_verified` are validated consistently between Logto and the backend.
   Authorization headers, cookies, JWTs, bearer/query tokens, and sensitive
   query/referrer values do not enter application, Gunicorn, or Nginx evidence.
6. PeakTalk auth entry and verification screens use the existing logo, Russian
   copy, `#faf8f4`, `#171717`, and `#E8600A`; desktop/mobile, keyboard focus,
   semantic labels, contrast, loading, disabled, inline validation, callback
   error, retry, and long-error states are visibly checked.
7. Guest flow, upload/storage flow, typed simulation, guest simulation, and
   Defense Brief/report behavior are regression-tested without changing Storage
   or adding voice, SMS, social login, or unrelated product behavior.
8. Local evidence includes backend tests, frontend lint and typecheck, a clean
   checkout production build, harness tests/audit, CodeGraph health,
   `git diff --check`, high/critical dependency audit, migration/environment
   review, deploy preflight, health expectations, and rollback review.
9. Production readiness additionally requires a real isolated-account mailbox
   E2E covering registration, receipt and use of verification mail, ready
   session, onboarding, logout/login, recovery/reset, invalid and expired links,
   signed-out/unverified negatives, and MFA when enabled. Mocked sessions are
   labeled local checks and never substitute for this E2E.

## Evidence and completion rule

Every criterion must cite a fresh command, browser observation, or redacted
external check. Existing failed or stale evidence remains in task history and
must not be overwritten or re-described as a pass. Neither auth task can be
completed while hosted email/identifier configuration or the real mailbox E2E
is unverified.

Local scoped implementation may proceed under this decision. Any Logto Console
or Management API change, Postbox/VDS action, deployment, migration, or other
external/destructive mutation is a separate explicit-authority gate: record the
exact proposed action, target, preflight, rollback, and approval before acting.
Absence of authority is a blocker for that external step, not permission to
infer credentials or claim production readiness.

## Rollback

Application rollback is the previously verified PeakTalk image/commit. Revert
the auth application changes as one release if API health, sign-in, or
onboarding smoke checks fail. Keep Logto, Postbox, and their persistent
configuration intact; do not delete the Logto tenant or email connector as
part of an application rollback. If the new flow is disabled, the prior
Supabase compatibility path remains the emergency fallback only until a later
explicit migration decision removes it.

## Operational notes

The following Logto console settings must remain aligned with this decision:

- sign-up identifier: Email address;
- sign-in identifier: Email address;
- verify at sign-up: enabled/required;
- password sign-in: enabled;
- email connector: the working Postbox SMTP connector;
- application redirect URI: `https://peaktalk.ru/api/auth/logto/callback`;
- post-logout redirect URI: `https://peaktalk.ru/`.
