import { describe, expect, it } from "vitest";

import { ConversionService } from "@/lib/market/services/conversion-service";

describe("ConversionService", () => {
  it("calculates USD quote with purity and unit conversion", async () => {
    const service = new ConversionService(
      {
        findLatestTrustedSnapshot: async () => ({
          id: "s1",
          capturedAt: new Date("2026-04-13T12:00:10.000Z"),
          providerTimestamp: new Date("2026-04-13T12:00:00.000Z"),
          goldUsdPerToz: 2300,
          usdToEgp: 50,
          sourceName: "Metals.Dev",
          sourceEndpoint: "/latest",
          timestampSkewSeconds: 0,
          ingestStatus: "success"
        })
      },
      {
        freshSeconds: 120,
        staleSeconds: 600
      }
    );

    const quote = await service.getConversionQuote(
      {
        weight: 10,
        unit: "g",
        purity: "21k",
        currency: "USD"
      },
      new Date("2026-04-13T12:01:00.000Z")
    );

    expect(quote).not.toBeNull();
    expect(quote?.currency).toBe("USD");
    expect(quote?.spotValue).toBeCloseTo(647.03, 2);
  });

  it("calculates EGP quote using same snapshot fx", async () => {
    const service = new ConversionService(
      {
        findLatestTrustedSnapshot: async () => ({
          id: "s1",
          capturedAt: new Date("2026-04-13T12:00:10.000Z"),
          providerTimestamp: new Date("2026-04-13T12:00:00.000Z"),
          goldUsdPerToz: 2300,
          usdToEgp: 50,
          sourceName: "Metals.Dev",
          sourceEndpoint: "/latest",
          timestampSkewSeconds: 0,
          ingestStatus: "success"
        })
      },
      {
        freshSeconds: 120,
        staleSeconds: 600
      }
    );

    const quote = await service.getConversionQuote(
      {
        weight: 2,
        unit: "toz",
        purity: "24k",
        currency: "EGP"
      },
      new Date("2026-04-13T12:01:00.000Z")
    );

    expect(quote).not.toBeNull();
    expect(quote?.currency).toBe("EGP");
    expect(quote?.spotValue).toBe(230000);
  });

  it("returns null when no trusted snapshot exists", async () => {
    const service = new ConversionService(
      {
        findLatestTrustedSnapshot: async () => null
      },
      {
        freshSeconds: 120,
        staleSeconds: 600
      }
    );

    const quote = await service.getConversionQuote({
      weight: 5,
      unit: "g",
      purity: "24k",
      currency: "USD"
    });

    expect(quote).toBeNull();
  });
});
