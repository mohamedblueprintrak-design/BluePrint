/**
 * Security Configuration
 * إعدادات الأمان
 * 
 * Comprehensive security configuration including:
 * - CORS settings
 * - CSP headers
 * - Rate limiting
 * - Password policies
 * - Session management
 * - File upload security
 */

// ============================================
// Environment Helpers
// ============================================

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getEnv(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue
}

// ============================================
// Environment Detection
// ============================================

export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isTest = process.env.NODE_ENV === 'test'

// ============================================
// JWT Configuration
// ============================================

export const JWT_CONFIG = {
  get secret(): Uint8Array {
    const secret = isProduction
      ? requireEnv('JWT_SECRET')
      : getEnv('JWT_SECRET', 'development-secret-key-at-least-32-characters-long')
    
    if (isDevelopment && secret === 'development-secret-key-at-least-32-characters-long') {
      console.warn('⚠️ Using development JWT secret. Set JWT_SECRET in production!')
    }
    
    // Validate minimum length
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long')
    }
    
    return new TextEncoder().encode(secret)
  },
  algorithm: 'HS256' as const,
  expiresIn: getEnv('JWT_EXPIRES_IN', '2h'),           // Short-lived access token
  refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),  // Refresh token
}

// ============================================
// Rate Limiting Configuration
// ============================================

export const RATE_LIMIT_CONFIG = {
  // General API rate limit
  windowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '60000') || '60000'),
  maxRequests: parseInt(getEnv('RATE_LIMIT_MAX', '100') || '100'),
  
  // Auth endpoints (stricter)
  authWindowMs: parseInt(getEnv('RATE_LIMIT_AUTH_WINDOW_MS', '60000') || '60000'),
  authMaxRequests: parseInt(getEnv('RATE_LIMIT_AUTH_MAX', '10') || '10'),
  
  // Public endpoints (more lenient)
  publicWindowMs: parseInt(getEnv('RATE_LIMIT_PUBLIC_WINDOW_MS', '60000') || '60000'),
  publicMaxRequests: parseInt(getEnv('RATE_LIMIT_PUBLIC_MAX', '200') || '200'),
}

// ============================================
// Password Configuration
// ============================================

export const PASSWORD_CONFIG = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,  // Changed to true for better security
  bcryptRounds: 12,          // Minimum recommended for bcrypt
  maxAge: 90 * 24 * 60 * 60, // 90 days in seconds
  historyCount: 5,           // Remember last 5 passwords
}

// ============================================
// Session Configuration
// ============================================

export const SESSION_CONFIG = {
  maxAge: 7 * 24 * 60 * 60,   // 7 days in seconds
  cookieName: 'bp_token',
  secureCookies: isProduction,
  sameSite: 'strict' as const, // Changed to strict for better CSRF protection
  httpOnly: true,
  path: '/',
}

// ============================================
// CORS Configuration (SECURED)
// ============================================

function getCorsOrigins(): string[] {
  const envOrigins = getEnv('CORS_ORIGINS') || getEnv('ALLOWED_ORIGINS') || ''
  
  if (isProduction) {
    // In production, CORS origins MUST be explicitly set
    const origins = envOrigins
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
    
    if (origins.length === 0) {
      console.warn(
        '⚠️ CORS_ORIGINS or ALLOWED_ORIGINS is not set in production. ' +
        'CORS will be disabled. Set this to your domain(s).'
      )
      return []
    }
    
    return origins
  }
  
  // In development, allow common local origins
  const devOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://localhost:4000',
  ]
  
  // Add any custom origins from env
  const customOrigins = envOrigins
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
  
  return [...devOrigins, ...customOrigins]
}

export const CORS_CONFIG = {
  allowedOrigins: getCorsOrigins(),
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-HTTP-Method-Override',
    'Accept',
    'Origin',
    'Cache-Control',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page',
    'X-Per-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
  credentials: true,
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  
  // In development with wildcard, allow all
  if (isDevelopment && CORS_CONFIG.allowedOrigins.length === 0) {
    return true
  }
  
  return CORS_CONFIG.allowedOrigins.includes(origin)
}

// ============================================
// Content Security Policy
// ============================================

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js in development
    "'unsafe-eval'",   // Required for some libraries
    'https://js.stripe.com',
    'https://cdnjs.cloudflare.com', // For some UI libraries
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind and styled-components
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    // SECURITY: http: removed from production - prevents mixed content
    // In development, HTTP images may be needed for testing
    ...(isDevelopment ? ['http:'] : []),
  ],
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://checkout.stripe.com',
    // Add your API endpoints here
  ],
  'frame-src': [
    'https://js.stripe.com',
    'https://hooks.stripe.com',
    'https://checkout.stripe.com',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  'upgrade-insecure-requests': isProduction ? [] : undefined,
}

/**
 * Generate CSP header value
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .filter(([, values]) => values !== undefined)
    .map(([directive, values]) => {
      if (!values || values.length === 0) {
        return directive
      }
      return `${directive} ${values.join(' ')}`
    })
    .join('; ')
}

// ============================================
// Security Headers
// ============================================

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN', // Allow same-origin framing for Stripe checkout
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

/**
 * Get all security headers including CSP
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    'Content-Security-Policy': generateCSPHeader(),
    // HSTS only in production with HTTPS
    ...(isProduction && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }),
  }
}

// ============================================
// File Upload Security
// ============================================

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedTypes: [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // SECURITY: SVG removed - SVG files can contain embedded JavaScript (XSS vector)
    // If SVG support is needed, use a dedicated SVG sanitizer library like DOMPurify
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    'text/plain',
    'text/csv',
  ],
  // Dangerous file extensions to block
  blockedExtensions: [
    '.exe', '.bat', '.cmd', '.sh', '.ps1',
    '.js', '.jsx', '.ts', '.tsx', // No script uploads
    '.php', '.py', '.rb', '.pl',
    '.dll', '.so', '.dylib',
    '.jar', '.war', '.ear',
  ],
  // Upload path (relative to project root)
  uploadPath: 'uploads',
}

/**
 * Validate file type
 */
export function isAllowedFileType(mimeType: string): boolean {
  return UPLOAD_CONFIG.allowedTypes.includes(mimeType)
}

/**
 * Validate file extension
 */
export function isBlockedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return UPLOAD_CONFIG.blockedExtensions.includes(ext)
}

/**
 * Generate safe filename
 */
export function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalName.substring(originalName.lastIndexOf('.'))
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50)
  
  return `${timestamp}_${random}_${safeName}${ext}`
}

// ============================================
// Export Config Object
// ============================================

export const config = {
  isProduction,
  isDevelopment,
  isTest,
  jwt: JWT_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  password: PASSWORD_CONFIG,
  session: SESSION_CONFIG,
  cors: CORS_CONFIG,
  security: SECURITY_HEADERS,
  upload: UPLOAD_CONFIG,
  getEnv,
  requireEnv,
}
