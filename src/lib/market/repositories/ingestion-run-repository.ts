import type { Pool } from "pg";

import type { IngestStatus, IngestionRun } from "@/types/market";

interface IngestionRunRow {
  id: string;
  started_at: Date;
  completed_at: Date | null;
  status: IngestStatus;
  provider_latency_ms: number | null;
  error_code: string | null;
  snapshot_id: string | null;
}

function mapRunRow(row: IngestionRunRow): IngestionRun {
  return {
    id: row.id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    providerLatencyMs: row.provider_latency_ms,
    errorCode: row.error_code,
    snapshotId: row.snapshot_id
  };
}

export class IngestionRunRepository {
  constructor(private readonly pool: Pool) {}

  async createStartedRun(startedAt: Date): Promise<IngestionRun> {
    const result = await this.pool.query<IngestionRunRow>(
      `
      INSERT INTO ingestion_runs (started_at, status)
      VALUES ($1, 'failed')
      RETURNING *
      `,
      [startedAt]
    );

    return mapRunRow(result.rows[0]);
  }

  async completeRun(input: {
    runId: string;
    status: IngestStatus;
    providerLatencyMs: number | null;
    errorCode: string | null;
    snapshotId: string | null;
    completedAt: Date;
  }): Promise<void> {
    await this.pool.query(
      `
      UPDATE ingestion_runs
      SET
        completed_at = $2,
        status = $3,
        provider_latency_ms = $4,
        error_code = $5,
        snapshot_id = $6
      WHERE id = $1
      `,
      [
        input.runId,
        input.completedAt,
        input.status,
        input.providerLatencyMs,
        input.errorCode,
        input.snapshotId
      ]
    );
  }
}
