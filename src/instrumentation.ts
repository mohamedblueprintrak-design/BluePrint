/**
 * Next.js Instrumentation Hook
 * This file runs when the Next.js server starts
 * Used for initializing observability tools like Sentry
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry for server-side
    const Sentry = await import('@sentry/nextjs');

    Sentry.init({
      dsn: process.env.SENTRY_DSN,

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: process.env.NODE_ENV === 'development',

      // Environment
      environment: process.env.NODE_ENV || 'development',

      // Release version
      release: process.env.npm_package_version || '0.1.0',
    });

    console.log('✅ Sentry initialized (server-side)');
  }
}
