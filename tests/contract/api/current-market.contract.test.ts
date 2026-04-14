import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/db", () => ({
  getDbPool: vi.fn(() => ({}))
}));

vi.mock("@/lib/market/providers/metals-dev-client", () => ({
  MetalsDevClient: vi.fn()
}));

vi.mock("@/lib/market/repositories/ingestion-run-repository", () => ({
  IngestionRunRepository: vi.fn()
}));

vi.mock("@/lib/market/repositories/market-snapshot-repository", () => ({
  MarketSnapshotRepository: vi.fn()
}));

vi.mock("@/lib/market/services/current-quote-service", () => ({
  createCurrentQuoteService: vi.fn()
}));

vi.mock("@/lib/market/services/snapshot-ingestion-service", () => ({
  SnapshotIngestionService: vi.fn()
}));

import { GET } from "@/app/api/market/current/route";
import { createCurrentQuoteService } from "@/lib/market/services/current-quote-service";
import { SnapshotIngestionService } from "@/lib/market/services/snapshot-ingestion-service";

describe("GET /api/market/current contract", () => {
  it("returns 200 with normalized response payload", async () => {
    vi.mocked(SnapshotIngestionService).mockImplementation(
      () =>
        ({
          ingestLatestSnapshot: vi.fn().mockResolvedValue({
            status: "success"
          })
        }) as never
    );

    vi.mocked(createCurrentQuoteService).mockReturnValue({
      getCurrentQuote: vi.fn().mockResolvedValue({
        snapshotAt: "2026-04-13T12:00:00.000Z",
        goldUsdPerToz: 2300,
        goldEgpPerToz: 115000,
        goldUsdPerGram: 73.946,
        goldEgpPerGram: 3697.31,
        goldUsdPerKg: 73946.717,
        goldEgpPerKg: 3697335.85,
        dayChangeAbsUsd: 22,
        dayChangePctUsd: 0.97,
        sourceNotice: {
          label: "Metals.Dev /latest",
          sourceName: "Metals.Dev",
          sourceEndpoint: "/latest",
          lastUpdatedAt: "2026-04-13T12:00:00.000Z",
          freshnessState: "fresh",
          disclaimer: "Prices are informational only and may differ from local transaction quotes."
        }
      })
    } as never);

    const response = await GET();
    const body = (await response.json()) as {
      data: {
        goldUsdPerToz: number;
        sourceNotice: { sourceName: string };
      };
    };

    expect(response.status).toBe(200);
    expect(body.data.goldUsdPerToz).toBe(2300);
    expect(body.data.sourceNotice.sourceName).toBe("Metals.Dev");
  });

  it("returns 503 when no trustworthy snapshot exists", async () => {
    vi.mocked(SnapshotIngestionService).mockImplementation(
      () =>
        ({
          ingestLatestSnapshot: vi.fn().mockResolvedValue({
            status: "failed"
          })
        }) as never
    );

    vi.mocked(createCurrentQuoteService).mockReturnValue({
      getCurrentQuote: vi.fn().mockResolvedValue(null)
    } as never);

    const response = await GET();
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("NO_MARKET_SNAPSHOT");
  });

  it("refreshes delayed quotes before responding", async () => {
    const getCurrentQuote = vi
      .fn()
      .mockResolvedValueOnce({
        snapshotAt: "2026-04-13T00:00:00.000Z",
        goldUsdPerToz: 2200,
        goldEgpPerToz: 110000,
        goldUsdPerGram: 70.73,
        goldEgpPerGram: 3536.65,
        goldUsdPerKg: 70730,
        goldEgpPerKg: 3536650,
        dayChangeAbsUsd: 0,
        dayChangePctUsd: 0,
        sourceNotice: {
          label: "Metals.Dev /latest",
          sourceName: "Metals.Dev",
          sourceEndpoint: "/latest",
          lastUpdatedAt: "2026-04-13T00:00:00.000Z",
          freshnessState: "delayed",
          disclaimer: "Prices are informational only and may differ from local transaction quotes."
        }
      })
      .mockResolvedValueOnce({
        snapshotAt: "2026-04-13T08:00:00.000Z",
        goldUsdPerToz: 2300,
        goldEgpPerToz: 115000,
        goldUsdPerGram: 73.946,
        goldEgpPerGram: 3697.31,
        goldUsdPerKg: 73946.717,
        goldEgpPerKg: 3697335.85,
        dayChangeAbsUsd: 22,
        dayChangePctUsd: 0.97,
        sourceNotice: {
          label: "Metals.Dev /latest",
          sourceName: "Metals.Dev",
          sourceEndpoint: "/latest",
          lastUpdatedAt: "2026-04-13T08:00:00.000Z",
          freshnessState: "fresh",
          disclaimer: "Prices are informational only and may differ from local transaction quotes."
        }
      });

    vi.mocked(SnapshotIngestionService).mockImplementation(
      () =>
        ({
          ingestLatestSnapshot: vi.fn().mockResolvedValue({
            status: "success"
          })
        }) as never
    );

    vi.mocked(createCurrentQuoteService).mockReturnValue({
      getCurrentQuote
    } as never);

    const response = await GET();
    const body = (await response.json()) as {
      data: {
        goldUsdPerToz: number;
        sourceNotice: { freshnessState: string };
      };
    };

    expect(response.status).toBe(200);
    expect(body.data.goldUsdPerToz).toBe(2300);
    expect(body.data.sourceNotice.freshnessState).toBe("fresh");
    expect(getCurrentQuote).toHaveBeenCalledTimes(2);
  });
});
