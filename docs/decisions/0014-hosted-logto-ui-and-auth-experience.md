Status: superseded by decision 0017 (retained for historical context)

# Decision 0014: hosted Logto UI and auth recovery

Status: accepted for implementation
Date: 2026-08-11

## Context

PeakTalk uses the Logto-hosted authorization flow at `auth.peaktalk.ru`. The
local `/login`, `/register`, and `/forgot-password` pages are entry points only;
they must not replace the hosted OIDC experience. A browser check on the
deployed v1.42.0 instance showed the hosted registration and sign-in pages
configured for phone (`+7`) and username, so the required email flow is not
currently configured.

The local verification screen also contained marketing-style copy and a
two-column panel that made the next action harder to understand. A separate
observed failure was that an existing unverified Logto SSO session redirected a
fresh visit to `/login` straight back to `/verify-email`; “Войти заново” did not
force a new Logto interaction.

## Findings for Logto OSS v1.42.0

The v1.42.0 source and official documentation establish these supported
boundaries:

- Sign-in Experience supports tenant branding, colors, logo, language/content,
  sign-in/sign-up identifiers, password, email verification, password recovery,
  and MFA settings.
- The application-level endpoint supports application branding and terms links;
  the v1.42.0 OpenAPI description says per-app sign-in-method customization is
  not supported. Application branding and custom CSS must not be conflated with
  changing the auth protocol.
- Built-in Custom CSS is a supported Sign-in Experience capability. It is
  stored in Logto configuration and applied by the hosted experience; CSS must
  remain CSS-only and must not be injected through Nginx or an application proxy.
- Bring Your UI exists in the v1.42.0 source, but its self-hosted asset upload
  path requires Logto's Azure experience-blob storage configuration and the
  accompanying processing path. Logto's public documentation describes the
  hosted upload workflow as a Logto Cloud feature and says OSS users can fork
  the experience code. Forking the whole experience is a separate maintained
  product surface with a larger OIDC, CSRF, session, MFA, recovery, and upgrade
  blast radius.

## Decision

Use the built-in hosted Logto Experience on `auth.peaktalk.ru`, configured by
the Logto Console or Management API, with:

- PeakTalk logo asset, `#faf8f4` background treatment, `#171717` graphite,
  and `#E8600A` primary accent;
- Russian fallback language and concise Russian content;
- email plus password as the required sign-up/sign-in path;
- mandatory email verification and email password recovery;
- MFA factors and states left inside Logto's hosted interaction flow;
- supported Custom CSS for visual refinement across sign-in, sign-up,
  verification, recovery, MFA, loading, and error states.

Do not use Bring Your UI, a Logto source fork, or reverse-proxy CSS in this
release. Reconsider a maintained Logto experience fork only through a new
decision after measuring requirements that built-in branding and CSS cannot
meet.

## Consequences and safeguards

- OIDC authorization, callback validation, state/PKCE, CSRF/session cookies,
  password recovery, MFA, and API token exchange stay owned by Logto.
- PeakTalk's local pages remain clear entry/recovery screens and do not collect
  credentials or imitate the hosted form.
- No Logto, Postbox, PostgreSQL, Redis, or object-storage data is deleted.
- Decision 0003 does not authorize an Auth migration, and decision 0002 does
  not authorize a Storage migration. Neither migration is part of this release.

## External-action gate and verification

Local application implementation and non-mutating inspection may proceed under
this accepted decision. Changing Sign-in Experience, branding, localization,
connectors, MFA, application settings, or any Logto/Postbox/VDS state is an
external admin action and is not authorized by this decision alone. Before such
an action, obtain explicit authority for the exact target and change, confirm a
redacted current-state capture, preflight and rollback, and avoid printing or
persisting credentials, cookies, tokens, SMTP values, or secret configuration.
Deployment is a separate explicit-authority action.

After an authorized configuration change, fresh evidence must show on the real
hosted v1.42.0 experience that:

1. registration and sign-in require email plus password, not phone or username;
2. Russian locale, PeakTalk logo/colors, mandatory email verification,
   password recovery, and all enabled MFA states are actually rendered;
3. sign-in, sign-up, verification/resend, recovery/reset, MFA, loading,
   disabled, invalid input/link, session-expired, access-denied,
   service-unavailable, callback-error, logout, retry, mobile, keyboard/focus,
   and long-error states remain usable;
4. OIDC callback and post-logout return safely to allowlisted PeakTalk paths;
5. a real isolated mailbox flow completes registration, verification, login,
   logout, recovery/reset, and login with the reset password.

A mocked session, source inspection, local PeakTalk page, or HTTP 200 is not
positive hosted/mailbox E2E evidence. Until the phone/username observation is
superseded by a fresh hosted check and mailbox E2E, keep the existing failed
acceptance/risk evidence and report production readiness as blocked.

## Rollback

1. Revert the Sign-in Experience and app-level branding values to the last
   recorded Logto configuration in the Console/Management API.
2. Restore the previous PeakTalk application image through the existing deploy
   workflow; do not run `down -v` and do not remove persistent volumes.
3. Recheck OIDC discovery, public health, callback, sign-out, and API negative
   cases before declaring recovery.
