# Validation report

## Verified locally

- Next.js 16.4.3 production build: passed, with all 37 tool pages and six category pages statically generated.
- Strict TypeScript: passed.
- ESLint with zero warnings: passed.
- Vitest/Testing Library: 162 tests passed. Includes valid inputs, invalid inputs, edge cases, format round trips, RFC 4231 HMAC and RFC 7636 PKCE vectors, valid/invalid RSA and HMAC JWT signatures, private-key rejection, XML entity rejection, disabled JSONPath script evaluation, SCIM grammar, WebAuthn CBOR, subnet /0 /31 /32, epoch timestamps, prototype-named input fields, and local processing checks.
- Playwright baseline: 14 tests passed across desktop and mobile. Covers all dedicated routes, viewport overflow, search, navigation, theme, copy, clear, download, local-input privacy, regex worker deadline, inaccessible certificate destinations and axe WCAG A/AA scans on homepage/workbenches.
- Additional browser tests exercise all 36 local tools with valid inputs and known file-hash output; final result recorded after release checks.
- Dependency audit after removing unused packages: zero reported vulnerabilities.
- Screenshots in `docs/qa` show desktop/mobile homepage and JSON workbench with synthetic examples only.

## DNS

Added exactly one CNAME: `toolbox.rigilgilbert.com` → `0351ee308018ab3b.vercel-dns-017.com`, TTL 600. Existing 12 records, including apex, wildcard, mail and all other subdomains, remain in place. Porkbun nameservers remain unchanged. Vercel subsequently reported `configuredBy: CNAME`, `misconfigured: false`, and no conflicts.

## Performance measurement

Local Lighthouse failed with `NO_FCP` despite working Playwright rendering. Category scores were null, so no Lighthouse score is claimed. Targets remain Performance 90+, Accessibility/Best Practices/SEO 95+. Automated axe scans passed; this is not a substitute for a measured Lighthouse score or manual assistive-technology audit.

## Deployment

Production build, GitHub CI and HTTPS/custom-domain verification are recorded below after the deployment completes. A domain ownership flag alone is not proof that the application is live.

## Scope limitations

- IAM checks are structural/advisory; they do not call AWS Access Analyzer or calculate effective permissions.
- SAML and WebAuthn inspectors decode structures; they do not verify those protocols' signatures.
- Public key conversion supports RSA/EC SPKI only; no private keys or certificates as PEM input.
- CORS simulation is conservative for content-type because header values are not supplied.
- Remote JWKS/OIDC retrieval requires provider CORS and intentionally has no server proxy.
- Certificate rate limiting is per warm server instance, not a globally distributed guarantee.
- Static Next.js hydration requires the documented inline-script CSP allowance.
