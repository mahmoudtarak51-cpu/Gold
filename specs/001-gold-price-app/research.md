# Research: Gold Price Web Application

## Decision: Use Next.js App Router with TypeScript as the single application framework

- **Decision**: Build the product as a single Next.js App Router application in
  TypeScript, using server components for the initial page render and route
  handlers for public market-data endpoints.
- **Rationale**: Next.js App Router gives us one codebase for SSR, client
  interactivity, and server-side data access. Its built-in server `fetch`
  caching and route handlers reduce infrastructure overhead for a public,
  read-only web application.
- **Alternatives considered**:
  - Vite SPA plus separate Express or Fastify API: rejected because it creates
    two deployable surfaces and duplicates routing and data-fetching concerns.
  - Pure static site plus browser-only provider calls: rejected because it would
    expose provider credentials or force unreliable unauthenticated browser
    access to paid market-data endpoints.

## Decision: Use Metals.Dev as the canonical source for both gold and FX data

- **Decision**: Use Metals.Dev as the single canonical market-data provider for
  V1. Use `/latest` for current gold plus FX snapshots and `/timeseries` for
  historical daily backfill and same-period USD/EGP conversions.
- **Rationale**: Metals.Dev exposes metals and currencies in one provider,
  making source labeling, timestamp handling, and historical EGP conversion
  simpler and more consistent than stitching together unrelated APIs.
- **Provider constraints that shape the design**:
  - `/latest` delivers metals and currency rates with up to 60-second updates.
  - `/timeseries` provides daily historical metals and currencies but limits
    each request to a 30-day date window, so longer ranges must be batched and
    normalized server-side.
- **Alternatives considered**:
  - Separate gold API plus FX API: rejected because it increases timestamp skew
    risk and complicates source attribution for every derived EGP value.
  - Scraping public market pages: rejected because HTML contracts are fragile
    and do not meet the constitution's testable data-contract requirement.

## Decision: Add scheduled snapshot ingestion plus PostgreSQL persistence

- **Decision**: Persist market snapshots in PostgreSQL and trigger a protected
  ingest path every 60 seconds to store intraday data. Use provider timeseries
  backfill to seed at least one year of daily history at launch.
- **Rationale**: The spec explicitly includes intraday history. Since
  Metals.Dev historical data is daily, the application must collect and persist
  its own minute-level snapshots to serve same-day charts and dependable
  last-known-good fallback after restarts or deploys.
- **Storage strategy**:
  - Store minute snapshots for intraday views and freshness fallback.
  - Store daily backfill rows for 7d, 30d, 1y, and `all` history.
  - Avoid user tables or account persistence in V1.
- **Alternatives considered**:
  - In-memory cache only: rejected because restarts wipe history and fallback
    state.
  - File-based persistence: rejected because it is fragile across deployments
    and unsuitable for shared hosting environments.

## Decision: Keep the browser behind a server-owned BFF contract

- **Decision**: The UI will talk only to internal JSON endpoints:
  `/api/market/current`, `/api/market/history`, and `/api/market/convert`.
- **Rationale**: A BFF layer keeps provider keys off the client, centralizes
  normalization and formulas, enforces source notices, and gives tests a stable
  contract even if provider payloads evolve.
- **Alternatives considered**:
  - Direct browser calls to the provider: rejected for security and source
    normalization reasons.
  - Page-only data access with no route handlers: rejected because the spec
    needs auto-refresh and range-switch interactions that benefit from
    lightweight JSON endpoints.

## Decision: Use Tailwind CSS v4 and Recharts for the UI layer

- **Decision**: Style the application with Tailwind CSS v4 and build charting
  with Recharts.
- **Rationale**: Tailwind provides zero-runtime styling with fast responsive
  iteration, while Recharts offers composable React charts and responsive
  rendering suitable for public market dashboards without introducing a heavier
  financial-chart dependency.
- **Alternatives considered**:
  - CSS Modules alone: rejected because the design requires many responsive
    layout variants and fast iteration on dashboard surfaces.
  - Heavier trading-chart libraries: rejected because V1 does not need broker-
    grade charting features, overlays, or drawing tools.

## Decision: Validate all provider and request contracts with Zod 4

- **Decision**: Use Zod 4 for provider-payload validation, query-parameter
  validation, and normalized response schemas.
- **Rationale**: The constitution requires testable data contracts. Zod gives a
  single schema source for parsing external payloads, route inputs, and domain
  responses with strict TypeScript inference.
- **Alternatives considered**:
  - Hand-rolled guards: rejected because they are repetitive and easier to
    drift out of sync with tests.
  - Yup or ad hoc validators: rejected because Zod integrates more directly
    with TypeScript-first route and service code.

## Decision: Use Vitest and Playwright as the testing stack

- **Decision**: Use Vitest for unit and service-level tests and Playwright for
  end-to-end verification of the public user journeys.
- **Rationale**: Vitest fits a modern TypeScript toolchain and keeps unit
  feedback fast, while Playwright supports multi-browser end-to-end coverage for
  the critical flows: initial load, auto-refresh, history switching, stale
  states, and calculator behavior.
- **Alternatives considered**:
  - Jest plus Cypress: rejected because it duplicates more tooling and offers no
    advantage for this size of app.
  - Browser-only manual QA: rejected because the constitution requires reliable
    automated checks for provider drift and high-value user journeys.

## Decision: Encode freshness in domain state, not just UI text

- **Decision**: Model freshness explicitly as `fresh`, `delayed`, `stale`, or
  `unavailable`, and compute it server-side from snapshot age and timestamp
  skew.
- **Rationale**: Freshness affects rendering, fallback behavior, tests, logs,
  and disclaimer placement. Making it a first-class domain concept prevents the
  UI from inventing status rules ad hoc.
- **Alternatives considered**:
  - Ad hoc timestamp checks in components: rejected because it would spread
    correctness rules across the UI and make stale-state testing harder.
