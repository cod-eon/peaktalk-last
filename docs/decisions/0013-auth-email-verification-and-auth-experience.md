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

## Acceptance criteria

- Registration visibly requires an email and reaches an explicit verification
  state before onboarding.
- A verified email can sign in, obtain an API-accepted session, and open
  onboarding exactly once without a reload loop.
- An unverified email cannot reach `/me`, dashboard, or onboarding; it sees a
  stable verification action instead of `Сессия не готова`.
- Password recovery and logout retain safe return-path behavior.
- Protected routes, guest flow, typed simulation, upload, and Defense Brief
  behavior are not regressed.
- Auth pages use the PeakTalk logo, responsive layout, and loading/error states.
- Local, CI, and remote VDS checks are fresh and a rollback artifact is
  identified before deployment.

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
