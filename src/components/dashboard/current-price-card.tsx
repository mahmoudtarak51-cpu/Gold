import type { CurrentQuoteData } from "@/lib/market/services/current-quote-service";

interface CurrentPriceCardProps {
  quote: CurrentQuoteData;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(value);
}

export function CurrentPriceCard({ quote }: CurrentPriceCardProps) {
  return (
    <section className="glass-panel rounded-[1.5rem] p-6">
      <h2 className="font-display text-2xl font-semibold text-[var(--text)]">Current Gold Price</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-[var(--border)] bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">USD/toz</p>
          <p className="mt-2 font-display text-2xl text-[var(--text)]">
            {formatNumber(quote.goldUsdPerToz)}
          </p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">EGP/toz</p>
          <p className="mt-2 font-display text-2xl text-[var(--text)]">
            {formatNumber(quote.goldEgpPerToz)}
          </p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Daily Change (USD)</p>
          <p className="mt-2 font-display text-2xl text-[var(--text)]">
            {formatNumber(quote.dayChangeAbsUsd)} ({formatNumber(quote.dayChangePctUsd)}%)
          </p>
        </article>
      </div>
    </section>
  );
}
