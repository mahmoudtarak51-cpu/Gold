import { getEnv } from "@/lib/config/env";
import {
  parseLatestPayload,
  parseTimeseriesPayload
} from "@/lib/market/validators/provider-schemas";
import type { LatestMarketSnapshot, ProviderDailyPoint } from "@/types/market";

interface MetalsDevClientOptions {
  fetchImpl?: typeof fetch;
}

export class MetalsDevClient {
  private readonly fetchImpl: typeof fetch;

  constructor(options?: MetalsDevClientOptions) {
    this.fetchImpl = options?.fetchImpl ?? fetch;
  }

  async fetchLatestSnapshot(): Promise<LatestMarketSnapshot> {
    const env = getEnv();
    const url = new URL("latest", env.METALS_DEV_BASE_URL);
    url.searchParams.set("api_key", env.METALS_DEV_API_KEY);
    url.searchParams.set("currency", "USD");
    url.searchParams.set("unit", "toz");

    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Metals.Dev latest request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    return parseLatestPayload(payload);
  }

  async fetchTimeseriesDaily(startDate: string, endDate: string): Promise<ProviderDailyPoint[]> {
    const env = getEnv();
    const url = new URL("timeseries", env.METALS_DEV_BASE_URL);
    url.searchParams.set("api_key", env.METALS_DEV_API_KEY);
    url.searchParams.set("start_date", startDate);
    url.searchParams.set("end_date", endDate);

    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Metals.Dev timeseries request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    return parseTimeseriesPayload(payload);
  }
}
