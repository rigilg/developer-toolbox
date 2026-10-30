# Security and privacy design

## Data flow

Local input → in-memory React state → lazily imported utility → text output. No local utility payload is sent to APIs, analytics, logs, query strings, browser history or local storage. Theme, favorite tool IDs and recent tool IDs are the only local storage entries. Copy and download are explicit actions. No decoded HTML/XML is inserted as markup.

Exceptions are labeled: certificate inspection posts only a hostname to `/api/certificate`; optional JWKS/OIDC retrieval uses direct browser HTTPS with omitted credentials, no referrer, no redirects, five-second timeout and a streamed 1 MB response limit. Remote metadata is never automatically trusted for JWT verification. The browser and remote provider enforce CORS. No server-side URL proxy exists.

## Server diagnostic

Accept DNS hostnames only, not IP literals, URLs, ports, credentials or paths. Resolve all addresses and reject every set containing private, loopback, link-local, multicast, mapped or reserved ranges. Pin the TCP destination to a validated resolved IP while retaining hostname SNI. Port 443 only; no HTTP request or redirects. Connection limit 5 seconds; overall request deadline 8 seconds; request body limit 1 KB; up to 10 requests/minute per source and 8 concurrent connections per warm instance. Responses use `Cache-Control: no-store`.

The warm-instance limiter is intentionally not represented as a globally distributed limit. Vercel's platform DDoS protection provides a baseline; for a public high-traffic deployment configure a platform firewall rate-limit rule for `/api/certificate`. No database or paid rate-limit dependency is required by the local utilities.

Inspection records trust errors rather than refusing expired/self-signed certificates, because displaying those errors is the purpose of the tool. It sends no application data. Presented chain metadata is not a revocation, transparency or comprehensive trust audit.

## Parsing and resource bounds

Inputs are limited to 1 MB per field, file hashing to 20 MB, regex text to 100,000 characters, regex patterns to 2,000 characters, matches to 1,000, UUID batches to 1,000 and SCIM nesting to 40. Regex runs in a worker terminated after 500 ms. XML DOCTYPE/entity declarations are rejected. YAML aliases have an expansion cap. JSONPath script evaluation is disabled. SAML DEFLATE output is capped before XML parsing. Decoded entities are rendered as plain text.

## Crypto

Web Crypto generates randomness and implements SHA/HMAC; `jose` implements JWT and JWK/SPKI conversion. Explicit expected algorithms prevent header-driven algorithm confusion. JWT cryptographic and claim validation are separate, with expected issuer/audience opt-in and visible. Decoder claims are unverified. Private JWK/PEM and symmetric JWKS material are rejected. Webhook verification uses native Web Crypto verify over exact bytes, with authenticated timestamps when enabled. Password alphabet sampling rejects modulo bias and enforces enabled sets. Passphrase estimates disclose the local vocabulary size. Fast hashes are never recommended for password storage.

## Browser headers

CSP blocks third-party scripts, objects, framing, foreign base URLs and foreign form actions. HTTPS connections are allowed for explicit metadata retrieval. Inline scripts/styles remain permitted for Next.js static hydration and styling; no `unsafe-eval` is used. This is a documented tradeoff for static rendering, not a nonce-based strict CSP. Also set HSTS (without includeSubDomains, protecting unrelated parent-domain configurations), no-sniff, no-referrer, DENY framing and disabled camera/microphone/geolocation.

## Reporting

Report issues via the repository or rigilgilbert.com. Never include live tokens, private keys, credentials or personal data in issue reports. Use synthetic reproductions. Dependency lockfile and CI audit cover production packages; automated tests do not constitute an independent security audit.
