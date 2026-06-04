// src/lib/api-response.ts
// Centralized API response helpers with consistent structure

import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
  requestId?: string;
}

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function successResponse<T>(
  data: T = null as T,
  message = "Success",
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      requestId: generateRequestId(),
    },
    { status }
  );
}

export function errorResponse(
  error = "Something went wrong",
  status = 500,
  details?: unknown
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
      requestId: generateRequestId(),
    },
    { status }
  );
}

export function unauthorizedResponse(
  message = "Unauthorized"
): NextResponse<ApiResponse<never>> {
  return errorResponse(message, 401);
}

export function validationErrorResponse(
  zodError: ZodError
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      details: zodError.flatten(),
      requestId: generateRequestId(),
    },
    { status: 400 }
  );
}

export function notFoundResponse(
  resource = "Resource"
): NextResponse<ApiResponse<never>> {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Wraps an API handler with consistent error handling.
 * Use this to reduce try/catch boilerplate in route handlers.
 */
export async function withApiHandler<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T | never>>> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error) as NextResponse<ApiResponse<T | never>>;
    }

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return unauthorizedResponse() as NextResponse<ApiResponse<T | never>>;
      }
      return errorResponse(error.message, 400) as NextResponse<ApiResponse<T | never>>;
    }

    return errorResponse("Internal server error", 500) as NextResponse<ApiResponse<T | never>>;
  }
}