import { describe, expect, it } from "vitest";

import { HistoryService } from "@/lib/market/services/history-service";

describe("HistoryService", () => {
  it("returns intraday USD points from snapshots", async () => {
    const service = new HistoryService(
      {
        listSince: async () => [
          {
            id: "s1",
            capturedAt: new Date("2026-04-13T12:00:00.000Z"),
            providerTimestamp: new Date("2026-04-13T12:00:00.000Z"),
            goldUsdPerToz: 2300,
            usdToEgp: 50,
            sourceName: "Metals.Dev",
            sourceEndpoint: "/latest",
            timestampSkewSeconds: 0,
            ingestStatus: "success"
          }
        ]
      },
      {
        listByDateRange: async () => []
      }
    );

    const result = await service.getHistory("intraday", "USD", new Date("2026-04-13T12:30:00.000Z"));
    expect(result?.points).toHaveLength(1);
    expect(result?.points[0].valuePerToz).toBe(2300);
  });

  it("converts daily history to EGP using same-period fx", async () => {
    const service = new HistoryService(
      {
        listSince: async () => []
      },
      {
        listByDateRange: async () => [
          {
            marketDate: "2026-04-10",
            goldUsdPerToz: 2300,
            usdToEgp: 50,
            sourceName: "Metals.Dev",
            sourceEndpoint: "/timeseries",
            backfilledAt: new Date("2026-04-11T00:00:00.000Z")
          }
        ]
      }
    );

    const result = await service.getHistory("7d", "EGP", new Date("2026-04-13T12:30:00.000Z"));
    expect(result?.points[0].valuePerToz).toBe(115000);
    expect(result?.sourceNotice.sourceEndpoint).toBe("/timeseries");
  });

  it("returns null for unavailable history", async () => {
    const service = new HistoryService(
      {
        listSince: async () => []
      },
      {
        listByDateRange: async () => []
      }
    );

    const result = await service.getHistory("7d", "USD", new Date("2026-04-13T12:30:00.000Z"));
    expect(result).toBeNull();
  });
});
