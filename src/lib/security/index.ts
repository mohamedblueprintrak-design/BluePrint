/**
 * @module security
 * @description Barrel export for all BluePrint security modules.
 *
 * Import individual modules as needed:
 * ```ts
 * import { encrypt, decrypt } from '@/lib/security';
 * import { rateLimit, RATE_LIMITS } from '@/lib/security';
 * import { AuditLogger, auditLog } from '@/lib/security';
 * ```
 */

// ─── Encryption ──────────────────────────────────────────────────────────────
export {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateAPIKey,
  maskSensitiveData,
  maskString,
  type EncryptionResult,
  type HashPasswordOptions,
  type GenerateAPIKeyOptions,
  type MaskFieldConfig,
} from './encryption';

// ─── Validation ──────────────────────────────────────────────────────────────
export {
  sanitizeString,
  sanitizeObject,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateURL,
  validateSQLInjection,
  validateXSS,
  validateFilePath,
  rateLimitInput,
  createValidator,
  securityCheck,
  type ValidationResult,
  type ValidatorConfig,
  type ValidatorFn,
} from './validation';

// ─── CSRF Protection ─────────────────────────────────────────────────────────
export {
  generateCSRFToken,
  validateCSRFToken,
  validateDoubleSubmit,
  isSafeMethod,
  getCSRFMiddleware,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  type CSRFValidationResult,
} from './csrf';

// ─── Security Headers ────────────────────────────────────────────────────────
export {
  getSecurityHeaders,
  getContentSecurityPolicy,
  generateNonce,
  getReferrerPolicy,
  getPermissionsPolicy,
  getStrictTransportSecurity,
  getCORSHeaders,
  getReportTo,
  generateSRI,
  createCSPBuilder,
  type SecurityHeadersOptions,
  type CSPBuilder,
} from './security-headers';

// ─── Rate Limiting ───────────────────────────────────────────────────────────
export {
  RateLimiter,
  rateLimit,
  initRateLimiter,
  getRateLimiter,
  getRateLimitHeaders,
  createRateLimitResponse,
  RATE_LIMITS,
  type RateLimitStrategy,
  type RateLimitCategory,
  type RateLimitConfig,
  type RateLimitOptions,
  type RateLimitResult,
  type RedisClient,
} from './rate-limiter';

// ─── Audit Logging ───────────────────────────────────────────────────────────
export {
  AuditLogger,
  auditLog,
  initAuditLogger,
  getAuditLogger,
  type LogLevel,
  type LogCategory,
  type AuditLogEntry,
  type AuditLoggerOptions,
  type SafeAuditLogEntry,
} from './audit-logger';
