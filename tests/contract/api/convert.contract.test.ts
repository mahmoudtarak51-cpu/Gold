import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/market/services/conversion-service", () => ({
  createConversionService: vi.fn()
}));

import { GET } from "@/app/api/market/convert/route";
import { createConversionService } from "@/lib/market/services/conversion-service";

describe("GET /api/market/convert contract", () => {
  it("returns 200 for valid conversion query", async () => {
    vi.mocked(createConversionService).mockReturnValue({
      getConversionQuote: vi.fn().mockResolvedValue({
        requestedWeight: 10,
        unit: "g",
        purity: "21k",
        currency: "USD",
        spotValue: 843.95,
        snapshotAt: "2026-04-13T12:00:00.000Z",
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

    const request = new Request(
      "http://localhost:3000/api/market/convert?weight=10&unit=g&purity=21k&currency=USD"
    );
    const response = await GET(request);
    const body = (await response.json()) as { data: { spotValue: number; currency: string } };

    expect(response.status).toBe(200);
    expect(body.data.spotValue).toBeCloseTo(843.95, 2);
    expect(body.data.currency).toBe("USD");
  });

  it("returns 400 for invalid conversion query", async () => {
    vi.mocked(createConversionService).mockReturnValue({
      getConversionQuote: vi.fn()
    } as never);

    const request = new Request(
      "http://localhost:3000/api/market/convert?weight=-1&unit=g&purity=21k&currency=USD"
    );
    const response = await GET(request);
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_QUERY");
  });
});
