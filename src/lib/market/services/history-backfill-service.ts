import { MetalsDevClient } from "@/lib/market/providers/metals-dev-client";
import { DailyHistoryRepository } from "@/lib/market/repositories/daily-history-repository";
import { logger } from "@/lib/telemetry/logger";

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export class HistoryBackfillService {
  constructor(
    private readonly providerClient: MetalsDevClient,
    private readonly dailyHistoryRepository: DailyHistoryRepository
  ) {}

  async backfillDays(days: number): Promise<{ inserted: number; windows: number }> {
    const end = new Date();
    const start = addDays(end, -Math.abs(days));

    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    let inserted = 0;
    let windows = 0;

    while (cursor <= end) {
      const windowStart = cursor;
      const windowEnd = addDays(windowStart, 29);
      const boundedEnd = windowEnd > end ? end : windowEnd;

      const points = await this.providerClient.fetchTimeseriesDaily(
        formatDate(windowStart),
        formatDate(boundedEnd)
      );

      inserted += await this.dailyHistoryRepository.upsertBatch(points);
      windows += 1;
      cursor = addDays(boundedEnd, 1);
    }

    logger.info("History backfill completed", { inserted, windows, days });

    return { inserted, windows };
  }
}
