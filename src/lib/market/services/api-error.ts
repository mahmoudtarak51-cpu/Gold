import { NextResponse } from "next/server";

const securityHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
} as const;

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export function toSecureJsonResponse(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: securityHeaders
  });
}

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return toSecureJsonResponse(
      {
        error: {
          code: error.code,
          message: error.message
        }
      },
      error.statusCode
    );
  }

  return toSecureJsonResponse(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred."
      }
    },
    500
  );
}
