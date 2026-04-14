import { useState, type FormEvent } from "react";

import type { ConversionQuoteInput } from "@/lib/market/services/conversion-service";

interface ConversionFormProps {
  onSubmit: (input: ConversionQuoteInput) => Promise<void>;
  isSubmitting: boolean;
}

export function ConversionForm({ onSubmit, isSubmitting }: ConversionFormProps) {
  const [weight, setWeight] = useState("1");
  const [unit, setUnit] = useState<ConversionQuoteInput["unit"]>("g");
  const [purity, setPurity] = useState<ConversionQuoteInput["purity"]>("24k");
  const [currency, setCurrency] = useState<ConversionQuoteInput["currency"]>("USD");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    await onSubmit({
      weight: Number(weight),
      unit,
      purity,
      currency
    });
  }

  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
      <label className="text-sm text-[var(--muted)]">
        Weight
        <input
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/80 px-3 py-2 text-[var(--text)]"
          type="number"
          step="any"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
        />
      </label>

      <label className="text-sm text-[var(--muted)]">
        Unit
        <select
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/80 px-3 py-2 text-[var(--text)]"
          value={unit}
          onChange={(event) => setUnit(event.target.value as ConversionQuoteInput["unit"])}
        >
          <option value="toz">toz</option>
          <option value="g">g</option>
          <option value="kg">kg</option>
        </select>
      </label>

      <label className="text-sm text-[var(--muted)]">
        Purity
        <select
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/80 px-3 py-2 text-[var(--text)]"
          value={purity}
          onChange={(event) => setPurity(event.target.value as ConversionQuoteInput["purity"])}
        >
          <option value="24k">24k</option>
          <option value="22k">22k</option>
          <option value="21k">21k</option>
          <option value="18k">18k</option>
        </select>
      </label>

      <label className="text-sm text-[var(--muted)]">
        Currency
        <select
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/80 px-3 py-2 text-[var(--text)]"
          value={currency}
          onChange={(event) => setCurrency(event.target.value as ConversionQuoteInput["currency"])}
        >
          <option value="USD">USD</option>
          <option value="EGP">EGP</option>
        </select>
      </label>

      <button
        type="submit"
        className="sm:col-span-2 rounded-full border border-[var(--accent)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--text)]"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Calculating..." : "Calculate"}
      </button>
    </form>
  );
}
