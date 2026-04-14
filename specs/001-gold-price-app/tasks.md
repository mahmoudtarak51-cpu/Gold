# Tasks: Gold Price Web Application

**Input**: Design documents from `/specs/001-gold-price-app/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are REQUIRED for provider parsing, conversion logic,
freshness handling, public route contracts, and the end-to-end user journeys in
this feature.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., `US1`, `US2`, `US3`)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and core tooling setup

- [X] T001 Initialize the Next.js App Router workspace and package scripts in `package.json`, `tsconfig.json`, and `next.config.ts`
- [X] T002 Set up the root application shell and Tailwind baseline in `src/app/layout.tsx` and `src/app/globals.css`
- [X] T003 [P] Configure linting and formatting in `eslint.config.mjs`, `prettier.config.mjs`, and `.prettierignore`
- [X] T004 [P] Configure Vitest and Playwright runners in `vitest.config.ts`, `playwright.config.ts`, and `tests/setup/vitest.setup.ts`
- [X] T005 [P] Create reusable shared UI scaffolding in `src/components/shared/section-shell.tsx` and `src/components/shared/disclaimer.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create the PostgreSQL schema and migration for market tables in `db/migrations/001_market_data.sql`
- [X] T007 [P] Implement environment and database bootstrap modules in `.env.example`, `src/lib/config/env.ts`, and `src/lib/config/db.ts`
- [X] T008 [P] Implement the Metals.Dev provider client and upstream validation schemas in `src/lib/market/providers/metals-dev-client.ts` and `src/lib/market/validators/provider-schemas.ts`
- [X] T009 [P] Implement shared market types, conversion helpers, freshness rules, and source-notice mapping in `src/types/market.ts`, `src/lib/market/transforms/conversions.ts`, `src/lib/market/transforms/freshness.ts`, and `src/lib/market/transforms/source-notice.ts`
- [X] T010 Implement snapshot, daily history, and ingestion repositories in `src/lib/market/repositories/market-snapshot-repository.ts`, `src/lib/market/repositories/daily-history-repository.ts`, and `src/lib/market/repositories/ingestion-run-repository.ts`
- [X] T011 Implement snapshot ingestion and historical backfill services in `src/lib/market/services/snapshot-ingestion-service.ts`, `src/lib/market/services/history-backfill-service.ts`, and `scripts/backfill-history.ts`
- [X] T012 Implement structured logging and API error helpers in `src/lib/telemetry/logger.ts` and `src/lib/market/services/api-error.ts`
- [X] T013 [P] Add foundational unit coverage for provider parsing and market transforms in `tests/unit/market/provider-schemas.test.ts` and `tests/unit/market/market-transforms.test.ts`
- [X] T014 Implement the protected scheduler ingestion endpoint in `src/app/api/internal/ingest/route.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Check Live Gold Prices (Priority: P1) MVP

**Goal**: Deliver a public landing page that shows current gold prices in USD
and spot-linked EGP, including timestamps, freshness status, auto-refresh, and
fallback behavior.

**Independent Test**: Open the landing page and verify the current quote,
source notice, freshness label, stale or unavailable states, and automatic
refresh behavior without visiting any other route directly.

### Tests for User Story 1

> **NOTE**: Write these tests first, ensure they fail before implementation.

- [X] T015 [P] [US1] Add the current market API contract test in `tests/contract/api/current-market.contract.test.ts`
- [X] T016 [P] [US1] Add the landing-page integration test for current quote, stale fallback, and auto-refresh in `tests/integration/current-dashboard.spec.ts`
- [X] T017 [P] [US1] Add unit coverage for current quote assembly and freshness-state transitions in `tests/unit/market/current-quote-service.test.ts`

### Implementation for User Story 1

- [X] T018 [US1] Implement the current quote domain service in `src/lib/market/services/current-quote-service.ts`
- [X] T019 [US1] Implement the current market route handler in `src/app/api/market/current/route.ts`
- [X] T020 [P] [US1] Build the current-price and market-status components in `src/components/dashboard/current-price-card.tsx` and `src/components/dashboard/market-status-banner.tsx`
- [X] T021 [US1] Build the live dashboard container with automatic polling in `src/components/dashboard/live-market-dashboard.tsx`
- [X] T022 [US1] Render the landing page with source notices and disclaimer text in `src/app/page.tsx`

**Checkpoint**: User Story 1 should be fully functional and testable on its own

---

## Phase 4: User Story 2 - Explore Price History (Priority: P2)

**Goal**: Add chartable historical ranges in USD and EGP, including same-period
FX conversion for EGP and clear handling for incomplete or unavailable history.

**Independent Test**: From the populated landing page, switch between `intraday`,
`7d`, `30d`, `1y`, and `all` ranges and confirm the chart and summaries update
correctly in USD and EGP.

### Tests for User Story 2

- [X] T023 [P] [US2] Add the history API contract test in `tests/contract/api/history.contract.test.ts`
- [X] T024 [P] [US2] Add the range-switch and currency-switch integration test in `tests/integration/history-chart.spec.ts`
- [X] T025 [P] [US2] Add unit coverage for history aggregation and same-period FX conversion in `tests/unit/market/history-service.test.ts`

### Implementation for User Story 2

- [X] T026 [US2] Implement the historical series query service in `src/lib/market/services/history-service.ts`
- [X] T027 [US2] Implement the history route handler in `src/app/api/market/history/route.ts`
- [X] T028 [P] [US2] Build the historical chart and range-switcher components in `src/components/history/history-chart.tsx` and `src/components/history/history-range-tabs.tsx`
- [X] T029 [US2] Integrate historical views into the live dashboard in `src/components/dashboard/live-market-dashboard.tsx`

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Convert and Compare Gold Values (Priority: P3)

**Goal**: Add a calculator that converts visitor-entered weight and purity into
an indicative USD or EGP value using the current trusted snapshot.

**Independent Test**: Enter valid and invalid combinations of weight, unit,
purity, and currency and confirm the calculator returns the correct result or
validation message with timestamp and source context.

### Tests for User Story 3

- [X] T030 [P] [US3] Add the conversion API contract test in `tests/contract/api/convert.contract.test.ts`
- [X] T031 [P] [US3] Add the calculator integration test for valid and invalid inputs in `tests/integration/conversion-calculator.spec.ts`
- [X] T032 [P] [US3] Add unit coverage for purity, unit, and currency calculations in `tests/unit/market/conversion-service.test.ts`

### Implementation for User Story 3

- [X] T033 [US3] Implement the conversion domain service in `src/lib/market/services/conversion-service.ts`
- [X] T034 [US3] Implement the conversion route handler in `src/app/api/market/convert/route.ts`
- [X] T035 [P] [US3] Build the calculator form and result components in `src/components/calculator/conversion-form.tsx` and `src/components/calculator/conversion-result.tsx`
- [X] T036 [US3] Integrate the calculator into the live dashboard in `src/components/dashboard/live-market-dashboard.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [X] T037 [P] Add an end-to-end release smoke test for dashboard, history, and calculator coverage in `tests/integration/release-smoke.spec.ts`
- [X] T038 Harden route security and response handling in `src/app/api/market/current/route.ts`, `src/app/api/market/history/route.ts`, `src/app/api/market/convert/route.ts`, and `src/app/api/internal/ingest/route.ts`
- [X] T039 [P] Update developer and deployment documentation in `README.md` and `specs/001-gold-price-app/quickstart.md`
- [X] T040 Validate the full quickstart workflow and record final setup notes in `specs/001-gold-price-app/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phases 3-5)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on completion of the desired user stories

### User Story Dependencies

- **User Story 1 (P1)**: Starts immediately after Foundational and defines the MVP
- **User Story 2 (P2)**: Starts after Foundational and reuses the live dashboard shell from US1 while remaining independently testable through `/api/market/history`
- **User Story 3 (P3)**: Starts after Foundational and reuses the live dashboard shell from US1 while remaining independently testable through `/api/market/convert`

### Within Each User Story

- Tests MUST be written and fail before implementation
- Services before route handlers
- API routes before dashboard integration
- Shared visual components before final page-level assembly

### Parallel Opportunities

- Setup tasks `T003`, `T004`, and `T005` can run in parallel after `T001` and `T002`
- Foundational tasks `T007`, `T008`, `T009`, and `T013` can run in parallel after `T006`
- In US1, `T020` can proceed in parallel with `T018` once the test tasks exist
- In US2, `T028` can proceed in parallel with `T026` before `T029`
- In US3, `T035` can proceed in parallel with `T033` before `T036`

---

## Parallel Example: User Story 1

```bash
Task: "T015 [US1] Add the current market API contract test in tests/contract/api/current-market.contract.test.ts"
Task: "T016 [US1] Add the landing-page integration test for current quote, stale fallback, and auto-refresh in tests/integration/current-dashboard.spec.ts"
Task: "T017 [US1] Add unit coverage for current quote assembly and freshness-state transitions in tests/unit/market/current-quote-service.test.ts"

Task: "T018 [US1] Implement the current quote domain service in src/lib/market/services/current-quote-service.ts"
Task: "T020 [US1] Build the current-price and market-status components in src/components/dashboard/current-price-card.tsx and src/components/dashboard/market-status-banner.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T023 [US2] Add the history API contract test in tests/contract/api/history.contract.test.ts"
Task: "T024 [US2] Add the range-switch and currency-switch integration test in tests/integration/history-chart.spec.ts"
Task: "T025 [US2] Add unit coverage for history aggregation and same-period FX conversion in tests/unit/market/history-service.test.ts"

Task: "T026 [US2] Implement the historical series query service in src/lib/market/services/history-service.ts"
Task: "T028 [US2] Build the historical chart and range-switcher components in src/components/history/history-chart.tsx and src/components/history/history-range-tabs.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T030 [US3] Add the conversion API contract test in tests/contract/api/convert.contract.test.ts"
Task: "T031 [US3] Add the calculator integration test for valid and invalid inputs in tests/integration/conversion-calculator.spec.ts"
Task: "T032 [US3] Add unit coverage for purity, unit, and currency calculations in tests/unit/market/conversion-service.test.ts"

Task: "T033 [US3] Implement the conversion domain service in src/lib/market/services/conversion-service.ts"
Task: "T035 [US3] Build the calculator form and result components in src/components/calculator/conversion-form.tsx and src/components/calculator/conversion-result.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate the MVP with `tests/contract/api/current-market.contract.test.ts`, `tests/integration/current-dashboard.spec.ts`, and `tests/unit/market/current-quote-service.test.ts`

### Incremental Delivery

1. Deliver Setup plus Foundational to establish the provider, storage, and ingest pipeline
2. Deliver User Story 1 for the public live-pricing MVP
3. Deliver User Story 2 for history and trend exploration
4. Deliver User Story 3 for conversion and comparison
5. Finish with Phase 6 polish before release

### Parallel Team Strategy

1. One developer can own provider and storage foundations while another prepares the UI shell and test tooling
2. After Foundational is complete:
   - Developer A: User Story 1 current dashboard
   - Developer B: User Story 2 historical charting
   - Developer C: User Story 3 conversion calculator
3. Rejoin for Phase 6 smoke testing, security hardening, and docs

---

## Notes

- All tasks follow the required checklist format with task ID, optional parallel marker, optional user story label, and exact file paths
- MVP scope is User Story 1 after Setup and Foundational phases
- User Story 2 and User Story 3 are independently testable through their dedicated route contracts and UI flows
- The task order preserves the constitution requirement for source transparency, conversion integrity, stale-state handling, and observability
