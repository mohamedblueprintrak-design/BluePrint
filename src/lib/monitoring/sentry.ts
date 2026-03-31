/**
 * Sentry Error Monitoring Configuration
 * إعداد مراقبة الأخطاء مع Sentry
 */

import * as Sentry from '@sentry/nextjs';

// NOTE: NEXT_PUBLIC_ prefix exposes this value to the browser bundle.
// This is required because client-side Sentry integrations (BrowserTracing, Replay)
// need the DSN in the browser. If server-only error reporting is sufficient,
// consider switching to a server-side SENTRY_DSN and splitting client/server Sentry config.
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NODE_ENV || 'development';

// Only initialize Sentry if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment
    environment,
    
    // Release version
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Session replay
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    
    // Integrations
    integrations: [
       
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.blueprint\.dev/,
        ],
      }),
       
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Ignore specific errors
    ignoreErrors: [
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'Navigation cancelled',
    ],
    
    // Filter transactions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeSend(event: any, _hint: any) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      // Don't send events in development unless explicitly enabled
      if (environment === 'development' && !process.env.SENTRY_ENABLE_DEV) {
        return null;
      }
      
      return event;
    },
    
    // Additional configuration
    debug: environment === 'development',
    attachStacktrace: true,
    maxBreadcrumbs: 50,
    
    // Set user context
    initialScope: {
      tags: {
        app: 'blueprint-saas',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      },
    },
  });
}

// Export for use in other files
export { Sentry };

// Helper function to capture errors with context
export function captureError(
  error: Error,
  context?: {
    user?: { id: string; email: string; role: string };
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) {
  if (!SENTRY_DSN) {
    console.error('Error (Sentry not configured):', error);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Sentry.withScope((scope: any) => {
    if (context?.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
        username: context.user.role,
      });
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
}

// Helper function to capture API errors
export function captureApiError(
  error: Error,
  request: {
    method: string;
    path: string;
    params?: Record<string, unknown>;
  }
) {
  captureError(error, {
    tags: {
      type: 'api_error',
      method: request.method,
    },
    extra: {
      path: request.path,
      params: request.params,
    },
  });
}

// Helper function to capture database errors
export function captureDatabaseError(
  error: Error,
  context?: {
    model?: string;
    operation?: string;
    query?: string;
  }
) {
  captureError(error, {
    tags: {
      type: 'database_error',
      model: context?.model || '',
      operation: context?.operation || '',
    },
    extra: {
      query: context?.query,
    },
  });
}

// Performance monitoring helper
export function startTransaction(name: string, op: string) {
  if (!SENTRY_DSN) return null;
   
  return Sentry.startTransaction({ name, op });
}

// Export types
export type { ErrorEvent, Breadcrumb } from '@sentry/nextjs';
