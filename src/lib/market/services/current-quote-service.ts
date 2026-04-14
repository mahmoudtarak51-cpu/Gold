import { getEnv } from "@/lib/config/env";
import { getDbPool } from "@/lib/config/db";
import { DailyHistoryRepository } from "@/lib/market/repositories/daily-history-repository";
import { MarketSnapshotRepository } from "@/lib/market/repositories/market-snapshot-repository";
import {
  toEgpPerGram,
  toEgpPerKg,
  toEgpPerToz,
  toUsdPerGram,
  toUsdPerKg
} from "@/lib/market/transforms/conversions";
import { getFreshnessState } from "@/lib/market/transforms/freshness";
import { toSourceNotice } from "@/lib/market/transforms/source-notice";

export interface CurrentQuoteData {
  snapshotAt: string;
  goldUsdPerToz: number;
  goldEgpPerToz: number;
  goldUsdPerGram: number;
  goldEgpPerGram: number;
  goldUsdPerKg: number;
  goldEgpPerKg: number;
  dayChangeAbsUsd: number;
  dayChangePctUsd: number;
  sourceNotice: {
    label: string;
    sourceName: string;
    sourceEndpoint: "/latest" | "/timeseries";
    lastUpdatedAt: string;
    freshnessState: "fresh" | "delayed" | "stale" | "unavailable";
    disclaimer: string;
  };
}

interface QuoteThresholds {
  freshSeconds: number;
  staleSeconds: number;
}

interface SnapshotRepositoryPort {
  findLatestTrustedSnapshot: MarketSnapshotRepository["findLatestTrustedSnapshot"];
}

interface DailyHistoryRepositoryPort {
  getLatestDailyPointBefore: DailyHistoryRepository["getLatestDailyPointBefore"];
}

export class CurrentQuoteService {
  constructor(
    private readonly snapshotRepository: SnapshotRepositoryPort,
    private readonly dailyHistoryRepository: DailyHistoryRepositoryPort,
    private readonly thresholds: QuoteThresholds
  ) {}

  async getCurrentQuote(now = new Date()): Promise<CurrentQuoteData | null> {
    const snapshot = await this.snapshotRepository.findLatestTrustedSnapshot();

    if (!snapshot) {
      return null;
    }

    const prior = await this.dailyHistoryRepository.getLatestDailyPointBefore(snapshot.providerTimestamp);
    const dayChangeAbsUsd = prior ? snapshot.goldUsdPerToz - prior.goldUsdPerToz : 0;
    const dayChangePctUsd = prior ? (dayChangeAbsUsd / prior.goldUsdPerToz) * 100 : 0;

    const freshnessState = getFreshnessState(snapshot.providerTimestamp, now, this.thresholds);
    const sourceNotice = toSourceNotice(
      {
        sourceName: snapshot.sourceName,
        sourceEndpoint: snapshot.sourceEndpoint,
        providerTimestamp: snapshot.providerTimestamp
      },
      freshnessState
    );

    return {
      snapshotAt: snapshot.providerTimestamp.toISOString(),
      goldUsdPerToz: snapshot.goldUsdPerToz,
      goldEgpPerToz: toEgpPerToz(snapshot.goldUsdPerToz, snapshot.usdToEgp),
      goldUsdPerGram: toUsdPerGram(snapshot.goldUsdPerToz),
      goldEgpPerGram: toEgpPerGram(snapshot.goldUsdPerToz, snapshot.usdToEgp),
      goldUsdPerKg: toUsdPerKg(snapshot.goldUsdPerToz),
      goldEgpPerKg: toEgpPerKg(snapshot.goldUsdPerToz, snapshot.usdToEgp),
      dayChangeAbsUsd,
      dayChangePctUsd,
      sourceNotice
    };
  }
}

export function createCurrentQuoteService(): CurrentQuoteService {
  const env = getEnv();
  const pool = getDbPool();

  return new CurrentQuoteService(
    new MarketSnapshotRepository(pool),
    new DailyHistoryRepository(pool),
    {
      freshSeconds: env.MARKET_FRESH_SECONDS,
      staleSeconds: env.MARKET_STALE_SECONDS
    }
  );
}
