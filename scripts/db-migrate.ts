import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { getDbPool } from "@/lib/config/db";

async function main(): Promise<void> {
  const migrationPath = resolve(process.cwd(), "db/migrations/001_market_data.sql");
  const sql = await readFile(migrationPath, "utf8");

  const pool = getDbPool();
  await pool.query(sql);
  await pool.end();

  console.log("Applied migration db/migrations/001_market_data.sql");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
