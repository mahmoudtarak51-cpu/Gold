# Feature Specification: Gold Price Web Application

**Feature Branch**: `[001-gold-price-app]`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "full application for a web app that reports global gold prices with USD and EGP like the site GOLDPRICE"

## Clarifications

### Session 2026-04-13

- Q: What should EGP values represent? -> A: Direct conversions from global USD spot gold prices using the canonical USD/EGP exchange rate only.
- Q: How should historical EGP values be calculated? -> A: Each historical EGP point uses the USD/EGP rate from the same time period.
- Q: What language scope should V1 support? -> A: English only for the initial release.
- Q: How should live price refreshing work in V1? -> A: Refresh prices automatically while the page is open, with no manual refresh control.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check Live Gold Prices (Priority: P1)

As a public visitor, I want to open the site and immediately see current global
gold prices in USD and the equivalent values in EGP so I can understand the
market without doing manual conversions.

**Why this priority**: This is the core value of the application and the main
reason users will visit the site.

**Independent Test**: Open the home page as a first-time visitor and verify
that current gold prices, EGP equivalents, freshness status, source labels, and
basic market movement can be understood without visiting any other page.

**Acceptance Scenarios**:

1. **Given** fresh gold and FX data is available, **When** a visitor opens the
   home page, **Then** the system shows the current global gold spot price in
   USD, converted EGP values for common display units, daily change, source
   attribution, and a last-updated timestamp.
2. **Given** the visitor keeps the home page open during normal operation,
   **When** a new valid pricing snapshot becomes available, **Then** the page
   updates the displayed values automatically and refreshes the timestamp
   context without requiring a manual refresh action.
3. **Given** the latest gold or FX data is older than the freshness target but
   fallback data exists, **When** a visitor opens the home page, **Then** the
   system shows the last-known-good values with a visible stale warning instead
   of presenting them as live.
4. **Given** neither fresh nor fallback pricing data is available, **When** a
   visitor opens the home page, **Then** the system shows a clear unavailable
   state and prevents unsupported price-derived views from appearing as valid.

---

### User Story 2 - Explore Price History (Priority: P2)

As a public visitor, I want to explore historical gold price movement across
multiple time ranges in both USD and EGP so I can understand short-term and
long-term trends.

**Why this priority**: A full application modeled after a public market site is
expected to support trend exploration, not only the current snapshot.

**Independent Test**: Starting from a populated home page, switch between
historical ranges and currencies and confirm the chart and summary values update
consistently with the selected view.

**Acceptance Scenarios**:

1. **Given** historical pricing data is available, **When** a visitor selects a
   time range such as intraday, 7 days, 30 days, or 1 year, **Then** the system
   displays the corresponding historical trend and summary movement for that
   period.
2. **Given** a historical range is currently shown, **When** the visitor
   switches the display from USD to EGP, **Then** the chart and summary update
   to the same time range in the selected currency using the historical
   USD/EGP rate from each corresponding time period.
3. **Given** historical data for a selected range is incomplete or unavailable,
   **When** the visitor requests that range, **Then** the system explains the
   limitation clearly and avoids displaying misleading or fabricated points.

---

### User Story 3 - Convert and Compare Gold Values (Priority: P3)

As a public visitor, I want to compare prices by weight and purity and
calculate the indicative value of my chosen quantity in USD or EGP so I can
relate the global spot price to practical buying or selling decisions.

**Why this priority**: Users often need more than a single spot quote; they
need to connect the quote to grams, larger weights, and common jewelry purities.

**Independent Test**: Enter a custom weight, select a unit and purity, and
verify that the displayed indicative value updates correctly in USD and EGP with
clear explanatory labeling.

**Acceptance Scenarios**:

1. **Given** live or fallback pricing data is available, **When** a visitor
   selects a supported unit and purity, **Then** the system displays indicative
   values derived from the canonical pricing inputs for both USD and EGP views.
2. **Given** a visitor enters a custom weight and chooses a purity, **When**
   the visitor requests the calculation, **Then** the system returns an
   indicative value with the unit, purity, currency, and timestamp context used
   for the calculation.
3. **Given** a visitor enters invalid or unsupported input, **When** the
   calculation is requested, **Then** the system explains the issue clearly and
   does not return misleading results.

---

### Edge Cases

- Gold pricing updates arrive before USD/EGP rate updates, resulting in
  different timestamps for the two source snapshots.
- One upstream source is available while another is temporarily delayed, making
  only part of the derived display trustworthy.
- Historical data contains gaps for weekends, holidays, or provider outages.
- A visitor enters extremely small, extremely large, or unsupported weight
  values in the calculator.
- The site is opened on a slow mobile connection while the latest market data
  request is still in progress.
- A displayed value is based on spot pricing while a visitor expects a local
  dealer or jewelry-shop quote with premiums.

## Data Sources & Trust Signals *(mandatory when external data is displayed)*

- **Primary Displayed Metrics**: Current global gold spot price, converted EGP
  spot-linked price, common weight views, common purity views, daily movement,
  and historical trend summaries.
- **Canonical Gold Source**: One canonical global spot gold source selected for
  production use and displayed by name in the interface.
- **Canonical FX Source**: One canonical USD/EGP exchange-rate source selected
  for production use and displayed by name in the interface.
- **Refresh Cadence**: Published refresh cadence is 3 times per day, or every 8
  hours.
- **Stale Threshold**: A visible stale state begins when either required source
  is more than 24 hours older than the latest successful refresh.
- **Fallback Behavior**: Show last-known-good values with explicit stale
  labeling, suppress unsupported derived values, and show an informative
  unavailable state when no trustworthy data can be shown.
- **User Trust Signals**: Source name, last-updated timestamp, live or delayed
  status label, stale warning, and a disclaimer that displayed prices are
  informational and may differ from local transaction prices.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the current global gold spot price in USD on
  the primary landing view.
- **FR-002**: System MUST display the corresponding EGP value derived from the
  canonical USD/EGP exchange rate.
- **FR-003**: Users MUST be able to view indicative prices for at least ounce,
  gram, and kilogram units.
- **FR-004**: Users MUST be able to view indicative prices for at least 24k,
  22k, 21k, and 18k purity views.
- **FR-005**: System MUST show daily gold price movement in both absolute and
  percentage terms for the primary quote.
- **FR-006**: System MUST expose source attribution and last-updated
  information for all user-visible market data.
- **FR-007**: System MUST label displayed values according to freshness status,
  including live, delayed, or stale states.
- **FR-008**: System MUST retain and display last-known-good values when fresh
  data cannot be retrieved and MUST visibly distinguish fallback values from
  live values.
- **FR-009**: System MUST provide historical price views for multiple
  user-selectable time ranges.
- **FR-010**: Users MUST be able to switch historical views between USD and
  EGP.
- **FR-010a**: System MUST calculate historical EGP views using the
  corresponding USD/EGP rate for each historical point rather than applying the
  current rate to past gold prices.
- **FR-011**: Users MUST be able to enter a custom weight and receive an
  indicative value in the selected unit, purity, and currency.
- **FR-012**: System MUST explain whether a displayed value is spot-linked only
  or includes any separately labeled premium or local-market adjustment.
- **FR-013**: System MUST provide clear loading, empty, stale, and provider
  error states without showing unsupported figures as valid prices.
- **FR-014**: System MUST preserve internal consistency across simultaneously
  displayed derived values or clearly label when the underlying source
  timestamps differ.
- **FR-015**: System MUST make core pricing information available without
  requiring account creation or sign-in.
- **FR-016**: System MUST present an informational disclaimer stating that the
  displayed prices are not investment advice and may differ from local
  transaction prices.
- **FR-017**: System MUST provide a mobile-friendly and desktop-friendly
  experience without loss of primary pricing information or calculator access.
- **FR-018**: System MUST treat all EGP prices as spot-linked currency
  conversions from the canonical USD gold price unless a future feature adds a
  separately labeled local market metric.
- **FR-019**: System MUST provide the initial release in English only, with any
  future Arabic or multilingual support treated as a later enhancement.
- **FR-020**: System MUST refresh displayed market data automatically while the
  page remains open and MUST update timestamps and freshness labels alongside
  those values.
- **FR-021**: System MUST NOT require or expose a manual refresh control in the
  initial release.

### Key Entities *(include if feature involves data)*

- **Gold Price Snapshot**: A current or historical global gold market value with
  unit basis, timestamp, source attribution, freshness state, and movement data.
- **Exchange Rate Snapshot**: A USD/EGP rate with timestamp, source
  attribution, and freshness state.
- **Display Quote**: A user-facing quote composed from gold price data, FX data,
  selected unit, selected purity, derived amount, and trust signals.
- **Historical Series**: An ordered set of price points and summary movement for
  a selected time range and currency view.
- **Conversion Request**: A visitor-entered weight, selected unit, selected
  purity, and target currency used to derive an indicative value.
- **Source Notice**: The visible trust information attached to displayed market
  data, including source name, last-updated time, freshness label, and
  explanatory disclaimer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of test users can identify the current gold price in
  both USD and EGP within 10 seconds of opening the home page.
- **SC-002**: At least 95% of successful home page visits display either fresh
  pricing data or a clearly labeled stale or unavailable state within 5
  seconds on a standard mobile connection.
- **SC-003**: At least 90% of test users can switch to a historical view and
  determine whether the price rose or fell over a selected period in under 30
  seconds.
- **SC-004**: At least 90% of test users can calculate an indicative value for
  a chosen weight and purity in under 45 seconds without outside help.
- **SC-005**: In acceptance testing, 100% of screens that display market data
  also display source attribution, timestamp context, and the informational
  pricing disclaimer.
- **SC-006**: On all supported mobile and desktop test layouts, the primary
  pricing summary and calculator remain usable without horizontal scrolling.

## Assumptions

- The initial release is a public, read-only experience with no user accounts,
  transactions, saved portfolios, or alerts.
- EGP values are indicative conversions derived from the canonical global USD
  spot price and canonical USD/EGP exchange rate rather than local dealer
  quotes unless separately labeled.
- Egypt-specific dealer pricing, jewelry premiums, and merchant markups are out
  of scope for this feature unless introduced later as separately labeled data.
- The initial release uses one canonical gold source and one canonical FX
  source for each displayed metric, even if fallback sources are added later.
- Historical EGP trend views use same-period FX history rather than a single
  current conversion rate applied across past data.
- The initial release relies on automatic in-session refresh rather than a
  visitor-triggered manual refresh control.
- Historical views cover common consumer-friendly ranges such as intraday, 7
  days, 30 days, 1 year, and all available history where supported by source
  data.
- The initial release prioritizes English content and standard international
  numeric formatting; additional language support can be added later.
- Arabic localization, bilingual navigation, and right-to-left presentation are
  out of scope for the initial release.
- Precious metals beyond gold, personalized watchlists, and local merchant
  pricing are out of scope for this feature unless added by a later
  specification.
