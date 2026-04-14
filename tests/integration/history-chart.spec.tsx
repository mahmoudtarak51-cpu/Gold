import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LiveMarketDashboard } from "@/components/dashboard/live-market-dashboard";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("history chart interactions", () => {
  it("switches range and currency and re-renders history payload", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
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

      if (url.includes("range=7d") && url.includes("currency=USD")) {
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

      return new Response(
        JSON.stringify({
          data: {
            range: "7d",
            currency: "EGP",
            points: [{ pointAt: "2026-04-10T00:00:00.000Z", currency: "EGP", valuePerToz: 115000 }],
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
    });

    render(<LiveMarketDashboard pollIntervalMs={60_000} />);

    await waitFor(() => {
      expect(screen.getByText("History 7d (USD)")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "EGP" }));

    await waitFor(() => {
      expect(screen.getByText("History 7d (EGP)")).toBeInTheDocument();
      expect(screen.getAllByText("115,000").length).toBeGreaterThan(0);
    });

    expect(fetchMock).toHaveBeenCalled();
  });
});
