import { LiveMarketDashboard } from "@/components/dashboard/live-market-dashboard";
import { Disclaimer } from "@/components/shared/disclaimer";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <header className="glass-panel hero-ring animate-rise-in rounded-[2rem] px-6 py-8 sm:px-8">
        <p className="font-display text-xs uppercase tracking-[0.32em] text-[var(--accent)]">
          Gold Price Reporter
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
          Live Global Gold Prices
        </h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          Monitor spot-linked USD and EGP gold pricing with source attribution, freshness status,
          and automatic refresh.
        </p>
      </header>

      <LiveMarketDashboard />

      <Disclaimer>
        Displayed prices are informational only and may differ from local transaction prices.
      </Disclaimer>
    </main>
  );
}
