/**
 * Redis Cache Service
 * خدمة التخزين المؤقت باستخدام Redis
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

// Default TTL: 1 hour
const DEFAULT_TTL = 3600;

// Check if Redis is available
const getRedisUrl = (): string | null => {
  return process.env.REDIS_URL || null;
};

/**
 * Simple in-memory cache fallback when Redis is not available
 */
class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();
  
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }
  
  async set(key: string, value: any, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }
  
  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Use memory cache as fallback
const memoryCache = new MemoryCache();

/**
 * Get a value from cache
 */
export async function cacheGet<T>(
  key: string,
  options?: CacheOptions
): Promise<T | null> {
  const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
  
  // Try Redis first
  const redisUrl = getRedisUrl();
  if (redisUrl) {
    try {
      // Dynamic import for Redis
      const { createClient } = await import('redis');
      const client = createClient({ url: redisUrl });
      await client.connect();
      
      const value = await client.get(fullKey);
      await client.disconnect();
      
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      // Fall back to memory cache
    }
  }
  
  // Use memory cache
  return memoryCache.get<T>(fullKey);
}

/**
 * Set a value in cache
 */
export async function cacheSet(
  key: string,
  value: any,
  options?: CacheOptions
): Promise<void> {
  const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
  const ttl = options?.ttl || DEFAULT_TTL;
  
  // Try Redis first
  const redisUrl = getRedisUrl();
  if (redisUrl) {
    try {
      const { createClient } = await import('redis');
      const client = createClient({ url: redisUrl });
      await client.connect();
      
      await client.setEx(fullKey, ttl, JSON.stringify(value));
      await client.disconnect();
      return;
    } catch (error) {
      console.error('Redis set error:', error);
      // Fall back to memory cache
    }
  }
  
  // Use memory cache
  await memoryCache.set(fullKey, value, ttl);
}

/**
 * Delete a value from cache
 */
export async function cacheDel(
  key: string,
  options?: CacheOptions
): Promise<void> {
  const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
  
  // Try Redis first
  const redisUrl = getRedisUrl();
  if (redisUrl) {
    try {
      const { createClient } = await import('redis');
      const client = createClient({ url: redisUrl });
      await client.connect();
      
      await client.del(fullKey);
      await client.disconnect();
      return;
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }
  
  // Use memory cache
  await memoryCache.del(fullKey);
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDelPattern(
  pattern: string,
  options?: CacheOptions
): Promise<void> {
  const fullPattern = options?.prefix ? `${options.prefix}:${pattern}` : pattern;
  
  // Try Redis first
  const redisUrl = getRedisUrl();
  if (redisUrl) {
    try {
      const { createClient } = await import('redis');
      const client = createClient({ url: redisUrl });
      await client.connect();
      
      const keys = await client.keys(fullPattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      await client.disconnect();
      return;
    } catch (error) {
      console.error('Redis delPattern error:', error);
    }
  }
  
  // Use memory cache
  await memoryCache.delPattern(fullPattern);
}

/**
 * Get or set cache (cache-aside pattern)
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cached = await cacheGet<T>(key, options);
  if (cached !== null) {
    return cached;
  }
  
  const value = await fetcher();
  await cacheSet(key, value, options);
  return value;
}

// Cache key prefixes for different entities
export const CachePrefixes = {
  USER: 'user',
  PROJECT: 'project',
  TASK: 'task',
  INVOICE: 'invoice',
  CLIENT: 'client',
  DASHBOARD: 'dashboard',
  SETTINGS: 'settings',
} as const;
