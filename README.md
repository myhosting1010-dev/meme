# Application foundation

The screenshot-inspired coin list at `/` now loads real DEX Screener data through `/api/coins`, with original Mintline branding, local filtering, metric-based sorting and responsive navigation. DEX Screener was selected for this integration; it is not confirmed as the reference site's provider.

## Install and run

Use Node.js 22.15+ and npm. From this directory:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open http://127.0.0.1:3000. On other shells use `npm` in place of `npm.cmd`. No MongoDB credentials are required for startup, tests or build. Leave MONGODB_URI blank until a later approved database workflow needs it. Never commit `.env.local` or put secrets in `NEXT_PUBLIC_*` variables.

## Checks and production startup

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd start
```

`npm.cmd run check` runs lint, unit checks and build in sequence. Phase 1 uses Node's built-in test runner for configuration checks; the previously requested Vitest/Jest and Playwright tooling is deferred until approved feature tests are needed. No end-to-end tests are claimed.

## Source structure

- `src/app`: routes, root layout, error boundaries; `api/` reserves future handlers.
- `src/components/ui`: reusable primitives; `components/layouts`: shared shells.
- `src/hooks`: future client hooks; `services`: future server business operations.
- `src/lib/env.js`: server-only configuration; `lib/db`: lazy Mongoose connection.
- `src/models`: future verified models; `schemas`: Zod validation.
- `src/utils`: shared pure helpers; `constants`: public, nonsecret constants.
- `tests/unit`, `tests/integration`, `tests/e2e`: separated check scopes.

`@/*` maps to `src/*`. Server Components are the default. Database/configuration modules use `server-only`; future database handlers must use the Node runtime and authorize each operation. Connection reuse is per process; failed connections can be retried. Production index creation is disabled and must be managed deliberately. No live database connectivity has been tested.

The public coin feed API is implemented. Authentication, database models, additional product pages, CI/CD and deployment remain deferred. Unverified sidebar destinations are disabled. No API key or live database is required; server internet access to api.dexscreener.com is required. Obtain approval before expanding scope further.

The feed includes up to 30 latest-profile tokens, not every token on DEX Screener. Sorts apply within that list: Trending by 24-hour trades, Newest by pair creation, volume by 24-hour USD volume and market cap by reported cap. Each token uses its most liquid available pair. Values refresh every minute; missing values show —. Provider failures show retry/stale-data indicators instead of mock data. Market cap, volume, liquidity, 24-hour price change and USD price replace unverified screenshot metrics, fake multipliers and illustrative charts.

## Visual comparison checklist

- Desktop: dark sidebar and main canvas, 90px toolbar, selected Newest pill, search/status position.
- Sidebar: label grouping, purple premium treatment, reward slots and account section; original branding expected.
- Coin rows: rounded dark cards, avatar/title/symbol alignment, green/red value backgrounds, purple third value, green multiple and sparkline.
- Tablet/mobile: no horizontal page overflow, scrollable sort controls, stacked values, menu drawer, Escape dismissal and focus return.
- Keyboard: visible focus, skip link, search/clear, sort buttons, info disclosure and drawer controls.
- States: unmatched search shows an empty state and clear action; route loading uses skeleton; error boundary supports retry.
- All navigable internal links lead to `/`; unknown pages have no invented links.

Exact font, mobile reference layout, avatars, chart history, metric meanings and live behavior are not claimed as matching the reference.

## Known tooling issues

The full npm audit reports five high-severity entries in the development-only Next lint dependency chain, traced to the unpatched [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). The production-only audit reported zero vulnerabilities during Phase 1. ESLint 9 is retained for the installed plugins' declared compatibility, despite its unsupported-version warning. Recheck before CI or release; do not force-downgrade the framework using `npm audit fix --force`.
