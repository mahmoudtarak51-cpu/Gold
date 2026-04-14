# Gold Price Reporter

A Next.js App Router web application for live and historical global gold pricing in USD and spot-linked EGP, plus a conversion calculator by weight and purity.

## Tech Stack

- Node.js 22 LTS
- TypeScript 5.5+
- Next.js App Router
- Tailwind CSS v4
- PostgreSQL
- Zod
- Vitest and Playwright

## Environment

Create .env.local in the repository root:

```dotenv
METALS_DEV_API_KEY=your_api_key
METALS_DEV_BASE_URL=https://api.metals.dev/v1/
DATABASE_URL=postgres://user:password@localhost:5432/gold_price_app
CRON_SECRET=replace_with_long_random_value
MARKET_FRESH_SECONDS=28800
MARKET_STALE_SECONDS=86400
```

## Development

```bash
npm install
npm run db:migrate
npm run data:backfill -- --days 365
npm run dev
```

Open http://localhost:3000.

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:contract
npm run test:e2e
```

## Deployment Notes

- Keep METALS_DEV_API_KEY and CRON_SECRET secret.
- Schedule POST /api/internal/ingest every 8 hours with x-cron-secret.
- Run periodic historical backfill to keep long-range data complete.
- The app returns source metadata and freshness labels for all market-derived responses.
