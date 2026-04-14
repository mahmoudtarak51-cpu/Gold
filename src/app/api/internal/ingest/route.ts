import { NextResponse } from "next/server";

import { getDbPool } from "@/lib/config/db";
import { getEnv } from "@/lib/config/env";
import { MetalsDevClient } from "@/lib/market/providers/metals-dev-client";
import { IngestionRunRepository } from "@/lib/market/repositories/ingestion-run-repository";
import { MarketSnapshotRepository } from "@/lib/market/repositories/market-snapshot-repository";
import {
  ApiError,
  toErrorResponse,
  toSecureJsonResponse
} from "@/lib/market/services/api-error";
import { SnapshotIngestionService } from "@/lib/market/services/snapshot-ingestion-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const env = getEnv();
    const secret = request.headers.get("x-cron-secret");

    if (!secret || secret !== env.CRON_SECRET) {
      throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid scheduler secret.");
    }

    const pool = getDbPool();
    const service = new SnapshotIngestionService(
      new MetalsDevClient(),
      new MarketSnapshotRepository(pool),
      new IngestionRunRepository(pool)
    );

    const result = await service.ingestLatestSnapshot();

    if (result.status === "failed") {
      throw new ApiError(502, "PROVIDER_FAILURE", "Provider fetch failed during ingestion.");
    }

    return toSecureJsonResponse(
      {
        status: "accepted",
        runId: result.runId,
        acceptedAt: result.acceptedAt.toISOString()
      },
      202
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
