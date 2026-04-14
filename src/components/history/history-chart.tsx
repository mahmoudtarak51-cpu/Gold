import type { HistoryResponseData } from "@/lib/market/services/history-service";

interface HistoryChartProps {
  history: HistoryResponseData;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export function HistoryChart({ history }: HistoryChartProps) {
  return (
    <section className="glass-panel rounded-[1.5rem] p-6">
      <h3 className="font-display text-xl font-semibold text-[var(--text)]">
        History {history.range} ({history.currency})
      </h3>
      <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
        {history.points.slice(-8).map((point) => (
          <li key={`${point.pointAt}-${point.currency}`} className="flex items-center justify-between">
            <span>{point.pointAt}</span>
            <span className="font-display text-[var(--text)]">{formatNumber(point.valuePerToz)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
