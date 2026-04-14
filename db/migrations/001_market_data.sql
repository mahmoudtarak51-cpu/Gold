CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ingest_status') THEN
    CREATE TYPE ingest_status AS ENUM ('success', 'partial', 'failed');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS market_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_timestamp TIMESTAMPTZ NOT NULL,
  gold_usd_per_toz NUMERIC(18, 6) NOT NULL CHECK (gold_usd_per_toz > 0),
  usd_to_egp NUMERIC(18, 6) NOT NULL CHECK (usd_to_egp > 0),
  source_name TEXT NOT NULL,
  source_endpoint TEXT NOT NULL,
  timestamp_skew_seconds INTEGER NOT NULL DEFAULT 0 CHECK (timestamp_skew_seconds >= 0),
  ingest_status ingest_status NOT NULL,
  minute_bucket TIMESTAMP GENERATED ALWAYS AS (
    date_trunc('minute', provider_timestamp AT TIME ZONE 'UTC')
  ) STORED,
  UNIQUE (minute_bucket, source_endpoint)
);

CREATE INDEX IF NOT EXISTS idx_market_snapshots_provider_timestamp
  ON market_snapshots (provider_timestamp DESC);

CREATE TABLE IF NOT EXISTS daily_history_points (
  market_date DATE PRIMARY KEY,
  gold_usd_per_toz NUMERIC(18, 6) NOT NULL CHECK (gold_usd_per_toz > 0),
  usd_to_egp NUMERIC(18, 6) NOT NULL CHECK (usd_to_egp > 0),
  source_name TEXT NOT NULL,
  source_endpoint TEXT NOT NULL,
  backfilled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status ingest_status NOT NULL,
  provider_latency_ms INTEGER,
  error_code TEXT,
  snapshot_id UUID REFERENCES market_snapshots(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started_at
  ON ingestion_runs (started_at DESC);
