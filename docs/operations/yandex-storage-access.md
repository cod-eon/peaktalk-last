# Yandex Object Storage access for PeakTalk

Status: operator procedure; provider-neutral backend adapter is implemented
behind `STORAGE_PROVIDER=legacy|yandex`. The clean production runtime is now
on `STORAGE_PROVIDER=yandex`; Supabase Storage remains available for rollback.

## Target

- Bucket: `peaktalk-prod-private-documents`
- KMS key: `peaktalk-prod-documents-kms`
- KMS key ID confirmed from the supplied console screenshot: `abjbiq7jvp0bca5qpe3l`
- Endpoint: `https://storage.yandexcloud.net`
- Region: `ru-central1`
- Access mode: private bucket, backend-only S3 access, short-lived signed URLs where a browser download is required.

## What to create in Yandex Cloud

Create a dedicated service account named `peaktalk-prod-storage` in the same cloud/folder as the bucket. Do not use a personal account or a folder-wide owner/editor role for the application.

Assign roles at the bucket resource, not at the whole cloud:

1. `storage.editor` on `peaktalk-prod-private-documents` — the backend needs object read, upload, overwrite protection and deletion for orphan cleanup.
2. `kms.keys.encrypterDecrypter` on key `abjbiq7jvp0bca5qpe3l` — required for encrypted object upload and download.

Do not grant `storage.admin` to the runtime account. Bucket policy, lifecycle, encryption settings and IAM membership remain operator-only. `storage.uploader` is insufficient because it cannot delete objects; use it only if the application is intentionally made append-only.

Create a static S3 access key for this service account, or use an equivalent short-lived Yandex credential mechanism. Store the access key ID and secret only in the VDS secret file / secret manager. Never put them in GitHub logs, this repository, screenshots or chat.

The official role model confirms that `storage.editor` includes object deletion and that encrypted-object access additionally requires the KMS encryption/decryption role: [Yandex Object Storage access management](https://yandex.cloud/en/docs/storage/security/), [encrypted object upload requirements](https://yandex.cloud/en/docs/storage/operations/objects/upload).

## Console steps

1. Open Yandex Cloud → the project folder → Identity and Access Management → Service accounts.
2. Create `peaktalk-prod-storage`.
3. Open the bucket → Access bindings → add the service account with `storage.editor`.
4. Open KMS → `peaktalk-prod-documents-kms` → Access bindings → add the service account with `kms.keys.encrypterDecrypter`.
5. Open the bucket security settings and verify:
   - public access is disabled;
   - encryption uses `peaktalk-prod-documents-kms`;
   - versioning is enabled if the retention/cost decision accepts it;
   - lifecycle rules cover incomplete multipart uploads and the approved retention window;
   - no anonymous `s3:GetObject` rule exists.
6. Create the S3 access key. Download/copy the secret once and place it on VDS through the secret-management procedure; do not send it to me in the conversation.

The bucket policy is destructive to existing policy rules when replaced, so I will inspect the current policy and produce an exact diff before changing it. This follows the provider warning in the [bucket policy procedure](https://yandex.cloud/en/docs/storage/operations/buckets/policy).

## Secret names expected on VDS

The application integration will use names with no values committed to the repository:

```text
STORAGE_PROVIDER=yandex
YANDEX_S3_ENDPOINT_URL=https://storage.yandexcloud.net
YANDEX_S3_REGION=ru-central1
YANDEX_S3_BUCKET=peaktalk-prod-private-documents
YANDEX_S3_ACCESS_KEY_ID=<secret>
YANDEX_S3_SECRET_ACCESS_KEY=<secret>
YANDEX_S3_KMS_KEY_ID=abjbiq7jvp0bca5qpe3l
YANDEX_S3_PRESIGN_TTL_SECONDS=900
```

The completed release gate included a non-destructive bucket check, a test
upload under a temporary prefix, a KMS-encrypted object head, a signed
download, a negative anonymous download, and cleanup of only that test prefix.
Existing objects were not migrated or deleted; the clean production database
contains no document or artifact rows.

## What I can do after the key is installed

The backend adapter is configured for timeout/retry/idempotency/content type
validation, KMS-encrypted uploads, private-object downloads, and short-lived
signed URLs. The scoped VDS smoke test passed. The remaining operator task is
to inspect and record the bucket policy, lifecycle and retention settings; an
existing bucket policy will not be replaced without an exact diff.
