# 0011 — Onboarding auth lifecycle and bounded recovery

## Problem

The Logto browser session and the PeakTalk API bearer token are separate
artifacts. Onboarding mounted before the global session check had completed and
called `/me` immediately. A 401 from that request entered the global OAuth
recovery path. If the browser session was still valid while the API token was
not usable, the user could be sent through the same flow repeatedly and see
what looked like a page refresh every few seconds.

## Decision

1. The auth provider does not mount protected routes until the current browser
   session has been resolved and an authenticated user is present.
2. Onboarding checks its profile only after that session gate completes.
3. The profile check opts out of automatic OAuth recovery. A 401 is shown as a
   bounded, explicit recovery state with a single retry action instead of an
   uncontrolled redirect loop.
4. Other authenticated API calls retain automatic recovery, but the browser
   stores a 30-second recovery guard so repeated concurrent 401 responses cannot
   create an OAuth storm.

## Acceptance criteria

- A fresh Logto callback reaches onboarding without an automatic reload loop.
- `/me` is not requested by onboarding before the session check completes.
- A 401 during onboarding renders a recovery action and does not redirect more
  than once automatically.
- Completed onboarding redirects once to the requested internal return path.
- Typed input and the existing optional voice-input path are unchanged.
- No API authorization boundary or backend token validation is weakened.

## Non-goals

- No change to onboarding questions or product positioning.
- No voice simulation or speech-quality feature.
- No change to Logto branding, providers, roles, or user data migration.

## Rollback

Revert the application commit and redeploy the previous verified image. The
change is frontend-only and does not require a database migration. If the
rollback is needed during a deploy, use the previous release artifact recorded
by the deploy runbook; do not roll back the Logto database or application data.
