# PeakTalk Logto auth runbook

This runbook describes the production auth contract after the email
verification hardening release.

## Required Logto console settings

In the Logto admin console, under the tenant sign-in experience:

1. Enable `Email address` as a sign-up identifier.
2. Enable `Email address` as a sign-in identifier.
3. Keep `Verify at sign-up` enabled for email.
4. Keep password sign-in enabled. Users enter email and password in the
   hosted Logto flow; PeakTalk does not collect or store passwords.
5. Confirm the SMTP connector is enabled and its timeout values are numbers,
   not blank fields. The PeakTalk sender is `no-reply@auth.peaktalk.ru`.
6. Keep the application redirect URI exactly:
   `https://peaktalk.ru/api/auth/logto/callback`
7. Keep the post-logout redirect URI exactly:
   `https://peaktalk.ru/`
8. Set the application language/branding to Russian/PeakTalk where the Logto
   version exposes application-level branding. The local PeakTalk auth shell
   is already branded in code; the hosted screen is controlled by Logto.

## Expected user flow

1. `/register` explains that email is required and redirects to hosted Logto.
2. Logto collects email and password and sends the verification message.
3. After callback, an unverified account is sent to `/verify-email` and cannot
   call the PeakTalk API or enter onboarding.
4. After the user confirms the email, `Проверить снова` refreshes the browser
   session. The app then routes to `/onboarding` without a periodic reload.
5. Onboarding calls `/me` only in `ready` auth state. A completed profile goes
   to the requested return path.

## Negative checks

- Open `/onboarding` while signed out: it must route to `/login`.
- Open `/onboarding` with an authenticated but unverified Logto account: it
  must route to `/verify-email`, not `/login`, and must not provision a local
  user.
- A direct `/api/auth/access-token` request for an unverified account returns a
  machine-readable `email_verification_required` response.
- A valid verified session reaches `/me` and can save onboarding.
- Refreshing onboarding must not restart the page or lose its local draft.

## Recovery

If auth smoke fails after a release, redeploy the previous verified image tag
using the deployment runbook. Do not delete Logto, its PostgreSQL volume, the
Postbox connector, or the PeakTalk PostgreSQL database during an application
rollback.

## Evidence to capture

Record the Logto sign-in experience configuration, a verified registration,
one negative unverified-account check, one onboarding completion, and remote
health/container evidence. Never record access tokens, cookies, SMTP keys, or
Logto application secrets.
# Hosted Logto v1.42.0 configuration

The hosted pages at `https://auth.peaktalk.ru` are the source of truth for
credentials. The local PeakTalk auth routes only start the OIDC flow.

Before changing settings, record the current Sign-in Experience values and the
application-level branding values. Do not delete users, connectors, Postbox
data, or persistent volumes.

In the Logto Console at `https://admin.auth.peaktalk.ru`:

1. Open **Sign-in & account → Branding**. Set the PeakTalk logo (use the
   existing public `/logo_svg.svg` asset or upload the same SVG), primary color
   `#E8600A`, light background treatment `#faf8f4`, graphite text `#171717`,
   and Russian as the fallback language.
2. Open **Sign-up and sign-in**. Set email as the required identifier, enable
   password, enable email verification, and remove phone and username from the
   required sign-up/sign-in methods. Keep the email forgot-password method
   enabled.
3. Configure MFA factors and policy only according to the approved product
   requirement. The hosted MFA screens must remain in the Logto interaction
   flow.
4. Add only supported CSS in **Branding → Custom CSS**. Do not edit Nginx to
   inject CSS into `auth.peaktalk.ru`.
5. Use **Live preview** for sign-in, sign-up, verification, recovery, MFA,
   loading, and error states. Then start the real flow from PeakTalk and verify
   the exact callback and return path.

If the Console does not expose a setting, use the Logto Management API with an
admin access token kept out of shell history and logs. The relevant endpoints
are `PATCH /api/sign-in-exp` and the application-level sign-in-experience
endpoint. Never paste that token into an issue, terminal transcript, or chat.

The self-hosted Logto OSS v1.42.0 Bring Your UI asset endpoint depends on the
Azure experience-blob processing configuration. It is not the selected path for
PeakTalk; use the built-in hosted experience plus supported Custom CSS instead.
