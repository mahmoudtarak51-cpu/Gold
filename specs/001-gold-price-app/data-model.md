# Data Model: Gold Price Web Application

## Persistent Entities

### MarketSnapshot

Represents one ingested live market snapshot used for the current quote,
intraday history, and stale fallback.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `captured_at` | timestamp | Server ingestion time |
| `provider_timestamp` | timestamp | Timestamp returned by Metals.Dev |
| `gold_usd_per_toz` | decimal | Canonical global gold price in USD per troy ounce |
| `usd_to_egp` | decimal | Canonical USD to EGP conversion rate for the same snapshot |
| `source_name` | text | `Metals.Dev` in V1 |
| `source_endpoint` | text | Usually `/latest` |
| `timestamp_skew_seconds` | integer | Absolute difference between gold and FX timestamps if separately sourced later |
| `ingest_status` | enum | `success`, `partial`, `failed` |

**Uniqueness rule**: one row per minute bucket and source endpoint.

### DailyHistoryPoint

Represents one backfilled daily historical point from the provider timeseries.

| Field | Type | Notes |
|-------|------|-------|
| `market_date` | date | Historical trading date |
| `gold_usd_per_toz` | decimal | Daily gold price basis |
| `usd_to_egp` | decimal | Daily FX rate for same-period EGP conversion |
| `source_name` | text | `Metals.Dev` |
| `source_endpoint` | text | `/timeseries` |
| `backfilled_at` | timestamp | When this point was written locally |

**Uniqueness rule**: one row per market date.

### IngestionRun

Represents one scheduled ingest execution for observability and troubleshooting.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `started_at` | timestamp | Job start time |
| `completed_at` | timestamp | Job finish time |
| `status` | enum | `success`, `partial`, `failed` |
| `provider_latency_ms` | integer | Upstream request time |
| `error_code` | text nullable | Normalized provider or network error |
| `snapshot_id` | UUID nullable | Linked snapshot when written |

## Derived Domain Entities

### SourceNotice

Explains where a displayed number came from and how trustworthy it is.

| Field | Type | Notes |
|-------|------|-------|
| `label` | string | Human-readable provider label |
| `source_name` | string | `Metals.Dev` |
| `source_endpoint` | string | `/latest` or `/timeseries` |
| `last_updated_at` | ISO timestamp | Provider timestamp shown to users |
| `freshness_state` | enum | `fresh`, `delayed`, `stale`, `unavailable` |
| `disclaimer` | string | Informational-only pricing message |

### CurrentQuote

Represents the current dashboard summary shown on the landing page.

| Field | Type | Notes |
|-------|------|-------|
| `snapshot_at` | ISO timestamp | Effective snapshot timestamp |
| `gold_usd_per_toz` | decimal | Primary USD quote |
| `gold_egp_per_toz` | decimal | Spot-linked EGP quote |
| `gold_usd_per_gram` | decimal | Derived from USD/toz |
| `gold_egp_per_gram` | decimal | Derived from EGP/toz |
| `gold_usd_per_kg` | decimal | Derived from USD/toz |
| `gold_egp_per_kg` | decimal | Derived from EGP/toz |
| `day_change_abs_usd` | decimal | Current quote minus prior daily point |
| `day_change_pct_usd` | decimal | Percentage movement against prior daily point |
| `source_notice` | SourceNotice | Required on all current-quote views |

### HistoricalSeriesPoint

Represents one chart point returned to the UI.

| Field | Type | Notes |
|-------|------|-------|
| `point_at` | ISO timestamp or date | Minute-level for intraday, date-level for longer ranges |
| `currency` | enum | `USD`, `EGP` |
| `value_per_toz` | decimal | Canonical chart value |
| `value_per_gram` | decimal | Optional derived helper for alternate display |
| `source_notice` | SourceNotice | Shared notice or inherited metadata |

### ConversionRequest

Represents a visitor-entered calculation request.

| Field | Type | Notes |
|-------|------|-------|
| `weight` | decimal | Positive number |
| `unit` | enum | `toz`, `g`, `kg` |
| `purity` | enum | `24k`, `22k`, `21k`, `18k` |
| `currency` | enum | `USD`, `EGP` |

### ConversionQuote

Represents the calculated response for a visitor's requested weight and purity.

| Field | Type | Notes |
|-------|------|-------|
| `requested_weight` | decimal | Echoed input |
| `unit` | enum | Echoed input |
| `purity` | enum | Echoed input |
| `currency` | enum | Echoed input |
| `spot_value` | decimal | Calculated indicative result |
| `snapshot_at` | ISO timestamp | Snapshot basis used |
| `source_notice` | SourceNotice | Required trust metadata |

## Relationships

- `IngestionRun` optionally produces one `MarketSnapshot`.
- `CurrentQuote` is derived from the most recent valid `MarketSnapshot` plus the
  most recent prior `DailyHistoryPoint`.
- `HistoricalSeriesPoint` is derived from minute-level `MarketSnapshot` rows for
  `intraday` and from `DailyHistoryPoint` rows for `7d`, `30d`, `1y`, and
  `all`.
- `ConversionQuote` is derived from `CurrentQuote` plus the visitor's
  `ConversionRequest`.
- `SourceNotice` is attached to every derived view model returned to the UI.

## Validation Rules

- `weight` must be greater than 0 and less than or equal to `100000`.
- Supported `unit` values are `toz`, `g`, and `kg`.
- Supported `purity` values are `24k`, `22k`, `21k`, and `18k`.
- `gold_usd_per_toz` and `usd_to_egp` must both be positive decimals.
- `provider_timestamp` cannot be in the future by more than 60 seconds of
  server time skew.
- A `CurrentQuote` is not valid unless both gold and FX components are present.

## Derived Formulas

- `grams_per_toz = 31.1034768`
- `kg_per_toz = 0.0311034768`
- `purity_factor(24k) = 1.0`
- `purity_factor(22k) = 22 / 24`
- `purity_factor(21k) = 21 / 24`
- `purity_factor(18k) = 18 / 24`
- `usd_per_gram = gold_usd_per_toz / grams_per_toz`
- `egp_per_gram = (gold_usd_per_toz * usd_to_egp) / grams_per_toz`
- `conversion_value = base_unit_value * requested_weight * purity_factor`

Calculations preserve full precision internally and round only for display.

## State Transitions

### FreshnessState

- `fresh` -> snapshot age is 0 to 8 hours.
- `delayed` -> snapshot age is greater than 8 hours and less than or equal
  to 24 hours.
- `stale` -> snapshot age is greater than 24 hours but a last-known-good
  value is still available.
- `unavailable` -> no trustworthy combined gold plus FX snapshot exists.

### IngestionRun Status

- `success` -> provider fetch validated and a snapshot was written.
- `partial` -> provider responded but validation or storage only partially
  succeeded.
- `failed` -> provider fetch or validation failed and no new snapshot was
  stored.
