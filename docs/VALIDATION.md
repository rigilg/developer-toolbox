# Validation report

## Verified locally

- Next.js 16.4.3 production build: passed, with all 37 tool pages and six category pages statically generated.
- Strict TypeScript: passed.
- ESLint with zero warnings: passed.
- Vitest/Testing Library: 162 baseline tests passed, plus final regression cases for reserved TypeScript names, calendar rollover and non-finite YAML numbers. Includes valid inputs, invalid inputs, edge cases, format round trips, RFC 4231 HMAC and RFC 7636 PKCE vectors, valid/invalid RSA and HMAC JWT signatures, private-key rejection, XML entity rejection, disabled JSONPath script evaluation, SCIM grammar, WebAuthn CBOR, subnet /0 /31 /32, epoch timestamps, prototype-named input fields, and local processing checks.
- Playwright: 18 tests passed locally and 18 passed against the actual production HTTPS domain. Covers all dedicated routes, every local utility with valid input, known file-hash output, viewport overflow, search, navigation, theme, copy, clear, download, local-input privacy, regex worker deadline, inaccessible certificate destinations and axe WCAG A/AA scans on homepage/workbenches.
- Dependency audit after removing unused packages: zero reported vulnerabilities.
- Screenshots in `docs/qa` show desktop/mobile homepage and JSON workbench with synthetic examples only.

## DNS

Added exactly one CNAME: `toolbox.rigilgilbert.com` → `0351ee308018ab3b.vercel-dns-017.com`, TTL 600. Existing 12 records, including apex, wildcard, mail and all other subdomains, remain in place. Porkbun nameservers remain unchanged. Vercel subsequently reported `configuredBy: CNAME`, `misconfigured: false`, and no conflicts.

## Performance measurement

Local Lighthouse failed with `NO_FCP` despite working Playwright rendering. Category scores were null, so no Lighthouse score is claimed. Targets remain Performance 90+, Accessibility/Best Practices/SEO 95+. Automated axe scans passed; this is not a substitute for a measured Lighthouse score or manual assistive-technology audit.

## Deployment

Initial deployment `dpl_6KjCmYFkAnhefh3zzkkjLfZdZSZf` reached READY from commit `3360453feda484c3efcfc57f8aa9432e2ae97250`. Vercel assigned the production custom domain.

- `https://toolbox.rigilgilbert.com/`: HTTP 200, expected application content, successful certificate validation.
- `http://toolbox.rigilgilbert.com/`: HTTP 308 to HTTPS.
- CSP and HSTS headers confirmed on the live response.
- Production `/api/certificate` with `example.com`: HTTP 200, authorized TLS 1.3, public certificate subject/issuer/SANs/validity and chain returned.
- All 18 production browser tests passed across desktop/mobile, including all 36 local utility operations, real file hashing and privacy checks.
- DNS: Vercel `misconfigured: false`; no unrelated DNS records changed.

User authorized the one-time initial `main`/`development` branch setup. Future changes use pull requests. Automatic Git integration/CI final status is recorded after branch initialization.

## Scope limitations

- IAM checks are structural/advisory; they do not call AWS Access Analyzer or calculate effective permissions.
- SAML and WebAuthn inspectors decode structures; they do not verify those protocols' signatures.
- Public key conversion supports RSA/EC SPKI only; no private keys or certificates as PEM input.
- CORS simulation is conservative for content-type because header values are not supplied.
- Remote JWKS/OIDC retrieval requires provider CORS and intentionally has no server proxy.
- Certificate rate limiting is per warm server instance, not a globally distributed guarantee.
- Static Next.js hydration requires the documented inline-script CSP allowance.
