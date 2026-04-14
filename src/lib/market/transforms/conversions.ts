import type { Purity, SupportedUnit } from "@/types/market";

export const GRAMS_PER_TOZ = 31.1034768;

const TOZ_PER_KG = 32.150746568627;

const PURITY_FACTORS: Record<Purity, number> = {
  "24k": 1,
  "22k": 22 / 24,
  "21k": 21 / 24,
  "18k": 18 / 24
};

export function toUsdPerGram(goldUsdPerToz: number): number {
  return goldUsdPerToz / GRAMS_PER_TOZ;
}

export function toUsdPerKg(goldUsdPerToz: number): number {
  return goldUsdPerToz * TOZ_PER_KG;
}

export function toEgpPerToz(goldUsdPerToz: number, usdToEgp: number): number {
  return goldUsdPerToz * usdToEgp;
}

export function toEgpPerGram(goldUsdPerToz: number, usdToEgp: number): number {
  return toEgpPerToz(goldUsdPerToz, usdToEgp) / GRAMS_PER_TOZ;
}

export function toEgpPerKg(goldUsdPerToz: number, usdToEgp: number): number {
  return toEgpPerToz(goldUsdPerToz, usdToEgp) * TOZ_PER_KG;
}

function toTroyOunces(weight: number, unit: SupportedUnit): number {
  if (unit === "toz") {
    return weight;
  }

  if (unit === "g") {
    return weight / GRAMS_PER_TOZ;
  }

  return weight * TOZ_PER_KG;
}

export function toIndicativeSpotValue(
  weight: number,
  unit: SupportedUnit,
  purity: Purity,
  currencyPerToz: number
): number {
  const toz = toTroyOunces(weight, unit);
  return toz * currencyPerToz * PURITY_FACTORS[purity];
}
