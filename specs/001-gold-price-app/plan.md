# Implementation Plan: Gold Price Web Application

**Branch**: `[001-gold-price-app]` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-gold-price-app/spec.md`

**Note**: This plan covers Phase 0 research and Phase 1 design artifacts for the
Gold Price Web Application.

## Summary

Build a public, read-only gold-price web application that shows current global
gold prices in USD and spot-linked EGP equivalents, historical views, and a
weight/purity calculator. The application will be implemented as a single
Next.js App Router project with server-side route handlers, a canonical
Metals.Dev market-data provider, scheduled snapshot ingestion for intraday
history, PostgreSQL-backed historical storage, and mobile-first UI components
that always expose source attribution, timestamps, freshness state, and pricing
disclaimers.

## Technical Context

**Language/Version**: TypeScript 5.5+ on Node.js 22 LTS  
**Primary Dependencies**: Next.js App Router, React, Tailwind CSS v4, Zod 4,
Recharts, PostgreSQL client/query layer  
**External Data Sources**: Metals.Dev `/latest` for live metals plus FX,
Metals.Dev `/timeseries` for daily backfill and same-period FX history  
**Storage**: PostgreSQL for minute snapshots, daily history backfill, and
ingestion bookkeeping; no user-account persistence in V1  
**Testing**: Vitest for domain/provider/unit logic, Playwright for end-to-end
flows, contract assertions for public route handlers  
**Target Platform**: Modern desktop and mobile browsers, Node.js server runtime  
**Project Type**: Web application  
**Freshness Target**: Ingest latest source data every 8 hours, auto-refresh the
open page every 8 hours, mark delayed after 8 hours, mark stale after 24 hours
without a valid combined snapshot  
**Performance Goals**: Primary pricing summary visible within 5 seconds on a
standard mobile connection, history range switches within 1 second from cached
server data, converter responses returned within 500 ms p95  
**Constraints**: Public read-only product, English-only V1, no manual refresh
control, EGP always equals spot gold multiplied by same-period USD/EGP,
Egypt-local premiums are out of scope, Metals.Dev timeseries is limited to
30-day windows per request  
**Observability**: Structured server logs for provider latency, ingestion
outcomes, freshness transitions, protected health and ingest endpoints, and
warning logs for stale-source or timestamp-skew conditions  
**Scale/Scope**: Up to 10k daily visitors, hundreds of concurrent readers, 24h
of minute-level intraday data, provider-supported daily historical data for the
public `all` range, plus continued daily backfill after launch

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: PASS (pre-design) and PASS (post-design re-check after generated
artifacts)

- [x] Source transparency is defined for every user-visible price, rate, and
      derived value through `SourceNotice` fields in the data model and public
      API contracts for current, history, and conversion responses.
- [x] Refresh cadence, cache strategy, stale-data threshold, and fallback
      behavior are documented through 8-hour ingestion, 8-hour page polling,
      delayed and stale thresholds, and last-known-good persistence in
      PostgreSQL.
- [x] Canonical units, conversion formulas, FX sourcing, and rounding rules are
      centralized and testable in shared market services and validation schemas.
- [x] Loading, empty, stale, and provider-error states are designed for the
      primary journey with dedicated dashboard state components and explicit API
      response semantics.
- [x] Accessibility basics and mobile usability are addressed through a
      server-rendered summary, semantic content structure, responsive chart and
      calculator components, and quickstart verification steps.
- [x] Observability, diagnostics, and informational-only product copy are
      accounted for through structured ingestion logs, health checks,
      stale-source warnings, and required disclaimer rendering in all market
      views.

## Project Structure

### Documentation (this feature)

```text
specs/001-gold-price-app/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- market-data.openapi.yaml
`-- tasks.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- api/
|   |   |-- market/
|   |   |   |-- current/route.ts
|   |   |   |-- history/route.ts
|   |   |   `-- convert/route.ts
|   |   `-- internal/
|   |       `-- ingest/route.ts
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- components/
|   |-- calculator/
|   |-- dashboard/
|   |-- history/
|   `-- shared/
|-- lib/
|   |-- config/
|   |-- market/
|   |   |-- providers/
|   |   |-- repositories/
|   |   |-- services/
|   |   |-- transforms/
|   |   `-- validators/
|   `-- telemetry/
`-- types/

tests/
|-- contract/
|-- integration/
`-- unit/
```

**Structure Decision**: Use a single Next.js application with server route
handlers for market data, shared domain services under `src/lib/market`, and a
single responsive UI surface at `src/app/page.tsx`. This keeps source
normalization, conversion logic, and public UI in one deployable unit while
still separating contract, integration, and unit tests.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Durable snapshot storage and scheduled ingestion | Intraday history, same-day auto-refresh validation, and trustworthy stale fallback all require persisted market snapshots independent of active page views | Direct provider reads plus short-lived cache cannot recreate intraday charts or survive restarts and deployments with last-known-good data intact |
