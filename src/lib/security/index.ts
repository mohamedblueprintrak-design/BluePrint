/**
 * @module security
 * @description Barrel export for all BluePrint security modules.
 *
 * Import individual modules as needed:
 * ```ts
 * import { encrypt, decrypt } from '@/lib/security';
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
