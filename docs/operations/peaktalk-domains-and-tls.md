# PeakTalk domains, DNS and TLS

Status: operator checklist; the VDS currently serves `peaktalk.ru` and `www.peaktalk.ru`. New Logto hostnames are not enabled yet.

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

Send only the fact that DNS is configured and the names, not credentials. I will verify from the VDS and public resolvers:

```text
auth.peaktalk.ru -> 89.169.169.98
admin.auth.peaktalk.ru -> 89.169.169.98
```

Propagation is complete for this release gate when authoritative DNS and at least two public resolvers return the expected address. The VDS nginx configuration and certificates will be changed only after that check.

## TLS plan on VDS

1. Preserve the existing `peaktalk.ru` / `www.peaktalk.ru` certificate and renewal job.
2. Obtain a separate certificate containing `auth.peaktalk.ru` and `admin.auth.peaktalk.ru` using the existing HTTP-01 webroot flow, or use a DNS-01 certificate if the DNS provider supports it.
3. Add separate nginx virtual hosts:
   - `auth.peaktalk.ru` → Logto public endpoint;
   - `admin.auth.peaktalk.ru` → Logto admin endpoint, with an additional access-control decision before public exposure.
4. Validate `nginx -t`, certificate SANs, TLS protocol policy, redirect behavior, OAuth issuer URL and Logto health before enabling application integration.
5. Keep a timestamped copy of nginx configuration and certificate metadata for rollback. Private keys stay on VDS and are never copied into GitHub artifacts.

Logto's official deployment settings distinguish the public endpoint, admin endpoint, ports and secret vault key; those values will be configured in the separate Logto Compose project, not in the PeakTalk application Compose file: [Logto OSS deployment and configuration](https://docs.logto.io/logto-oss/deployment-and-configuration).

## Required callbacks to prepare later

The exact callback URLs will be recorded in the Auth migration gate after the application adapter exists. The baseline issuer will be `https://auth.peaktalk.ru/`; admin traffic will use `https://admin.auth.peaktalk.ru/`. Do not guess callback paths or add wildcard redirects.
