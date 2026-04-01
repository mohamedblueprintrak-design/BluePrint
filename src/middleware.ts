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
  // SECURITY NOTE: In production with a trusted proxy, only the rightmost IP in
  // X-Forwarded-For (the one appended by the trusted proxy) should be trusted.
  // This sanitization is a baseline defense; configure TRUSTED_PROXY_IPS for full protection.
  const ipRegex = /^[0-9a-fA-F.:]+$/;
  const maxIPLength = 45; // Max IPv6 address length

  function sanitize(ip: string): string {
    const cleaned = ip.trim();
    if (cleaned.length > maxIPLength || !ipRegex.test(cleaned)) return 'unknown';
    return cleaned;
  }

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const candidate = forwarded.split(',')[0].trim();
    const sanitized = sanitize(candidate);
    if (sanitized !== 'unknown') return sanitized;
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    const sanitized = sanitize(realIP);
    if (sanitized !== 'unknown') return sanitized;
  }
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    const sanitized = sanitize(cfIP);
    if (sanitized !== 'unknown') return sanitized;
  }
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
 * IMPORTANT: Must use the SAME secret as the API auth handlers (demo-config.ts)
 */
// Stable development JWT secret (same as demo-config fallback)
const DEV_JWT_SECRET = 'blueprint-dev-secret-do-not-use-in-production-min32chars!';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }
  // Development fallback - matches demo-config.ts behavior
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return new TextEncoder().encode(DEV_JWT_SECRET);
}

/**
 * Verify and decode a JWT token (Edge Runtime compatible)
 */
async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = getJwtSecret();
    // NOTE: No issuer/audience check here — the API auth handlers (demo-config.ts)
    // do NOT set these claims, so we must not require them here.
    const { payload } = await jwtVerify(token, secret);
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      username: payload.username as string,
      role: payload.role as string,
      organizationId: payload.organizationId as string | undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
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
    /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/i.test(pathname)
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
  // CSRF Protection for Mutations
  // ============================================
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  const csrfExemptPaths = ['/api/stripe/webhook', '/api/health', '/api/auth', '/api/seed'];
  const isCsrfExempt = csrfExemptPaths.some(p => pathname.startsWith(p));

  if (pathname.startsWith('/api/') && isMutation && !isCsrfExempt) {
    const csrfCookie = request.cookies.get('csrf_token');
    const csrfHeader = request.headers.get('x-csrf-token');

    if (!csrfCookie?.value || !csrfHeader || csrfCookie.value !== csrfHeader) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_INVALID',
            message: process.env.NODE_ENV === 'development'
              ? 'CSRF token missing or invalid. Include X-CSRF-Token header matching csrf_token cookie.'
              : 'Invalid request. Please refresh the page and try again.',
          },
        },
        { status: 403 }
      );
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
    
    // In development, allow specific origins (not '*' with credentials)
    // In production, check if origin is allowed
    const allowOrigin = isDev
      ? (origin && origin !== 'null' ? origin : 'http://localhost:3000')
      : (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
    
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, X-Requested-With, X-HTTP-Method-Override, Cache-Control, X-CSRF-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  // ============================================
  // Generate CSRF token for page requests
  // ============================================
  // Set CSRF token cookie on page loads so the frontend can read it
  // and include it in mutation headers (double-submit cookie pattern)
  if (!pathname.startsWith('/api/') && request.method === 'GET') {
    const existingCsrf = request.cookies.get('csrf_token');
    const response = NextResponse.next();
    if (!existingCsrf?.value) {
      // Generate a new CSRF token using crypto (available in Edge Runtime)
      const token = crypto.randomUUID().replace(/-/g, '');
      response.cookies.set('csrf_token', token, {
        path: '/',
        httpOnly: false, // Must be readable by JS for double-submit
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use 'lax' so cookie is sent on first navigation
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }
    return response;
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
  
  // Check role-based access (normalize role to lowercase for comparison)
  const userRole = payload.role.toLowerCase();
  const requiredRoles = getRequiredRole(pathname);
  if (requiredRoles && !requiredRoles.includes(userRole)) {
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
