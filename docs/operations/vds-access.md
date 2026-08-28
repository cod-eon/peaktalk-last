# PeakTalk VDS access

Status: operational note, reviewed 2026-08-09.

## Connection

- Host: `89.169.169.98`
- Application hostname: `peaktalk.ru`
- Current application directory: `/opt/peaktalk`
- Dedicated SSH user: `peaktalk-agent`
- Temporary bootstrap key path: `/Users/codeon/Documents/peaktalk-ai-workspace/ВРЕМЕННО_key`
- Durable agent key path: `/Users/codeon/.ssh/peaktalk-agent-vds`

Both private keys are local-only and must never be pasted into the repository,
terminal output, CI logs, or a ticket. The temporary key is ignored by Git and
should be revoked after the durable key has been validated. The currently observed
ED25519 host-key fingerprint is:

```text
SHA256:R4GsZO5E7Ybn+96rWxWGGJ2onbjQJPVGssj/7femw8I
```

Use strict host-key checking after the fingerprint has been verified:

```bash
ssh -i /Users/codeon/Documents/peaktalk-ai-workspace/ВРЕМЕННО_key \
  -o BatchMode=yes \
  -o StrictHostKeyChecking=yes \
  peaktalk-agent@89.169.169.98
```

For future agent sessions, use the durable key instead:

```bash
ssh -i /Users/codeon/.ssh/peaktalk-agent-vds \
  -o BatchMode=yes \
  -o StrictHostKeyChecking=yes \
  peaktalk-agent@89.169.169.98
```

## Privilege boundary

`peaktalk-agent` has no sudo and has a locked password. It is a member of the
`docker` group so it can inspect and operate the PeakTalk containers. Docker
access is root-equivalent on Linux; treat this key as a production privileged
credential and rotate/revoke it if exposed.

The account currently does not replace the GitHub Actions deployment identity:
the existing `/opt/peaktalk` tree is owned by `codeon`, and the deploy workflow
must first gain an explicit artifact-sync path for `peaktalk-agent`. Do not
change the GitHub `VDS_USER` secret or filesystem ownership during this audit.

## Safe checks

```bash
ssh -i /Users/codeon/Documents/peaktalk-ai-workspace/ВРЕМЕННО_key \
  -o BatchMode=yes -o StrictHostKeyChecking=yes \
  peaktalk-agent@89.169.169.98 \
  'id && docker compose -f /opt/peaktalk/docker-compose.yml ps'
```

Never use `StrictHostKeyChecking=no`, never remove `codeon`, and never use
`docker compose down -v` on production volumes.

## Key rotation

Install a new public key alongside the old key, validate a new SSH session,
then remove the old public key. Never replace the only working key in one
step. The temporary key should be revoked after confirming the durable key
remains usable. Neither key is an application secret or a durable backup.
