import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LiveMarketDashboard } from "@/components/dashboard/live-market-dashboard";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("release smoke", () => {
  it("renders dashboard, history, and calculator flow", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("/api/market/current")) {
        return new Response(
          JSON.stringify({
            data: {
              snapshotAt: "2026-04-13T12:00:00.000Z",
              goldUsdPerToz: 2300,
              goldEgpPerToz: 115000,
              goldUsdPerGram: 73.9,
              goldEgpPerGram: 3697,
              goldUsdPerKg: 73900,
              goldEgpPerKg: 3697000,
              dayChangeAbsUsd: 20,
              dayChangePctUsd: 0.9,
              sourceNotice: {
                label: "Metals.Dev /latest",
                sourceName: "Metals.Dev",
                sourceEndpoint: "/latest",
                lastUpdatedAt: "2026-04-13T12:00:00.000Z",
                freshnessState: "fresh",
                disclaimer: "Prices are informational only and may differ from local transaction quotes."
              }
            }
          }),
          { status: 200 }
        );
      }

      if (url.includes("/api/market/history")) {
        return new Response(
          JSON.stringify({
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
          }),
          { status: 200 }
        );
      }

      if (url.includes("/api/market/convert") && url.includes("weight=5")) {
        return new Response(
          JSON.stringify({
            data: {
              requestedWeight: 5,
              unit: "g",
              purity: "24k",
              currency: "USD",
              spotValue: 369.73,
              snapshotAt: "2026-04-13T12:00:00.000Z",
              sourceNotice: {
                label: "Metals.Dev /latest",
                sourceName: "Metals.Dev",
                sourceEndpoint: "/latest",
                lastUpdatedAt: "2026-04-13T12:00:00.000Z",
                freshnessState: "fresh",
                disclaimer: "Prices are informational only and may differ from local transaction quotes."
              }
            }
          }),
          { status: 200 }
        );
      }

      return new Response(
        JSON.stringify({ error: { code: "INVALID_QUERY", message: "Invalid conversion query." } }),
        { status: 400 }
      );
    });

    render(<LiveMarketDashboard pollIntervalMs={60_000} />);

    await waitFor(() => {
      expect(screen.getByText("Current Gold Price")).toBeInTheDocument();
      expect(screen.getByText("History 7d (USD)")).toBeInTheDocument();
      expect(screen.getByText("Gold Value Calculator")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Weight"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => {
      expect(screen.getByText("Indicative Spot Value")).toBeInTheDocument();
      expect(screen.getByText("369.73 USD")).toBeInTheDocument();
    });
  });
});
