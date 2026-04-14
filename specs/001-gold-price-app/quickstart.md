# Quickstart: Gold Price Web Application

## Prerequisites

- Node.js 22 LTS
- npm 10+ or a compatible package manager
- PostgreSQL 15+ running locally or reachable remotely
- A Metals.Dev API key

## Environment

Create a `.env.local` file in the repository root with:

```dotenv
METALS_DEV_API_KEY=your_api_key
DATABASE_URL=postgres://user:password@localhost:5432/gold_price_app
CRON_SECRET=replace_with_long_random_value
MARKET_FRESH_SECONDS=28800
MARKET_STALE_SECONDS=86400
```

## Initial Setup

1. Scaffold the app with a Next.js App Router TypeScript baseline at the repo
   root.
2. Install dependencies for Next.js, Tailwind CSS, Zod, Recharts, PostgreSQL,
   Vitest, and Playwright.
3. Apply database migrations for snapshot, history, and ingestion tables.
4. Run an initial historical backfill for at least the last 365 days and, for
   the public `all` range, as much provider-supported daily history as the
   deployment allows.

Example planned workflow:

```bash
npm install
npm run db:migrate
npm run data:backfill -- --days 365
npm run dev
```

## Local Development Flow

1. Start the dev server.
2. Open `http://localhost:3000`.
3. Verify the home page shows:
   - Current gold spot value in USD
   - Spot-linked EGP equivalent
   - Source attribution and last-updated timestamp
   - Informational pricing disclaimer
4. Confirm the dashboard is configured to auto-refresh without a manual refresh
   button and will pick up a new snapshot on the next 8-hour polling window.
5. Switch the history range from `intraday` to `30d` and confirm the chart
   updates.
6. Use the calculator with a custom weight and purity and confirm the quote is
   returned in both supported currencies.

## Simulating Scheduled Ingestion Locally

Trigger the protected ingestion route manually during local development:

```powershell
Invoke-WebRequest `
  -Method POST `
  -Uri 'http://localhost:3000/api/internal/ingest' `
  -Headers @{ 'x-cron-secret' = $env:CRON_SECRET }
```

Run this on an 8-hour cadence locally if you want the app to refresh snapshots
data while developing.

## Test Commands

```bash
npm run test:unit
npm run test:contract
npm run test:e2e
```

## Release Readiness Checks

- All current, history, and conversion responses include source notices and
  timestamps.
- Stale and unavailable states are visible and not silently replaced with fake
  live data.
- Intraday history renders from persisted snapshots.
- Historical EGP charts use same-period FX values.
- No manual refresh control is exposed in V1.

## Validation Notes (2026-04-13)

- Executed successfully in this workspace:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:unit` (includes unit, contract, and integration suites)
   - `npm run test:contract`
   - `npm run test:e2e` (configured to `tests/e2e` with `--pass-with-no-tests`)
   - `npm run build`
- Not executed in this validation pass:
   - `npm run db:migrate`
   - `npm run data:backfill -- --days 365`
- Reason for skipped database steps: this environment does not include a configured live PostgreSQL instance and provider credentials for a safe end-to-end ingest run.
- Final setup note: before production deployment, run migration and backfill against the target database, then verify scheduler access to `POST /api/internal/ingest` with `x-cron-secret` on an 8-hour cadence.
