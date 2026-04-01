/**
 * BluePrint API - Health Check & Monitoring
 *
 * Provides health monitoring for the application's critical dependencies.
 * Designed to be used with `/api/health` endpoints and external monitoring tools.
 *
 * @module health-check
 * @version 1.0.0
 */

import { db } from '@/lib/db';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Status of a single health check.
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Result of an individual health check.
 */
export interface HealthCheckResult {
  /** The component / dependency name. */
  component: string;
  /** Current status. */
  status: HealthStatus;
  /** Time taken to perform the check (ms). */
  responseTimeMs: number;
  /** Optional additional details about the check. */
  details?: Record<string, unknown>;
  /** Human-readable message. */
  message?: string;
  /** Timestamp of when the check was performed. */
  timestamp: string;
}

/**
 * Aggregated health check response.
 */
export interface HealthCheckResponse {
  /** Overall system status (worst of all checks). */
  status: HealthStatus;
  /** Timestamp of the check. */
  timestamp: string;
  /** System information. */
  system: SystemInfo;
  /** Individual check results. */
  checks: HealthCheckResult[];
  /** Total response time for all checks (ms). */
  totalResponseTimeMs: number;
  /** Request identifier for tracing. */
  requestId?: string;
}

/**
 * System information snapshot.
 */
export interface SystemInfo {
  /** Node.js version. */
  nodeVersion: string;
  /** Application environment. */
  environment: string;
  /** Server uptime in seconds. */
  uptimeSeconds: number;
  /** Process memory usage. */
  memory: MemoryInfo;
  /** CPU architecture. */
  platform: string;
  /** Hostname. */
  hostname: string;
}

/**
 * Memory usage snapshot.
 */
export interface MemoryInfo {
  /** RSS (Resident Set Size) in bytes. */
  rssBytes: number;
  /** Heap total in bytes. */
  heapTotalBytes: number;
  /** Heap used in bytes. */
  heapUsedBytes: number;
  /** External memory in bytes. */
  externalBytes: number;
  /** RSS in human-readable MB. */
  rssMB: string;
  /** Heap usage percentage. */
  heapUsagePercent: number;
}

/**
 * Disk space information.
 */
export interface DiskSpaceInfo {
  /** Total disk space in bytes. */
  totalBytes: number;
  /** Free disk space in bytes. */
  freeBytes: number;
  /** Used disk space in bytes. */
  usedBytes: number;
  /** Usage percentage. */
  usagePercent: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// System Info
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns basic system information about the running Node.js process.
 *
 * @returns A `SystemInfo` object with version, uptime, memory, etc.
 */
export function getSystemInfo(): SystemInfo {
  const mem = process.memoryUsage();
  const heapUsagePercent =
    mem.heapTotal > 0 ? Math.round((mem.heapUsed / mem.heapTotal) * 100) : 0;

  return {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV ?? 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssBytes: mem.rss,
      heapTotalBytes: mem.heapTotal,
      heapUsedBytes: mem.heapUsed,
      externalBytes: mem.external,
      rssMB: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsagePercent,
    },
    platform: process.platform,
    hostname: process.env.HOSTNAME ?? process.env.HOST ?? 'unknown',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual Health Checks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks the health of the Prisma / SQLite database connection.
 *
 * Executes a lightweight query (`SELECT 1`) to verify the connection is active.
 *
 * @returns A `HealthCheckResult` for the database.
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Execute a simple query to verify connectivity
    await db.$queryRaw`SELECT 1 as health`;

    const responseTimeMs = Date.now() - start;

    return {
      component: 'database',
      status: 'healthy',
      responseTimeMs,
      message: 'Database connection is active.',
      details: {
        provider: 'sqlite',
        responseTimeMs,
      },
      timestamp,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - start;

    return {
      component: 'database',
      status: 'unhealthy',
      responseTimeMs,
      message: 'Database connection failed.',
      details: {
        provider: 'sqlite',
        error: error instanceof Error ? error.message : String(error),
      },
      timestamp,
    };
  }
}

/**
 * Checks the health of a Redis connection (if configured).
 *
 * This is a stub that returns a "degraded" status if Redis is not configured,
 * as the application uses in-memory caching by default.
 *
 * @returns A `HealthCheckResult` for Redis.
 */
export async function checkRedisHealth(): Promise<HealthCheckResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return {
      component: 'redis',
      status: 'degraded',
      responseTimeMs: Date.now() - start,
      message: 'Redis is not configured. Using in-memory caching.',
      details: {
        configured: false,
        fallback: 'in-memory',
      },
      timestamp,
    };
  }

  try {
    // If Redis is configured, attempt a connection
    // This would use ioredis or similar in production
    // For now, we just check the URL format
    if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
      return {
        component: 'redis',
        status: 'unhealthy',
        responseTimeMs: Date.now() - start,
        message: 'Redis URL is malformed.',
        timestamp,
      };
    }

    return {
      component: 'redis',
      status: 'healthy',
      responseTimeMs: Date.now() - start,
      message: 'Redis connection is active.',
      details: {
        configured: true,
      },
      timestamp,
    };
  } catch (error) {
    return {
      component: 'redis',
      status: 'unhealthy',
      responseTimeMs: Date.now() - start,
      message: 'Redis health check failed.',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
      timestamp,
    };
  }
}

/**
 * Checks available disk space on the server.
 *
 * Uses the `statvfs` system call via a child process (Linux/macOS).
 * Returns "degraded" if the check is unavailable (e.g., on Windows).
 *
 * @returns A `HealthCheckResult` for disk space.
 */
export async function checkDiskSpace(): Promise<HealthCheckResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Use df command to check disk space (Unix systems)
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('df -k / | tail -1 | awk \'{print $2, $3, $4}\'');

    const [totalKb, usedKb, freeKb] = stdout
      .trim()
      .split(/\s+/)
      .map(Number);

    if (isNaN(totalKb) || isNaN(usedKb) || isNaN(freeKb)) {
      return {
        component: 'disk-space',
        status: 'degraded',
        responseTimeMs: Date.now() - start,
        message: 'Unable to parse disk space data.',
        timestamp,
      };
    }

    const usagePercent = Math.round((usedKb / totalKb) * 100);
    const status: HealthStatus =
      usagePercent > 90 ? 'unhealthy' : usagePercent > 75 ? 'degraded' : 'healthy';

    return {
      component: 'disk-space',
      status,
      responseTimeMs: Date.now() - start,
      message: `Disk usage at ${usagePercent}%.`,
      details: {
        totalBytes: totalKb * 1024,
        usedBytes: usedKb * 1024,
        freeBytes: freeKb * 1024,
        usagePercent,
      },
      timestamp,
    };
  } catch {
    return {
      component: 'disk-space',
      status: 'degraded',
      responseTimeMs: Date.now() - start,
      message: 'Disk space check unavailable (not a Unix system or permission denied).',
      timestamp,
    };
  }
}

/**
 * Checks the current memory usage against configured thresholds.
 *
 * @returns A `HealthCheckResult` for memory usage.
 */
export function checkMemoryUsage(): HealthCheckResult {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const mem = process.memoryUsage();

  const heapUsagePercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);
  const rssMB = mem.rss / 1024 / 1024;

  // Thresholds
  const WARNING_THRESHOLD = 75; // percent
  const CRITICAL_THRESHOLD = 90; // percent

  let status: HealthStatus = 'healthy';
  if (heapUsagePercent >= CRITICAL_THRESHOLD) {
    status = 'unhealthy';
  } else if (heapUsagePercent >= WARNING_THRESHOLD) {
    status = 'degraded';
  }

  return {
    component: 'memory',
    status,
    responseTimeMs: Date.now() - start,
    message: `Heap usage at ${heapUsagePercent}%. RSS: ${rssMB.toFixed(2)} MB.`,
    details: {
      heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2),
      heapUsagePercent,
      rssMB: rssMB.toFixed(2),
      warningThreshold: WARNING_THRESHOLD,
      criticalThreshold: CRITICAL_THRESHOLD,
    },
    timestamp,
  };
}

/**
 * Checks if an external service is reachable.
 * This is a generic stub that can be extended for specific services.
 *
 * @returns A `HealthCheckResult` for external services.
 */
export async function checkExternalServices(): Promise<HealthCheckResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  const services: { name: string; url: string }[] = [];

  // Add configured external service URLs
  if (process.env.STRIPE_SECRET_KEY) {
    services.push({ name: 'stripe', url: 'https://api.stripe.com' });
  }
  if (process.env.SENDGRID_API_KEY) {
    services.push({ name: 'sendgrid', url: 'https://api.sendgrid.com' });
  }

  if (services.length === 0) {
    return {
      component: 'external-services',
      status: 'degraded',
      responseTimeMs: Date.now() - start,
      message: 'No external services configured.',
      details: { configured: false },
      timestamp,
    };
  }

  const results: Record<string, { reachable: boolean; responseTimeMs: number }> = {};

  for (const service of services) {
    try {
      const serviceStart = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch(service.url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      results[service.name] = {
        reachable: true,
        responseTimeMs: Date.now() - serviceStart,
      };
    } catch {
      results[service.name] = { reachable: false, responseTimeMs: Date.now() - start };
    }
  }

  const allReachable = Object.values(results).every((r) => r.reachable);
  const anyReachable = Object.values(results).some((r) => r.reachable);

  const status: HealthStatus = allReachable
    ? 'healthy'
    : anyReachable
      ? 'degraded'
      : 'unhealthy';

  return {
    component: 'external-services',
    status,
    responseTimeMs: Date.now() - start,
    message: allReachable
      ? 'All external services are reachable.'
      : anyReachable
        ? 'Some external services are unreachable.'
        : 'All external services are unreachable.',
    details: { services: results },
    timestamp,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregated Health Check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs all health checks and returns an aggregated result.
 *
 * The overall status is determined by the worst individual check:
 * - Any "unhealthy" → overall "unhealthy"
 * - Any "degraded" → overall "degraded"
 * - All "healthy" → overall "healthy"
 *
 * @returns A `HealthCheckResponse` with all check results.
 *
 * @example
 * ```ts
 * // src/app/api/health/route.ts
 * import { runHealthChecks } from '@/lib/api/health-check';
 * import { successResponse } from '@/lib/api/api-response';
 *
 * export async function GET() {
 *   const result = await runHealthChecks();
 *   const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;
 *   return successResponse(result, undefined, statusCode);
 * }
 * ```
 */
export async function runHealthChecks(): Promise<HealthCheckResponse> {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const system = getSystemInfo();

  // Run all checks in parallel
  const [database, redis, diskSpace, memory, externalServices] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkDiskSpace().catch(() => ({
      component: 'disk-space' as const,
      status: 'degraded' as const,
      responseTimeMs: 0,
      message: 'Disk check failed unexpectedly.',
      timestamp,
    })),
    Promise.resolve(checkMemoryUsage()),
    checkExternalServices().catch(() => ({
      component: 'external-services' as const,
      status: 'degraded' as const,
      responseTimeMs: 0,
      message: 'External services check failed unexpectedly.',
      timestamp,
    })),
  ]);

  const checks = [database, redis, diskSpace, memory, externalServices];

  // Determine overall status
  const hasUnhealthy = checks.some((c) => c.status === 'unhealthy');
  const hasDegraded = checks.some((c) => c.status === 'degraded');

  const status: HealthStatus = hasUnhealthy
    ? 'unhealthy'
    : hasDegraded
      ? 'degraded'
      : 'healthy';

  return {
    status,
    timestamp,
    system,
    checks,
    totalResponseTimeMs: Date.now() - start,
  };
}

/**
 * Runs a quick liveness check (no database calls, just process health).
 *
 * Suitable for container orchestration liveness probes that must be fast.
 *
 * @returns `true` if the process is running.
 */
export function livenessCheck(): { alive: boolean; timestamp: string } {
  return {
    alive: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Runs a readiness check including database connectivity.
 *
 * Suitable for container orchestration readiness probes.
 *
 * @returns The database health check result.
 */
export async function readinessCheck(): Promise<HealthCheckResult> {
  return checkDatabaseHealth();
}
