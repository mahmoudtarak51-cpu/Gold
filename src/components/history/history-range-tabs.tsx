import type { HistoryRange } from "@/types/market";

const ranges: HistoryRange[] = ["intraday", "7d", "30d", "1y", "all"];

interface HistoryRangeTabsProps {
  value: HistoryRange;
  onChange: (value: HistoryRange) => void;
}

export function HistoryRangeTabs({ value, onChange }: HistoryRangeTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <button
          key={range}
          type="button"
          className={`rounded-full border px-3 py-1 text-sm ${
            value === range
              ? "border-[var(--accent)] bg-[var(--surface-strong)] text-[var(--text)]"
              : "border-[var(--border)] text-[var(--muted)]"
          }`}
          onClick={() => onChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
