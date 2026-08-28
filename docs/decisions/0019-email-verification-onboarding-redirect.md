# Decision 0019: Email verification returns users to onboarding

Status: accepted  
Date: 2026-08-13  
Approved by: user request to fix the registration/onboarding behavior

## Problem

After registration, PeakTalk requires email verification. Better Auth is
configured with `autoSignInAfterVerification: false`, so the verification
callback can leave the user on the verification screen without an authenticated
session. The intended first-user flow is registration → verified email →
onboarding, and the current behavior makes the user discover a manual login
step.

## Options considered

1. Keep the current explicit-login flow. This has the smallest auth change, but
   breaks the expected first-run path and loses the preserved onboarding return
   path in the most common verification flow.
2. Enable Better Auth automatic sign-in after verification and keep the existing
   callback return path. This gives the shortest predictable path, while the
   verification page and login fallback remain available if a browser loses the
   session.
3. Keep automatic sign-in disabled and add a dedicated server callback that
   creates a session. This duplicates Better Auth behavior, increases auth
   surface area, and creates more rollback and testing cost.

## Decision

Use option 2. Enable Better Auth automatic sign-in after verification and keep
the normalized internal `return` path, defaulting to `/onboarding`. Do not
change password policy, admin permissions, external auth providers, or the
completed-onboarding redirect.

## Acceptance criteria

- A newly registered user who follows the verification link lands in an
  authenticated `/onboarding` flow without a manual login step.
- Unsafe/external return paths are still rejected by the existing normalizer.
- Existing signed-out, unverified, login, and completed-onboarding behavior
  remains unchanged.
- If automatic sign-in cannot be completed, the user still has a clear manual
  login fallback preserving `/onboarding`.

## Rollback

Revert the auth configuration change and the associated frontend test/change,
then deploy the previous immutable application artifact. No database migration
or data rollback is required.

