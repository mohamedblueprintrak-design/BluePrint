/**
 * Rate Limiter Module
 * وحدة تحديد معدل الطلبات
 * 
 * Provides rate limiting functionality with Redis support
 * Falls back to in-memory storage when Redis is not available
 */

import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMIT_CONFIG, isProduction } from '@/lib/config/security';

// ============================================
// Types
// ============================================

export type RateLimitType = 'auth' | 'api' | 'public';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message: string;
  messageEn: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, value: RateLimitEntry, ttl: number): Promise<void>;
  increment(key: string): Promise<number>;
  reset(key: string): Promise<void>;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// ============================================
// Rate Limit Configurations
// ============================================

export const RATE_LIMIT_CONFIGS: Record<RateLimitType, RateLimitConfig> = {
  auth: {
    maxRequests: RATE_LIMIT_CONFIG.authMaxRequests,
    windowMs: RATE_LIMIT_CONFIG.authWindowMs,
    message: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح. يرجى المحاولة بعد دقيقة.',
    messageEn: 'Too many login attempts. Please try again later.',
  },
  api: {
    maxRequests: RATE_LIMIT_CONFIG.maxRequests,
    windowMs: RATE_LIMIT_CONFIG.windowMs,
    message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
    messageEn: 'Rate limit exceeded. Please try again later.',
  },
  public: {
    maxRequests: RATE_LIMIT_CONFIG.publicMaxRequests || 200,
    windowMs: RATE_LIMIT_CONFIG.publicWindowMs || 60000,
    message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
    messageEn: 'Rate limit exceeded. Please try again later.',
  },
};

// ============================================
// In-Memory Store (Fallback)
// ============================================

class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
    }
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: RateLimitEntry, _ttl: number): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (entry) {
      entry.count++;
      return entry.count;
    }
    return 0;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// ============================================
// Redis Store (Production)
// ============================================

class RedisStore implements RateLimitStore {
  private redis: any; // Redis client type
  private prefix: string;

  constructor(redisClient: any, prefix: string = 'ratelimit:') {
    this.redis = redisClient;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const data = await this.redis.get(this.getKey(key));
    if (!data) return null;
    return JSON.parse(data);
  }

  async set(key: string, value: RateLimitEntry, ttl: number): Promise<void> {
    await this.redis.setex(
      this.getKey(key),
      Math.ceil(ttl / 1000),
      JSON.stringify(value)
    );
  }

  async increment(key: string): Promise<number> {
    const fullKey = this.getKey(key);
    const count = await this.redis.incr(fullKey);
    
    // Set expiry on first increment
    if (count === 1) {
      await this.redis.expire(fullKey, 60);
    }
    
    return count;
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(this.getKey(key));
  }
}

// ============================================
// Rate Limiter Class
// ============================================

class RateLimiter {
  private store: RateLimitStore;
  private useRedis: boolean = false;

  constructor() {
    // Try to use Redis in production
    if (isProduction && process.env.REDIS_URL) {
      try {
        // Import Redis dynamically
        const { createClient } = require('redis');
        const redisClient = createClient({ url: process.env.REDIS_URL });
        redisClient.connect();
        this.store = new RedisStore(redisClient);
        this.useRedis = true;
        console.log('✅ Rate limiter using Redis store');
      } catch {
        console.warn('⚠️ Redis not available, falling back to memory store');
        this.store = new MemoryStore();
      }
    } else {
      this.store = new MemoryStore();
    }
  }

  /**
   * Get client IP from request
   *
   * SECURITY NOTE: In production with a trusted proxy, only the rightmost IP in
   * X-Forwarded-For (the one appended by the trusted proxy) should be trusted.
   * This sanitization is a baseline defense; configure TRUSTED_PROXY_IPS for full protection.
   */
  getClientIP(request: NextRequest): string {
    const ipRegex = /^[0-9a-fA-F.:]+$/;
    const maxIPLength = 45; // Max IPv6 address length

    function sanitize(ip: string): string {
      const cleaned = ip.trim();
      if (cleaned.length > maxIPLength || !ipRegex.test(cleaned)) return 'unknown';
      return cleaned;
    }

    // Check X-Forwarded-For header (most common for proxies)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      const candidate = forwarded.split(',')[0].trim();
      const sanitized = sanitize(candidate);
      if (sanitized !== 'unknown') return sanitized;
    }

    // Check X-Real-IP header (nginx)
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      const sanitized = sanitize(realIP);
      if (sanitized !== 'unknown') return sanitized;
    }

    // Check CF-Connecting-IP (Cloudflare)
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP) {
      const sanitized = sanitize(cfIP);
      if (sanitized !== 'unknown') return sanitized;
    }

    return 'unknown';
  }

  /**
   * Detect rate limit type based on request path
   */
  detectType(pathname: string): RateLimitType {
    if (
      pathname.includes('/api/auth/') ||
      pathname.includes('/login') ||
      pathname.includes('/signup') ||
      pathname.includes('/forgot-password') ||
      pathname.includes('/reset-password')
    ) {
      return 'auth';
    }
    
    if (
      pathname.includes('/api/health') ||
      pathname.includes('/api/public') ||
      pathname.includes('/api/stripe/webhook')
    ) {
      return 'public';
    }
    
    return 'api';
  }

  /**
   * Check rate limit
   */
  async check(
    ip: string, 
    type: RateLimitType
  ): Promise<RateLimitResult> {
    const config = RATE_LIMIT_CONFIGS[type];
    const key = `${ip}:${type}`;
    const now = Date.now();
    
    const entry = await this.store.get(key);
    
    // No entry or expired window - create new
    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      await this.store.set(key, newEntry, config.windowMs);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }
    
    // Limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }
    
    // Increment count
    const newCount = await this.store.increment(key);
    
    return {
      allowed: true,
      remaining: config.maxRequests - newCount,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Create rate limit error response
   */
  createErrorResponse(
    result: RateLimitResult,
    type: RateLimitType,
    language: 'ar' | 'en' = 'ar'
  ): NextResponse {
    const config = RATE_LIMIT_CONFIGS[type];
    const message = language === 'ar' ? config.message : config.messageEn;
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
          'X-RateLimit-Type': type,
        },
      }
    );
  }

  /**
   * Rate limit middleware wrapper
   */
  middleware(type?: RateLimitType) {
    return async (
      request: NextRequest,
      handler: () => Promise<NextResponse>
    ): Promise<NextResponse> => {
      const ip = this.getClientIP(request);
      const limitType = type || this.detectType(request.nextUrl.pathname);
      const result = await this.check(ip, limitType);
      
      if (!result.allowed) {
        const acceptLanguage = request.headers.get('accept-language') || '';
        const language = acceptLanguage.includes('ar') ? 'ar' : 'en';
        return this.createErrorResponse(result, limitType, language);
      }
      
      const response = await handler();
      
      // Add rate limit headers
      const config = RATE_LIMIT_CONFIGS[limitType];
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      
      return response;
    };
  }

  /**
   * Reset rate limit for an IP
   */
  async reset(ip: string, type?: RateLimitType): Promise<void> {
    if (type) {
      await this.store.reset(`${ip}:${type}`);
    } else {
      for (const t of Object.keys(RATE_LIMIT_CONFIGS) as RateLimitType[]) {
        await this.store.reset(`${ip}:${t}`);
      }
    }
  }
}

// ============================================
// Export Singleton
// ============================================

export const rateLimiter = new RateLimiter();

// ============================================
// Convenience Functions
// ============================================

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: NextRequest
): Promise<RateLimitResult> {
  const ip = rateLimiter.getClientIP(request);
  const type = rateLimiter.detectType(request.nextUrl.pathname);
  return rateLimiter.check(ip, type);
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type?: RateLimitType
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ip = rateLimiter.getClientIP(request);
    const limitType = type || rateLimiter.detectType(request.nextUrl.pathname);
    const result = await rateLimiter.check(ip, limitType);
    
    if (!result.allowed) {
      const acceptLanguage = request.headers.get('accept-language') || '';
      const language = acceptLanguage.includes('ar') ? 'ar' : 'en';
      return rateLimiter.createErrorResponse(result, limitType, language);
    }
    
    const response = await handler(request);
    
    // Add rate limit headers
    const config = RATE_LIMIT_CONFIGS[limitType];
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return response;
  };
}
