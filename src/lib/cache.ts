/**
 * Redis Cache Service for BluePrint SaaS
 * Used for rate limiting, session storage, and API caching
 */

import { log } from '@/lib/logger';

// Types
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

// In-memory fallback when Redis is not available
class MemoryCache {
  private store = new Map<string, { value: unknown; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;
  private readonly maxSize: number;

  constructor(maxSize: number = 100_000) {
    this.maxSize = maxSize;
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
    // Don't prevent the process from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    this.evictIfNeeded();
    this.store.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async increment(key: string, ttl: number): Promise<number> {
    // Atomic read-and-increment in a single synchronous operation
    // to avoid the race condition where two concurrent calls read
    // the same value before either writes.
    const now = Date.now();
    const entry = this.store.get(key);
    const current = (entry && entry.expires >= now) ? (entry.value as number) : 0;
    const newValue = current + 1;

    this.evictIfNeeded();
    this.store.set(key, {
      value: newValue,
      expires: now + ttl * 1000,
    });
    return newValue;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -1;
    return Math.max(0, Math.floor((entry.expires - Date.now()) / 1000));
  }

  async clearPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Remove all expired entries. */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expires < now) {
        this.store.delete(key);
      }
    }
  }

  /** Evict oldest entries when the store exceeds maxSize. */
  private evictIfNeeded(): void {
    if (this.store.size < this.maxSize) return;
    // Delete the first (oldest-inserted) entries to make room
    let evicted = 0;
    const toEvict = Math.max(1, Math.floor(this.maxSize * 0.1)); // evict 10%
    for (const [key, _entry] of this.store.entries()) {
      if (evicted >= toEvict) break;
      this.store.delete(key);
      evicted++;
    }
  }

  /** Stop the periodic cleanup interval (call on shutdown). */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Redis client (lazy loaded)
let redisClient: any = null;
let memoryCache: MemoryCache | null = null;

/**
 * Get or create cache instance
 * Falls back to memory cache if Redis is not available
 */
async function getCache(): Promise<MemoryCache | any> {
  // Return existing client
  if (redisClient) return redisClient;
  if (memoryCache) return memoryCache;

  // Try to connect to Redis
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl && process.env.NODE_ENV === 'production') {
    try {
      // Dynamic import for Redis (only in production)
      const { createClient } = await import('redis');
      
      redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              log.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      redisClient.on('error', (err: Error) => {
        log.error('Redis Client Error', err);
      });

      await redisClient.connect();
      log.info('Redis connected successfully');
      return redisClient;
    } catch (error) {
      log.warn('Redis connection failed, falling back to memory cache', error);
      redisClient = null;
    }
  }

  // Fall back to memory cache
  log.info('Using in-memory cache (development mode or Redis unavailable)');
  memoryCache = new MemoryCache();
  return memoryCache;
}

/**
 * Cache Service
 */
export const CacheService = {
  /**
   * Get a value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const cache = await getCache();
      const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
      
      if (cache instanceof MemoryCache) {
        return cache.get<T>(fullKey);
      }
      
      const value = await cache.get(fullKey);
      if (!value) return null;
      
      return JSON.parse(value);
    } catch (error) {
      log.error('Cache get error', error);
      return null;
    }
  },

  /**
   * Set a value in cache
   */
  async set(key: string, value: unknown, options?: CacheOptions): Promise<void> {
    try {
      const cache = await getCache();
      const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const ttl = options?.ttl || 3600; // Default 1 hour
      
      if (cache instanceof MemoryCache) {
        return cache.set(fullKey, value, ttl);
      }
      
      await cache.setEx(fullKey, ttl, JSON.stringify(value));
    } catch (error) {
      log.error('Cache set error', error);
    }
  },

  /**
   * Delete a value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    try {
      const cache = await getCache();
      const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
      
      if (cache instanceof MemoryCache) {
        return cache.delete(fullKey);
      }
      
      await cache.del(fullKey);
    } catch (error) {
      log.error('Cache delete error', error);
    }
  },

  /**
   * Check rate limit
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    try {
      const cache = await getCache();
      const fullKey = `ratelimit:${key}`;
      const now = Date.now();
      const resetTime = now + windowSeconds * 1000;
      
      if (cache instanceof MemoryCache) {
        const current = await cache.increment(fullKey, windowSeconds);
        const ttl = await cache.ttl(fullKey);
        
        return {
          allowed: current <= limit,
          remaining: Math.max(0, limit - current),
          resetTime: ttl > 0 ? now + ttl * 1000 : resetTime,
          total: current,
        };
      }
      
      // Redis implementation
      const multi = cache.multi();
      multi.incr(fullKey);
      multi.ttl(fullKey);
      
      const results = await multi.exec();
      const current = results[0] as number;
      let ttl = results[1] as number;
      
      // Set TTL if this is a new key
      if (ttl === -1) {
        await cache.expire(fullKey, windowSeconds);
        ttl = windowSeconds;
      }
      
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime: now + ttl * 1000,
        total: current,
      };
    } catch (error) {
      log.error('Rate limit check error', error);
      // Allow on error (fail open)
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + windowSeconds * 1000,
        total: 0,
      };
    }
  },

  /**
   * Get or set cache with factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get(key, options) as T | null;
    if (cached !== null) {
      return cached;
    }
    
    const value = await factory();
    await this.set(key, value, options);
    return value;
  },

  /**
   * Clear all cache with prefix
   */
  async clearPrefix(prefix: string): Promise<void> {
    try {
      const cache = await getCache();
      
      if (cache instanceof MemoryCache) {
        await cache.clearPrefix(`${prefix}:`);
        return;
      }
      
      // Redis: scan and delete
      let cursor = 0;
      do {
        const result = await cache.scan(cursor, {
          MATCH: `${prefix}:*`,
          COUNT: 100,
        });
        cursor = result.cursor;
        
        if (result.keys.length > 0) {
          await cache.del(result.keys);
        }
      } while (cursor !== 0);
    } catch (error) {
      log.error('Clear prefix error', error);
    }
  },
};

export default CacheService;
