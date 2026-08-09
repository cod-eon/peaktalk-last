# 0002 — Source-file storage migration gate

Status: proposed migration placeholder; not approved for implementation
Date: 2026-08-09

## Intended target

Store original user files in the private Yandex Object Storage bucket
`peaktalk-prod-private-documents`. Keep extracted text and product results in
PostgreSQL. The bucket is Standard, limited to 10 GB, private for object/list/
settings reads, and has versioning disabled.

Use KMS key `peaktalk-prod-documents-kms` with AES-256, 365-day rotation, and
deletion protection.

## Gate

This placeholder does not authorize migration. Before implementation, approve a
separate decision brief covering data inventory, access policy, upload/download
cutover, backfill, failure and rollback behavior, retention, cost, and smoke /
regression evidence. Supabase Storage and Auth must not migrate in one release.
