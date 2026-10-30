# Deployment

## Target

- GitHub: `rigilg/developer-toolbox`
- Vercel team: `rigilgilbert-6315` (`team_z6zmzndvb0eeHqBj5tMVvB4P`)
- Vercel project: `developer-toolbox` (`prj_wHcLsMUKwq1SHcbssrcpCw0mMQUX`)
- Node.js: 24.x
- Production branch: `main`; integration/preview branch: `development`
- Custom domain: `toolbox.rigilgilbert.com`

`vercel.json` defines the Next.js build and the 15-second certificate function ceiling. The app needs no secret environment variables. Do not copy local `.env` or `.vercel` files into Git.

## Porkbun DNS

The following target was retrieved from Vercel's actual configuration for this project and domain, not inferred from a generic example:

| Type | Host | Answer | TTL |
| --- | --- | --- | --- |
| CNAME | `toolbox` | `0351ee308018ab3b.vercel-dns-017.com` | `600` seconds |

1. Sign in to Porkbun and locate `rigilgilbert.com` in Domain Management.
2. Open its DNS record manager.
3. Look specifically for an existing `toolbox` A/AAAA/CNAME record. Replace only a conflicting record for that exact hostname. A wildcard parking record does not need removal: an explicit `toolbox` CNAME overrides it.
4. Add the CNAME above. Leave apex records, mail records, other subdomains and nameservers unchanged.
5. Return to the Vercel project's Domains page and refresh the configuration. Wait for propagation and automatic certificate issuance.
6. Verify HTTPS and the HTTP → HTTPS redirect at the custom domain. Check homepage, tool routes, assets, local processing, certificate diagnostics and mobile layout.

DNS was configured successfully with the exact record above. Vercel reports `misconfigured: false`, and HTTPS/HTTP redirection and the live app were verified. The existing GitHub integration is connected. `main` is production and `development` provides previews. See VALIDATION.md for deployment IDs, TLS details and actual test results.

## Rollback

Use Vercel's previous known-good production deployment and promote it. Do not repoint parent-domain DNS or change nameservers. Git source rollback should use a reviewed revert commit. Verify the custom domain again after promotion.
