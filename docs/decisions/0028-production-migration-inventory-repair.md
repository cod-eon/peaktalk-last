# Production migration inventory repair

Status: accepted

Date: 2026-08-27

Approved by: product owner in the task after the failed migration preflight

## Problem

The production database reports Alembic revision
`0025_guest_session_token_widen`, but `main` ends at
`0024_better_auth_admin`. The missing revision file exists in the previously
recorded production backend image
`peaktalk-backend:598a5b3bc19f648033dda11e049ebffc9ecb09c5` and has already
been applied to production. Consequently, every deployment built from `main`
fails before container replacement because Alembic cannot resolve the database
revision.

## Options considered

1. Skip migrations or manually stamp the database. This would bypass the
   deployment contract, conceal the inconsistent history, and leave future
   releases broken.
2. Modify the database revision. This is unnecessary, destructive, and would
   misrepresent the schema already present in production.
3. Restore the exact missing revision file from the recorded production image.
   This repairs migration inventory without introducing a new schema operation.

## Decision

Restore `0025_widen_guest_session_token.py` from the recorded production image,
commit it to `main`, rebuild exact-SHA images, and run the existing deployment
script normally. Since production is already stamped at this revision, Alembic
must resolve the graph and perform no additional upgrade operation.

This is a compatibility restoration, not authorization for a new migration,
manual database mutation, or an Auth/Storage migration.

## Verification

- The restored file matches the version in the recorded production image.
- The revision has parent `0024_better_auth_admin` and becomes the single
  Alembic head.
- Production `alembic upgrade head` completes without applying a new schema
  change.
- The normal backup, image identity, health, and rollback checks remain active.

## Rollback

The file must not be removed while any environment is stamped at
`0025_guest_session_token_widen`. Runtime rollback remains image-based through
`deploy.sh`; no schema downgrade is required or authorized by this repair.

## Non-goals

- No new database revision or schema change.
- No manual Alembic stamp, downgrade, or data rewrite.
- No Auth, Storage, infrastructure, or deployment-workflow change.
