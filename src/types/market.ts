export type IngestStatus = "success" | "partial" | "failed";

export type FreshnessState = "fresh" | "delayed" | "stale" | "unavailable";

export type SupportedCurrency = "USD" | "EGP";

export type HistoryRange = "intraday" | "7d" | "30d" | "1y" | "all";

export type SupportedUnit = "toz" | "g" | "kg";

export type Purity = "24k" | "22k" | "21k" | "18k";

export type SourceEndpoint = "/latest" | "/timeseries";

export interface SourceMetadata {
  sourceName: string;
  sourceEndpoint: SourceEndpoint;
  providerTimestamp: Date;
}

export interface SourceNotice {
  label: string;
  sourceName: string;
  sourceEndpoint: SourceEndpoint;
  lastUpdatedAt: string;
  freshnessState: FreshnessState;
  disclaimer: string;
}

export interface MarketSnapshot {
  id: string;
  capturedAt: Date;
  providerTimestamp: Date;
  goldUsdPerToz: number;
  usdToEgp: number;
  sourceName: string;
  sourceEndpoint: SourceEndpoint;
  timestampSkewSeconds: number;
  ingestStatus: IngestStatus;
}

export interface DailyHistoryPoint {
  marketDate: string;
  goldUsdPerToz: number;
  usdToEgp: number;
  sourceName: string;
  sourceEndpoint: "/timeseries";
  backfilledAt: Date;
}

export interface IngestionRun {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  status: IngestStatus;
  providerLatencyMs: number | null;
  errorCode: string | null;
  snapshotId: string | null;
}

export interface LatestMarketSnapshot {
  providerTimestamp: Date;
  goldUsdPerToz: number;
  usdToEgp: number;
  sourceName: string;
  sourceEndpoint: "/latest";
}

export interface ProviderDailyPoint {
  marketDate: string;
  goldUsdPerToz: number;
  usdToEgp: number;
}

export interface HistoryPoint {
  pointAt: string;
  currency: SupportedCurrency;
  valuePerToz: number;
}
