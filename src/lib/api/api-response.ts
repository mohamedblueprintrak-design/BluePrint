/**
 * BluePrint API - Standard Response Utilities
 *
 * Provides a consistent, type-safe response format for all API endpoints.
 * Every response follows a standardized structure to simplify client-side
 * parsing and error handling.
 *
 * @module api-response
 * @version 1.0.0
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { ErrorCode } from './error-codes';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Metadata for paginated responses.
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether a next page exists */
  hasNext: boolean;
  /** Whether a previous page exists */
  hasPrev: boolean;
}

/**
 * Standardized success response envelope.
 *
 * @typeParam T - The shape of the response data payload.
 *
 * @example
 * ```json
 * { "success": true, "data": { "id": "1", "name": "Project A" } }
 * ```
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
  requestId?: string;
}

/**
 * Error detail object carried inside error responses.
 */
export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Standardized error response envelope.
 *
 * @example
 * ```json
 * { "success": false, "error": { "code": "RESOURCE_NOT_FOUND", "message": "Project not found" } }
 * ```
 */
export interface ApiError {
  success: false;
  error: ApiErrorDetail;
  timestamp: string;
  requestId?: string;
}

/**
 * Paginated list response.
 *
 * @typeParam T - The shape of each item in the data array.
 *
 * @example
 * ```json
 * { "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5, "hasNext": true, "hasPrev": false } }
 * ```
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  timestamp: string;
  requestId?: string;
}

/**
 * Validation error field detail for Zod-formatted errors.
 */
export interface ValidationErrorField {
  field: string;
  message: string;
  code?: string;
}

/**
 * Validation error response body.
 */
export interface ValidationErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: ValidationErrorField[];
  };
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns an ISO-8601 UTC timestamp string. */
function getTimestamp(): string {
  return new Date().toISOString();
}

/** Generates a short random request ID for tracing (optional). */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Success Responses
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a standardized success JSON response.
 *
 * @typeParam T - The type of the data payload.
 * @param data - The response data.
 * @param meta - Optional pagination metadata.
 * @param statusCode - HTTP status code (default: 200).
 * @param requestId - Optional request identifier for tracing.
 * @returns A `NextResponse` with the standard success envelope.
 *
 * @example
 * ```ts
 * return successResponse({ id: '1', name: 'BluePrint' });
 * ```
 */
export function successResponse<T>(
  data: T,
  meta?: PaginationMeta,
  statusCode: number = 200,
  requestId?: string,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
      timestamp: getTimestamp(),
      ...(requestId && { requestId }),
    },
    { status: statusCode },
  );
}

/**
 * Creates a paginated list response with metadata.
 *
 * @typeParam T - The type of each item.
 * @param data - Array of items for the current page.
 * @param pagination - Pagination parameters and totals.
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with `PaginatedResponse` envelope.
 *
 * @example
 * ```ts
 * return paginatedResponse(projects, {
 *   page: 1,
 *   limit: 20,
 *   total: 100,
 * });
 * ```
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number },
  requestId?: string,
): NextResponse<PaginatedResponse<T>> {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      timestamp: getTimestamp(),
      ...(requestId && { requestId }),
    },
    { status: 200 },
  );
}

/**
 * Creates a 201 Created response for newly created resources.
 *
 * @typeParam T - The type of the created resource.
 * @param data - The newly created resource data.
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with status 201.
 *
 * @example
 * ```ts
 * return createdResponse({ id: 'abc', name: 'New Project' });
 * ```
 */
export function createdResponse<T>(
  data: T,
  requestId?: string,
): NextResponse<ApiResponse<T>> {
  return successResponse(data, undefined, 201, requestId);
}

/**
 * Creates a 204 No Content response (no body).
 *
 * Used for successful DELETE operations or updates that return no payload.
 *
 * @returns A `NextResponse` with status 204.
 */
export function noContentResponse(): NextResponse<undefined> {
  return new NextResponse(null, { status: 204 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Responses
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a standardized error JSON response.
 *
 * @param code - Machine-readable error code (e.g., `'RESOURCE_NOT_FOUND'`).
 * @param message - Human-readable error message.
 * @param statusCode - HTTP status code (default: 400).
 * @param details - Optional extra error details.
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with the standard error envelope.
 */
export function errorResponse(
  code: ErrorCode | string,
  message: string,
  statusCode: number = 400,
  details?: unknown,
  requestId?: string,
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined && { details }),
      },
      timestamp: getTimestamp(),
      ...(requestId && { requestId }),
    },
    { status: statusCode },
  );
}

/**
 * Creates a 404 Not Found response for a missing resource.
 *
 * @param resource - Name of the resource type (e.g., `'Project'`, `'Invoice'`).
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with status 404.
 *
 * @example
 * ```ts
 * return notFoundResponse('Project');
 * // -> { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Project not found' } }
 * ```
 */
export function notFoundResponse(
  resource: string,
  requestId?: string,
): NextResponse<ApiError> {
  return errorResponse(
    'RESOURCE_NOT_FOUND' as ErrorCode,
    `${resource} not found`,
    404,
    undefined,
    requestId,
  );
}

/**
 * Creates a 401 Unauthorized response.
 *
 * @param message - Override the default message.
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with status 401.
 */
export function unauthorizedResponse(
  message: string = 'Authentication required. Please provide valid credentials.',
  requestId?: string,
): NextResponse<ApiError> {
  return errorResponse(
    'AUTH_INVALID_CREDENTIALS' as ErrorCode,
    message,
    401,
    undefined,
    requestId,
  );
}

/**
 * Creates a 403 Forbidden response for insufficient permissions.
 *
 * @param message - Override the default message.
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with status 403.
 */
export function forbiddenResponse(
  message: string = 'You do not have permission to perform this action.',
  requestId?: string,
): NextResponse<ApiError> {
  return errorResponse(
    'PERMISSION_DENIED' as ErrorCode,
    message,
    403,
    undefined,
    requestId,
  );
}

/**
 * Creates a 422 Validation Error response from a Zod error.
 *
 * Automatically extracts field-level messages from the Zod error
 * and formats them into the standard validation error structure.
 *
 * @param errors - A Zod `ZodError` instance or a pre-formatted array of field errors.
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with status 422.
 *
 * @example
 * ```ts
 * const result = schema.safeParse(body);
 * if (!result.success) return validationErrorResponse(result.error);
 * ```
 */
export function validationErrorResponse(
  errors: ZodError | ValidationErrorField[],
  requestId?: string,
): NextResponse<ValidationErrorResponse> {
  const fields: ValidationErrorField[] =
    errors instanceof ZodError
      ? errors.errors.map((err) => ({
          field: String(err.path.join('.')),
          message: err.message,
          code: err.code,
        }))
      : errors;

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_INVALID_INPUT',
        message: 'Validation failed. Please check your input and try again.',
        details: fields,
      },
      timestamp: getTimestamp(),
      ...(requestId && { requestId }),
    },
    { status: 422 },
  );
}

/**
 * Creates a 429 Too Many Requests response.
 *
 * @param retryAfter - Number of seconds until the client should retry.
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with status 429 and `Retry-After` header.
 */
export function rateLimitResponse(
  retryAfter: number,
  requestId?: string,
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'AUTH_RATE_LIMITED' as ErrorCode,
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      },
      timestamp: getTimestamp(),
      ...(requestId && { requestId }),
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    },
  );
}

/**
 * Creates a 500 Internal Server Error response.
 *
 * Intended for unexpected server-side failures. The `message` parameter
 * should NOT leak sensitive implementation details to the client.
 *
 * @param message - Generic message (default: `'An unexpected error occurred'`).
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with status 500.
 */
export function serverErrorResponse(
  message: string = 'An unexpected error occurred. Please try again later.',
  requestId?: string,
): NextResponse<ApiError> {
  return errorResponse(
    'SYSTEM_DATABASE_ERROR' as ErrorCode,
    message,
    500,
    undefined,
    requestId,
  );
}

/**
 * Creates a 400 Bad Request response for general client errors.
 *
 * @param message - Descriptive error message.
 * @param code - Machine-readable error code (default: `'VALIDATION_INVALID_INPUT'`).
 * @param details - Optional extra details.
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with status 400.
 */
export function badRequestResponse(
  message: string,
  code: ErrorCode | string = 'VALIDATION_INVALID_INPUT',
  details?: unknown,
  requestId?: string,
): NextResponse<ApiError> {
  return errorResponse(code, message, 400, details, requestId);
}

/**
 * Creates a 409 Conflict response.
 *
 * @param message - Descriptive conflict message.
 * @param code - Machine-readable error code (default: `'RESOURCE_CONFLICT'`).
 * @param requestId - Optional request identifier.
 * @returns A `NextResponse` with status 409.
 */
export function conflictResponse(
  message: string,
  code: ErrorCode | string = 'RESOURCE_CONFLICT',
  requestId?: string,
): NextResponse<ApiError> {
  return errorResponse(code, message, 409, undefined, requestId);
}
