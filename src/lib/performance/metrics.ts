/**
 * @module performance/metrics
 * @description Application performance metrics collector for the BluePrint SaaS platform.
 * Tracks request duration, DB query time, cache hit rate, error rate, and active users.
 * Provides a singleton MetricsCollector with lightweight middleware for auto-collection.
 *
 * @example
 * ```typescript
 * import { metricsCollector } from '@/lib/performance/metrics';
 *
 * // Record a request
 * metricsCollector.recordRequest('GET', '/api/projects', 120, 200);
 *
 * // Record a DB query
 * metricsCollector.recordDBQuery('project', 'findMany', 45);
 *
 * // Get health metrics for monitoring
 * const health = metricsCollector.getHealthMetrics();
 * console.log(health);
 * ```
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single request metric entry */
export interface RequestMetric {
  method: string;
  path: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

/** A single DB query metric entry */
export interface DBQueryMetric {
  model: string;
  operation: string;
  duration: number;
  timestamp: Date;
}

/** A single cache operation metric entry */
export interface CacheMetric {
  operation: 'get' | 'set' | 'delete' | 'invalidate';
  key: string;
  hit: boolean;
  duration: number;
  timestamp: Date;
}

/** Aggregated metrics snapshot */
export interface MetricsSnapshot {
  /** Request metrics */
  requests: {
    total: number;
    averageDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
    errorRate: number;
    byStatus: Record<number, number>;
    byMethod: Record<string, number>;
    byPath: Record<string, { count: number; avgDuration: number }>;
  };
  /** Database query metrics */
  dbQueries: {
    total: number;
    averageDuration: number;
    slowQueries: number;
    byModel: Record<string, { count: number; avgDuration: number }>;
    byOperation: Record<string, { count: number; avgDuration: number }>;
  };
  /** Cache metrics */
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    averageDuration: number;
    byOperation: Record<string, number>;
  };
  /** General metrics */
  general: {
    startTime: Date;
    uptime: number;
    activeUsers: number;
    memoryUsage: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
  };
}

/** Health check response */
export interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  responseTime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  errorRate: number;
  cacheHitRate: number;
  averageResponseTime: number;
  slowQueryCount: number;
  details: {
    requests: { total: number; errorRate: number };
    dbQueries: { total: number; avgDuration: number; slowQueries: number };
    cache: { hitRate: number };
  };
}

/** Middleware options */
export interface MetricsMiddlewareOptions {
  /** Path patterns to exclude from metrics (default: ['/health', '/favicon.ico']) */
  excludePaths?: string[];
  /** Slow request threshold in ms (default: 1000) */
  slowRequestThreshold?: number;
  /** Slow query threshold in ms (default: 500) */
  slowQueryThreshold?: number;
}

// ─── Metrics Collector ───────────────────────────────────────────────────────

/**
 * Singleton metrics collector for the BluePrint application.
 * Tracks request, database, cache, and general performance metrics.
 *
 * Thread-safe for use in serverless environments.
 *
 * @example
 * ```typescript
 * const metrics = new MetricsCollector();
 *
 * metrics.recordRequest('GET', '/api/projects', 120, 200);
 * metrics.recordDBQuery('project', 'findMany', 45);
 * metrics.recordCacheOperation('get', 'projects:list', true, 2);
 *
 * const snapshot = metrics.getMetrics();
 * const health = metrics.getHealthMetrics();
 * ```
 */
export class MetricsCollector {
  private static instance: MetricsCollector | null = null;

  // Metrics storage
  private requests: RequestMetric[] = [];
  private dbQueries: DBQueryMetric[] = [];
  private cacheMetrics: CacheMetric[] = [];

  // Configuration
  private maxRequestHistory = 1000;
  private maxDBQueryHistory = 500;
  private maxCacheHistory = 500;
  private slowQueryThreshold = 500;
  private slowRequestThreshold = 1000;

  // Active user tracking
  private activeUserSet = new Set<string>();
  private userCleanupInterval: ReturnType<typeof setInterval> | null = null;

  // Start time
  private startTime = new Date();

  private constructor() {
    // Start periodic user cleanup
    this.userCleanupInterval = setInterval(() => {
      this.activeUserSet.clear();
    }, 5 * 60 * 1000); // Reset every 5 minutes
  }

  /**
   * Get the singleton MetricsCollector instance.
   */
  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  // ─── Request Metrics ────────────────────────────────────────────────────

  /**
   * Record an HTTP request metric.
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - Request path
   * @param duration - Request duration in milliseconds
   * @param statusCode - HTTP response status code
   */
  recordRequest(
    method: string,
    path: string,
    duration: number,
    statusCode: number
  ): void {
    this.requests.push({
      method: method.toUpperCase(),
      path,
      duration: Math.round(duration * 100) / 100,
      statusCode,
      timestamp: new Date(),
    });

    // Trim history if needed
    if (this.requests.length > this.maxRequestHistory) {
      this.requests = this.requests.slice(-this.maxRequestHistory);
    }

    // Log slow requests
    if (duration > this.slowRequestThreshold) {
      console.warn(
        `[Metrics] Slow request: ${method} ${path} - ${duration.toFixed(2)}ms (${statusCode})`
      );
    }
  }

  // ─── DB Query Metrics ───────────────────────────────────────────────────

  /**
   * Record a database query metric.
   *
   * @param model - Prisma model name (e.g., 'project', 'task')
   * @param operation - Operation performed (e.g., 'findMany', 'create')
   * @param duration - Query duration in milliseconds
   */
  recordDBQuery(model: string, operation: string, duration: number): void {
    this.dbQueries.push({
      model,
      operation,
      duration: Math.round(duration * 100) / 100,
      timestamp: new Date(),
    });

    // Trim history
    if (this.dbQueries.length > this.maxDBQueryHistory) {
      this.dbQueries = this.dbQueries.slice(-this.maxDBQueryHistory);
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(
        `[Metrics] Slow DB query: ${model}.${operation} - ${duration.toFixed(2)}ms`
      );
    }
  }

  // ─── Cache Metrics ──────────────────────────────────────────────────────

  /**
   * Record a cache operation metric.
   *
   * @param operation - Cache operation type
   * @param key - Cache key accessed
   * @param hit - Whether the cache hit (true) or missed (false)
   * @param duration - Operation duration in milliseconds
   */
  recordCacheOperation(
    operation: 'get' | 'set' | 'delete' | 'invalidate',
    key: string,
    hit: boolean,
    duration: number
  ): void {
    this.cacheMetrics.push({
      operation,
      key,
      hit,
      duration: Math.round(duration * 100) / 100,
      timestamp: new Date(),
    });

    // Trim history
    if (this.cacheMetrics.length > this.maxCacheHistory) {
      this.cacheMetrics = this.cacheMetrics.slice(-this.maxCacheHistory);
    }
  }

  // ─── Active Users ───────────────────────────────────────────────────────

  /**
   * Track an active user session.
   *
   * @param userId - The user's unique identifier
   */
  trackActiveUser(userId: string): void {
    this.activeUserSet.add(userId);
  }

  /**
   * Remove a user from active tracking.
   *
   * @param userId - The user's unique identifier
   */
  removeActiveUser(userId: string): void {
    this.activeUserSet.delete(userId);
  }

  /**
   * Get the count of currently active users.
   */
  getActiveUserCount(): number {
    return this.activeUserSet.size;
  }

  // ─── Metrics Snapshots ──────────────────────────────────────────────────

  /**
   * Get a comprehensive metrics snapshot.
   * Useful for monitoring dashboards and alerting.
   *
   * @returns Full metrics snapshot with all collected data
   */
  getMetrics(): MetricsSnapshot {
    return {
      requests: this.getRequestMetrics(),
      dbQueries: this.getDBQueryMetrics(),
      cache: this.getCacheMetrics(),
      general: this.getGeneralMetrics(),
    };
  }

  /**
   * Get health check metrics.
   * Returns a simplified view suitable for health check endpoints.
   *
   * @returns Health status and key metrics
   */
  getHealthMetrics(): HealthMetrics {
    const requestMetrics = this.getRequestMetrics();
    const dbMetrics = this.getDBQueryMetrics();
    const cacheMetrics = this.getCacheMetrics();
    const generalMetrics = this.getGeneralMetrics();

    const errorRate = requestMetrics.errorRate;
    const memoryPercentage = (generalMetrics.memoryUsage.heapUsed / generalMetrics.memoryUsage.heapTotal) * 100;

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorRate > 10 || memoryPercentage > 90 || dbMetrics.slowQueries > 50) {
      status = 'unhealthy';
    } else if (errorRate > 5 || memoryPercentage > 75 || dbMetrics.slowQueries > 20) {
      status = 'degraded';
    }

    return {
      status,
      uptime: generalMetrics.uptime,
      responseTime: requestMetrics.averageDuration,
      memoryUsage: {
        used: generalMetrics.memoryUsage.heapUsed,
        total: generalMetrics.memoryUsage.heapTotal,
        percentage: Math.round(memoryPercentage * 100) / 100,
      },
      errorRate,
      cacheHitRate: cacheMetrics.hitRate,
      averageResponseTime: requestMetrics.averageDuration,
      slowQueryCount: dbMetrics.slowQueries,
      details: {
        requests: {
          total: requestMetrics.total,
          errorRate,
        },
        dbQueries: {
          total: dbMetrics.total,
          avgDuration: dbMetrics.averageDuration,
          slowQueries: dbMetrics.slowQueries,
        },
        cache: {
          hitRate: cacheMetrics.hitRate,
        },
      },
    };
  }

  /**
   * Reset all collected metrics. Useful for testing.
   */
  reset(): void {
    this.requests = [];
    this.dbQueries = [];
    this.cacheMetrics = [];
    this.activeUserSet.clear();
    this.startTime = new Date();
  }

  /**
   * Destroy the metrics collector and clean up timers.
   */
  destroy(): void {
    if (this.userCleanupInterval) {
      clearInterval(this.userCleanupInterval);
    }
    MetricsCollector.instance = null;
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  private getRequestMetrics() {
    const total = this.requests.length;
    if (total === 0) {
      return {
        total: 0,
        averageDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        errorRate: 0,
        byStatus: {},
        byMethod: {},
        byPath: {},
      };
    }

    const durations = this.requests.map((r) => r.duration).sort((a, b) => a - b);
    const errorCount = this.requests.filter((r) => r.statusCode >= 400).length;

    const byStatus: Record<number, number> = {};
    const byMethod: Record<string, number> = {};
    const byPath: Record<string, { count: number; totalDuration: number }> = {};

    for (const req of this.requests) {
      byStatus[req.statusCode] = (byStatus[req.statusCode] || 0) + 1;
      byMethod[req.method] = (byMethod[req.method] || 0) + 1;

      if (!byPath[req.path]) {
        byPath[req.path] = { count: 0, totalDuration: 0 };
      }
      byPath[req.path].count++;
      byPath[req.path].totalDuration += req.duration;
    }

    const byPathAvg: Record<string, { count: number; avgDuration: number }> = {};
    for (const [path, stats] of Object.entries(byPath)) {
      byPathAvg[path] = {
        count: stats.count,
        avgDuration: Math.round((stats.totalDuration / stats.count) * 100) / 100,
      };
    }

    return {
      total,
      averageDuration: Math.round((durations.reduce((a, b) => a + b, 0) / total) * 100) / 100,
      p50Duration: percentile(durations, 50),
      p95Duration: percentile(durations, 95),
      p99Duration: percentile(durations, 99),
      errorRate: Math.round((errorCount / total) * 10000) / 100,
      byStatus,
      byMethod,
      byPath: byPathAvg,
    };
  }

  private getDBQueryMetrics() {
    const total = this.dbQueries.length;
    if (total === 0) {
      return {
        total: 0,
        averageDuration: 0,
        slowQueries: 0,
        byModel: {},
        byOperation: {},
      };
    }

    const durations = this.dbQueries.map((q) => q.duration);
    const slowQueries = this.dbQueries.filter((q) => q.duration > this.slowQueryThreshold).length;

    const byModel: Record<string, { count: number; totalDuration: number }> = {};
    const byOperation: Record<string, { count: number; totalDuration: number }> = {};

    for (const query of this.dbQueries) {
      if (!byModel[query.model]) {
        byModel[query.model] = { count: 0, totalDuration: 0 };
      }
      byModel[query.model].count++;
      byModel[query.model].totalDuration += query.duration;

      if (!byOperation[query.operation]) {
        byOperation[query.operation] = { count: 0, totalDuration: 0 };
      }
      byOperation[query.operation].count++;
      byOperation[query.operation].totalDuration += query.duration;
    }

    const formatBy = (obj: Record<string, { count: number; totalDuration: number }>) => {
      const result: Record<string, { count: number; avgDuration: number }> = {};
      for (const [key, stats] of Object.entries(obj)) {
        result[key] = {
          count: stats.count,
          avgDuration: Math.round((stats.totalDuration / stats.count) * 100) / 100,
        };
      }
      return result;
    };

    return {
      total,
      averageDuration: Math.round((durations.reduce((a, b) => a + b, 0) / total) * 100) / 100,
      slowQueries,
      byModel: formatBy(byModel),
      byOperation: formatBy(byOperation),
    };
  }

  private getCacheMetrics() {
    const total = this.cacheMetrics.length;
    if (total === 0) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageDuration: 0,
        byOperation: {},
      };
    }

    const hits = this.cacheMetrics.filter((m) => m.hit).length;
    const misses = total - hits;
    const durations = this.cacheMetrics.map((m) => m.duration);

    const byOperation: Record<string, number> = {};
    for (const metric of this.cacheMetrics) {
      byOperation[metric.operation] = (byOperation[metric.operation] || 0) + 1;
    }

    return {
      hits,
      misses,
      hitRate: Math.round((hits / total) * 10000) / 100,
      averageDuration: Math.round((durations.reduce((a, b) => a + b, 0) / total) * 100) / 100,
      byOperation,
    };
  }

  private getGeneralMetrics() {
    const memoryUsage = process.memoryUsage();
    return {
      startTime: this.startTime,
      uptime: Math.round((Date.now() - this.startTime.getTime()) / 1000),
      activeUsers: this.activeUserSet.size,
      memoryUsage: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external || 0,
      },
    };
  }
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Calculate the percentile value from a sorted array of numbers.
 */
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return Math.round((sortedArr[Math.max(0, index)] || 0) * 100) / 100;
}

// ─── Next.js Middleware Helper ───────────────────────────────────────────────

/**
 * Create a metrics-collecting wrapper for Next.js API route handlers.
 * Automatically records request duration and status code.
 *
 * @param handler - The original API route handler
 * @param options - Metrics middleware options
 * @returns Wrapped handler with metrics collection
 *
 * @example
 * ```typescript
 * // pages/api/projects/index.ts
 * import { withMetrics } from '@/lib/performance/metrics';
 *
 * export default withMetrics(async (req, res) => {
 *   const projects = await db.project.findMany();
 *   res.json(projects);
 * }, { excludePaths: [] });
 * ```
 */
export function withMetrics(
  handler: (req: Request, ctx?: unknown) => Promise<Response>,
  options: MetricsMiddlewareOptions = {}
): (req: Request, ctx?: unknown) => Promise<Response> {
  const {
    excludePaths = ['/health', '/favicon.ico'],
  } = options;

  return async (req: Request, ctx?: unknown) => {
    const metrics = MetricsCollector.getInstance();
    const startTime = performance.now();

    try {
      const response = await handler(req, ctx);
      const duration = performance.now() - startTime;

      // Check if path should be excluded
      const url = new URL(req.url);
      if (!excludePaths.some((pattern) => url.pathname.startsWith(pattern))) {
        metrics.recordRequest(
          req.method,
          url.pathname,
          duration,
          response.status
        );
      }

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      metrics.recordRequest(req.method, new URL(req.url).pathname, duration, 500);
      throw error;
    }
  };
}

// ─── Console Reporter (Development) ──────────────────────────────────────────

/**
 * Print a metrics summary to the console.
 * Useful for development debugging and monitoring.
 *
 * @param metrics - Optional MetricsCollector instance (uses singleton if not provided)
 */
export function reportMetricsToConsole(metrics?: MetricsCollector): void {
  const collector = metrics ?? MetricsCollector.getInstance();
  const snapshot = collector.getMetrics();

  console.log('\n' + '='.repeat(60));
  console.log('📊 BluePrint Performance Metrics');
  console.log('='.repeat(60));

  // General
  console.log(`\n⏱️  Uptime: ${formatUptime(snapshot.general.uptime)}`);
  console.log(`👥 Active Users: ${snapshot.general.activeUsers}`);
  console.log(
    `💾 Memory: ${formatBytes(snapshot.general.memoryUsage.heapUsed)} / ${formatBytes(snapshot.general.memoryUsage.heapTotal)}`
  );

  // Requests
  console.log(`\n📡 Requests (${snapshot.requests.total} total)`);
  console.log(`   Avg Duration: ${snapshot.requests.averageDuration}ms`);
  console.log(`   P50/P95/P99: ${snapshot.requests.p50Duration}ms / ${snapshot.requests.p95Duration}ms / ${snapshot.requests.p99Duration}ms`);
  console.log(`   Error Rate: ${snapshot.requests.errorRate}%`);

  // DB Queries
  console.log(`\n🗃️  DB Queries (${snapshot.dbQueries.total} total)`);
  console.log(`   Avg Duration: ${snapshot.dbQueries.averageDuration}ms`);
  console.log(`   Slow Queries: ${snapshot.dbQueries.slowQueries}`);

  // Cache
  console.log(`\n📦 Cache`);
  console.log(`   Hit Rate: ${snapshot.cache.hitRate}%`);
  console.log(`   Hits: ${snapshot.cache.hits} | Misses: ${snapshot.cache.misses}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Format seconds into a human-readable uptime string.
 */
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Format bytes into a human-readable string.
 */
function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// ─── Singleton Export ────────────────────────────────────────────────────────

/** Singleton MetricsCollector instance */
export const metricsCollector = new Proxy({} as MetricsCollector, {
  get(_target, prop) {
    const instance = MetricsCollector.getInstance();
    const value = (instance as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
