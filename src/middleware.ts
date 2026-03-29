/**
 * Authentication & Rate Limiting Middleware
 * وسيط المصادقة وتحديد معدل الطلبات
 * 
 * Edge Runtime Compatible - Uses only Web APIs
 * Protects routes and validates authentication
 * Implements rate limiting for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ============================================
// Types
// ============================================

type RateLimitType = 'auth' | 'api' | 'public';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  organizationId?: string;
  iat?: number;
  exp?: number;
}

// ============================================
// Rate Limiting Configuration (Inline)
// ============================================

const RATE_LIMIT_CONFIGS = {
  auth: { maxRequests: 10, windowMs: 60000 },      // 10 req/min for auth
  api: { maxRequests: 100, windowMs: 60000 },      // 100 req/min for API
  public: { maxRequests: 200, windowMs: 60000 },   // 200 req/min for public
};

// In-memory store (Edge Runtime compatible)
const rateLimitStore = new Map<string, RateLimitRecord>();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  return 'unknown';
}

function detectRateLimitType(pathname: string): RateLimitType {
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

function checkRateLimit(ip: string, type: RateLimitType): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[type];
  const key = `${ip}:${type}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime };
}

function rateLimitResponse(resetTime: number, type: RateLimitType, language: 'ar' | 'en'): NextResponse {
  const config = RATE_LIMIT_CONFIGS[type];
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  const messages = {
    auth: {
      ar: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح. يرجى المحاولة بعد دقيقة.',
      en: 'Too many login attempts. Please try again later.',
    },
    api: {
      ar: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
      en: 'Rate limit exceeded. Please try again later.',
    },
    public: {
      ar: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
      en: 'Rate limit exceeded. Please try again later.',
    },
  };

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: messages[type][language],
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
        'X-RateLimit-Type': type,
      },
    }
  );
}

// ============================================
// Authentication Configuration
// ============================================

/**
 * Public paths that don't require authentication
 */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/api/auth',          // Main auth API (uses action in body)
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/2fa',
  '/api/auth/2fa/verify',
  '/api/auth/2fa/backup-codes',
  '/api/auth/resend-verification',
  '/api/auth/verify-email',
  '/api/health',
  '/api/stripe/webhook',
  '/api/public',
  '/pricing',
];

/**
 * Paths that require specific roles
 */
const ROLE_PROTECTED_PATHS: Record<string, string[]> = {
  '/admin': ['admin'],
  '/settings': ['admin', 'manager'],
  '/reports': ['admin', 'manager', 'accountant'],
  '/hr': ['admin', 'manager', 'hr'],
};

// ============================================
// JWT Verification (Edge Runtime Compatible)
// ============================================

/**
 * Get JWT secret key
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET environment variable is required and must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verify and decode a JWT token (Edge Runtime compatible)
 */
async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'blueprint-saas',
      audience: 'blueprint-users',
    });
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      username: payload.username as string,
      role: payload.role as string,
      organizationId: payload.organizationId as string | undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    return null;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract token from request
 */
function extractToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  // Try cookie
  const tokenCookie = request.cookies.get('token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  return null;
}

/**
 * Check if path matches public paths
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );
}

/**
 * Check if path matches static files
 */
function isStaticFile(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/public') ||
    pathname.includes('.') // Files with extensions
  );
}

/**
 * Get required role for path
 */
function getRequiredRole(pathname: string): string[] | null {
  for (const [path, roles] of Object.entries(ROLE_PROTECTED_PATHS)) {
    if (pathname.startsWith(path)) {
      return roles;
    }
  }
  return null;
}

// ============================================
// Main Middleware Function
// ============================================

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }
  
  // ============================================
  // Rate Limiting for API Endpoints
  // ============================================
  if (pathname.startsWith('/api/')) {
    const ip = getClientIP(request);
    const rateLimitType = detectRateLimitType(pathname);
    const rateLimitResult = checkRateLimit(ip, rateLimitType);
    
    if (!rateLimitResult.allowed) {
      // Detect language from Accept-Language header
      const acceptLanguage = request.headers.get('accept-language') || '';
      const language: 'ar' | 'en' = acceptLanguage.includes('ar') ? 'ar' : 'en';
      return rateLimitResponse(rateLimitResult.resetTime, rateLimitType, language);
    }
  }
  
  // ============================================
  // Handle CORS Preflight (OPTIONS) Requests
  // ============================================
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') || '*';
    const isDev = process.env.NODE_ENV === 'development';
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    // In development, allow all origins
    // In production, check if origin is allowed
    const allowOrigin = isDev ? '*' : (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
    
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, X-Requested-With, X-HTTP-Method-Override, Cache-Control',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  // Skip public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Extract token
  const token = extractToken(request);
  
  // No token found
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // For pages, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verify token (Edge Runtime compatible)
  const payload = await verifyToken(token);
  
  // Invalid token
  if (!payload) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }
    
    // For pages, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check role-based access
  const requiredRoles = getRequiredRole(pathname);
  if (requiredRoles && !requiredRoles.includes(payload.role)) {
    // For API routes, return 403
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    
    // For pages, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Add user info to headers for API routes
  const response = NextResponse.next();
  if (pathname.startsWith('/api/')) {
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-role', payload.role);
    if (payload.organizationId) {
      response.headers.set('x-organization-id', payload.organizationId);
    }
  }
  
  return response;
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
