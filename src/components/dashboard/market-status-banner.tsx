import type { CurrentQuoteData } from "@/lib/market/services/current-quote-service";

interface MarketStatusBannerProps {
  quote: CurrentQuoteData;
}

function toLabel(state: CurrentQuoteData["sourceNotice"]["freshnessState"]): string {
  if (state === "fresh") {
    return "Fresh";
  }

  if (state === "delayed") {
    return "Delayed";
  }

  if (state === "stale") {
    return "Stale";
  }

  return "Unavailable";
}

export function MarketStatusBanner({ quote }: MarketStatusBannerProps) {
  return (
    <aside className="glass-panel rounded-[1.5rem] p-5">
      <p className="font-display text-sm uppercase tracking-[0.18em] text-[var(--accent)]">Market Status</p>
      <p className="mt-3 text-lg text-[var(--text)]">{toLabel(quote.sourceNotice.freshnessState)}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Source: {quote.sourceNotice.sourceName} {quote.sourceNotice.sourceEndpoint}
      </p>
      <p className="text-sm text-[var(--muted)]">Updated: {quote.sourceNotice.lastUpdatedAt}</p>
    </aside>
  );
}
