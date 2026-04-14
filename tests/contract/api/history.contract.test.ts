import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/market/services/history-service", () => ({
  createHistoryService: vi.fn()
}));

import { GET } from "@/app/api/market/history/route";
import { createHistoryService } from "@/lib/market/services/history-service";

describe("GET /api/market/history contract", () => {
  it("returns 200 for valid range and currency", async () => {
    vi.mocked(createHistoryService).mockReturnValue({
      getHistory: vi.fn().mockResolvedValue({
        range: "7d",
        currency: "USD",
        points: [
          {
            pointAt: "2026-04-10T00:00:00.000Z",
            currency: "USD",
            valuePerToz: 2300
          }
        ],
        sourceNotice: {
          label: "Metals.Dev /timeseries",
          sourceName: "Metals.Dev",
          sourceEndpoint: "/timeseries",
          lastUpdatedAt: "2026-04-10T00:00:00.000Z",
          freshnessState: "fresh",
          disclaimer: "Prices are informational only and may differ from local transaction quotes."
        }
      })
    } as never);

    const request = new Request("http://localhost:3000/api/market/history?range=7d&currency=USD");
    const response = await GET(request);
    const body = (await response.json()) as { data: { range: string; currency: string } };

    expect(response.status).toBe(200);
    expect(body.data.range).toBe("7d");
    expect(body.data.currency).toBe("USD");
  });

  it("returns 400 for invalid query parameters", async () => {
    vi.mocked(createHistoryService).mockReturnValue({
      getHistory: vi.fn()
    } as never);

    const request = new Request("http://localhost:3000/api/market/history?range=bad&currency=USD");
    const response = await GET(request);
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_QUERY");
  });
});
