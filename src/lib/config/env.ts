import { loadEnvConfig } from "@next/env";
import { z } from "zod";

loadEnvConfig(process.cwd());

const envSchema = z.object({
  METALS_DEV_API_KEY: z.string().min(1),
  METALS_DEV_BASE_URL: z.url().default("https://api.metals.dev/v1/"),
  DATABASE_URL: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  MARKET_FRESH_SECONDS: z.coerce.number().int().positive().default(28800),
  MARKET_STALE_SECONDS: z.coerce.number().int().positive().default(86400)
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}
