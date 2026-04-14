import { NextResponse } from "next/server";

import { getDbPool } from "@/lib/config/db";
import { MetalsDevClient } from "@/lib/market/providers/metals-dev-client";
import { IngestionRunRepository } from "@/lib/market/repositories/ingestion-run-repository";
import { MarketSnapshotRepository } from "@/lib/market/repositories/market-snapshot-repository";
import {
  ApiError,
  toErrorResponse,
  toSecureJsonResponse
} from "@/lib/market/services/api-error";
import { createCurrentQuoteService } from "@/lib/market/services/current-quote-service";
import { SnapshotIngestionService } from "@/lib/market/services/snapshot-ingestion-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
  try {
    const service = createCurrentQuoteService();
    let quote = await service.getCurrentQuote();

    if (!quote || quote.sourceNotice.freshnessState !== "fresh") {
      const pool = getDbPool();
      const ingestionService = new SnapshotIngestionService(
        new MetalsDevClient(),
        new MarketSnapshotRepository(pool),
        new IngestionRunRepository(pool)
      );
      const ingestion = await ingestionService.ingestLatestSnapshot();

      if (ingestion.status !== "failed") {
        quote = await service.getCurrentQuote();
      }
    }

    if (!quote) {
      throw new ApiError(
        503,
        "NO_MARKET_SNAPSHOT",
        "No trustworthy market snapshot is available."
      );
    }

    return toSecureJsonResponse({ data: quote });
  } catch (error) {
    return toErrorResponse(error);
  }
}
