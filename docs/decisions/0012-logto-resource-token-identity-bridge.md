# 0012 — Logto resource-token identity bridge

## Problem

PeakTalk uses a Logto API resource access token for FastAPI. That token is a
JWT for the `https://peaktalk.ru/api` audience, so it is correctly validated
locally with Logto's JWKS. It is not a userinfo token and Logto returns 401
when that resource JWT is sent to `/oidc/me`. The previous provisioning path
therefore rejected a newly registered user even though the browser session was
authenticated.

## Decision

1. Keep the API resource JWT as the browser-to-FastAPI bearer credential.
   FastAPI validates its signature, issuer, audience, lifetime, subject and
   required scopes locally.
2. The Next.js server obtains the verified Logto profile from the server-side
   session/userinfo boundary and creates a five-minute HMAC assertion containing
   only `sub`, normalized email, `email_verified=true`, `iat`, `exp` and a fixed
   audience (`peaktalk-api`). The browser may transport this assertion but
   cannot create or alter it.
3. FastAPI binds the assertion subject to the validated JWT subject before it
   provisions or updates a local identity. It never accepts a client-supplied
   email header or body field as an identity source.
4. Existing local identities can be resolved from the validated JWT subject
   without a Logto network call. First-time provisioning still requires a
   verified email; an unverified Logto account receives 401 and is not linked.
5. The HMAC secret is shared between the Next.js server and FastAPI through
   protected runtime configuration. The current deployment derives both values
   from the existing Logto cookie secret so no new secret is printed or
   committed; separating the secrets remains a follow-up hardening option.

## Alternatives rejected

- Sending the API resource JWT to `/oidc/me`: rejected by Logto and was the
  observed production failure.
- Trusting `X-Email` or a browser JSON field: permits identity/email spoofing
  and could affect email-based admin boundaries.
- Replacing local JWT validation with per-request userinfo/introspection:
  adds avoidable latency and a runtime dependency for every API call.
- Provisioning with an unverified email or a synthetic placeholder: conflicts
  with the auth migration gate and weakens account-linking safety.

## Acceptance criteria

- A fresh, email-verified Logto user can call `/me` after callback and receives
  a local PeakTalk identity without a Logto `/oidc/me` request carrying the
  resource JWT.
- A mismatched, expired, unsigned or unverified assertion is rejected.
- A JWT with a valid signature but a different assertion subject is rejected.
- Existing local identities continue to work without userinfo availability.
- No secrets appear in CI output, application logs, browser UI or committed
  files.
- Registration, login, logout, protected routes, onboarding, guest flow and
  typed simulation remain in the auth regression set.

## Rollback

Redeploy the previous verified application artifact and restore the previous
runtime configuration if required. This is an application/configuration
change with no database migration. Do not roll back Logto or PostgreSQL data.
