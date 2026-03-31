/**
 * Async Route Handler Wrapper
 * غلاف معالج المسارات غير المتزامن
 *
 * Provides consistent error handling for all API routes.
 * Catches errors and formats them using the global error handler.
 * Replaces raw try/catch blocks in route handlers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatErrorResponse, logError, AppError } from '@/lib/errors';
import { requiresCsrfProtection, isCsrfExempt, validateCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';

type RouteHandler = (request: NextRequest, context?: any) => Promise<NextResponse>;
type Middleware = (request: NextRequest) => NextResponse | Promise<NextResponse> | null;

/**
 * Wrap an async route handler with error handling
 * Usage: export const GET = withHandler(async (req) => { ... });
 */
export function withHandler(handler: RouteHandler, options?: {
  requireAuth?: boolean;
  allowedMethods?: string[];
  middlewares?: Middleware[];
}) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Run middlewares
      if (options?.middlewares) {
        for (const middleware of options.middlewares) {
          const result = await middleware(request);
          if (result) return result;
        }
      }

      // Check allowed methods
      if (options?.allowedMethods) {
        if (!options.allowedMethods.includes(request.method)) {
          return NextResponse.json(
            { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${request.method} not allowed` } },
            { status: 405 }
          );
        }
      }

      return await handler(request, context);
    } catch (error) {
      logError(error, `${request.method} ${request.nextUrl.pathname}`);
      const formatted = formatErrorResponse(error);
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      return NextResponse.json(formatted, { status: statusCode });
    }
  };
}

/**
 * CSRF validation middleware for use with withHandler
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  if (isCsrfExempt(request.nextUrl.pathname)) return null;
  if (!requiresCsrfProtection(request.method)) return null;

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!validateCsrfToken(cookieToken, headerToken)) {
    return NextResponse.json(
      { success: false, error: { code: 'CSRF_INVALID', message: 'Invalid CSRF token' } },
      { status: 403 }
    );
  }

  return null;
}
