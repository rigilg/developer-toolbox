# Validation report

## Verified locally

- Next.js 16.4.3 production build: passed, with all 37 tool pages and six category pages statically generated.
- Strict TypeScript: passed.
- ESLint with zero warnings: passed.
- Vitest/Testing Library: 165 tests passed, including final regression cases for reserved TypeScript names, calendar rollover and non-finite YAML numbers. Includes valid inputs, invalid inputs, edge cases, format round trips, RFC 4231 HMAC and RFC 7636 PKCE vectors, valid/invalid RSA and HMAC JWT signatures, private-key rejection, XML entity rejection, disabled JSONPath script evaluation, SCIM grammar, WebAuthn CBOR, subnet /0 /31 /32, epoch timestamps, prototype-named input fields, and local processing checks.
- Playwright: 18 tests passed locally and 18 passed against the actual production HTTPS domain. Covers all dedicated routes, every local utility with valid input, known file-hash output, viewport overflow, search, navigation, theme, copy, clear, download, local-input privacy, regex worker deadline, inaccessible certificate destinations and axe WCAG A/AA scans on homepage/workbenches.
- Dependency audit after removing unused packages: zero reported vulnerabilities.
- Screenshots in `docs/qa` show desktop/mobile homepage and JSON workbench with synthetic examples only.

## DNS

Added exactly one CNAME: `toolbox.rigilgilbert.com` → `0351ee308018ab3b.vercel-dns-017.com`, TTL 600. Existing 12 records, including apex, wildcard, mail and all other subdomains, remain in place. Porkbun nameservers remain unchanged. Vercel subsequently reported `configuredBy: CNAME`, `misconfigured: false`, and no conflicts.

## Performance measurement

The Windows audit browser failed, so the audit was rerun successfully in isolated Linux Chrome on GitHub Actions. [Completed audit run](https://github.com/rigilg/developer-toolbox/actions/runs/40987702968). Lighthouse 13.6.0 measured the public production URLs on October 29, 2026 (Chicago time).

| Page | Device | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- | --- |
| Homepage | Mobile | 98 | 100 | 96 | 100 |
| Homepage | Desktop | 100 | 100 | 100 | 100 |
| JSON Formatter | Mobile | 99 | 100 | 100 | 100 |
| JSON Formatter | Desktop | 100 | 100 | 100 | 100 |

All sampled pages meet the requested score targets. Mobile LCP was 0.8–0.9 seconds, TBT 100–150 ms, and CLS 0. Desktop LCP was 0.2–0.3 seconds, TBT 0–10 ms, and CLS 0. These are single simulated lab runs, not field-user Core Web Vitals or guarantees for every utility.

The homepage mobile best-practices deduction was a 404 for `/favicon.ico`. A separate accessible-label diagnostic flagged the quick-search button. Both fixes are prepared in the pull request; the table above honestly records production before those fixes. Render-blocking CSS showed an estimated 100 ms mobile LCP opportunity on the homepage; unused/legacy JavaScript diagnostics estimated no LCP saving, so no speculative bundle changes were made.

Full HTML/JSON reports are in the run's `production-lighthouse` artifact (14-day retention). Permanent summaries are in `docs/qa/scores.json` and `docs/qa/lighthouse/results.json`. Run `node scripts/lighthouse.mjs` with installed Chrome-for-Testing on Linux, or use the Production Lighthouse workflow after merge. An audit runtime error fails the job and never masquerades as measured zero scores.

## Deployment

Initial deployment `dpl_6KjCmYFkAnhefh3zzkkjLfZdZSZf` reached READY from commit `3360453feda484c3efcfc57f8aa9432e2ae97250`. Vercel assigned the production custom domain.

- `https://toolbox.rigilgilbert.com/`: HTTP 200, expected application content, successful certificate validation.
- `http://toolbox.rigilgilbert.com/`: HTTP 308 to HTTPS.
- CSP and HSTS headers confirmed on the live response.
- Production `/api/certificate` with `example.com`: HTTP 200, authorized TLS 1.3, public certificate subject/issuer/SANs/validity and chain returned.
- All 18 production browser tests passed across desktop/mobile, including all 36 local utility operations, real file hashing and privacy checks.
- DNS: Vercel `misconfigured: false`; no unrelated DNS records changed.

User authorized the one-time initial `main`/`development` branch setup. `main` is the repository default branch. Future changes use pull requests.

Final approved source: `804b6d413f9efb085409516df8f2f603652e5292` on `main` and `development`. Production deployment `dpl_Ew1DgrCD48Kkq9wPfAz3e7NSsnUw` reached READY and owns `toolbox.rigilgilbert.com`.

GitHub CI completed successfully on all three branches: [main run](https://github.com/rigilg/developer-toolbox/actions/runs/40986668163), [development run](https://github.com/rigilg/developer-toolbox/actions/runs/40986667942), [feature run](https://github.com/rigilg/developer-toolbox/actions/runs/40986664279). These run the production build, 165 unit/component tests and 18 desktop/mobile browser checks on Linux.

Connected the existing GitHub integration to the Vercel project; the Vercel API now lists `rigilg/developer-toolbox` as a linked Git project. No new account credentials or expanded GitHub app permissions were created.

Direct TLS verification: authorized TLS 1.3, CN/SAN `toolbox.rigilgilbert.com`, issuer Let's Encrypt YR2, validity October 30, 2026 00:33:30 UTC through January 28, 2027 00:33:29 UTC. Automatic renewal is managed by Vercel.

Production error/fatal runtime-log scan over the release window returned no matching logs. This is a point-in-time observation, not continuous monitoring. No tracking/drain integration was added.

## Scope limitations

- IAM checks are structural/advisory; they do not call AWS Access Analyzer or calculate effective permissions.
- SAML and WebAuthn inspectors decode structures; they do not verify those protocols' signatures.
- Public key conversion supports RSA/EC SPKI only; no private keys or certificates as PEM input.
- CORS simulation is conservative for content-type because header values are not supplied.
- Remote JWKS/OIDC retrieval requires provider CORS and intentionally has no server proxy.
- Certificate rate limiting is per warm server instance, not a globally distributed guarantee.
- Static Next.js hydration requires the documented inline-script CSP allowance.
