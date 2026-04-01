/**
 * @module query-optimizer
 * @description Database query optimization utilities for the BluePrint SaaS platform.
 * Provides helpers for preventing N+1 queries, batch loading, optimized pagination,
 * TanStack Query integration with Redis backing, and slow query tracking/logging.
 *
 * @example
 * ```typescript
 * import { createPaginatedQuery, QueryOptimizer } from '@/lib/performance/query-optimizer';
 * import { db } from '@/lib/db';
 *
 * // Paginated project query
 * const { data, pagination } = await createPaginatedQuery(db.project, {
 *   page: 1,
 *   pageSize: 20,
 *   where: { status: 'active' },
 *   orderBy: { createdAt: 'desc' },
 *   include: { client: true },
 * });
 *
 * // Track slow queries
 * const optimizer = new QueryOptimizer();
 * await optimizer.trackQuery('project', 'findMany', () =>
 *   db.project.findMany({ where: { status: 'active' } })
 * );
 * ```
 */

import type { Prisma } from '@prisma/client';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Pagination parameters */
export interface PaginationParams {
  /** Page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
}

/** Pagination result metadata */
export interface PaginationResult {
  /** Current page number */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
}

/** Result of a paginated query */
export interface PaginatedResult<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationResult;
}

/** Options for creating a paginated query */
export interface PaginatedQueryOptions {
  /** Pagination parameters */
  pagination: PaginationParams;
  /** Prisma where clause */
  where?: Record<string, unknown>;
  /** Prisma orderBy clause */
  orderBy?: Record<string, unknown>;
  /** Prisma include clause (for eager loading relations) */
  include?: Record<string, unknown>;
  /** Prisma select clause (for picking specific fields) */
  select?: Record<string, unknown>;
  /** Search filter configuration */
  search?: {
    /** Field to search in */
    field: string;
    /** Search query string */
    query: string;
  };
}

/** Options for the optimizeQuery function */
export interface QueryOptimizationOptions {
  /** Maximum depth of relations to include (default: 2) */
  maxDepth?: number;
  /** Specific relations to always include */
  eagerLoad?: string[];
  /** Specific relations to never include */
  excludeRelations?: string[];
  /** Whether to log the query plan (default: false) */
  debug?: boolean;
}

/** Slow query log entry */
export interface SlowQueryLog {
  /** Prisma model name */
  model: string;
  /** Operation performed (findMany, findUnique, etc.) */
  operation: string;
  /** Query duration in milliseconds */
  duration: number;
  /** Timestamp of the query */
  timestamp: Date;
  /** Optional query details */
  details?: Record<string, unknown>;
}

/** Options for the batch loader */
export interface BatchLoaderOptions<K, V> {
  /** Maximum batch size (default: 100) */
  maxBatchSize?: number;
  /** Maximum time to wait before flushing batch in ms (default: 10) */
  maxWait?: number;
  /** Cache results for repeated lookups (default: true) */
  cache?: boolean;
  /** Custom cache key function */
  cacheKeyFn?: (key: K) => string;
}

/** Options for withOptimisticCache */
export interface OptimisticCacheOptions<T> {
  /** Cache key for the query result */
  cacheKey: string;
  /** Cache TTL in seconds (default: 300) */
  cacheTtl?: number;
  /** Tags for cache invalidation */
  cacheTags?: string[];
  /** The query function to execute on cache miss */
  queryFn: () => Promise<T>;
  /** Whether to use stale-while-revalidate pattern (default: true) */
  staleWhileRevalidate?: boolean;
}

// ─── Query Optimization Helpers ──────────────────────────────────────────────

/**
 * Optimize a Prisma query by analyzing and adjusting select/include patterns
 * to prevent N+1 queries and over-fetching.
 *
 * @param originalQuery - The original query parameters object
 * @param options - Optimization options
 * @returns Optimized query parameters
 *
 * @example
 * ```typescript
 * const optimized = optimizeQuery(
 *   { where: { status: 'active' } },
 *   { eagerLoad: ['client', 'tasks'], maxDepth: 1 }
 * );
 * ```
 */
export function optimizeQuery(
  originalQuery: Record<string, unknown>,
  options: QueryOptimizationOptions = {}
): Record<string, unknown> {
  const {
    maxDepth = 2,
    eagerLoad = [],
    excludeRelations = [],
    debug = false,
  } = options;

  const optimized = { ...originalQuery };

  // Build an optimized include clause if eagerLoad is specified
  if (eagerLoad.length > 0 && !optimized.include) {
    const include: Record<string, unknown> = {};
    for (const relation of eagerLoad) {
      if (!excludeRelations.includes(relation)) {
        include[relation] = maxDepth > 1 ? { select: { id: true } } : true;
      }
    }
    optimized.include = include;
  }

  if (debug) {
    console.log('[QueryOptimizer] Optimized query:', JSON.stringify(optimized, null, 2));
  }

  return optimized;
}

// ─── Paginated Query ─────────────────────────────────────────────────────────

/**
 * Create an optimized paginated query with count.
 * Automatically calculates pagination metadata and handles edge cases.
 *
 * @param model - A Prisma model delegate (e.g., db.project)
 * @param params - Query and pagination options
 * @returns Paginated result with data and metadata
 *
 * @example
 * ```typescript
 * const result = await createPaginatedQuery(db.project, {
 *   pagination: { page: 2, pageSize: 20 },
 *   where: { status: 'active' },
 *   orderBy: { createdAt: 'desc' },
 *   include: { client: { select: { id: true, name: true } } },
 * });
 *
 * console.log(result.data);       // Array of projects
 * console.log(result.pagination); // { page: 2, totalPages: 5, ... }
 * ```
 */
export async function createPaginatedQuery<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  params: PaginatedQueryOptions
): Promise<PaginatedResult<T>> {
  const { pagination, where, orderBy, include, select, search } = params;
  const { page, pageSize } = pagination;

  // Build the where clause
  const whereClause: Record<string, unknown> = { ...where };

  // Add search filter if provided
  if (search?.query) {
    whereClause[search.field] = {
      contains: search.query,
      mode: 'insensitive',
    };
  }

  // Build query arguments
  const queryArgs: Record<string, unknown> = {
    where: whereClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };

  if (orderBy) queryArgs.orderBy = orderBy;
  if (include) queryArgs.include = include;
  if (select) queryArgs.select = select;

  // Execute count and data queries in parallel
  const [data, total] = await Promise.all([
    model.findMany(queryArgs) as Promise<T[]>,
    model.count({ where: whereClause }) as Promise<number>,
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ─── Batch Loader ────────────────────────────────────────────────────────────

/**
 * DataLoader-style batch loading utility to prevent N+1 queries.
 * Collects individual load requests and batches them into a single query.
 *
 * @typeParam K - The key type (e.g., string for IDs)
 * @typeParam V - The value type (e.g., Project)
 * @param loaderFn - A function that receives an array of keys and returns a map of key -> value
 * @param options - Batch loading options
 * @returns A function that loads a single item by key
 *
 * @example
 * ```typescript
 * const loadClient = batchLoader<string, Client>(
 *   async (ids) => {
 *     const clients = await db.client.findMany({
 *       where: { id: { in: ids } },
 *     });
 *     return new Map(clients.map(c => [c.id, c]));
 *   },
 *   { maxBatchSize: 100, cache: true }
 * );
 *
 * // These will be batched into a single query
 * const client1 = await loadClient('client-1');
 * const client2 = await loadClient('client-2');
 * ```
 */
export function batchLoader<K, V>(
  loaderFn: (keys: K[]) => Promise<Map<K, V>>,
  options: BatchLoaderOptions<K, V> = {}
): (key: K) => Promise<V | undefined> {
  const {
    maxBatchSize = 100,
    maxWait = 10,
    cache: enableCache = true,
  } = options;

  // Pending batch
  let batchKeys: K[] = [];
  let batchResolvers: Array<{
    key: K;
    resolve: (value: V | undefined) => void;
    reject: (error: Error) => void;
  }> = [];
  let batchTimer: ReturnType<typeof setTimeout> | null = null;

  // Result cache
  const resultCache = new Map<string, V>();

  /**
   * Flush the current batch by calling the loader function.
   */
  async function flushBatch(): Promise<void> {
    if (batchKeys.length === 0) return;

    const keys = batchKeys.slice();
    const resolvers = batchResolvers.slice();
    batchKeys = [];
    batchResolvers = [];
    batchTimer = null;

    try {
      // Process in sub-batches if needed
      const subBatches: K[][] = [];
      for (let i = 0; i < keys.length; i += maxBatchSize) {
        subBatches.push(keys.slice(i, i + maxBatchSize));
      }

      // Load all sub-batches in parallel
      const subResults = await Promise.all(
        subBatches.map((subKeys) => loaderFn(subKeys))
      );

      // Merge results
      const mergedResults = new Map<K, V>();
      for (const result of subResults) {
        for (const [key, value] of result) {
          mergedResults.set(key, value);
          if (enableCache) {
            resultCache.set(String(key), value);
          }
        }
      }

      // Resolve all pending promises
      for (const resolver of resolvers) {
        resolver.resolve(mergedResults.get(resolver.key));
      }
    } catch (error) {
      // Reject all pending promises on error
      for (const resolver of resolvers) {
        resolver.reject(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Load a single item by key.
   * Items are batched and loaded together for efficiency.
   */
  return async function loadSingle(key: K): Promise<V | undefined> {
    // Check cache first
    if (enableCache) {
      const cacheKey = String(key);
      if (resultCache.has(cacheKey)) {
        return resultCache.get(cacheKey);
      }
    }

    return new Promise<V | undefined>((resolve, reject) => {
      batchKeys.push(key);
      batchResolvers.push({ key, resolve, reject });

      // Set a timer to flush the batch
      if (!batchTimer) {
        batchTimer = setTimeout(flushBatch, maxWait);
      }
    });
  };
}

// ─── TanStack Query Integration ──────────────────────────────────────────────

/**
 * Create a TanStack Query-compatible query function with Redis backing.
 * Implements a stale-while-revalidate pattern for optimal performance.
 *
 * @param options - Cache and query options
 * @returns An object with queryFn and cache invalidation helper
 *
 * @example
 * ```typescript
 * // In a TanStack Query setup
 * const { queryFn, invalidate } = withOptimisticCache({
 *   cacheKey: 'projects:list',
 *   queryFn: () => db.project.findMany({ where: { status: 'active' } }),
 *   cacheTtl: 300,
 *   cacheTags: ['projects'],
 * });
 *
 * // Use in useQuery
 * useQuery({
 *   queryKey: ['projects', 'active'],
 *   queryFn,
 * });
 *
 * // Invalidate when data changes
 * await invalidate();
 * ```
 */
export function withOptimisticCache<T>(
  options: OptimisticCacheOptions<T>
): {
  queryFn: () => Promise<T>;
  invalidate: () => Promise<void>;
} {
  let cacheManager: InstanceType<typeof import('./cache/cache-manager').CacheManager> | null = null;

  async function getCache(): Promise<InstanceType<typeof import('./cache/cache-manager').CacheManager> | null> {
    if (!cacheManager) {
      try {
        const module = await import('../cache/cache-manager');
        cacheManager = module.cacheManager as unknown as InstanceType<typeof module.CacheManager>;
      } catch {
        return null;
      }
    }
    return cacheManager;
  }

  return {
    async queryFn(): Promise<T> {
      const cache = await getCache();

      // Try to get from cache first
      if (cache) {
        try {
          const cached = await cache.get<T>(options.cacheKey);
          if (cached !== null) {
            // Revalidate in background if staleWhileRevalidate is enabled
            if (options.staleWhileRevalidate !== false) {
              options.queryFn().then((freshData) => {
                cache.set(options.cacheKey, freshData, {
                  ttl: options.cacheTtl,
                  tags: options.cacheTags,
                });
              }).catch(() => {
                // Silently fail background revalidation
              });
            }
            return cached;
          }
        } catch {
          // Continue with direct query if cache fails
        }
      }

      // Execute the actual query
      const data = await options.queryFn();

      // Store in cache
      if (cache) {
        try {
          await cache.set(options.cacheKey, data, {
            ttl: options.cacheTtl ?? 300,
            tags: options.cacheTags,
          });
        } catch {
          // Silently fail cache writes
        }
      }

      return data;
    },

    async invalidate(): Promise<void> {
      const cache = await getCache();
      if (cache && options.cacheTags) {
        try {
          await cache.invalidateByTags(options.cacheTags);
        } catch {
          // Silently fail
        }
      }
      // Also delete the specific key
      if (cache) {
        try {
          await cache.delete(options.cacheKey);
        } catch {
          // Silently fail
        }
      }
    },
  };
}

// ─── Smart Query Factory ─────────────────────────────────────────────────────

/**
 * Factory for creating cached + paginated TanStack Query configurations.
 * Combines Redis caching with optimized pagination.
 *
 * @typeParam T - The data type for each item
 * @typeParam TModel - The Prisma model type
 * @param config - Configuration for the smart query
 * @returns TanStack Query compatible options
 *
 * @example
 * ```typescript
 * const projectsQuery = createSmartQuery({
 *   queryKey: ['projects'],
 *   model: db.project,
 *   cacheKey: 'projects:list',
 *   pagination: { page: 1, pageSize: 20 },
 *   where: { status: 'active' },
 *   orderBy: { createdAt: 'desc' },
 *   include: { client: true },
 *   staleTime: 5 * 60 * 1000, // 5 minutes
 * });
 *
 * // Use in component
 * const { data, isLoading } = useQuery(projectsQuery);
 * ```
 */
export function createSmartQuery<T, TModel = unknown>(config: {
  /** TanStack Query key */
  queryKey: string[];
  /** Prisma model delegate */
  model: Record<string, unknown>;
  /** Redis cache key */
  cacheKey: string;
  /** Pagination parameters */
  pagination: PaginationParams;
  /** Prisma where clause */
  where?: Record<string, unknown>;
  /** Prisma orderBy */
  orderBy?: Record<string, unknown>;
  /** Prisma include */
  include?: Record<string, unknown>;
  /** Prisma select */
  select?: Record<string, unknown>;
  /** Search configuration */
  search?: { field: string; query: string };
  /** Cache TTL in seconds */
  cacheTtl?: number;
  /** Cache tags */
  cacheTags?: string[];
  /** TanStack Query staleTime in ms */
  staleTime?: number;
}) {
  const { queryFn, invalidate } = withOptimisticCache<PaginatedResult<T>>({
    cacheKey: `${config.cacheKey}:${config.pagination.page}:${config.pagination.pageSize}`,
    queryFn: () =>
      createPaginatedQuery<T>(
        config.model as { findMany: Function; count: Function },
        {
          pagination: config.pagination,
          where: config.where,
          orderBy: config.orderBy,
          include: config.include,
          select: config.select,
          search: config.search,
        }
      ),
    cacheTtl: config.cacheTtl,
    cacheTags: config.cacheTags,
  });

  return {
    queryKey: [...queryKeyWithPagination(config.queryKey, config.pagination)],
    queryFn,
    staleTime: config.staleTime ?? 5 * 60 * 1000,
    invalidate,
  };
}

/**
 * Build a query key array including pagination params.
 */
function queryKeyWithPagination(
  baseKey: string[],
  pagination: PaginationParams
): string[] {
  return [...baseKey, pagination.page, pagination.pageSize];
}

// ─── Query Optimizer (Performance Tracker) ───────────────────────────────────

/**
 * Tracks and logs slow database queries.
 * Useful for identifying performance bottlenecks in development and production.
 *
 * @example
 * ```typescript
 * const optimizer = new QueryOptimizer({ slowThreshold: 500 });
 *
 * // Track a query
 * const result = await optimizer.trackQuery('project', 'findMany', async () => {
 *   return db.project.findMany({ where: { status: 'active' } });
 * });
 *
 * // Get slow query log
 * const slowQueries = optimizer.getSlowQueries();
 * ```
 */
export class QueryOptimizer {
  /** Threshold in ms for considering a query "slow" (default: 500) */
  private slowThreshold: number;
  /** Maximum number of slow query logs to keep */
  private maxLogs: number;
  /** Log of slow queries */
  private slowQueryLog: SlowQueryLog[] = [];
  /** Whether to log to console in development */
  private verbose: boolean;

  constructor(options: {
    slowThreshold?: number;
    maxLogs?: number;
    verbose?: boolean;
  } = {}) {
    this.slowThreshold = options.slowThreshold ?? 500;
    this.maxLogs = options.maxLogs ?? 100;
    this.verbose = options.verbose ?? process.env.NODE_ENV === 'development';
  }

  /**
   * Track the execution time of a database query.
   * Automatically logs slow queries.
   *
   * @param model - The Prisma model name (e.g., 'project')
   * @param operation - The operation performed (e.g., 'findMany')
   * @param queryFn - The query function to execute
   * @returns The query result
   */
  async trackQuery<T>(
    model: string,
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;

      this.logIfSlow(model, operation, duration);

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logIfSlow(model, operation, duration, { error: String(error) });
      throw error;
    }
  }

  /**
   * Analyze a Prisma query and estimate its complexity.
   * Returns a simple cost estimate (1-10) for the query.
   *
   * @param query - The query object to analyze
   * @returns Object with cost estimate and recommendations
   */
  analyzeQuery(query: Record<string, unknown>): {
    cost: number;
    recommendations: string[];
  } {
    let cost = 1;
    const recommendations: string[] = [];

    // Check for potentially expensive operations
    if (query.where) {
      cost += 1;
      const where = query.where as Record<string, unknown>;
      // Using OR or NOT can be expensive
      if ('OR' in where || 'NOT' in where) {
        cost += 2;
        recommendations.push('Consider adding indexes for OR/NOT conditions');
      }
    }

    if (query.include) {
      const include = query.include as Record<string, unknown>;
      const relationCount = Object.keys(include).length;
      cost += relationCount;
      if (relationCount > 3) {
        recommendations.push(
          'Consider reducing included relations or using select for nested data'
        );
      }
    }

    if (query.orderBy) {
      cost += 1;
      recommendations.push('Ensure orderBy fields are indexed');
    }

    // Check for pagination
    if (query.skip !== undefined || query.take !== undefined) {
      const take = query.take as number | undefined;
      if (take && take > 100) {
        cost += 2;
        recommendations.push('Consider using cursor-based pagination for large datasets');
      }
    }

    if (this.verbose) {
      console.log(
        `[QueryAnalyzer] Query cost: ${cost}/10`,
        recommendations.length > 0 ? `\nRecommendations: ${recommendations.join('\n  ')}` : ''
      );
    }

    return {
      cost: Math.min(cost, 10),
      recommendations,
    };
  }

  /**
   * Log a query if it exceeds the slow threshold.
   */
  private logIfSlow(
    model: string,
    operation: string,
    duration: number,
    details?: Record<string, unknown>
  ): void {
    if (duration > this.slowThreshold) {
      const entry: SlowQueryLog = {
        model,
        operation,
        duration: Math.round(duration * 100) / 100,
        timestamp: new Date(),
        details,
      };

      this.slowQueryLog.push(entry);

      // Trim to max logs
      if (this.slowQueryLog.length > this.maxLogs) {
        this.slowQueryLog = this.slowQueryLog.slice(-this.maxLogs);
      }

      // Log warning
      console.warn(
        `[QueryOptimizer] Slow query detected: ${model}.${operation} took ${duration.toFixed(2)}ms ` +
        `(threshold: ${this.slowThreshold}ms)`,
        details ? JSON.stringify(details) : ''
      );
    }
  }

  /**
   * Get all recorded slow queries.
   */
  getSlowQueries(): SlowQueryLog[] {
    return [...this.slowQueryLog];
  }

  /**
   * Get a summary of slow query statistics.
   */
  getSummary(): {
    totalSlow: number;
    slowestQuery: SlowQueryLog | null;
    averageDuration: number;
    byModel: Record<string, { count: number; avgDuration: number }>;
  } {
    const totalSlow = this.slowQueryLog.length;

    if (totalSlow === 0) {
      return {
        totalSlow: 0,
        slowestQuery: null,
        averageDuration: 0,
        byModel: {},
      };
    }

    const byModel: Record<string, { count: number; totalDuration: number }> = {};
    let slowestQuery: SlowQueryLog | null = null;

    for (const entry of this.slowQueryLog) {
      if (!slowestQuery || entry.duration > slowestQuery.duration) {
        slowestQuery = entry;
      }

      if (!byModel[entry.model]) {
        byModel[entry.model] = { count: 0, totalDuration: 0 };
      }
      byModel[entry.model].count++;
      byModel[entry.model].totalDuration += entry.duration;
    }

    const byModelResult: Record<string, { count: number; avgDuration: number }> = {};
    for (const [model, stats] of Object.entries(byModel)) {
      byModelResult[model] = {
        count: stats.count,
        avgDuration: Math.round((stats.totalDuration / stats.count) * 100) / 100,
      };
    }

    return {
      totalSlow,
      slowestQuery,
      averageDuration:
        Math.round(
          (this.slowQueryLog.reduce((sum, q) => sum + q.duration, 0) / totalSlow) * 100
        ) / 100,
      byModel: byModelResult,
    };
  }

  /**
   * Clear all slow query logs.
   */
  clearLogs(): void {
    this.slowQueryLog = [];
  }
}
