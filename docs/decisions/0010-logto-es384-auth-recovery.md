# 0010 — Logto ES384 validation and auth recovery

Status: accepted implementation decision

Date: 2026-08-10

## Problem

After the Logto cutover, a browser could hold a valid-looking Logto web
session while the PeakTalk API rejected the access token. The frontend then
redirected `401` responses to `/login`; the authenticated-session guard sent
the browser back to `/dashboard`, creating an infinite loop before the user
could finish onboarding.

Fresh production evidence showed that the Logto JWKS publishes an `ES384`
P-384 signing key, while the backend validator allowed only `RS256`.

## Options

1. Keep the validator on `RS256` and reconfigure Logto signing. This would
   change the identity provider for an application bug and creates an
   unnecessary key-rotation operation.
2. Allow the observed Logto `ES384` algorithm in the backend's explicit
   allowlist, retain `RS256` for controlled transition compatibility, and add a
   regression test. This fixes the root cause without accepting arbitrary
   token algorithms.
3. Disable backend JWT validation and trust the frontend session. This would
   remove the loop at the cost of destroying the API authorization boundary.

## Decision

Adopt option 2. The API remains the authority for bearer-token validation.
The frontend's `401` recovery re-enters the Logto sign-in route with token
clearing instead of bouncing through the authenticated `/login` page.

## Acceptance criteria

- The backend accepts the current Logto `ES384` token signature only through
  an explicit algorithm allowlist and continues validating issuer, audience,
  expiry, subject, JWKS signature and verified email.
- A rejected API token cannot cause an unbounded `/dashboard` ↔ `/login`
  redirect loop; recovery preserves the original internal return path.
- Backend auth tests cover the current algorithm allowlist.
- CI and the immutable deploy pass, and fresh production checks show healthy
  services with no new Logto token-validation rejection loop.

## Non-goals

- No weakening of API authorization or email-verification requirements.
- No change to onboarding questions or product flow.
- No new auth provider, user migration, or Logto admin feature.

## Rollback

Rollback the application artifact to the previous verified commit and image
set using the existing deploy runbook. The database schema is unchanged by
this fix, so no database rollback is required.
