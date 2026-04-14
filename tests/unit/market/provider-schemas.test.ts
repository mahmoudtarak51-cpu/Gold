import { describe, expect, it } from "vitest";

import {
  parseLatestPayload,
  parseTimeseriesPayload
} from "@/lib/market/validators/provider-schemas";

describe("provider schema parsing", () => {
  it("parses latest payload with rates map", () => {
    const parsed = parseLatestPayload({
      timestamp: "2026-04-13T12:00:00.000Z",
      rates: {
        XAU: 2350.25,
        EGP: 49.8
      }
    });

    expect(parsed.sourceName).toBe("Metals.Dev");
    expect(parsed.goldUsdPerToz).toBeCloseTo(2350.25);
    expect(parsed.usdToEgp).toBeCloseTo(49.8);
    expect(parsed.providerTimestamp.toISOString()).toBe("2026-04-13T12:00:00.000Z");
  });

  it("parses live latest payload with split timestamps and inverse currency quotes", () => {
    const parsed = parseLatestPayload({
      timestamps: {
        metal: "2026-04-13T12:00:00.000Z",
        currency: "2026-04-13T11:58:00.000Z"
      },
      metals: {
        gold: 2350.25
      },
      currencies: {
        EGP: 0.02
      }
    });

    expect(parsed.goldUsdPerToz).toBeCloseTo(2350.25);
    expect(parsed.usdToEgp).toBeCloseTo(50);
    expect(parsed.providerTimestamp.toISOString()).toBe("2026-04-13T11:58:00.000Z");
  });

  it("parses timeseries payload and drops incomplete points", () => {
    const parsed = parseTimeseriesPayload({
      rates: {
        "2026-04-10": {
          date: "2026-04-10",
          metals: {
            gold: 2300
          },
          currencies: {
            EGP: 0.0204081633
          }
        },
        "2026-04-11": {
          date: "2026-04-11",
          metals: {
            gold: 2310
          }
        },
        "2026-04-12": {
          date: "2026-04-12",
          gold: 2320,
          usd_egp: 49.2
        }
      }
    });

    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.marketDate).toBe("2026-04-10");
    expect(parsed[0]?.goldUsdPerToz).toBe(2300);
    expect(parsed[0]?.usdToEgp).toBeCloseTo(49, 6);
    expect(parsed[1]).toEqual({
      marketDate: "2026-04-12",
      goldUsdPerToz: 2320,
      usdToEgp: 49.2
    });
  });
});
