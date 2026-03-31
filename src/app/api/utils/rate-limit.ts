/**
 * Rate Limiting Utility
 * أداة تحديد معدل الطلبات
 * 
 * Provides different rate limits for different endpoint types:
 * - Auth endpoints: Stricter limits (10 req/min) to prevent brute force
 * - API endpoints: Standard limits (100 req/min)
 * - Public endpoints: Lenient limits (200 req/min)
 * 
 * Supports Redis for distributed rate limiting in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimitRecord, RateLimitResult, ApiErrorResponse } from '../types';

// ============================================
// Rate Limit Configuration
// ============================================

export type RateLimitType = 'auth' | 'api' | 'public';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message: string;
  messageEn: string;
}

const RATE_LIMIT_CONFIGS: Record<RateLimitType, RateLimitConfig> = {
  // Auth endpoints - stricter limits to prevent brute force attacks
  auth: {
    maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10'),
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '60000'),
    message: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح. يرجى المحاولة بعد دقيقة.',
    messageEn: 'Too many login attempts. Please try again later.',
  },
  // API endpoints - standard limits
  api: {
    maxRequests: parseInt(process.env.RATE_LIMIT_API_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || '60000'),
    message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
    messageEn: 'Rate limit exceeded. Please try again later.',
  },
  // Public endpoints - more lenient
  public: {
    maxRequests: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX || '200'),
    windowMs: parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS || '60000'),
    message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
    messageEn: 'Rate limit exceeded. Please try again later.',
  },
};

// Default values for backward compatibility
const DEFAULT_LIMIT_REQUESTS = RATE_LIMIT_CONFIGS.api.maxRequests;
const DEFAULT_WINDOW = RATE_LIMIT_CONFIGS.api.windowMs;

// ============================================
// Redis Support (Optional)
// ============================================

let redisClient: any = null;
let redisAvailable = false;

/**
 * Initialize Redis client if available
 */
async function initRedis(): Promise<boolean> {
  if (redisClient !== null) {
    return redisAvailable;
  }
  
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    redisClient = false;
    redisAvailable = false;
    return false;
  }
  
  try {
    const { createClient } = await import('redis');
    redisClient = createClient({ 
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 3) {
            console.warn('Redis connection failed, falling back to memory store');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    redisClient.on('error', (err: Error) => {
      console.error('Redis error:', err);
      redisAvailable = false;
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Rate limiter connected to Redis');
      redisAvailable = true;
    });
    
    await redisClient.connect();
    redisAvailable = true;
    return true;
  } catch {
    console.warn('⚠️ Redis not available, using memory store for rate limiting');
    redisClient = false;
    redisAvailable = false;
    return false;
  }
}

// Initialize Redis on startup
initRedis();

// ============================================
// In-Memory Store (Fallback)
// ============================================

// Store structure: key -> { count, resetTime, type }
const rateLimitStore = new Map<string, RateLimitRecord & { type?: RateLimitType }>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get client IP from request
 * Supports various proxy configurations
 */
export function getClientIP(request: NextRequest): string {
  // Check X-Forwarded-For header (most common for proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP (original client)
    return forwarded.split(',')[0].trim();
  }
  
  // Check X-Real-IP header (nginx)
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  // Check CF-Connecting-IP (Cloudflare)
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }
  
  // Fallback
  return 'unknown';
}

/**
 * Detect rate limit type based on request path
 */
export function detectRateLimitType(pathname: string): RateLimitType {
  // Auth endpoints - strictest limits
  if (
    pathname.includes('/api/auth/') ||
    pathname.includes('/login') ||
    pathname.includes('/signup') ||
    pathname.includes('/forgot-password') ||
    pathname.includes('/reset-password')
  ) {
    return 'auth';
  }
  
  // Public endpoints - lenient limits
  if (
    pathname.includes('/api/health') ||
    pathname.includes('/api/public') ||
    pathname.includes('/api/stripe/webhook')
  ) {
    return 'public';
  }
  
  // Default to API limits
  return 'api';
}

/**
 * Get rate limit key for storage
 * Combines IP with endpoint type for separate tracking
 */
function getRateLimitKey(ip: string, type: RateLimitType): string {
  return `ratelimit:${ip}:${type}`;
}

// ============================================
// Main Rate Limit Functions
// ============================================

/**
 * Check rate limit using Redis
 */
async function checkRateLimitRedis(
  key: string, 
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const ttlSeconds = Math.ceil(config.windowMs / 1000);
  
  try {
    // Use Redis MULTI for atomic operations
    const multi = redisClient.multi();
    multi.incr(key);
    multi.expire(key, ttlSeconds);
    const results = await multi.exec();
    
    const count = results[0];
    
    if (count > config.maxRequests) {
      // Get TTL for reset time
      const ttl = await redisClient.ttl(key);
      const resetTime = now + (ttl * 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime
      };
    }
    
    return {
      allowed: true,
      remaining: config.maxRequests - count,
      resetTime: now + config.windowMs
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fall back to memory store
    return checkRateLimitMemory(key.replace('ratelimit:', ''), config);
  }
}

/**
 * Check rate limit using in-memory store
 */
function checkRateLimitMemory(
  key: string, 
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  // No record or expired window - create new
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      type: detectRateLimitType(key.split(':')[1] || '')
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  // Limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    };
  }
  
  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime
  };
}

/**
 * Check rate limit for a request
 * Legacy function for backward compatibility
 */
export function checkRateLimit(request: NextRequest): RateLimitResult {
  const ip = getClientIP(request);
  const type = detectRateLimitType(request.nextUrl.pathname);
  return checkRateLimitByType(ip, type);
}

/**
 * Check rate limit by IP and type
 * More flexible function for custom rate limiting
 * Uses Redis if available, falls back to memory store
 */
export function checkRateLimitByType(
  ip: string, 
  type: RateLimitType = 'api'
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[type];
  const _key = getRateLimitKey(ip, type);
  
  // Use Redis if available
  if (redisAvailable && redisClient) {
    // For synchronous contexts, we need to handle this differently
    // Return memory store result and let async callers use checkRateLimitByTypeAsync
    return checkRateLimitMemory(`${ip}:${type}`, config);
  }
  
  // Use memory store
  return checkRateLimitMemory(`${ip}:${type}`, config);
}

/**
 * Async version of checkRateLimitByType that properly uses Redis
 */
export async function checkRateLimitByTypeAsync(
  ip: string, 
  type: RateLimitType = 'api'
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[type];
  const key = getRateLimitKey(ip, type);
  
  // Try to use Redis
  if (await initRedis()) {
    return checkRateLimitRedis(key, config);
  }
  
  // Use memory store
  return checkRateLimitMemory(`${ip}:${type}`, config);
}

/**
 * Create rate limit error response
 */
export function rateLimitError(
  resetTime: number, 
  type: RateLimitType = 'api',
  language: 'ar' | 'en' = 'ar'
): NextResponse<ApiErrorResponse> {
  const config = RATE_LIMIT_CONFIGS[type];
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  const message = language === 'ar' ? config.message : config.messageEn;
  
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'RATE_LIMIT_EXCEEDED', 
        message 
      } 
    },
    { 
      status: 429, 
      headers: { 
        'Retry-After': retryAfter.toString(), 
        'X-RateLimit-Limit': config.maxRequests.toString(), 
        'X-RateLimit-Remaining': '0', 
        'X-RateLimit-Reset': resetTime.toString(),
        'X-RateLimit-Type': type,
      } 
    }
  );
}

/**
 * Rate limit middleware wrapper
 * Use this to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type?: RateLimitType
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ip = getClientIP(request);
    const limitType = type || detectRateLimitType(request.nextUrl.pathname);
    const result = await checkRateLimitByTypeAsync(ip, limitType);
    
    if (!result.allowed) {
      // Detect language from Accept-Language header
      const acceptLanguage = request.headers.get('accept-language') || '';
      const language = acceptLanguage.includes('ar') ? 'ar' : 'en';
      return rateLimitError(result.resetTime, limitType, language);
    }
    
    const response = await handler(request);
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIGS[limitType].maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return response;
  };
}

// ============================================
// Configuration Export
// ============================================

/**
 * Get current rate limit configuration
 */
export function getRateLimitConfig(): { maxRequests: number; windowMs: number } {
  return {
    maxRequests: DEFAULT_LIMIT_REQUESTS,
    windowMs: DEFAULT_WINDOW
  };
}

/**
 * Get all rate limit configurations
 */
export function getAllRateLimitConfigs(): Record<RateLimitType, RateLimitConfig> {
  return { ...RATE_LIMIT_CONFIGS };
}

/**
 * Reset rate limit for a specific IP (admin only)
 */
export async function resetRateLimit(ip: string, type?: RateLimitType): Promise<void> {
  if (type) {
    const key = getRateLimitKey(ip, type);
    if (redisAvailable && redisClient) {
      await redisClient.del(key);
    }
    rateLimitStore.delete(`${ip}:${type}`);
  } else {
    // Reset all types for this IP
    for (const t of Object.keys(RATE_LIMIT_CONFIGS) as RateLimitType[]) {
      const key = getRateLimitKey(ip, t);
      if (redisAvailable && redisClient) {
        await redisClient.del(key);
      }
      rateLimitStore.delete(`${ip}:${t}`);
    }
  }
}

/**
 * Get rate limit stats (admin only)
 */
export function getRateLimitStats(): {
  totalEntries: number;
  entriesByType: Record<RateLimitType, number>;
  usingRedis: boolean;
} {
  const entriesByType: Record<RateLimitType, number> = {
    auth: 0,
    api: 0,
    public: 0
  };
  
  for (const [, record] of rateLimitStore.entries()) {
    if (record.type) {
      entriesByType[record.type]++;
    }
  }
  
  return {
    totalEntries: rateLimitStore.size,
    entriesByType,
    usingRedis: redisAvailable
  };
}
