import type { FreshnessState } from "@/types/market";

export interface FreshnessThresholds {
  freshSeconds: number;
  staleSeconds: number;
}

export function getFreshnessState(
  snapshotAt: Date | null,
  now: Date,
  thresholds: FreshnessThresholds
): FreshnessState {
  if (!snapshotAt) {
    return "unavailable";
  }

  const ageSeconds = Math.max(0, Math.floor((now.getTime() - snapshotAt.getTime()) / 1000));

  if (ageSeconds <= thresholds.freshSeconds) {
    return "fresh";
  }

  if (ageSeconds <= thresholds.staleSeconds) {
    return "delayed";
  }

  return "stale";
}
