/**
 * Auth Modules Index
 * تصدير وحدات المصادقة
 * 
 * Re-exports all auth module functionality
 */

// Password Management
export {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateSecurePassword,
  checkPasswordBreached,
  type PasswordValidationResult,
} from './password';

// JWT Token Management
export {
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generateToken,
  verifyToken,
  verifyRefreshToken,
  verifyPasswordResetToken,
  verifyEmailVerificationToken,
  getTokenExpiration,
  isTokenExpired,
  decodeToken,
  type JwtPayload,
  type TokenType,
  type TokenOptions,
} from './jwt';

// Authorization
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleAtLeast,
  isAdmin,
  isManagerOrAbove,
  canManageUsers,
  canManageProjects,
  canApprove,
  canAccessFinancials,
  canAccessHR,
  getRolePermissions,
  getRoleLevel,
  getRolesBelow,
  getRolesAtOrAbove,
  canAccessResource,
  isSameOrganization,
  canAccessOrganization,
} from './authorization';

// Rate Limiting
export {
  rateLimiter,
  checkRateLimit,
  withRateLimit,
  RATE_LIMIT_CONFIGS,
  type RateLimitType,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limiter';
