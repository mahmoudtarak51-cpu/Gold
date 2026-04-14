import { z } from "zod";

import type { LatestMarketSnapshot, ProviderDailyPoint } from "@/types/market";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const timestampInputSchema = z.union([z.string(), z.number(), z.date()]);

const timestampSchema = timestampInputSchema.transform((value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid provider timestamp");
  }

  return date;
});

const latestPayloadSchema = z.object({
  timestamp: timestampSchema.optional(),
  timestamps: z
    .object({
      metal: timestampInputSchema.optional(),
      currency: timestampInputSchema.optional()
    })
    .optional(),
  metals: z.record(z.string(), z.number()).optional(),
  rates: z.record(z.string(), z.number()).optional(),
  currencies: z.record(z.string(), z.number()).optional()
});

const timeseriesPointSchema = z.object({
  currencies: z.record(z.string(), z.number()).optional(),
  metals: z.record(z.string(), z.number()).optional(),
  date: isoDateSchema.optional(),
  gold: z.number().positive().optional(),
  XAU: z.number().positive().optional(),
  usd_egp: z.number().positive().optional(),
  USD_EGP: z.number().positive().optional(),
  egp: z.number().positive().optional()
});

const timeseriesPayloadSchema = z
  .object({
    data: z.record(isoDateSchema, timeseriesPointSchema).optional(),
    rates: z.record(isoDateSchema, timeseriesPointSchema).optional()
  })
  .refine((payload) => Boolean(payload.data ?? payload.rates), {
    message: "Provider payload is missing timeseries rate data"
  });

function toTimestamp(value: string | number | Date): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid provider timestamp");
  }

  return date;
}

function toUsdToEgpFromQuote(value: number | undefined): number | null {
  if (!value || value <= 0) {
    return null;
  }

  return value >= 1 ? value : 1 / value;
}

function getProviderTimestamp(payload: z.infer<typeof latestPayloadSchema>): Date {
  if (payload.timestamp) {
    return payload.timestamp;
  }

  const candidates = [payload.timestamps?.metal, payload.timestamps?.currency]
    .filter((value): value is string | number | Date => value !== undefined)
    .map((value) => toTimestamp(value))
    .sort((left, right) => left.getTime() - right.getTime());

  if (candidates.length === 0) {
    throw new Error("Provider payload is missing a valid timestamp");
  }

  // Use the older timestamp so combined metal+FX freshness never overstates recency.
  return candidates[0];
}

function getGoldUsdPerToz(payload: z.infer<typeof latestPayloadSchema>): number {
  const metals = payload.metals ?? payload.rates;
  const value = metals?.gold ?? metals?.GOLD ?? metals?.XAU;

  if (!value || value <= 0) {
    throw new Error("Provider payload is missing a valid gold quote");
  }

  return value;
}

function getUsdToEgp(payload: z.infer<typeof latestPayloadSchema>): number {
  const directRates = payload.rates;
  const directValue = directRates?.USD_EGP ?? directRates?.usd_egp;

  if (directValue && directValue > 0) {
    return directValue;
  }

  const currencies = payload.currencies ?? payload.rates;
  const value = toUsdToEgpFromQuote(currencies?.EGP ?? currencies?.egp);

  if (!value || value <= 0) {
    throw new Error("Provider payload is missing a valid USD/EGP rate");
  }

  return value;
}

export function parseLatestPayload(payload: unknown): LatestMarketSnapshot {
  const parsed = latestPayloadSchema.parse(payload);

  return {
    providerTimestamp: getProviderTimestamp(parsed),
    goldUsdPerToz: getGoldUsdPerToz(parsed),
    usdToEgp: getUsdToEgp(parsed),
    sourceName: "Metals.Dev",
    sourceEndpoint: "/latest"
  };
}

export function parseTimeseriesPayload(payload: unknown): ProviderDailyPoint[] {
  const parsed = timeseriesPayloadSchema.parse(payload);
  const source = parsed.data ?? parsed.rates ?? {};

  return Object.entries(source)
    .map(([marketDate, point]) => {
      const goldUsdPerToz = point.gold ?? point.XAU ?? point.metals?.gold ?? point.metals?.XAU;
      const usdToEgp =
        point.usd_egp ??
        point.USD_EGP ??
        point.egp ??
        toUsdToEgpFromQuote(point.currencies?.EGP ?? point.currencies?.egp);

      if (!goldUsdPerToz || !usdToEgp) {
        return null;
      }

      return {
        marketDate,
        goldUsdPerToz,
        usdToEgp
      } satisfies ProviderDailyPoint;
    })
    .filter((entry): entry is ProviderDailyPoint => entry !== null)
    .sort((a, b) => a.marketDate.localeCompare(b.marketDate));
}
