import type { Pool } from "pg";

import type { DailyHistoryPoint, ProviderDailyPoint } from "@/types/market";

interface DailyHistoryRow {
  market_date: string;
  gold_usd_per_toz: string;
  usd_to_egp: string;
  source_name: string;
  source_endpoint: "/timeseries";
  backfilled_at: Date;
}

function mapDailyHistoryRow(row: DailyHistoryRow): DailyHistoryPoint {
  return {
    marketDate: row.market_date,
    goldUsdPerToz: Number(row.gold_usd_per_toz),
    usdToEgp: Number(row.usd_to_egp),
    sourceName: row.source_name,
    sourceEndpoint: row.source_endpoint,
    backfilledAt: row.backfilled_at
  };
}

export class DailyHistoryRepository {
  constructor(private readonly pool: Pool) {}

  async upsertBatch(points: ProviderDailyPoint[]): Promise<number> {
    if (points.length === 0) {
      return 0;
    }

    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      for (const point of points) {
        await client.query(
          `
          INSERT INTO daily_history_points (
            market_date,
            gold_usd_per_toz,
            usd_to_egp,
            source_name,
            source_endpoint,
            backfilled_at
          )
          VALUES ($1, $2, $3, 'Metals.Dev', '/timeseries', NOW())
          ON CONFLICT (market_date)
          DO UPDATE SET
            gold_usd_per_toz = EXCLUDED.gold_usd_per_toz,
            usd_to_egp = EXCLUDED.usd_to_egp,
            source_name = EXCLUDED.source_name,
            source_endpoint = EXCLUDED.source_endpoint,
            backfilled_at = NOW()
          `,
          [point.marketDate, point.goldUsdPerToz, point.usdToEgp]
        );
      }

      await client.query("COMMIT");
      return points.length;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getLatestDailyPointBefore(dateExclusive: Date): Promise<DailyHistoryPoint | null> {
    const result = await this.pool.query<DailyHistoryRow>(
      `
      SELECT *
      FROM daily_history_points
      WHERE market_date < $1::date
      ORDER BY market_date DESC
      LIMIT 1
      `,
      [dateExclusive.toISOString()]
    );

    const row = result.rows[0];
    return row ? mapDailyHistoryRow(row) : null;
  }

  async listByDateRange(startDate: Date | null, endDate: Date): Promise<DailyHistoryPoint[]> {
    const hasStart = Boolean(startDate);
    const result = await this.pool.query<DailyHistoryRow>(
      hasStart
        ? `
        SELECT *
        FROM daily_history_points
        WHERE market_date >= $1::date
          AND market_date <= $2::date
        ORDER BY market_date ASC
        `
        : `
        SELECT *
        FROM daily_history_points
        WHERE market_date <= $1::date
        ORDER BY market_date ASC
        `,
      hasStart ? [startDate?.toISOString(), endDate.toISOString()] : [endDate.toISOString()]
    );

    return result.rows.map(mapDailyHistoryRow);
  }
}
