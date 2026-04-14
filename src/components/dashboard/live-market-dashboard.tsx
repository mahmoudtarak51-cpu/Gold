"use client";

import { useEffect, useMemo, useState } from "react";

import type { CurrentQuoteData } from "@/lib/market/services/current-quote-service";
import { CurrentPriceCard } from "@/components/dashboard/current-price-card";
import { MarketStatusBanner } from "@/components/dashboard/market-status-banner";
import { HistoryChart } from "@/components/history/history-chart";
import { HistoryRangeTabs } from "@/components/history/history-range-tabs";
import { ConversionForm } from "@/components/calculator/conversion-form";
import { ConversionResult } from "@/components/calculator/conversion-result";
import type {
  ConversionQuoteData,
  ConversionQuoteInput
} from "@/lib/market/services/conversion-service";
import type { HistoryResponseData } from "@/lib/market/services/history-service";
import type { HistoryRange, SupportedCurrency } from "@/types/market";

interface LiveMarketDashboardProps {
  pollIntervalMs?: number;
}

interface CurrentMarketResponse {
  data: CurrentQuoteData;
}

interface HistoryMarketResponse {
  data: HistoryResponseData;
}

interface ConversionMarketResponse {
  data: ConversionQuoteData;
}

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export function LiveMarketDashboard({ pollIntervalMs = EIGHT_HOURS_MS }: LiveMarketDashboardProps) {
  const [quote, setQuote] = useState<CurrentQuoteData | null>(null);
  const [history, setHistory] = useState<HistoryResponseData | null>(null);
  const [range, setRange] = useState<HistoryRange>("7d");
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversion, setConversion] = useState<ConversionQuoteData | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  async function requestConversion(input: ConversionQuoteInput): Promise<void> {
    setIsConverting(true);

    try {
      const query = new URLSearchParams({
        weight: String(input.weight),
        unit: input.unit,
        purity: input.purity,
        currency: input.currency
      });

      const response = await fetch(`/api/market/convert?${query.toString()}`, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: { message?: string } };
        throw new Error(errorBody.error?.message ?? "Unable to calculate conversion.");
      }

      const payload = (await response.json()) as ConversionMarketResponse;
      setConversion(payload.data);
      setConversionError(null);
    } catch (error) {
      setConversion(null);
      setConversionError(error instanceof Error ? error.message : "Unable to calculate conversion.");
    } finally {
      setIsConverting(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadCurrent(): Promise<void> {
      try {
        const response = await fetch("/api/market/current", {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as CurrentMarketResponse;

        if (!mounted) {
          return;
        }

        setQuote(payload.data);
        setErrorMessage(null);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unexpected error");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCurrent();
    const id = setInterval(() => {
      void loadCurrent();
    }, pollIntervalMs);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [pollIntervalMs]);

  useEffect(() => {
    let mounted = true;

    async function loadHistory(): Promise<void> {
      try {
        const response = await fetch(`/api/market/history?range=${range}&currency=${currency}`, {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(`History request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as HistoryMarketResponse;

        if (!mounted) {
          return;
        }

        setHistory(payload.data);
      } catch {
        if (mounted) {
          setHistory(null);
        }
      }
    }

    void loadHistory();

    return () => {
      mounted = false;
    };
  }, [currency, quote?.snapshotAt, range]);

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <section className="glass-panel rounded-[1.5rem] p-6 text-[var(--muted)]">Loading market data...</section>
      );
    }

    if (errorMessage || !quote) {
      return (
        <section className="glass-panel rounded-[1.5rem] p-6 text-[var(--muted)]">
          Live market data is currently unavailable.
        </section>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <CurrentPriceCard quote={quote} />
          <MarketStatusBanner quote={quote} />
        </div>

        <section className="space-y-3">
          <div className="glass-panel rounded-[1.5rem] p-4">
            <p className="mb-3 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">History Controls</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <HistoryRangeTabs value={range} onChange={setRange} />
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1 text-sm ${
                    currency === "USD"
                      ? "border-[var(--accent)] bg-[var(--surface-strong)] text-[var(--text)]"
                      : "border-[var(--border)] text-[var(--muted)]"
                  }`}
                  onClick={() => setCurrency("USD")}
                >
                  USD
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1 text-sm ${
                    currency === "EGP"
                      ? "border-[var(--accent)] bg-[var(--surface-strong)] text-[var(--text)]"
                      : "border-[var(--border)] text-[var(--muted)]"
                  }`}
                  onClick={() => setCurrency("EGP")}
                >
                  EGP
                </button>
              </div>
            </div>
          </div>

          {history ? (
            <HistoryChart history={history} />
          ) : (
            <section className="glass-panel rounded-[1.5rem] p-6 text-[var(--muted)]">
              History is unavailable for the selected range.
            </section>
          )}
        </section>

        <section className="glass-panel rounded-[1.5rem] p-6">
          <h3 className="font-display text-xl font-semibold text-[var(--text)]">Gold Value Calculator</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Estimate spot-linked value by weight, purity, and currency.
          </p>

          <div className="mt-4 space-y-4">
            <ConversionForm onSubmit={requestConversion} isSubmitting={isConverting} />

            {conversionError ? (
              <p className="text-sm text-[var(--muted)]">{conversionError}</p>
            ) : null}

            {conversion ? <ConversionResult result={conversion} /> : null}
          </div>
        </section>
      </div>
    );
  }, [conversion, conversionError, currency, errorMessage, history, isConverting, isLoading, quote, range]);

  return <section className="animate-rise-in">{content}</section>;
}
