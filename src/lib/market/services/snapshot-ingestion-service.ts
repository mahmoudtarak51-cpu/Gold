import { MetalsDevClient } from "@/lib/market/providers/metals-dev-client";
import { IngestionRunRepository } from "@/lib/market/repositories/ingestion-run-repository";
import { MarketSnapshotRepository } from "@/lib/market/repositories/market-snapshot-repository";
import { logger } from "@/lib/telemetry/logger";
import type { IngestStatus, MarketSnapshot } from "@/types/market";

export interface IngestionResult {
  runId: string;
  status: IngestStatus;
  snapshot: MarketSnapshot | null;
  acceptedAt: Date;
}

export class SnapshotIngestionService {
  constructor(
    private readonly providerClient: MetalsDevClient,
    private readonly snapshotRepository: MarketSnapshotRepository,
    private readonly runRepository: IngestionRunRepository
  ) {}

  async ingestLatestSnapshot(): Promise<IngestionResult> {
    const startedAt = new Date();
    const run = await this.runRepository.createStartedRun(startedAt);

    let status: IngestStatus = "failed";
    let snapshot: MarketSnapshot | null = null;
    let providerLatencyMs: number | null = null;
    let errorCode: string | null = null;

    try {
      const providerStart = Date.now();
      const latest = await this.providerClient.fetchLatestSnapshot();
      providerLatencyMs = Date.now() - providerStart;

      const skewSeconds = Math.abs(
        Math.floor((startedAt.getTime() - latest.providerTimestamp.getTime()) / 1000)
      );

      status = skewSeconds > 120 ? "partial" : "success";
      snapshot = await this.snapshotRepository.upsertSnapshot({
        latest,
        timestampSkewSeconds: skewSeconds,
        ingestStatus: status
      });

      logger.info("Market snapshot ingested", {
        runId: run.id,
        status,
        providerLatencyMs,
        skewSeconds,
        snapshotId: snapshot.id
      });
    } catch (error) {
      errorCode = error instanceof Error ? "PROVIDER_FETCH_FAILED" : "INGESTION_UNKNOWN";

      logger.error("Market snapshot ingestion failed", {
        runId: run.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    await this.runRepository.completeRun({
      runId: run.id,
      status,
      providerLatencyMs,
      errorCode,
      snapshotId: snapshot?.id ?? null,
      completedAt: new Date()
    });

    return {
      runId: run.id,
      status,
      snapshot,
      acceptedAt: startedAt
    };
  }
}
