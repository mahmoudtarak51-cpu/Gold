import { z } from "zod";

import {
  ApiError,
  toErrorResponse,
  toSecureJsonResponse
} from "@/lib/market/services/api-error";
import { createHistoryService } from "@/lib/market/services/history-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.object({
  range: z.enum(["intraday", "7d", "30d", "1y", "all"]),
  currency: z.enum(["USD", "EGP"])
});

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      range: url.searchParams.get("range"),
      currency: url.searchParams.get("currency")
    });

    if (!parsed.success) {
      throw new ApiError(400, "INVALID_QUERY", "Invalid range or currency query.");
    }

    const service = createHistoryService();
    const history = await service.getHistory(parsed.data.range, parsed.data.currency);

    if (!history) {
      throw new ApiError(503, "NO_HISTORY_AVAILABLE", "Historical data is unavailable.");
    }

    return toSecureJsonResponse({ data: history });
  } catch (error) {
    return toErrorResponse(error);
  }
}
