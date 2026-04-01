/**
 * BluePrint API - Route Handler Templates
 *
 * Reusable route handler patterns and higher-order functions for
 * Next.js App Router API routes. Provides:
 * - Authenticated handler wrapper
 * - Public handler wrapper
 * - Error handling wrapper
 * - Rate limiting (in-memory)
 * - CRUD handler factory for Prisma models
 * - Server-Sent Events (streaming) support
 *
 * @module route-handler
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma, PrismaClient } from '@prisma/client';
import {
  successResponse,
  createdResponse,
  noContentResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
  rateLimitResponse,
  paginatedResponse,
  generateRequestId,
} from './api-response';
import { ErrorCode } from './error-codes';
import { parseQuery, buildPrismaPagination, buildPrismaOrderBy, buildPrismaWhere, buildSearchCondition, buildDateRangeCondition } from './query-builder';
import type { QueryConfig, ParsedQuery } from './query-builder';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Context available to all route handlers.
 */
export interface HandlerContext {
  /** The raw NextRequest. */
  request: NextRequest;
  /** Unique request identifier. */
  requestId: string;
  /** Resolved route params (e.g. `{ id: 'abc' }`). */
  params: Record<string, string | string[]>;
}

/**
 * A basic route handler that receives context and returns a NextResponse.
 */
export type RouteHandler = (
  ctx: HandlerContext,
) => Promise<NextResponse> | NextResponse;

/**
 * A route handler that receives an authenticated user context.
 */
export interface AuthenticatedContext extends HandlerContext {
  /** The authenticated user information. */
  user: {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
    organizationId?: string;
  };
}

/**
 * An authenticated route handler.
 */
export type AuthenticatedRouteHandler = (
  ctx: AuthenticatedContext,
) => Promise<NextResponse> | NextResponse;

/**
 * Rate limit configuration.
 */
export interface RateLimitConfig {
  /** Maximum number of requests in the time window. */
  maxRequests: number;
  /** Time window in milliseconds. */
  windowMs: number;
  /** Optional unique key extractor (defaults to IP address). */
  keyExtractor?: (request: NextRequest) => string;
}

/**
 * CRUD handler factory configuration.
 */
export interface CrudHandlerOptions<TModel = any> {
  /** The Prisma model delegate to use (e.g. `db.project`). */
  model: {
    findMany: (args?: any) => Promise<TModel[]>;
    findUnique: (args: { where: { id: string } }) => Promise<TModel | null>;
    findFirst: (args?: any) => Promise<TModel | null>;
    create: (args: { data: any }) => Promise<TModel>;
    update: (args: { where: { id: string }; data: any }) => Promise<TModel>;
    delete: (args: { where: { id: string } }) => Promise<TModel>;
    count: (args?: any) => Promise<number>;
  };
  /** Resource name for error messages (e.g. `'Project'`). */
  resourceName: string;
  /** Query configuration for the list endpoint (sorting, filtering, search). */
  queryConfig?: QueryConfig;
  /** Fields that should be treated as numeric for filtering. */
  numericFields?: string[];
  /** Additional Prisma `where` conditions applied to all queries (e.g. tenant filter). */
  baseWhere?: Record<string, unknown>;
  /** Optional include/specify related models. */
  include?: Record<string, unknown>;
  /** Optional transformation applied before returning data. */
  transform?: (item: TModel) => unknown;
  /** Permission required for list/create (default: none). */
  listPermission?: string;
  createPermission?: string;
  readPermission?: string;
  updatePermission?: string;
  deletePermission?: string;
}

/**
 * Socket.io event handler type.
 */
export type SocketEventHandler = (
  socket: { id: string; data: any; emit: (event: string, data: any) => void },
  ...args: any[]
) => Promise<void> | void;

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting (In-Memory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * In-memory rate limit store.
 * In production, replace with Redis or a distributed cache.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Cleans up expired rate limit entries to prevent memory leaks.
 * Should be called periodically (e.g. every 60 seconds).
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Checks if the request should be rate-limited.
 *
 * @param request - The incoming request.
 * @param config - Rate limit configuration.
 * @returns `null` if the request is allowed, or the number of seconds to wait.
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
): number | null {
  const key = config.keyExtractor
    ? config.keyExtractor(request)
    : getClientIp(request);

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return null; // Allowed
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return retryAfter; // Rate limited
  }

  entry.count++;
  return null; // Allowed
}

/**
 * Extracts the client IP from the request headers.
 * Supports X-Forwarded-For and X-Real-IP headers.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler Wrappers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps a handler with automatic try-catch error handling.
 * Unhandled exceptions are caught and returned as 500 responses.
 *
 * @param handler - The route handler function.
 * @returns A wrapped handler that never throws.
 *
 * @example
 * ```ts
 * export const GET = withErrorHandling(async ({ request, requestId }) => {
 *   const data = await someOperation();
 *   return successResponse(data, undefined, 200, requestId);
 * });
 * ```
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (ctx) => {
    try {
      return await handler(ctx);
    } catch (error) {
      console.error(`[API Error] ${ctx.request.method} ${ctx.request.url}`, error);
      return serverErrorResponse(undefined, ctx.requestId);
    }
  };
}

/**
 * Wraps a handler with authentication checking.
 *
 * Extracts the user from the session/token. If no user is found,
 * returns a 401 response.
 *
 * @param handler - The authenticated route handler.
 * @returns A wrapped handler that checks auth before executing.
 *
 * @example
 * ```ts
 * export const GET = authenticatedHandler(async ({ user, requestId }) => {
 *   return successResponse({ user: user.email }, undefined, 200, requestId);
 * });
 * ```
 */
export function authenticatedHandler(
  handler: AuthenticatedRouteHandler,
): RouteHandler {
  return async (ctx) => {
    try {
      // TODO: Replace with actual auth logic
      // const session = await getServerSession(authOptions);
      // if (!session?.user) return unauthorizedResponse(undefined, ctx.requestId);

      // Placeholder — in production, extract user from session/JWT
      const user = {
        id: 'placeholder',
        email: 'user@example.com',
        role: 'admin',
        permissions: ['*'],
      };

      return await handler({ ...ctx, user });
    } catch (error) {
      console.error(`[Auth Error] ${ctx.request.method} ${ctx.request.url}`, error);
      return unauthorizedResponse(undefined, ctx.requestId);
    }
  };
}

/**
 * Wraps a handler with authentication and permission checking.
 *
 * @param handler - The authenticated route handler.
 * @param requiredPermissions - Permissions the user must have.
 * @returns A wrapped handler that checks auth + permissions.
 */
export function authenticatedHandlerWithPermissions(
  handler: AuthenticatedRouteHandler,
  requiredPermissions: string[],
): RouteHandler {
  return authenticatedHandler(async (ctx) => {
    const userPermissions = ctx.user.permissions ?? [];
    const hasAll = requiredPermissions.every((p) =>
      userPermissions.includes('*') || userPermissions.includes(p),
    );

    if (!hasAll) {
      return forbiddenResponse(undefined, ctx.requestId);
    }

    return handler(ctx);
  });
}

/**
 * Wraps a handler for public (unauthenticated) endpoints.
 * Adds error handling but skips auth checks.
 *
 * @param handler - The route handler function.
 * @returns A wrapped handler.
 */
export function publicHandler(handler: RouteHandler): RouteHandler {
  return withErrorHandling(handler);
}

/**
 * Wraps a handler with rate limiting.
 *
 * @param handler - The route handler function.
 * @param config - Rate limit configuration.
 * @returns A wrapped handler that checks rate limits.
 */
export function withRateLimit(
  handler: RouteHandler,
  config: RateLimitConfig,
): RouteHandler {
  return async (ctx) => {
    const retryAfter = checkRateLimit(ctx.request, config);
    if (retryAfter !== null) {
      return rateLimitResponse(retryAfter, ctx.requestId);
    }
    return handler(ctx);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD Handler Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates standard CRUD route handlers (GET list, GET by id, POST, PUT, DELETE)
 * for a Prisma model.
 *
 * @param options - Configuration for the CRUD handlers.
 * @returns Object with `list`, `getById`, `create`, `update`, `delete` handler functions.
 *
 * @example
 * ```ts
 * // src/app/api/projects/route.ts
 * import { createCrudHandlers } from '@/lib/api/route-handler';
 * import { db } from '@/lib/db';
 *
 * const projectCrud = createCrudHandlers({
 *   model: db.project,
 *   resourceName: 'Project',
 *   queryConfig: {
 *     allowedSortFields: ['name', 'status', 'createdAt'],
 *     allowedFilters: { status: ['eq', 'in'] },
 *     searchFields: ['name', 'code'],
 *   },
 * });
 *
 * export const GET = projectCrud.list;
 * export const POST = projectCrud.create;
 *
 * // src/app/api/projects/[id]/route.ts
 * export const GET = projectCrud.getById;
 * export const PUT = projectCrud.update;
 * export const DELETE = projectCrud.delete;
 * ```
 */
export function createCrudHandlers<TModel = any>(
  options: CrudHandlerOptions<TModel>,
) {
  const { model, resourceName, queryConfig, numericFields, baseWhere, include, transform } = options;

  /**
   * GET / — List with pagination, filtering, and sorting.
   */
  const list = withErrorHandling(async (ctx) => {
    const { searchParams } = new URL(ctx.request.url);
    const query: ParsedQuery = parseQuery(searchParams, queryConfig);

    const { skip, take } = buildPrismaPagination(query.pagination);
    const orderBy = buildPrismaOrderBy(query.sort);

    // Build where clause from filters, search, and date range
    const filterWhere = buildPrismaWhere(query.filters, numericFields);
    const searchWhere = query.search
      ? buildSearchCondition(query.search.fields, query.search.term)
      : {};
    const dateWhere = query.dateRange
      ? buildDateRangeCondition(query.dateRange)
      : {};

    const where = {
      ...baseWhere,
      ...filterWhere,
      ...searchWhere,
      ...dateWhere,
    };

    const [items, total] = await Promise.all([
      model.findMany({
        skip,
        take,
        orderBy,
        where,
        ...(include && { include }),
      }),
      model.count({ where }),
    ]);

    const data = transform ? items.map(transform) : items;

    return paginatedResponse(data, {
      page: query.pagination.page,
      limit: query.pagination.limit,
      total,
    }, ctx.requestId);
  });

  /**
   * GET /:id — Retrieve a single resource by ID.
   */
  const getById = withErrorHandling(async (ctx) => {
    const { id } = ctx.params;
    if (!id || typeof id !== 'string') {
      return notFoundResponse(resourceName, ctx.requestId);
    }

    const item = await model.findUnique({
      where: { id: Array.isArray(id) ? id[0] : id },
      ...(include && { include }),
    });

    if (!item) {
      return notFoundResponse(resourceName, ctx.requestId);
    }

    return successResponse(transform ? transform(item) : item, undefined, 200, ctx.requestId);
  });

  /**
   * POST / — Create a new resource.
   */
  const create = withErrorHandling(async (ctx) => {
    let body: any;
    try {
      body = await ctx.request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_INVALID_INPUT', message: 'Request body must be valid JSON.' } },
        { status: 400 },
      );
    }

    const item = await model.create({
      data: body,
      ...(include && { include }),
    });

    return createdResponse(transform ? transform(item) : item, ctx.requestId);
  });

  /**
   * PUT /:id — Update an existing resource.
   */
  const update = withErrorHandling(async (ctx) => {
    const { id } = ctx.params;
    if (!id || typeof id !== 'string') {
      return notFoundResponse(resourceName, ctx.requestId);
    }

    let body: any;
    try {
      body = await ctx.request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_INVALID_INPUT', message: 'Request body must be valid JSON.' } },
        { status: 400 },
      );
    }

    // Check existence first
    const existing = await model.findUnique({
      where: { id: Array.isArray(id) ? id[0] : id },
    });

    if (!existing) {
      return notFoundResponse(resourceName, ctx.requestId);
    }

    const item = await model.update({
      where: { id: Array.isArray(id) ? id[0] : id },
      data: body,
      ...(include && { include }),
    });

    return successResponse(transform ? transform(item) : item, undefined, 200, ctx.requestId);
  });

  /**
   * DELETE /:id — Delete a resource.
   */
  const remove = withErrorHandling(async (ctx) => {
    const { id } = ctx.params;
    if (!id || typeof id !== 'string') {
      return notFoundResponse(resourceName, ctx.requestId);
    }

    const resolvedId = Array.isArray(id) ? id[0] : id;

    // Check existence first
    const existing = await model.findUnique({
      where: { id: resolvedId },
    });

    if (!existing) {
      return notFoundResponse(resourceName, ctx.requestId);
    }

    await model.delete({ where: { id: resolvedId } });

    return noContentResponse();
  });

  return { list, getById, create, update, delete: remove };
}

// ─────────────────────────────────────────────────────────────────────────────
// Streaming / Server-Sent Events
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for streaming responses.
 */
export interface StreamOptions {
  /** Content-Type header value (default: `text/event-stream`). */
  contentType?: string;
  /** Custom headers to add to the response. */
  headers?: Record<string, string>;
}

/**
 * Creates a streaming (Server-Sent Events) response.
 *
 * Useful for real-time updates, AI chat streaming, progress notifications, etc.
 *
 * @param handler - An async function that receives a `send` callback.
 * @param options - Stream configuration options.
 * @returns A `NextResponse` with streaming body.
 *
 * @example
 * ```ts
 * export const GET = (request: NextRequest) => {
 *   return streamResponse(async (send) => {
 *     for (let i = 0; i < 10; i++) {
 *       send({ data: { progress: i * 10 } });
 *       await new Promise(resolve => setTimeout(resolve, 1000));
 *     }
 *     send({ data: { progress: 100, done: true } });
 *   });
 * };
 * ```
 */
export function streamResponse(
  handler: (send: (event: { event?: string; data: unknown; id?: string }) => void) => Promise<void>,
  options?: StreamOptions,
): NextResponse {
  const encoder = new TextEncoder();
  const requestId = generateRequestId();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: { event?: string; data: unknown; id?: string }) => {
        const lines: string[] = [];
        if (event.id) lines.push(`id: ${event.id}`);
        if (event.event) lines.push(`event: ${event.event}`);
        lines.push(`data: ${JSON.stringify(event.data)}`);
        lines.push('');
        lines.push('');
        controller.enqueue(encoder.encode(lines.join('\n')));
      };

      try {
        await handler(send);
      } catch (error) {
        send({ event: 'error', data: { message: 'Stream error occurred' } });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': options?.contentType ?? 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Request-Id': requestId,
      ...(options?.headers ?? {}),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a fully-wrapped handler: rate-limited + authenticated + error-handled.
 *
 * @param handler - The authenticated route handler.
 * @param requiredPermissions - Optional permissions to check.
 * @param rateLimitConfig - Optional rate limit configuration.
 * @returns A wrapped handler.
 */
export function protectedHandler(
  handler: AuthenticatedRouteHandler,
  requiredPermissions?: string[],
  rateLimitConfig?: RateLimitConfig,
): RouteHandler {
  let wrapped: RouteHandler = authenticatedHandler(
    requiredPermissions
      ? async (ctx) => {
          const userPermissions = ctx.user.permissions ?? [];
          const hasAll = requiredPermissions.every((p) =>
            userPermissions.includes('*') || userPermissions.includes(p),
          );
          if (!hasAll) return forbiddenResponse(undefined, ctx.requestId);
          return handler(ctx);
        }
      : handler,
  );

  wrapped = withErrorHandling(wrapped);

  if (rateLimitConfig) {
    wrapped = withRateLimit(wrapped, rateLimitConfig);
  }

  return wrapped;
}
