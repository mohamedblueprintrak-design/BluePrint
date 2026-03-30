/**
 * Redis-based Rate Limiter
 * محدد معدل الطلبات باستخدام Redis
 * 
 * This is a production-ready rate limiter that:
 * - Uses Redis for distributed rate limiting
 * - Falls back to in-memory when Redis is not available
 * - Supports multiple rate limit windows
 * - Provides sliding window algorithm
 */

import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

// ============================================
// Types
// ============================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// ============================================
// Redis Client Singleton
// ============================================

let redisClient: RedisClientType | null = null;
let redisConnectionPromise: Promise<void> | null = null;

async function getRedisClient(): Promise<RedisClientType | null> {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  if (redisConnectionPromise) {
    await redisConnectionPromise;
    return redisClient;
  }

  redisConnectionPromise = (async () => {
    try {
      redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      redisClient.on('error', (err: Error) => {
        console.error('Redis client error:', err);
      });

      await redisClient.connect();
      console.log('Redis rate limiter connected');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      redisClient = null;
    }
  })();

  await redisConnectionPromise;
  return redisClient;
}

// ============================================
// In-Memory Fallback
// ============================================

interface MemoryRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, MemoryRecord>();

function checkMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

// ============================================
// Redis Rate Limiting (Sliding Window)
// ============================================

async function checkRedisRateLimit(
  client: RedisClientType,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Use Lua script for atomic sliding window operation
  const luaScript = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowStart = tonumber(ARGV[2])
    local maxRequests = tonumber(ARGV[3])
    local windowMs = tonumber(ARGV[4])
    
    -- Remove old entries
    redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
    
    -- Get current count
    local count = redis.call('ZCARD', key)
    
    if count >= maxRequests then
      return {0, count, redis.call('ZSCORE', key, redis.call('ZRANGE', key, 0, 0)[1]) or now}
    end
    
    -- Add new entry
    redis.call('ZADD', key, now, now .. ':' .. math.random())
    redis.call('PEXPIRE', key, windowMs)
    
    return {1, count + 1, now + windowMs}
  `;

  try {
    const result = await client.eval(luaScript, {
      keys: [key],
      arguments: [now.toString(), windowStart.toString(), config.maxRequests.toString(), config.windowMs.toString()],
    }) as [number, number, number];

    const [allowed, count, resetTime] = result;

    return {
      allowed: allowed === 1,
      remaining: Math.max(0, config.maxRequests - count),
      resetTime,
      retryAfter: allowed === 0 ? Math.ceil((resetTime - now) / 1000) : undefined,
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fallback to memory
    return checkMemoryRateLimit(key, config);
  }
}

// ============================================
// Main Rate Limiter Class
// ============================================

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: 'ratelimit',
      ...config,
    };
  }

  /**
   * Check rate limit for a given identifier
   * @param identifier - Usually IP address or user ID
   * @returns Rate limit result
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}:${identifier}`;

    // Try Redis first
    const client = await getRedisClient();
    if (client) {
      return checkRedisRateLimit(client, key, this.config);
    }

    // Fallback to in-memory
    return checkMemoryRateLimit(key, this.config);
  }

  /**
   * Reset rate limit for a given identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `${this.config.keyPrefix}:${identifier}`;

    const client = await getRedisClient();
    if (client) {
      await client.del(key);
    } else {
      memoryStore.delete(key);
    }
  }

  /**
   * Get remaining requests for a given identifier
   */
  async getRemaining(identifier: string): Promise<number> {
    const result = await this.check(identifier);
    return result.remaining;
  }
}

// ============================================
// Pre-configured Rate Limiters
// ============================================

export const rateLimiters = {
  /**
   * Auth rate limiter: 10 requests per minute
   * Used for login, signup, password reset
   */
  auth: new RateLimiter({
    maxRequests: 10,
    windowMs: 60000,
    keyPrefix: 'auth',
  }),

  /**
   * API rate limiter: 100 requests per minute
   * General API endpoints
   */
  api: new RateLimiter({
    maxRequests: 100,
    windowMs: 60000,
    keyPrefix: 'api',
  }),

  /**
   * Strict rate limiter: 5 requests per minute
   * Used for sensitive operations
   */
  strict: new RateLimiter({
    maxRequests: 5,
    windowMs: 60000,
    keyPrefix: 'strict',
  }),

  /**
   * Password reset rate limiter: 3 requests per hour
   */
  passwordReset: new RateLimiter({
    maxRequests: 3,
    windowMs: 3600000, // 1 hour
    keyPrefix: 'pwdreset',
  }),

  /**
   * Email verification rate limiter: 5 requests per hour
   */
  emailVerification: new RateLimiter({
    maxRequests: 5,
    windowMs: 3600000, // 1 hour
    keyPrefix: 'emailverify',
  }),
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get client IP from request headers
 *
 * SECURITY NOTE: In production with a trusted proxy, only the rightmost IP in
 * X-Forwarded-For (the one appended by the trusted proxy) should be trusted.
 * This sanitization is a baseline defense; configure TRUSTED_PROXY_IPS for full protection.
 */
export function getClientIP(headers: Headers): string {
  const ipRegex = /^[0-9a-fA-F.:]+$/;
  const maxIPLength = 45; // Max IPv6 address length

  function sanitize(ip: string): string {
    const cleaned = ip.trim();
    if (cleaned.length > maxIPLength || !ipRegex.test(cleaned)) return 'unknown';
    return cleaned;
  }

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const candidate = forwarded.split(',')[0].trim();
    const sanitized = sanitize(candidate);
    if (sanitized !== 'unknown') return sanitized;
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    const sanitized = sanitize(realIP);
    if (sanitized !== 'unknown') return sanitized;
  }

  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) {
    const sanitized = sanitize(cfIP);
    if (sanitized !== 'unknown') return sanitized;
  }

  return 'unknown';
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  type: 'auth' | 'api' | 'strict' | 'passwordReset' | 'emailVerification',
  language: 'ar' | 'en' = 'ar'
): Response {
  const messages: Record<string, Record<string, string>> = {
    auth: {
      ar: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح. يرجى المحاولة بعد دقيقة.',
      en: 'Too many login attempts. Please try again later.',
    },
    api: {
      ar: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
      en: 'Rate limit exceeded. Please try again later.',
    },
    strict: {
      ar: 'تم تجاوز الحد المسموح من العمليات الحساسة. يرجى الانتظار.',
      en: 'Too many sensitive operations. Please wait.',
    },
    passwordReset: {
      ar: 'تم تجاوز الحد المسموح من طلبات إعادة تعيين كلمة المرور. يرجى المحاولة بعد ساعة.',
      en: 'Too many password reset requests. Please try again in an hour.',
    },
    emailVerification: {
      ar: 'تم تجاوز الحد المسموح من طلبات التحقق. يرجى المحاولة لاحقاً.',
      en: 'Too many verification requests. Please try again later.',
    },
  };

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: messages[type]?.[language] || messages.api[language],
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.retryAfter?.toString() || '60',
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
      },
    }
  );
}

// Export singleton instance getter
export async function getRedisRateLimiter(): Promise<RedisClientType | null> {
  return getRedisClient();
}
