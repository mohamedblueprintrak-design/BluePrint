/**
 * CSRF Protection - Double Submit Cookie Pattern
 * حماية من تزوير الطلبات عبر المواقع
 *
 * Uses synchronized double submit cookie pattern:
 * 1. Server sets a CSRF token in a non-httpOnly cookie on page load
 * 2. Client reads this cookie and includes it in a custom header on mutations
 * 3. Server verifies cookie value matches header value
 */

import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Create CSRF cookie options
 */
export function getCsrfCookieOptions() {
  return {
    name: CSRF_COOKIE_NAME,
    value: generateCsrfToken(),
    path: '/',
    httpOnly: false, // Must be readable by JS (for double-submit pattern)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24, // 24 hours
  };
}

/**
 * Validate CSRF token from request
 * Compares the token from the cookie with the token from the header
 */
export function validateCsrfToken(
  cookieToken: string | undefined,
  headerToken: string | undefined
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    // Buffer lengths differ
    return false;
  }
}

/**
 * Check if a request should be CSRF-protected
 * Only mutations (POST, PUT, PATCH, DELETE) need CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return protectedMethods.includes(method.toUpperCase());
}

/**
 * Check if the request is exempt from CSRF (API webhooks, etc.)
 */
export function isCsrfExempt(pathname: string): boolean {
  const exemptPaths = [
    '/api/stripe/webhook',
    '/api/health',
  ];
  return exemptPaths.some(path => pathname.startsWith(path));
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
