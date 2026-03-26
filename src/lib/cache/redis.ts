/**
 * Redis Cache Service
 * خدمة التخزين المؤقت باستخدام Redis
 */

import { createClient, RedisClientType } from 'redis';
import logger from '@/lib/logger';

// Redis client instance
let redisClient: RedisClientType | null = null;

// Connection status
let isConnected = false;

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'blueprint:';

/**
 * Initialize Redis connection
 */
export async function initRedis(): Promise<RedisClientType | null> {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          // Exponential backoff
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 5000,
      },
      database: parseInt(process.env.REDIS_DB || '0'),
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('Redis connected successfully');
    });

    redisClient.on('disconnect', () => {
      isConnected = false;
      logger.warn('Redis disconnected');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    return null;
  }
}

/**
 * Get Redis client (lazy initialization)
 */
export async function getRedis(): Promise<RedisClientType | null> {
  if (!redisClient || !isConnected) {
    return await initRedis();
  }
  return redisClient;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * Generate cache key with prefix
 */
function getKey(key: string): string {
  return `${REDIS_PREFIX}${key}`;
}

// ============================================
// Cache Operations
// ============================================

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedis();
    if (!client) return null;

    const value = await client.get(getKey(key));
    if (!value) return null;

    return JSON.parse(value) as T;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 3600 // Default 1 hour
): Promise<boolean> {
  try {
    const client = await getRedis();
    if (!client) return false;

    await client.setEx(
      getKey(key),
      ttlSeconds,
      JSON.stringify(value)
    );
    return true;
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const client = await getRedis();
    if (!client) return false;

    await client.del(getKey(key));
    return true;
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys matching pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  try {
    const client = await getRedis();
    if (!client) return 0;

    const keys = await client.keys(getKey(pattern));
    if (keys.length === 0) return 0;

    await client.del(keys);
    return keys.length;
  } catch (error) {
    logger.error(`Cache delete pattern error for ${pattern}:`, error);
    return 0;
  }
}

/**
 * Get or set cache value
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const value = await fetchFn();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

// ============================================
// Rate Limiting
// ============================================

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Rate limit check using Redis
 */
export async function rateLimit(
  identifier: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const client = await getRedis();
  
  if (!client) {
    // Fallback: Allow if Redis is not available
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }

  try {
    const current = await client.incr(getKey(key));
    
    // Set expiry on first request
    if (current === 1) {
      await client.expire(getKey(key), windowSeconds);
    }

    const ttl = await client.ttl(getKey(key));
    const resetAt = new Date(Date.now() + ttl * 1000);

    return {
      allowed: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      resetAt,
    };
  } catch (error) {
    logger.error('Rate limit error:', error);
    // Fallback: Allow on error
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }
}

/**
 * Sliding window rate limit
 */
export async function slidingWindowRateLimit(
  identifier: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:sliding:${identifier}`;
  const client = await getRedis();
  
  if (!client) {
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }

  try {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Remove old entries
    await client.zRemRangeByScore(getKey(key), 0, windowStart);
    
    // Count current entries
    const count = await client.zCard(getKey(key));
    
    if (count >= limit) {
      const ttl = await client.ttl(getKey(key));
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: new Date(Date.now() + (ttl || windowSeconds) * 1000),
      };
    }

    // Add current request
    await client.zAdd(getKey(key), { score: now, value: `${now}-${Math.random()}` });
    await client.expire(getKey(key), windowSeconds);

    return {
      allowed: true,
      limit,
      remaining: limit - count - 1,
      resetAt: new Date(now + windowSeconds * 1000),
    };
  } catch (error) {
    logger.error('Sliding window rate limit error:', error);
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }
}

// ============================================
// Session Storage
// ============================================

interface SessionData {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  createdAt: number;
  lastAccessedAt: number;
}

/**
 * Store session in Redis
 */
export async function sessionSet(
  sessionId: string,
  data: SessionData,
  ttlSeconds: number = 86400 // 24 hours
): Promise<boolean> {
  return cacheSet(`session:${sessionId}`, data, ttlSeconds);
}

/**
 * Get session from Redis
 */
export async function sessionGet(sessionId: string): Promise<SessionData | null> {
  return cacheGet<SessionData>(`session:${sessionId}`);
}

/**
 * Delete session from Redis
 */
export async function sessionDelete(sessionId: string): Promise<boolean> {
  return cacheDelete(`session:${sessionId}`);
}

/**
 * Refresh session TTL
 */
export async function sessionRefresh(
  sessionId: string,
  ttlSeconds: number = 86400
): Promise<boolean> {
  const client = await getRedis();
  if (!client) return false;

  try {
    await client.expire(getKey(`session:${sessionId}`), ttlSeconds);
    return true;
  } catch (error) {
    logger.error('Session refresh error:', error);
    return false;
  }
}

// ============================================
// Query Caching Helpers
// ============================================

/**
 * Cache database query result
 */
export async function cacheQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300 // 5 minutes
): Promise<T> {
  return cacheGetOrSet(`query:${queryKey}`, queryFn, ttlSeconds);
}

/**
 * Invalidate query cache by pattern
 */
export async function invalidateQueryCache(pattern: string = '*'): Promise<number> {
  return cacheDeletePattern(`query:${pattern}`);
}

// ============================================
// Health Check
// ============================================

/**
 * Check Redis health
 */
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  try {
    const client = await getRedis();
    if (!client) {
      return {
        status: 'unhealthy',
        error: 'Redis client not initialized',
      };
    }

    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;

    return {
      status: latency < 100 ? 'healthy' : 'degraded',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export types
export type { SessionData, RateLimitResult };
