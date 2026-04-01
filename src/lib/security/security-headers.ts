/**
 * @module security-headers
 * @description Security headers utility for the BluePrint platform.
 * Generates HTTP response headers that protect against common web vulnerabilities
 * including XSS, clickjacking, MIME sniffing, and information leakage.
 *
 * Supports Content Security Policy with nonce-based script/style whitelisting,
 * Subresource Integrity hints, and violation reporting.
 */

import crypto from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Options for `getSecurityHeaders`.
 */
export interface SecurityHeadersOptions {
  /** Generate a fresh nonce for inline scripts/styles (default: `true`) */
  nonce?: boolean;
  /** CSP report URI for violation reports */
  cspReportUri?: string;
  /** Override the CSP directives (replaces defaults entirely) */
  customCSP?: Record<string, string>;
  /** Additional CORS allowed origins */
  corsOrigins?: string[];
  /** Enable strict HSTS (include subdomains, preload) (default: `false`) */
  strictHSTS?: boolean;
  /** Environment: 'production' uses stricter headers, 'development' is more permissive */
  environment?: 'production' | 'development' | 'test';
}

/**
 * Individual CSP directive builder result.
 */
export interface CSPBuilder {
  /** Adds a value to an existing directive */
  add: (directive: string, ...values: string[]) => CSPBuilder;
  /** Removes a directive entirely */
  remove: (directive: string) => CSPBuilder;
  /** Returns the assembled CSP header value */
  build: () => string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Default allowed origins for CORS.
 */
const DEFAULT_CORS_ORIGINS = [
  'https://blueprintapp.io',
  'https://app.blueprintapp.io',
];

/**
 * Default CSP directives for production.
 */
const DEFAULT_CSP_DIRECTIVES: Record<string, string> = {
  'default-src': "'self'",
  'script-src': "'self'",
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' data: https: blob:",
  'font-src': "'self' data:",
  'connect-src': "'self'",
  'frame-src': "'none'",
  'object-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'frame-ancestors': "'none'",
  'upgrade-insecure-requests': '',
};

/**
 * Default Permissions-Policy directives.
 */
const PERMISSIONS_POLICY: Record<string, string[]> = {
  accelerometer: ['none'],
  camera: ['none'],
  geolocation: ['none'],
  gyroscope: ['none'],
  magnetometer: ['none'],
  microphone: ['none'],
  payment: ['none'],
  'usb': ['none'],
  'picture-in-picture': ['none'],
  'publickey-credentials-get': ['none'],
  'screen-wake-lock': ['none'],
  'sync-xhr': ['none'],
};

// ─── CSP Builder ─────────────────────────────────────────────────────────────

/**
 * Creates a CSP builder for assembling Content Security Policy directives.
 *
 * @param directives - Initial set of CSP directives
 * @returns CSP builder object
 *
 * @example
 * ```ts
 * const csp = createCSPBuilder()
 *   .add('script-src', "'self'", "'nonce-abc123'")
 *   .add('connect-src', "'self'", 'https://api.example.com')
 *   .build();
 * ```
 */
export function createCSPBuilder(
  directives?: Record<string, string>
): CSPBuilder {
  const current: Record<string, string> = { ...DEFAULT_CSP_DIRECTIVES, ...directives };

  return {
    add(directive: string, ...values: string[]): CSPBuilder {
      const existing = current[directive] ?? '';
      current[directive] = existing
        ? `${existing} ${values.join(' ')}`
        : values.join(' ');
      return this;
    },
    remove(directive: string): CSPBuilder {
      delete current[directive];
      return this;
    },
    build(): string {
      return Object.entries(current)
        .map(([directive, value]) => (value ? `${directive} ${value}` : directive))
        .join('; ');
    },
  };
}

// ─── Header Generators ──────────────────────────────────────────────────────

/**
 * Generates a Content Security Policy header value.
 *
 * In production, strict CSP is enforced. In development, `unsafe-inline`
 * and `unsafe-eval` are allowed for hot-reloading convenience.
 *
 * @param options - Security headers options
 * @returns CSP header value string
 */
export function getContentSecurityPolicy(
  options: SecurityHeadersOptions = {}
): string {
  const { nonce, cspReportUri, customCSP, environment = 'production' } = options;

  // If custom CSP provided, use it directly
  if (customCSP) {
    return Object.entries(customCSP)
      .map(([directive, value]) => (value ? `${directive} ${value}` : directive))
      .join('; ');
  }

  const nonceValue = nonce !== false ? generateNonce() : null;

  const builder = createCSPBuilder();

  // Add nonce for scripts and styles
  if (nonceValue) {
    builder.add('script-src', `'nonce-${nonceValue}'`);
    builder.add('style-src', `'nonce-${nonceValue}'`, "'unsafe-inline'");
  }

  // Allow Next.js specific endpoints
  builder.add('connect-src', "'self'", 'https://api.stripe.com', 'https://fonts.googleapis.com');
  builder.add('img-src', "'self'", 'data:', 'https:', 'blob:', 'https://res.cloudinary.com');
  builder.add('font-src', "'self'", 'https://fonts.gstatic.com', 'data:');
  builder.add('frame-src', 'https://js.stripe.com');
  builder.add('script-src', 'https://js.stripe.com');

  // Development relaxations
  if (environment === 'development' || environment === 'test') {
    builder.add('script-src', "'unsafe-eval'", "'unsafe-inline'");
    builder.add('connect-src', 'ws:', 'wss:', 'http://localhost:*', 'https://localhost:*');
  }

  // CSP violation reporting
  if (cspReportUri) {
    builder.add('report-uri', cspReportUri);
    builder.add('report-to', 'csp-violation');
  }

  return builder.build();
}

/**
 * Generates a cryptographically random nonce for CSP.
 *
 * @returns A base64url-encoded 16-byte random nonce
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64url');
}

/**
 * Generates the `Referrer-Policy` header value.
 *
 * @returns Referrer-Policy value
 */
export function getReferrerPolicy(): string {
  return 'strict-origin-when-cross-origin';
}

/**
 * Generates the `Permissions-Policy` header value.
 *
 * @returns Permissions-Policy value
 */
export function getPermissionsPolicy(): string {
  return Object.entries(PERMISSIONS_POLICY)
    .map(([feature, allowList]) => `${feature}=(${allowList.join(' ')})`)
    .join(', ');
}

/**
 * Generates the `Strict-Transport-Security` (HSTS) header value.
 *
 * @param strict - Enable preload and includeSubDomains (default: `true`)
 * @returns HSTS header value
 */
export function getStrictTransportSecurity(strict: boolean = true): string {
  const maxAge = 31536000; // 1 year in seconds
  if (strict) {
    return `max-age=${maxAge}; includeSubDomains; preload`;
  }
  return `max-age=${maxAge}`;
}

/**
 * Generates CORS headers for a given origin.
 *
 * @param origin - The requesting origin
 * @param allowedOrigins - List of allowed origins
 * @returns Object with CORS headers (empty if origin not allowed)
 */
export function getCORSHeaders(
  origin: string | null,
  allowedOrigins?: string[]
): Record<string, string> {
  const origins = allowedOrigins ?? DEFAULT_CORS_ORIGINS;

  if (!origin) {
    return {};
  }

  const isAllowed = origins.some(
    (allowed) => allowed === origin || allowed === '*'
  );

  if (!isAllowed) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-csrf-token, X-Requested-With, Accept, Origin',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    Vary: 'Origin',
  };
}

/**
 * Generates the `Report-To` header for CSP violation reporting.
 *
 * @param reportUri - URI where violation reports should be sent
 * @returns Report-To header value
 */
export function getReportTo(reportUri: string): string {
  const reportToConfig = {
    group: 'csp-violation',
    max_age: 31536000,
    endpoints: [{ url: reportUri }],
  };
  return JSON.stringify(reportToConfig);
}

/**
 * Returns SRI (Subresource Integrity) hash for a given content.
 *
 * Useful for pre-computing integrity attributes for external scripts/styles.
 *
 * @param content - The content to hash
 * @param algorithm - Hash algorithm (default: 'sha384')
 * @returns SRI attribute value (e.g., `sha384-abc123...`)
 */
export function generateSRI(
  content: string,
  algorithm: string = 'sha384'
): string {
  const hash = crypto.createHash(algorithm).update(content).digest('base64');
  return `${algorithm}-${hash}`;
}

// ─── Main Function ───────────────────────────────────────────────────────────

/**
 * Generates a complete set of security headers for an HTTP response.
 *
 * Includes: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options,
 * Referrer-Policy, Permissions-Policy, Strict-Transport-Security, and more.
 *
 * @param options - Security header configuration
 * @returns Record of header name → value pairs
 *
 * @example
 * ```ts
 * // In Next.js middleware:
 * const response = NextResponse.next();
 * const headers = getSecurityHeaders({ environment: 'production' });
 * for (const [key, value] of Object.entries(headers)) {
 *   response.headers.set(key, value);
 * }
 * ```
 */
export function getSecurityHeaders(
  options: SecurityHeadersOptions = {}
): Record<string, string> {
  const {
    cspReportUri,
    strictHSTS = true,
    environment = 'production',
  } = options;

  const headers: Record<string, string> = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS protection (legacy, but still useful for older browsers)
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy
    'Referrer-Policy': getReferrerPolicy(),

    // Permissions-Policy
    'Permissions-Policy': getPermissionsPolicy(),

    // Strict Transport Security
    'Strict-Transport-Security': getStrictTransportSecurity(strictHSTS),

    // Content Security Policy
    'Content-Security-Policy': getContentSecurityPolicy(options),

    // Remove server identification
    'X-Powered-By': 'BluePrint',

    // Cross-Origin policies
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'credentialless',
  };

  // Add Report-To header if CSP reporting is enabled
  if (cspReportUri) {
    headers['Report-To'] = getReportTo(cspReportUri);
  }

  // Relax some headers in development
  if (environment === 'development' || environment === 'test') {
    // Allow iframes for development tools (e.g., Next.js dev overlay)
    delete headers['X-Frame-Options'];
    headers['X-Frame-Options'] = 'SAMEORIGIN';
  }

  return headers;
}
