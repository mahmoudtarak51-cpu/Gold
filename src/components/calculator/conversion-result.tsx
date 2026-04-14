import type { ConversionQuoteData } from "@/lib/market/services/conversion-service";

interface ConversionResultProps {
  result: ConversionQuoteData;
}

function formatValue(value: number): string {
  return value.toFixed(2);
}

export function ConversionResult({ result }: ConversionResultProps) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-white/70 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Indicative Spot Value</p>
      <p className="mt-2 font-display text-xl text-[var(--text)]">
        {formatValue(result.spotValue)} {result.currency}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">Snapshot: {result.snapshotAt}</p>
      <p className="text-sm text-[var(--muted)]">
        Source: {result.sourceNotice.sourceName} {result.sourceNotice.sourceEndpoint}
      </p>
    </section>
  );
}
