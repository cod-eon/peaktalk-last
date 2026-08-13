# PeakTalk Better Auth runbook

Status: current local contract; production cutover remains gated by decision 0017.

## Runtime boundary

- Next.js owns Better Auth at `/api/auth/[...all]` and stores its additive schema in PostgreSQL.
- The browser uses a host-only HTTP-only session cookie. FastAPI forwards only that cookie to private session introspection and remains the resource-authorization boundary.
- Verified email is required before onboarding or protected API access. Unsafe cookie-authenticated requests require an exact allowed Origin/Referer.
- Internal `return` parameters are allowlisted; external, protocol-relative and backslash paths fall back to a safe PeakTalk route.

## Environment references (names only)

Frontend/server: `BETTER_AUTH_DATABASE_URL` (a standard `postgresql://` URI for node-postgres, not FastAPI's `postgresql+asyncpg://` URI), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, `EMAIL_FROM_ADDRESS` and exactly one mail transport. For REG.RU Hosting Mail use `AUTH_SMTP_HOST=mail.hosting.reg.ru`, `AUTH_SMTP_PORT=465`, `AUTH_SMTP_SECURE=true`, `AUTH_SMTP_USER` and `AUTH_SMTP_PASSWORD`; the existing alternative is `RESEND_API_KEY`. Do not configure both transports.

Backend: `BETTER_AUTH_SESSION_URL`, `BETTER_AUTH_HTTP_TIMEOUT_SECONDS`, `ALLOWED_ORIGINS`.

Do not paste values into docs, logs, screenshots, shell history or evidence. The public Better Auth URL and trusted origins must be exact HTTPS PeakTalk origins in production; the internal URL must stay private.

## User-state checks

1. Registration collects name, email and a password of at least 10 characters, disables duplicate submission, and presents a neutral sent state.
2. Verification blocks protected access until the cookie session reports a verified email; refresh and reauthentication are explicit actions.
3. Login preserves only an allowlisted internal return path and exposes errors through an alert region.
4. Forgot-password always returns the same neutral sent copy, preventing account enumeration.
5. Reset handles missing, used and expired tokens with a link to request a new one; success requires a new login and revoked prior sessions.
6. Session expiry/unauthorized routes return to login without exposing protected content. Generic errors and loading use the same PeakTalk shell.
7. Onboarding starts only in `ready`, retains safe billing continuation, and provides bounded reauthentication on API-session failure.

## Accessibility and responsive checks

Keyboard through every field, link and action; visible focus; one clear heading; labels attached to inputs; errors use `role=alert`; progress/success/loading use live status; disabled/busy controls are consistent. Check 320 px mobile and desktop widths for horizontal overflow and long server messages. Reduced-motion mode removes transitions and spinner animation.

## Local verification

Run frontend full lint, typecheck and production build; backend full and focused auth tests; Alembic sole-head/history validation; active legacy-provider scan; `git diff --check`; harness tests/audit. Component/accessibility tests supplement but never replace real browser/session E2E.

Real mailbox registration/verification/reset, session expiry in a real browser, production-like mobile/desktop checks, backup/restore, health and rollback evidence remain mandatory before the separately approved cutover. Do not deploy when any local gate fails.

## Recovery

Before cutover retain the previous immutable artifact/config and a verified database backup. The Better Auth migration is additive: application rollback restores the prior artifact while leaving the additive tables intact. Do not delete provider data or tables during application rollback. Exact destructive cleanup remains separately gated.
