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
export function unauthorizedResponse(message = 'يرجى تسجيل الدخول'): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 'UNAUTHORIZED', 401);
}

/**
 * Create a forbidden error response
 */
export function forbiddenResponse(message = 'غير مصرح لك بالوصول'): NextResponse<ApiErrorResponse> {
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

/**
 * Create a validation error response
 */
export function validationErrorResponse(message: string, field?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'VALIDATION_ERROR', 
        message,
        ...(field && { field })
      } 
    },
    { status: 400 }
  );
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(retryAfter: number = 60): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً' } },
    { 
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': (Date.now() + retryAfter * 1000).toString(),
      }
    }
  );
}

/**
 * Create a conflict error response (duplicate resource)
 */
export function conflictResponse(message: string): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 'CONFLICT', 409);
}

/**
 * Create a bad request error response
 */
export function badRequestResponse(message: string): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 'BAD_REQUEST', 400);
}

/**
 * Log API error for debugging
 */
export function logApiError(context: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : '';
  console.error(`[API Error] ${context}:`, errorMessage);
  if (process.env.NODE_ENV === 'development' && errorStack) {
    console.error('[API Error Stack]:', errorStack);
  }
}
