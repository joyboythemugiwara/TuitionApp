import type { ApiResponse, ApiErrorResponse, PaginatedResponse, PaginationQuery } from "@/common/types";

// ── Success Response ──────────────────────────────────────────────────────────
export function successResponse<T>(
  message: string,
  data: T,
  statusCode = 200,
): { statusCode: number; body: ApiResponse<T> } {
  return {
    statusCode,
    body: {
      success: true,
      message,
      data,
    },
  };
}

// ── Created Response ──────────────────────────────────────────────────────────
export function createdResponse<T>(
  message: string,
  data: T,
): { statusCode: number; body: ApiResponse<T> } {
  return successResponse(message, data, 201);
}

// ── No Content Response ───────────────────────────────────────────────────────
export function noContentResponse(): { statusCode: number; body: ApiResponse<null> } {
  return successResponse("Success", null, 204);
}

// ── Paginated Response ────────────────────────────────────────────────────────
export function paginatedResponse<T>(
  message: string,
  data: T[],
  total: number,
  query: PaginationQuery,
): { statusCode: number; body: PaginatedResponse<T> & { success: boolean; message: string } } {
  const totalPages = Math.ceil(total / query.limit);

  return {
    statusCode: 200,
    body: {
      success: true,
      message,
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    },
  };
}

// ── Error Response ────────────────────────────────────────────────────────────
export function errorResponse(
  message: string,
  code: string,
  statusCode = 500,
  errors?: Record<string, string[]>,
): { statusCode: number; body: ApiErrorResponse } {
  return {
    statusCode,
    body: {
      success: false,
      message,
      code,
      ...(errors && { errors }),
    },
  };
}