/**
 * BluePrint API - Request Validation Middleware
 *
 * Type-safe validation helpers for Next.js App Router API routes.
 * Integrates with Zod schemas to validate body, params, and query strings,
 * and provides a factory function to build validated, error-wrapped route handlers.
 *
 * @module request-validator
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { validationErrorResponse, errorResponse, generateRequestId } from './api-response';
import { ErrorCode } from './error-codes';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracted validated data from a Zod parse result.
 */
export type ValidatedData<T> = { success: true; data: T };

/**
 * Validation failure with formatted Zod error details.
 */
export type ValidationError = { success: false; errors: ZodError };

/**
 * Result of a validation pass — either valid data or errors.
 */
export type ValidationResult<T> = ValidatedData<T> | ValidationError;

/**
 * Configuration for the `createRouteHandler` factory.
 */
export interface RouteHandlerConfig<TBody = unknown, TParams = unknown, TQuery = unknown> {
  /** Zod schema for the request body (POST / PUT / PATCH). */
  body?: ZodSchema<TBody>;
  /** Zod schema for dynamic route params (e.g. `{ id: string }`). */
  params?: ZodSchema<TParams>;
  /** Zod schema for query string parameters. */
  query?: ZodSchema<TQuery>;
  /** Whether authentication is required (default: true). */
  requireAuth?: boolean;
  /** Array of permission strings required (e.g. `['projects:read']`). */
  permissions?: string[];
  /** Custom request identifier. If omitted one is auto-generated. */
  requestId?: string;
}

/**
 * Context object passed to the validated route handler function.
 */
export interface RouteContext<TBody = unknown, TParams = unknown, TQuery = unknown> {
  /** Validated and parsed request body. */
  body: TBody;
  /** Validated route params. */
  params: TParams;
  /** Validated query parameters (already parsed as an object). */
  query: TQuery;
  /** Raw NextRequest for access to headers, etc. */
  request: NextRequest;
  /** Unique request identifier for tracing. */
  requestId: string;
}

/**
 * The handler function type that receives validated context.
 */
export type ValidatedRouteHandler<TBody = unknown, TParams = unknown, TQuery = unknown> = (
  ctx: RouteContext<TBody, TParams, TQuery>,
) => Promise<NextResponse> | NextResponse;

/**
 * Type helper to infer the body type from a `RouteHandlerConfig`.
 */
export type InferBody<T> = T extends RouteHandlerConfig<infer B> ? B : never;

/**
 * Type helper to infer the params type from a `RouteHandlerConfig`.
 */
export type InferParams<T> = T extends RouteHandlerConfig<any, infer P> ? P : never;

/**
 * Type helper to infer the query type from a `RouteHandlerConfig`.
 */
export type InferQuery<T> = T extends RouteHandlerConfig<any, any, infer Q> ? Q : never;

// ─────────────────────────────────────────────────────────────────────────────
// Body Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a request body against a Zod schema.
 *
 * @param request - The incoming `NextRequest`.
 * @param schema - A Zod schema describing the expected body shape.
 * @returns A discriminated union: `{ success: true, data }` or `{ success: false, errors }`.
 *
 * @example
 * ```ts
 * const CreateProjectSchema = z.object({ name: z.string().min(1), code: z.string() });
 *
 * const result = await validateBody(request, CreateProjectSchema);
 * if (!result.success) return validationErrorResponse(result.errors);
 * // result.data is typed as { name: string, code: string }
 * ```
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): Promise<ValidationResult<T>> {
  try {
    const raw = await request.json();
    const parsed = schema.safeParse(raw);
    if (parsed.success) {
      return { success: true, data: parsed.data };
    }
    return { success: false, errors: parsed.error };
  } catch {
    return {
      success: false,
      errors: new ZodError([
        {
          code: 'custom',
          path: ['body'],
          message: 'Request body is not valid JSON.',
        },
      ]),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Params Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates URL dynamic route params against a Zod schema.
 *
 * In Next.js App Router, params are passed as `Promise<{ [key: string]: string }>`
 * for dynamic routes.
 *
 * @param params - Resolved route params object (e.g. `{ id: 'abc123' }`).
 * @param schema - A Zod schema describing expected params.
 * @returns A discriminated union.
 *
 * @example
 * ```ts
 * const result = validateParams({ id: 'abc123' }, z.object({ id: z.string().cuid() }));
 * if (!result.success) return validationErrorResponse(result.errors);
 * ```
 */
export function validateParams<T>(
  params: Record<string, string | string[]>,
  schema: ZodSchema<T>,
): ValidationResult<T> {
  const parsed = schema.safeParse(params);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  return { success: false, errors: parsed.error };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates query string parameters against a Zod schema.
 *
 * Converts `URLSearchParams` to a plain object before parsing with Zod.
 * Supports coercion for common types (numbers, booleans, dates).
 *
 * @param searchParams - `URLSearchParams` from the request URL.
 * @param schema - A Zod schema describing expected query params.
 * @returns A discriminated union.
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   page: z.coerce.number().int().positive().default(1),
 *   status: z.enum(['active', 'archived']).optional(),
 * });
 *
 * const { searchParams } = new URL(request.url);
 * const result = validateQuery(searchParams, schema);
 * ```
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>,
): ValidationResult<T> {
  const obj: Record<string, string | string[] | undefined> = {};

  searchParams.forEach((value, key) => {
    // Check for existing value (array)
    if (obj[key] !== undefined) {
      if (Array.isArray(obj[key])) {
        (obj[key] as string[]).push(value);
      } else {
        obj[key] = [obj[key] as string, value];
      }
    } else {
      obj[key] = value;
    }
  });

  const parsed = schema.safeParse(obj);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  return { success: false, errors: parsed.error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth & Permission Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal auth check interface.
 *
 * Implementations should integrate with NextAuth or a custom auth system.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
  organizationId?: string;
}

/**
 * Extracts and validates the authenticated user from a request.
 *
 * This is a placeholder that should be replaced with actual auth logic
 * (e.g. `getServerSession(authOptions)` from NextAuth).
 *
 * @param request - The incoming request.
 * @returns The authenticated user or `null`.
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  // TODO: Replace with actual auth integration
  // Example with NextAuth:
  // const session = await getServerSession(authOptions);
  // if (!session?.user) return null;
  // return { id: session.user.id, email: session.user.email, role: session.user.role };
  return null;
}

/**
 * Checks whether a user has all the required permissions.
 *
 * @param user - The authenticated user.
 * @param permissions - Array of permission strings required.
 * @returns `true` if the user has all permissions.
 */
export function hasPermissions(user: AuthUser, permissions: string[]): boolean {
  if (!user.permissions || user.permissions.length === 0) return false;
  return permissions.every((p) => user.permissions!.includes(p));
}

/**
 * Checks whether a user's role is in the allowed roles list.
 *
 * @param user - The authenticated user.
 * @param roles - Allowed roles.
 * @returns `true` if the user's role matches.
 */
export function hasRole(user: AuthUser, roles: string[]): boolean {
  return roles.includes(user.role);
}

// ─────────────────────────────────────────────────────────────────────────────
// Logging Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Log level for structured API logging. */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Logs an API request/response event in a structured format.
 *
 * @param level - Log level.
 * @param message - Human-readable message.
 * @param data - Additional structured data.
 * @param requestId - Request identifier for correlation.
 */
function logApiEvent(
  level: LogLevel,
  message: string,
  data: Record<string, unknown>,
  requestId?: string,
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId,
    ...data,
  };

  switch (level) {
    case 'error':
      console.error(JSON.stringify(entry));
      break;
    case 'warn':
      console.warn(JSON.stringify(entry));
      break;
    case 'debug':
      // Only log debug in development
      if (process.env.NODE_ENV === 'development') {
        console.debug(JSON.stringify(entry));
      }
      break;
    default:
      console.info(JSON.stringify(entry));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Handler Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a validated route handler with automatic:
 * - Body, param, and query validation (Zod)
 * - Authentication check
 * - Permission check
 * - Error handling wrapper (try-catch → standard error response)
 * - Request/response logging
 *
 * @param config - Validation and auth configuration.
 * @param handler - The actual route handler function receiving validated context.
 * @returns A Next.js route handler function ready to export from `route.ts`.
 *
 * @example
 * ```ts
 * // src/app/api/projects/route.ts
 * import { createRouteHandler } from '@/lib/api/request-validator';
 * import { z } from 'zod';
 *
 * const CreateProjectSchema = z.object({
 *   name: z.string().min(1).max(200),
 *   code: z.string().max(50),
 *   clientEmail: z.string().email(),
 * });
 *
 * export const POST = createRouteHandler(
 *   { body: CreateProjectSchema, requireAuth: true, permissions: ['projects:create'] },
 *   async ({ body, requestId }) => {
 *     const project = await db.project.create({ data: body });
 *     return createdResponse(project, requestId);
 *   },
 * );
 * ```
 */
export function createRouteHandler<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown,
>(
  config: RouteHandlerConfig<TBody, TParams, TQuery>,
  handler: ValidatedRouteHandler<TBody, TParams, TQuery>,
) {
  return async (request: NextRequest, context?: { params?: Promise<Record<string, string | string[]>> }) => {
    const requestId = config.requestId || generateRequestId();
    const startTime = Date.now();

    // Log incoming request
    logApiEvent('info', 'Incoming request', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    }, requestId);

    try {
      // ── Resolve params ────────────────────────────────────────────────
      let resolvedParams: Record<string, string | string[]> = {};
      if (context?.params) {
        resolvedParams = await context.params;
      }

      // ── Authentication ────────────────────────────────────────────────
      if (config.requireAuth !== false) {
        const user = await getAuthUser(request);
        if (!user) {
          logApiEvent('warn', 'Unauthenticated request', { url: request.url }, requestId);
          return errorResponse(
            ErrorCode.AUTH_INVALID_CREDENTIALS,
            'Authentication required. Please sign in.',
            401,
            undefined,
            requestId,
          );
        }

        // ── Permissions ───────────────────────────────────────────────
        if (config.permissions && config.permissions.length > 0) {
          if (!hasPermissions(user, config.permissions)) {
            logApiEvent('warn', 'Insufficient permissions', {
              userId: user.id,
              required: config.permissions,
              url: request.url,
            }, requestId);
            return errorResponse(
              ErrorCode.PERMISSION_DENIED,
              'You do not have permission to perform this action.',
              403,
              undefined,
              requestId,
            );
          }
        }
      }

      // ── Validate params ───────────────────────────────────────────────
      let parsedParams: TParams = {} as TParams;
      if (config.params) {
        const paramResult = validateParams(resolvedParams, config.params);
        if (!paramResult.success) {
          logApiEvent('warn', 'Param validation failed', { url: request.url }, requestId);
          return validationErrorResponse(paramResult.errors, requestId);
        }
        parsedParams = paramResult.data;
      }

      // ── Validate query ────────────────────────────────────────────────
      let parsedQuery: TQuery = {} as TQuery;
      if (config.query) {
        const { searchParams } = new URL(request.url);
        const queryResult = validateQuery(searchParams, config.query);
        if (!queryResult.success) {
          logApiEvent('warn', 'Query validation failed', { url: request.url }, requestId);
          return validationErrorResponse(queryResult.errors, requestId);
        }
        parsedQuery = queryResult.data;
      }

      // ── Validate body ─────────────────────────────────────────────────
      let parsedBody: TBody = undefined as unknown as TBody;
      if (config.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const bodyResult = await validateBody(request, config.body);
        if (!bodyResult.success) {
          logApiEvent('warn', 'Body validation failed', { url: request.url }, requestId);
          return validationErrorResponse(bodyResult.errors, requestId);
        }
        parsedBody = bodyResult.data;
      }

      // ── Execute handler ───────────────────────────────────────────────
      const response = await handler({
        body: parsedBody,
        params: parsedParams,
        query: parsedQuery,
        request,
        requestId,
      });

      // Log response
      const duration = Date.now() - startTime;
      logApiEvent('info', 'Request completed', {
        method: request.method,
        url: request.url,
        status: response.status,
        durationMs: duration,
      }, requestId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logApiEvent('error', 'Unhandled error in route handler', {
        method: request.method,
        url: request.url,
        durationMs: duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, requestId);

      return errorResponse(
        ErrorCode.SYSTEM_DATABASE_ERROR,
        'An unexpected error occurred. Please try again later.',
        500,
        process.env.NODE_ENV === 'development'
          ? { message: error instanceof Error ? error.message : String(error) }
          : undefined,
        requestId,
      );
    }
  };
}
