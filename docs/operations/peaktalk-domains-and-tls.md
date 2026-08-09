# PeakTalk domains, DNS and TLS

Status: DNS, TLS and Nginx routing are enabled for the Logto hostnames. Logto
application Auth integration remains a separate migration gate.

## DNS records to add

At the DNS provider, add these records. Use the VDS address `89.169.169.98` for each A record:

| Name | Type | Value | Purpose |
|---|---|---|---|
| `@` | A | `89.169.169.98` | Main PeakTalk application |
| `www` | CNAME | `peaktalk.ru.` | Canonical web redirect |
| `auth` | A | `89.169.169.98` | Public Logto issuer / OAuth endpoints |
| `admin.auth` | A | `89.169.169.98` | Logto admin console, later access-restricted |

Do not add `api` unless we deliberately expose a separate API hostname. The current application uses `https://peaktalk.ru/api`, so adding extra public origins would expand the CORS and attack surface without product benefit.

Keep existing MX, SPF, DKIM, DMARC, DNSSEC, certificate-related and unrelated records unchanged. Do not proxy `auth` or `admin.auth` through a CDN until WebSocket/OAuth callback behavior and the trust boundary are explicitly tested.

## Values I need after DNS changes

Send only the fact that DNS is configured and the names, not credentials. The
records now resolve from public DNS and were verified from the VDS and local
resolver:

```text
auth.peaktalk.ru -> 89.169.169.98
admin.auth.peaktalk.ru -> 89.169.169.98
```

Propagation was sufficient for this release gate: both names resolve to the
expected address and public HTTPS requests return successfully.

## TLS plan on VDS

1. Preserve the existing `peaktalk.ru` / `www.peaktalk.ru` certificate and renewal job.
2. A separate certificate containing `auth.peaktalk.ru` and
   `admin.auth.peaktalk.ru` is installed at
   `/etc/letsencrypt/live/auth.peaktalk.ru/` and renews through Certbot.
3. Separate nginx virtual hosts are installed:
   - `auth.peaktalk.ru` → Logto public endpoint;
   - `admin.auth.peaktalk.ru` → Logto admin endpoint, protected by Logto
     admin authentication and an edge rate limit.
4. `nginx -t`, certificate SANs, TLS protocol policy, redirect behavior,
   endpoint routing and Logto health have passed. Application integration
   remains separately gated.
5. Keep a timestamped copy of nginx configuration and certificate metadata for rollback. Private keys stay on VDS and are never copied into GitHub artifacts.

Logto's official deployment settings distinguish the public endpoint, admin endpoint, ports and secret vault key; those values will be configured in the separate Logto Compose project, not in the PeakTalk application Compose file: [Logto OSS deployment and configuration](https://docs.logto.io/logto-oss/deployment-and-configuration).

## Required callbacks to prepare later

The exact callback URLs will be recorded in the Auth migration gate after the application adapter exists. The baseline issuer will be `https://auth.peaktalk.ru/`; admin traffic will use `https://admin.auth.peaktalk.ru/`. Do not guess callback paths or add wildcard redirects.
