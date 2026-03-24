/**
 * Next.js Instrumentation Hook
 * This file runs when the Next.js server starts
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate environment configuration
    const { logEnvironmentStatus } = await import('@/lib/env-validator');
    logEnvironmentStatus();
    
    console.log('✅ BluePrint server initialized');
  }
}
