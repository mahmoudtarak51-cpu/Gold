import { getDbPool } from "@/lib/config/db";
import { MetalsDevClient } from "@/lib/market/providers/metals-dev-client";
import { DailyHistoryRepository } from "@/lib/market/repositories/daily-history-repository";
import { HistoryBackfillService } from "@/lib/market/services/history-backfill-service";

async function main(): Promise<void> {
  const daysArg = process.argv.find((arg) => arg.startsWith("--days="));
  const days = daysArg ? Number(daysArg.split("=")[1]) : 365;

  if (!Number.isFinite(days) || days <= 0) {
    throw new Error("--days must be a positive integer");
  }

  const pool = getDbPool();
  const service = new HistoryBackfillService(
    new MetalsDevClient(),
    new DailyHistoryRepository(pool)
  );

  const result = await service.backfillDays(Math.floor(days));
  await pool.end();

  console.log(`Backfill complete. Inserted/updated ${result.inserted} rows across ${result.windows} windows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
