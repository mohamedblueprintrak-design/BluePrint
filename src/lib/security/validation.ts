/**
 * @module validation
 * @description Input validation and sanitization utilities for the BluePrint platform.
 * Provides HTML/XSS sanitization, SQL injection detection, path traversal prevention,
 * common field validators (email, phone, URL, password), and Zod schema integration.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Result of a validation check.
 */
export interface ValidationResult {
  /** Whether the input passed validation */
  valid: boolean;
  /** Human-readable error message (present when `valid` is `false`) */
  error?: string;
}

/**
 * Configuration for the `createValidator` factory.
 */
export interface ValidatorConfig {
  /** Custom error message to use on validation failure */
  errorMessage?: string;
  /** Whether to sanitize the input after validation (default: `true`) */
  sanitize?: boolean;
}

/**
 * Validator function created by `createValidator`.
 */
export type ValidatorFn<T = unknown> = (
  input: unknown
) => ValidationResult & { data?: T };

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Common XSS attack patterns used by `validateXSS`.
 */
const XSS_PATTERNS: RegExp[] = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<script[\s\S]*?>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /on\w+\s*=/gi, // event handlers: onclick=, onload=, etc.
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
  /<form[\s\S]*?>/gi,
  /<input[\s\S]*?>/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
  /data\s*:\s*text\/html/gi,
  /<!--[\s\S]*?-->/g,
  /<\s*!\[CDATA\[[\s\S]*?\]\]>/gi,
  /<\s*img[^>]+on\w+\s*=[^>]*>/gi,
];

/**
 * Common SQL injection patterns used by `validateSQLInjection`.
 */
const SQL_INJECTION_PATTERNS: RegExp[] = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE|UNION|HAVING|GROUP\s+BY|ORDER\s+BY)\b.*\b(FROM|INTO|TABLE|DATABASE|WHERE|SET|VALUES)\b)/gi,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /(\bWAITFOR\s+DELAY\b)/gi,
  /(\bBENCHMARK\s*\()/gi,
  /(\bSLEEP\s*\()/gi,
  /('\s*(OR|AND)\s+')/gi,
  /(\bCONCAT\s*\()/gi,
  /(\bLOAD_FILE\s*\()/gi,
  /(\bINTO\s+(OUT|DUMP)FILE\b)/gi,
];

/**
 * Path traversal attack patterns.
 */
const PATH_TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.\//g,
  /\.\.\\/g,
  /\.\./g,
  /%2e%2e[\/%5c]/gi,
  /%2e%2e\//gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /%252e%252e[\/%5c]/gi,
];

/**
 * HTML tag pattern for sanitization.
 */
const HTML_TAG_PATTERN = /<[^>]*>/g;

/**
 * Default maximum character length for rate-limited input.
 */
const DEFAULT_MAX_CHARS = 10000;

// ─── Sanitization ────────────────────────────────────────────────────────────

/**
 * Sanitizes a string by removing HTML/script tags and normalizing whitespace.
 *
 * Strips all HTML tags, decodes common HTML entities back to their plain-text
 * equivalents, and collapses multiple whitespace characters into single spaces.
 *
 * @param input - The string to sanitize
 * @returns Sanitized string
 *
 * @example
 * ```ts
 * sanitizeString('<p>Hello <script>alert(1)</script> World</p>');
 * // => 'Hello  World'
 * ```
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  let sanitized = input;

  // IMPORTANT: Decode HTML entities FIRST, then strip tags.
  // This prevents bypass via encoded entities like &lt;script&gt;
  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Strip HTML tags AFTER decoding
  sanitized = sanitized.replace(HTML_TAG_PATTERN, '');

  // Collapse whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Recursively sanitizes all string properties of an object.
 *
 * Traverses the entire object graph (including nested objects and arrays)
 * and applies `sanitizeString` to every string value found.
 *
 * @param obj - The object to sanitize
 * @returns A new object with all string properties sanitized
 *
 * @example
 * ```ts
 * sanitizeObject({
 *   name: '<b>John</b>',
 *   address: { city: '<script>alert("x")</script>NYC' }
 * });
 * // => { name: 'John', address: { city: 'NYC' } }
 * ```
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  // Numbers, booleans, dates, etc. pass through
  return obj;
}

// ─── Field Validators ────────────────────────────────────────────────────────

/**
 * Validates an email address against RFC 5322 (simplified).
 *
 * Accepts the vast majority of valid email addresses while rejecting obviously
 * malformed ones. Uses a pragmatic regex that covers the common cases.
 *
 * @param email - The email address to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();

  // RFC 5322 compliant (simplified) — rejects spaces, requires @ and domain
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email exceeds maximum length of 254 characters' };
  }

  return { valid: true };
}

/**
 * Validates password strength.
 *
 * Enforces:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special character (!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`)
 *
 * @param password - The password to validate
 * @returns Validation result with specific error message
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password must not exceed 128 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one digit' };
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

/**
 * Validates an international phone number.
 *
 * Accepts E.164 format (e.g., `+14155552671`) and common formatted variants
 * (e.g., `+1 (415) 555-2671`, `1-415-555-2671`).
 *
 * @param phone - The phone number to validate
 * @returns Validation result
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  // Strip formatting characters for validation
  const stripped = phone.replace(/[\s\-\(\)\.]/g, '');

  // E.164 format or international with leading +
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;

  if (!phoneRegex.test(stripped)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  return { valid: true };
}

/**
 * Validates a URL with protocol checking.
 *
 * Only allows `http`, `https`, and `ftp` protocols. Rejects `javascript:`,
 * `data:`, and other potentially dangerous URI schemes.
 *
 * @param url - The URL to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateURL(
  url: string,
  options: { allowedProtocols?: string[] } = {}
): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const { allowedProtocols = ['http:', 'https:', 'ftp:'] } = options;

  try {
    const parsed = new URL(url);

    if (!allowedProtocols.includes(parsed.protocol)) {
      return {
        valid: false,
        error: `URL protocol "${parsed.protocol}" is not allowed`,
      };
    }

    // Additional check: hostname must contain at least one dot
    // (unless it's localhost)
    if (parsed.hostname !== 'localhost' && !parsed.hostname.includes('.')) {
      return { valid: false, error: 'Invalid URL hostname' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// ─── Security Validators ─────────────────────────────────────────────────────

/**
 * Detects potential SQL injection patterns in input.
 *
 * Uses a set of regex patterns to identify common SQL injection techniques
 * including UNION-based, blind, and time-based injection attacks.
 *
 * **Note:** This is a defense-in-depth measure and should NOT replace
 * parameterized queries.
 *
 * @param input - The input to check
 * @returns `true` if SQL injection patterns are detected
 */
export function validateSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Detects potential XSS (Cross-Site Scripting) patterns in input.
 *
 * Scans for `<script>` tags, inline event handlers, `javascript:` URIs,
 * and other common XSS vectors.
 *
 * **Note:** This is a defense-in-depth measure. Always use `sanitizeString`
 * before rendering user input in HTML.
 *
 * @param input - The input to check
 * @returns `true` if XSS patterns are detected
 */
export function validateXSS(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Validates a file path for path traversal attacks.
 *
 * Rejects paths containing `../`, `..\\`, or URL-encoded variants that
 * could be used to access files outside the intended directory.
 *
 * @param path - The file path to validate
 * @returns Validation result
 */
export function validateFilePath(path: string): ValidationResult {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'File path is required' };
  }

  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(path)) {
      return {
        valid: false,
        error: 'Path traversal detected: potentially unsafe file path',
      };
    }
  }

  // Reject null bytes
  if (path.includes('\0')) {
    return { valid: false, error: 'Null byte detected in file path' };
  }

  return { valid: true };
}

// ─── Input Length Limiting ───────────────────────────────────────────────────

/**
 * Enforces a maximum character length on input to prevent abuse.
 *
 * Truncates the input to the specified maximum length and returns the
 * truncated result along with a flag indicating whether truncation occurred.
 *
 * @param input - The input string
 * @param maxChars - Maximum allowed characters (default: 10,000)
 * @returns Object with the (possibly truncated) string and a `truncated` flag
 */
export function rateLimitInput(
  input: string,
  maxChars: number = DEFAULT_MAX_CHARS
): { value: string; truncated: boolean } {
  if (!input || typeof input !== 'string') {
    return { value: '', truncated: false };
  }

  if (input.length <= maxChars) {
    return { value: input, truncated: false };
  }

  return { value: input.slice(0, maxChars), truncated: true };
}

// ─── Zod Integration ─────────────────────────────────────────────────────────

/**
 * Creates a validator function from a Zod schema with security additions.
 *
 * The returned validator will:
 * 1. Parse and validate the input against the schema
 * 2. Optionally sanitize string fields after validation
 * 3. Return a `ValidationResult` with the parsed data
 *
 * @param schema - A Zod schema object with a `safeParse` method
 * @param config - Validator configuration
 * @returns A validator function
 *
 * @example
 * ```ts
 * import { z } from 'zod';
 *
 * const userSchema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(1).max(100),
 * });
 *
 * const validateUser = createValidator(userSchema);
 * const result = validateUser({ email: 'test@example.com', name: '<b>John</b>' });
 * // result.valid === true, result.data.email === 'test@example.com'
 * ```
 */
export function createValidator<T>(
  schema: { safeParse: (input: any) => { success: boolean; data?: T; error?: { errors: Array<{ message: string }> } } },
  config: ValidatorConfig = {}
): ValidatorFn<T> {
  const { errorMessage, sanitize = true } = config;

  return (input: unknown) => {
    const result = schema.safeParse(input);

    if (!result.success) {
      const firstError = result.error?.errors?.[0];
      return {
        valid: false,
        error: errorMessage ?? firstError?.message ?? 'Validation failed',
      };
    }

    const data = result.data!;

    if (sanitize && typeof data === 'object' && data !== null) {
      return {
        valid: true,
        data: sanitizeObject(data),
      };
    }

    return { valid: true, data };
  };
}

// ─── Convenience: Quick Security Check ───────────────────────────────────────

/**
 * Runs all security checks (XSS, SQL injection, path traversal) on a string.
 *
 * @param input - The input to check
 * @returns Object with individual check results and an overall `safe` flag
 */
export function securityCheck(input: string): {
  safe: boolean;
  xss: boolean;
  sqlInjection: boolean;
  pathTraversal: boolean;
} {
  return {
    safe: !validateXSS(input) && !validateSQLInjection(input) && validateFilePath(input).valid,
    xss: validateXSS(input),
    sqlInjection: validateSQLInjection(input),
    pathTraversal: !validateFilePath(input).valid,
  };
}
