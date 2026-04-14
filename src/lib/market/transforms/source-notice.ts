import type { FreshnessState, SourceMetadata, SourceNotice } from "@/types/market";

export const PRICING_DISCLAIMER =
  "Prices are informational only and may differ from local transaction quotes.";

export function toSourceNotice(metadata: SourceMetadata, freshnessState: FreshnessState): SourceNotice {
  return {
    label: `${metadata.sourceName} ${metadata.sourceEndpoint}`,
    sourceName: metadata.sourceName,
    sourceEndpoint: metadata.sourceEndpoint,
    lastUpdatedAt: metadata.providerTimestamp.toISOString(),
    freshnessState,
    disclaimer: PRICING_DISCLAIMER
  };
}
