import { Pool } from "pg";

import { getEnv } from "@/lib/config/env";

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (pool) {
    return pool;
  }

  const env = getEnv();
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10
  });

  return pool;
}
