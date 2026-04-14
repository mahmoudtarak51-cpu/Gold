import { describe, expect, it } from "vitest";

import { CurrentQuoteService } from "@/lib/market/services/current-quote-service";

describe("CurrentQuoteService", () => {
  it("assembles current quote with source notice and day change", async () => {
    const service = new CurrentQuoteService(
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
        getLatestDailyPointBefore: async () => ({
          marketDate: "2026-04-12",
          goldUsdPerToz: 2270,
          usdToEgp: 49.5,
          sourceName: "Metals.Dev",
          sourceEndpoint: "/timeseries",
          backfilledAt: new Date("2026-04-13T00:00:00.000Z")
        })
      },
      {
        freshSeconds: 120,
        staleSeconds: 600
      }
    );

    const quote = await service.getCurrentQuote(new Date("2026-04-13T12:01:00.000Z"));

    expect(quote).not.toBeNull();
    expect(quote?.sourceNotice.freshnessState).toBe("fresh");
    expect(quote?.dayChangeAbsUsd).toBeCloseTo(30);
    expect(quote?.dayChangePctUsd).toBeCloseTo(1.32159, 4);
  });

  it("returns null when there is no snapshot", async () => {
    const service = new CurrentQuoteService(
      {
        findLatestTrustedSnapshot: async () => null
      },
      {
        getLatestDailyPointBefore: async () => null
      },
      {
        freshSeconds: 120,
        staleSeconds: 600
      }
    );

    const quote = await service.getCurrentQuote(new Date("2026-04-13T12:01:00.000Z"));
    expect(quote).toBeNull();
  });

  it("marks old snapshots as stale", async () => {
    const service = new CurrentQuoteService(
      {
        findLatestTrustedSnapshot: async () => ({
          id: "s1",
          capturedAt: new Date("2026-04-13T11:45:10.000Z"),
          providerTimestamp: new Date("2026-04-13T11:45:00.000Z"),
          goldUsdPerToz: 2300,
          usdToEgp: 50,
          sourceName: "Metals.Dev",
          sourceEndpoint: "/latest",
          timestampSkewSeconds: 0,
          ingestStatus: "success"
        })
      },
      {
        getLatestDailyPointBefore: async () => null
      },
      {
        freshSeconds: 120,
        staleSeconds: 600
      }
    );

    const quote = await service.getCurrentQuote(new Date("2026-04-13T12:00:00.000Z"));
    expect(quote?.sourceNotice.freshnessState).toBe("stale");
  });
});
