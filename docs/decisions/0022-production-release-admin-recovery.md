# 0022: Production release of PeakTalk admin recovery

Status: accepted for the explicitly approved release procedure
Date: 2026-08-13

## Release scope

Release the current PeakTalk changes for Russian authentication errors, the
self-hosted admin users list and user page, admin action feedback, and the
historical local typography system to `peaktalk.ru` through the repository's
protected GitHub Actions workflow.

The release contains no database migration, environment-file change, secret
change, provider migration, or external admin console. The production target
is the exact new commit created from the reviewed working tree, not the older
`32be02d` commit.

## Options and decision

1. Deploy the old `32be02d` commit. This is already known to the user, but it
   does not contain the current typography, auth-copy, and user-page fixes.
2. Commit only the reviewed PeakTalk changes and deploy that immutable commit
   through GitHub Actions. This preserves the release boundary, runs the
   repository gates, creates the configured artifact and backup, and keeps a
   precise rollback target.
3. Copy the working tree directly to production. This is faster in appearance
   but bypasses reviewable commit identity, artifact checksums, and the
   workflow's backup and health gates.

Choose option 2. The current implementation has passed local backend,
frontend, security, harness, and visual checks. Real authenticated browser
E2E remains a known verification limitation and is not fabricated as passed;
the user explicitly authorized proceeding despite that limitation.

## Release gates

- Stage only the reviewed implementation files and durable decisions. Preserve
  unrelated untracked user files.
- Run final diff, tests, lint, typecheck, production build, dependency audit,
  harness audit, and CodeGraph health before creating the commit.
- Show the exact new commit SHA and changed-file list. Production push/deploy
  requires explicit approval for that SHA.
- GitHub Actions must pass harness, backend, frontend, dependency, compose, and
  immutable-artifact gates before the deploy job runs.
- The deploy job must retain the previous immutable artifact and create the
  configured pre-deploy database backup. This release has no schema migration.

## Rollback

Rollback trigger: public health failure, login failure, onboarding regression,
admin access failure, users/detail failure, or an action/audit regression in
the post-deploy verification window.

Rollback owner: PeakTalk operator with VDS access. Recovery is an application
rollback to the previous recorded deployment artifact and commit, leaving
Better Auth additive tables untouched. Re-run health checks and verify login,
onboarding, and admin access after rollback. Do not delete auth data or run a
destructive migration as part of rollback.

## Post-deploy checks

Verify `https://peaktalk.ru/health`, homepage, login, onboarding, admin access,
users loading, dedicated user detail, ordinary-user 403, admin action response,
audit event creation, and absence of secrets in logs. Re-check typography on
homepage, auth, and admin. Preserve the rollback option until these checks are
recorded.

## Non-goals

No production migration, environment mutation, secret rotation, auth-provider
change, third-party admin console, user deletion, password mutation,
impersonation, Organizations, SSO, or SCIM.
