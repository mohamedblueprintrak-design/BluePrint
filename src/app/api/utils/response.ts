import { NextResponse } from 'next/server';
import { ApiSuccessResponse, ApiErrorResponse } from '../types';

/**
 * Create a success response
 */
export function successResponse<T>(data: T, meta?: Record<string, unknown>): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = { success: true, data };
  if (meta) Object.assign(response, { meta });
  return NextResponse.json(response);
}

/**
 * Create an error response
 */
export function errorResponse(message: string, code = 'ERROR', status = 400): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedResponse(message = 'غير مصرح'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 'UNAUTHORIZED', 401);
}

/**
 * Create a forbidden error response
 */
export function forbiddenResponse(message = 'غير مصرح'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 'FORBIDDEN', 403);
}

/**
 * Create a not found error response
 */
export function notFoundResponse(message = 'غير موجود'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 'NOT_FOUND', 404);
}

/**
 * Create a server error response
 */
export function serverErrorResponse(message = 'خطأ في الخادم'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 'SERVER_ERROR', 500);
}
