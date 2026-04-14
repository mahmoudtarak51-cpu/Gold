import { getDbPool } from "@/lib/config/db";
import { getEnv } from "@/lib/config/env";
import { MarketSnapshotRepository } from "@/lib/market/repositories/market-snapshot-repository";
import { toEgpPerToz, toIndicativeSpotValue } from "@/lib/market/transforms/conversions";
import { getFreshnessState } from "@/lib/market/transforms/freshness";
import { toSourceNotice } from "@/lib/market/transforms/source-notice";
import type { Purity, SourceNotice, SupportedCurrency, SupportedUnit } from "@/types/market";

export interface ConversionQuoteInput {
  weight: number;
  unit: SupportedUnit;
  purity: Purity;
  currency: SupportedCurrency;
}

export interface ConversionQuoteData {
  requestedWeight: number;
  unit: SupportedUnit;
  purity: Purity;
  currency: SupportedCurrency;
  spotValue: number;
  snapshotAt: string;
  sourceNotice: SourceNotice;
}

interface QuoteThresholds {
  freshSeconds: number;
  staleSeconds: number;
}

interface SnapshotRepositoryPort {
  findLatestTrustedSnapshot: MarketSnapshotRepository["findLatestTrustedSnapshot"];
}

export class ConversionService {
  constructor(
    private readonly snapshotRepository: SnapshotRepositoryPort,
    private readonly thresholds: QuoteThresholds
  ) {}

  async getConversionQuote(
    input: ConversionQuoteInput,
    now = new Date()
  ): Promise<ConversionQuoteData | null> {
    const snapshot = await this.snapshotRepository.findLatestTrustedSnapshot();

    if (!snapshot) {
      return null;
    }

    const currencyPerToz =
      input.currency === "USD"
        ? snapshot.goldUsdPerToz
        : toEgpPerToz(snapshot.goldUsdPerToz, snapshot.usdToEgp);

    const freshnessState = getFreshnessState(snapshot.providerTimestamp, now, this.thresholds);

    return {
      requestedWeight: input.weight,
      unit: input.unit,
      purity: input.purity,
      currency: input.currency,
      spotValue: toIndicativeSpotValue(input.weight, input.unit, input.purity, currencyPerToz),
      snapshotAt: snapshot.providerTimestamp.toISOString(),
      sourceNotice: toSourceNotice(
        {
          sourceName: snapshot.sourceName,
          sourceEndpoint: snapshot.sourceEndpoint,
          providerTimestamp: snapshot.providerTimestamp
        },
        freshnessState
      )
    };
  }
}

export function createConversionService(): ConversionService {
  const env = getEnv();
  const pool = getDbPool();

  return new ConversionService(new MarketSnapshotRepository(pool), {
    freshSeconds: env.MARKET_FRESH_SECONDS,
    staleSeconds: env.MARKET_STALE_SECONDS
  });
}
