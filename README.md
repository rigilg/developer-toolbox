# Developer Toolbox

37 free developer utilities built with Next.js 16, React 19, strict TypeScript, Tailwind 4, shadcn-style Radix primitives and Lucide icons. Browser-first processing; no accounts, database, analytics or payload persistence.

Production domain: https://toolbox.rigilgilbert.com  
Repository: https://github.com/rigilg/developer-toolbox

## Run locally

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No secrets or environment variables are required. Web Crypto and clipboard operations require HTTPS or localhost.

```sh
npm run typecheck
npm run lint -- --max-warnings=0
npm test
npm run build
npx playwright install chromium
npm run test:e2e -- --workers=2
```

The build deliberately uses Next.js's supported webpack option: local Turbopack stalled on the Windows workspace. `npm start` serves the production build. Tests use synthetic fixtures only. `BASE_URL` targets an existing deployment instead of starting a local server.

## Project layout

- `src/config/tools.ts`: all 37 tools, categories, routes, examples, controls and privacy notes.
- `src/lib/tools/`: independently testable data, models, encoding, crypto, identity, SCIM, network and generation logic.
- `src/lib/tools/runner.ts`: lazy implementation imports; heavier libraries load when a tool runs.
- `src/components/tools/`: shared editors, workbench and result views.
- `src/components/ui/`: reusable shadcn-style UI primitive using Radix Slot and CVA.
- `src/workers/`: terminable regex computation.
- `src/lib/security/`: certificate destination validation and TLS inspection.
- `src/app/`: static tool/category pages, metadata, privacy, sitemap and one diagnostic API.
- `tests/`: Vitest/Testing Library and desktop/mobile Playwright with axe.

## Adding a tool

Add a registry definition, a pure or async logic function, a lazy runner mapping and valid/invalid/edge tests. Use the shared workbench controls; add a specialized result view only when it helps. Keep local tools free of network calls, logging, input URL parameters and storage. Preserve the privacy label when adding a remote feature.

## Existing utilities

Inspected `rigilg/base64-tool` and `rigilg/jwt-decoder` without changing those repositories or their deployments. Ported UTF-8, URL-safe, canonical Base64 validation and JWT Bearer/JWE/object validation. JWT cryptographic verification uses `jose` and Web Crypto. These are single consolidated tools, with no duplicate routes.

## Workflow

`main` is production and `development` is the integration/preview branch. Open feature pull requests into `development`, then promote reviewed changes to `main`. CI performs type checking, lint, unit/component tests, production dependency audit, build and desktop/mobile E2E. Vercel builds the production branch and preview branches via its Git integration. Configure a GitHub ruleset requiring `verify` on `main` if your account plan supports it; do not put production credentials into untrusted pull-request workflows.

See [tool catalog](docs/TOOLS.md), [security design](docs/SECURITY.md), [deployment](docs/DEPLOYMENT.md), and [validation report](docs/VALIDATION.md). The original user attachment is retained locally and excluded from published source.
