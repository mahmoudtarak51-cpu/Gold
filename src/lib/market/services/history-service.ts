import { getDbPool } from "@/lib/config/db";
import { toEgpPerToz } from "@/lib/market/transforms/conversions";
import { toSourceNotice } from "@/lib/market/transforms/source-notice";
import { DailyHistoryRepository } from "@/lib/market/repositories/daily-history-repository";
import { MarketSnapshotRepository } from "@/lib/market/repositories/market-snapshot-repository";
import type {
  DailyHistoryPoint,
  HistoryPoint,
  HistoryRange,
  SourceNotice,
  SupportedCurrency
} from "@/types/market";

function subDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

function startDateForRange(range: HistoryRange, now: Date): Date | null {
  if (range === "7d") {
    return subDays(now, 7);
  }

  if (range === "30d") {
    return subDays(now, 30);
  }

  if (range === "1y") {
    return subDays(now, 365);
  }

  if (range === "intraday") {
    return subDays(now, 1);
  }

  return null;
}

function toHistoryPointFromDaily(point: DailyHistoryPoint, currency: SupportedCurrency): HistoryPoint {
  return {
    pointAt: `${point.marketDate}T00:00:00.000Z`,
    currency,
    valuePerToz:
      currency === "USD" ? point.goldUsdPerToz : toEgpPerToz(point.goldUsdPerToz, point.usdToEgp)
  };
}

export interface HistoryResponseData {
  range: HistoryRange;
  currency: SupportedCurrency;
  points: HistoryPoint[];
  sourceNotice: SourceNotice;
}

interface SnapshotRepoPort {
  listSince: MarketSnapshotRepository["listSince"];
}

interface DailyRepoPort {
  listByDateRange: DailyHistoryRepository["listByDateRange"];
}

export class HistoryService {
  constructor(
    private readonly snapshotRepository: SnapshotRepoPort,
    private readonly dailyHistoryRepository: DailyRepoPort
  ) {}

  async getHistory(
    range: HistoryRange,
    currency: SupportedCurrency,
    now = new Date()
  ): Promise<HistoryResponseData | null> {
    if (range === "intraday") {
      const since = startDateForRange("intraday", now);
      const snapshots = await this.snapshotRepository.listSince(since ?? subDays(now, 1));

      if (snapshots.length === 0) {
        return null;
      }

      const points: HistoryPoint[] = snapshots.map((snapshot) => ({
        pointAt: snapshot.providerTimestamp.toISOString(),
        currency,
        valuePerToz:
          currency === "USD"
            ? snapshot.goldUsdPerToz
            : toEgpPerToz(snapshot.goldUsdPerToz, snapshot.usdToEgp)
      }));

      const latest = snapshots[snapshots.length - 1];
      return {
        range,
        currency,
        points,
        sourceNotice: toSourceNotice(
          {
            sourceName: latest.sourceName,
            sourceEndpoint: latest.sourceEndpoint,
            providerTimestamp: latest.providerTimestamp
          },
          "fresh"
        )
      };
    }

    const start = startDateForRange(range, now);
    const dailyPoints = await this.dailyHistoryRepository.listByDateRange(start, now);

    if (dailyPoints.length === 0) {
      return null;
    }

    const points = dailyPoints.map((point) => toHistoryPointFromDaily(point, currency));
    const latest = dailyPoints[dailyPoints.length - 1];

    return {
      range,
      currency,
      points,
      sourceNotice: toSourceNotice(
        {
          sourceName: latest.sourceName,
          sourceEndpoint: latest.sourceEndpoint,
          providerTimestamp: latest.backfilledAt
        },
        "fresh"
      )
    };
  }
}

export function createHistoryService(): HistoryService {
  const pool = getDbPool();

  return new HistoryService(
    new MarketSnapshotRepository(pool),
    new DailyHistoryRepository(pool)
  );
}
