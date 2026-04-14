import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LiveMarketDashboard } from "@/components/dashboard/live-market-dashboard";

const freshPayload = {
  data: {
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
  }
};

const stalePayload = {
  data: {
    ...freshPayload.data,
    sourceNotice: {
      ...freshPayload.data.sourceNotice,
      freshnessState: "stale"
    }
  }
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LiveMarketDashboard", () => {
  it("renders current quote, stale fallback, and auto-refreshes", async () => {
    const historyPayload = {
      data: {
        range: "7d",
        currency: "USD",
        points: [{ pointAt: "2026-04-10T00:00:00.000Z", currency: "USD", valuePerToz: 2300 }],
        sourceNotice: {
          label: "Metals.Dev /timeseries",
          sourceName: "Metals.Dev",
          sourceEndpoint: "/timeseries",
          lastUpdatedAt: "2026-04-10T00:00:00.000Z",
          freshnessState: "fresh",
          disclaimer: "Prices are informational only and may differ from local transaction quotes."
        }
      }
    };

    let currentCallCount = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("/api/market/history")) {
        return new Response(JSON.stringify(historyPayload), { status: 200 });
      }

      if (url.includes("/api/market/current")) {
        currentCallCount += 1;
        return new Response(JSON.stringify(currentCallCount === 1 ? freshPayload : stalePayload), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "Unknown route" }), { status: 404 });
    });

    render(<LiveMarketDashboard pollIntervalMs={25} />);

    await waitFor(() => {
      expect(screen.getByText("USD/toz")).toBeInTheDocument();
      expect(screen.getByText("Fresh")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Stale")).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(fetchMock).toHaveBeenCalled();
    expect(currentCallCount).toBeGreaterThanOrEqual(2);
  });
});
