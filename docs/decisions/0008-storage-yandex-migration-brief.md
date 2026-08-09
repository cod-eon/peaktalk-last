# 0008 — Yandex Object Storage migration brief

Status: accepted migration plan; provider-neutral adapter is implemented while
production execution remains credential and object-inventory gated.

Date: 2026-08-09

## Current state

The backend currently uploads original files directly through the Supabase
Storage client. The path is based on local user ID, document ID, and the raw
filename. The API allows PDF, DOC, DOCX, TXT, and MD up to 50 MiB. Extracted
text and product results are already stored in PostgreSQL. The current code has
no Yandex adapter, no signed-URL path, no storage manifest, and no verified
orphan inventory.

## Target boundary

- Private bucket: `peaktalk-prod-private-documents`.
- KMS key: `peaktalk-prod-documents-kms`.
- Original files: Yandex Object Storage.
- Extracted text and product results: PeakTalk PostgreSQL.
- Storage and Auth are separate releases.

## Options

1. Keep Supabase Storage and harden it. Lowest migration risk, but fails the
   accepted target decision.
2. Cut over new uploads, then backfill old objects. Simple end state, but a
   failed backfill or missed object can break existing documents.
3. Build a manifest-driven staged migration with idempotent copy, dual-read,
   verification, cutover, and delayed cleanup. More implementation work, but
   the safest recovery and audit path for the existing production rows.

Recommendation: option 3. Do not delete the legacy object until a database
manifest, object checksum/size/content-type verification, download smoke test,
and rollback window all pass.

## Required controls

- Bucket must be private; deny anonymous list/read/write and public website
  access. Use a narrow service account policy limited to this bucket and the
  required object actions.
- Enable server-side KMS encryption with `peaktalk-prod-documents-kms`.
  Yandex documents that KMS-encrypted buckets require both storage permissions
  and KMS encryption/decryption permissions, and that deleting the KMS key can
  make the data irrecoverable. See [Object Storage
  encryption](https://yandex.cloud/en/docs/storage/concepts/encryption).
- Use server-generated short-lived signed URLs only for authorized downloads;
  never expose long-lived static access keys to the browser. Yandex limits
  pre-signed URL lifetime to 30 days and supports restricted-bucket downloads
  through such URLs; use a much shorter application TTL. See [pre-signed
  URLs](https://yandex.cloud/en/docs/storage/concepts/pre-signed-urls).
- Validate content type and file size server-side, sanitize filename-derived
  object keys, and store a generated object key rather than a raw user path.
- Make upload and copy operations idempotent using document ID plus a content
  hash; set bounded connect/read timeouts and retry only transient failures.
- Record object key, size, checksum, content type, provider, version, and
  migration status in PostgreSQL. Reconcile database rows to object listings
  for orphan cleanup.
- Define lifecycle only after retention is approved. Yandex lifecycle rules
  can transition, expire objects, and delete incomplete multipart uploads, and
  are applied daily; see [bucket object lifecycles](https://yandex.cloud/en/docs/storage/concepts/lifecycles).
- Keep the specified Standard class, 10 GB limit, no bucket versioning, and
  deletion protection/KMS rotation from decision `0002` unless a new approved
  decision changes them.

## Migration and rollback

1. Obtain scoped Supabase and Yandex credentials without printing them.
2. Inventory current objects and database documents; write a manifest.
3. Provision and test the private bucket/KMS/IAM policy in a non-production
   prefix or test bucket.
4. Add provider abstraction behind a feature flag; keep Supabase as fallback.
5. Copy idempotently, verify checksums/metadata, and test authorized download.
6. Switch reads, then writes, while monitoring orphan and error metrics.
7. Keep Supabase objects during the rollback window; delete only from an
   explicitly approved manifest after backup and restore evidence.

Rollback switches the provider flag to Supabase and preserves the local
`storage_path` mapping. If a copy is incomplete, no legacy object is removed.

## Approval gate

Approval requires actual bucket/KMS/IAM inventory, retention period, service
account owner, cost ceiling, backup/restore test, object manifest, feature-flag
owner, cutover window, and smoke/regression evidence. Until then, do not create
the production bucket, migrate objects, or remove Supabase Storage.
