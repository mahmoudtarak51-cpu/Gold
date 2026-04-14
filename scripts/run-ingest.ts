import { getDbPool } from "@/lib/config/db";
import { MetalsDevClient } from "@/lib/market/providers/metals-dev-client";
import { IngestionRunRepository } from "@/lib/market/repositories/ingestion-run-repository";
import { MarketSnapshotRepository } from "@/lib/market/repositories/market-snapshot-repository";
import { SnapshotIngestionService } from "@/lib/market/services/snapshot-ingestion-service";

async function main(): Promise<void> {
  const pool = getDbPool();
  const service = new SnapshotIngestionService(
    new MetalsDevClient(),
    new MarketSnapshotRepository(pool),
    new IngestionRunRepository(pool)
  );

  const result = await service.ingestLatestSnapshot();
  await pool.end();

  console.log(`Ingestion ${result.status}. Run ID: ${result.runId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
