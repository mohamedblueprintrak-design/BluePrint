import { NextRequest, NextResponse } from 'next/server';
import { RateLimitRecord, RateLimitResult, ApiErrorResponse } from '../types';

// Rate Limiting: In-memory store for request tracking
const rateLimitStore = new Map<string, RateLimitRecord>();
const RATE_LIMIT_REQUESTS = 100; // requests per window
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms

// Clean up old rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(ip);
      }
    }
  }, 300000);
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(request: NextRequest): RateLimitResult {
  const ip = getClientIP(request);
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  if (record.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_REQUESTS - record.count, resetTime: record.resetTime };
}

/**
 * Rate limit error response
 */
export function rateLimitError(resetTime: number): NextResponse<ApiErrorResponse> {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return NextResponse.json(
    { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.' } },
    { 
      status: 429, 
      headers: { 
        'Retry-After': retryAfter.toString(), 
        'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(), 
        'X-RateLimit-Remaining': '0', 
        'X-RateLimit-Reset': resetTime.toString() 
      } 
    }
  );
}

/**
 * Get current rate limit configuration
 */
export function getRateLimitConfig(): { maxRequests: number; windowMs: number } {
  return {
    maxRequests: RATE_LIMIT_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW
  };
}
