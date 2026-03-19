/**
 * Security Configuration
 * إعدادات الأمان
 */

// Environment validation
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

// Check if running in production
export const isProduction = process.env.NODE_ENV === 'production'

// Check if running in development
export const isDevelopment = process.env.NODE_ENV === 'development'

// Check if running in test mode
export const isTest = process.env.NODE_ENV === 'test'

// JWT Configuration
export const JWT_CONFIG = {
  get secret(): Uint8Array {
    const secret = isProduction
      ? requireEnv('JWT_SECRET')
      : getEnv('JWT_SECRET', 'development-secret-key-at-least-32-characters-long')
    
    if (isDevelopment && secret === 'development-secret-key-at-least-32-characters-long') {
      console.warn('⚠️ Using development JWT secret. Set JWT_SECRET in production!')
    }
    
    return new TextEncoder().encode(secret)
  },
  algorithm: 'HS256' as const,
  expiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
}

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  windowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '60000') || '60000'),
  maxRequests: parseInt(getEnv('RATE_LIMIT_MAX', '100') || '100'),
  authMaxRequests: parseInt(getEnv('RATE_LIMIT_AUTH_MAX', '10') || '10'),
}

// Password Configuration
export const PASSWORD_CONFIG = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
  bcryptRounds: 12,
}

// Session Configuration
export const SESSION_CONFIG = {
  maxAge: 7 * 24 * 60 * 60,
  cookieName: 'bp_token',
  secureCookies: isProduction,
  sameSite: 'lax' as const,
}

// CORS Configuration
export const CORS_CONFIG = {
  allowedOrigins: (getEnv('ALLOWED_ORIGINS') || '')
    .split(',')
    .filter(Boolean)
    .concat(['http://localhost:3000', 'http://127.0.0.1:3000']),
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}

// Content Security Policy
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    'https://js.stripe.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
  ],
  'frame-src': [
    'https://js.stripe.com',
    'https://hooks.stripe.com',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
}

// Generate CSP header value
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive
      }
      return `${directive} ${values.join(' ')}`
    })
    .join('; ')
}

// Security Headers
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// File Upload Security
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024,
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}

// Validate file type
export function isAllowedFileType(mimeType: string): boolean {
  return UPLOAD_CONFIG.allowedTypes.includes(mimeType)
}

// Export config
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
