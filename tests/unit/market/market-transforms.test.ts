import { describe, expect, it } from "vitest";

import {
  toEgpPerGram,
  toEgpPerKg,
  toEgpPerToz,
  toIndicativeSpotValue,
  toUsdPerGram,
  toUsdPerKg
} from "@/lib/market/transforms/conversions";
import { getFreshnessState } from "@/lib/market/transforms/freshness";
import { toSourceNotice } from "@/lib/market/transforms/source-notice";

describe("market transforms", () => {
  it("calculates expected unit conversions", () => {
    expect(toUsdPerGram(3100)).toBeCloseTo(99.6674, 3);
    expect(toUsdPerKg(3100)).toBeCloseTo(99667.314, 3);
    expect(toEgpPerToz(3100, 50)).toBeCloseTo(155000);
    expect(toEgpPerGram(3100, 50)).toBeCloseTo(4983.37, 2);
    expect(toEgpPerKg(3100, 50)).toBeCloseTo(4983365.718, 3);
  });

  it("applies purity and weight in spot conversion", () => {
    const value = toIndicativeSpotValue(10, "g", "21k", 3000);
    expect(value).toBeCloseTo(843.957, 3);
  });

  it("returns freshness states from age thresholds", () => {
    const now = new Date("2026-04-13T12:10:00.000Z");

    expect(
      getFreshnessState(new Date("2026-04-13T12:09:10.000Z"), now, {
        freshSeconds: 120,
        staleSeconds: 600
      })
    ).toBe("fresh");

    expect(
      getFreshnessState(new Date("2026-04-13T12:06:00.000Z"), now, {
        freshSeconds: 120,
        staleSeconds: 600
      })
    ).toBe("delayed");

    expect(
      getFreshnessState(new Date("2026-04-13T11:55:00.000Z"), now, {
        freshSeconds: 120,
        staleSeconds: 600
      })
    ).toBe("stale");

    expect(
      getFreshnessState(null, now, {
        freshSeconds: 120,
        staleSeconds: 600
      })
    ).toBe("unavailable");
  });

  it("maps source notice with freshness and disclaimer", () => {
    const notice = toSourceNotice(
      {
        sourceName: "Metals.Dev",
        sourceEndpoint: "/latest",
        providerTimestamp: new Date("2026-04-13T12:00:00.000Z")
      },
      "fresh"
    );

    expect(notice.label).toBe("Metals.Dev /latest");
    expect(notice.freshnessState).toBe("fresh");
    expect(notice.disclaimer.length).toBeGreaterThan(10);
  });
});
