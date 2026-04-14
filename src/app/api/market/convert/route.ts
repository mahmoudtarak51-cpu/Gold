import { z } from "zod";

import {
  ApiError,
  toErrorResponse,
  toSecureJsonResponse
} from "@/lib/market/services/api-error";
import { createConversionService } from "@/lib/market/services/conversion-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.object({
  weight: z.coerce.number().positive().max(100000),
  unit: z.enum(["toz", "g", "kg"]),
  purity: z.enum(["24k", "22k", "21k", "18k"]),
  currency: z.enum(["USD", "EGP"])
});

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      weight: url.searchParams.get("weight"),
      unit: url.searchParams.get("unit"),
      purity: url.searchParams.get("purity"),
      currency: url.searchParams.get("currency")
    });

    if (!parsed.success) {
      throw new ApiError(400, "INVALID_QUERY", "Invalid conversion query.");
    }

    const service = createConversionService();
    const quote = await service.getConversionQuote(parsed.data);

    if (!quote) {
      throw new ApiError(503, "NO_MARKET_SNAPSHOT", "No trustworthy market snapshot is available.");
    }

    return toSecureJsonResponse({ data: quote });
  } catch (error) {
    return toErrorResponse(error);
  }
}
