/**
 * Logging Middleware for API Routes
 * وسيط التسجيل لمسارات API
 * 
 * Wraps API handlers with automatic request/response logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from './logger';

/**
 * Higher-order function to wrap API handlers with logging
 */
export function withLogging(
  handler: (request: NextRequest) => Promise<NextResponse>,
  routeName: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const path = request.nextUrl.pathname;

    // Log incoming request
    log.apiRequest(method, path, undefined, { route: routeName });

    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;

      // Log response
      log.apiResponse(method, path, response.status, duration, { route: routeName });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      log.error(
        `[${method}] ${path} - Unhandled error`,
        error,
        { route: routeName, duration }
      );

      // Re-throw to let error handler deal with it
      throw error;
    }
  };
}

/**
 * Log API action with context
 */
export function logAction(
  action: string,
  userId: string | undefined,
  details: Record<string, unknown> = {}
) {
  log.info(`[ACTION] ${action}`, { userId, ...details });
}

/**
 * Log authentication events
 */
export function logAuth(
  event: 'login' | 'logout' | 'register' | 'password_reset' | '2fa_enable' | '2fa_disable' | 'session_expired',
  userId: string | undefined,
  meta?: Record<string, unknown>
) {
  const message = `[AUTH] ${event.toUpperCase()}`;
  
  if (event === 'login' || event === 'register') {
    log.info(message, { userId, ...meta });
  } else if (event === 'password_reset' || event === '2fa_enable' || event === '2fa_disable') {
    log.security(message, { userId, ...meta });
  } else {
    log.debug(message, { userId, ...meta });
  }
}

/**
 * Log database errors with context
 */
export function logDbError(
  operation: string,
  error: unknown,
  meta?: Record<string, unknown>
) {
  log.error(`[DB ERROR] ${operation}`, error, meta);
}

/**
 * Log rate limit events
 */
export function logRateLimit(
  identifier: string,
  limit: number,
  current: number,
  meta?: Record<string, unknown>
) {
  if (current >= limit) {
    log.security('RATE_LIMIT_EXCEEDED', { identifier, limit, current, ...meta });
  } else {
    log.warn(`[RATE LIMIT] ${identifier}: ${current}/${limit}`, meta);
  }
}
