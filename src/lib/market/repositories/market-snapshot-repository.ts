import type { Pool } from "pg";

import type { IngestStatus, LatestMarketSnapshot, MarketSnapshot } from "@/types/market";

interface SnapshotRow {
  id: string;
  captured_at: Date;
  provider_timestamp: Date;
  gold_usd_per_toz: string;
  usd_to_egp: string;
  source_name: string;
  source_endpoint: "/latest";
  timestamp_skew_seconds: number;
  ingest_status: IngestStatus;
}

function mapSnapshotRow(row: SnapshotRow): MarketSnapshot {
  return {
    id: row.id,
    capturedAt: row.captured_at,
    providerTimestamp: row.provider_timestamp,
    goldUsdPerToz: Number(row.gold_usd_per_toz),
    usdToEgp: Number(row.usd_to_egp),
    sourceName: row.source_name,
    sourceEndpoint: row.source_endpoint,
    timestampSkewSeconds: row.timestamp_skew_seconds,
    ingestStatus: row.ingest_status
  };
}

export class MarketSnapshotRepository {
  constructor(private readonly pool: Pool) {}

  async upsertSnapshot(input: {
    latest: LatestMarketSnapshot;
    timestampSkewSeconds: number;
    ingestStatus: IngestStatus;
  }): Promise<MarketSnapshot> {
    const result = await this.pool.query<SnapshotRow>(
      `
      INSERT INTO market_snapshots (
        provider_timestamp,
        gold_usd_per_toz,
        usd_to_egp,
        source_name,
        source_endpoint,
        timestamp_skew_seconds,
        ingest_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (minute_bucket, source_endpoint)
      DO UPDATE SET
        gold_usd_per_toz = EXCLUDED.gold_usd_per_toz,
        usd_to_egp = EXCLUDED.usd_to_egp,
        source_name = EXCLUDED.source_name,
        timestamp_skew_seconds = EXCLUDED.timestamp_skew_seconds,
        ingest_status = EXCLUDED.ingest_status,
        provider_timestamp = EXCLUDED.provider_timestamp
      RETURNING *
      `,
      [
        input.latest.providerTimestamp,
        input.latest.goldUsdPerToz,
        input.latest.usdToEgp,
        input.latest.sourceName,
        input.latest.sourceEndpoint,
        input.timestampSkewSeconds,
        input.ingestStatus
      ]
    );

    return mapSnapshotRow(result.rows[0]);
  }

  async findLatestTrustedSnapshot(): Promise<MarketSnapshot | null> {
    const result = await this.pool.query<SnapshotRow>(
      `
      SELECT *
      FROM market_snapshots
      WHERE ingest_status IN ('success', 'partial')
      ORDER BY provider_timestamp DESC
      LIMIT 1
      `
    );

    const row = result.rows[0];
    return row ? mapSnapshotRow(row) : null;
  }

  async listSince(since: Date): Promise<MarketSnapshot[]> {
    const result = await this.pool.query<SnapshotRow>(
      `
      SELECT *
      FROM market_snapshots
      WHERE ingest_status IN ('success', 'partial')
        AND provider_timestamp >= $1
      ORDER BY provider_timestamp ASC
      `,
      [since.toISOString()]
    );

    return result.rows.map(mapSnapshotRow);
  }
}
