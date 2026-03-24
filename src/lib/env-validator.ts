/**
 * Environment Configuration Validation
 * التحقق من صحة تكوين البيئة
 * 
 * Validates that all required environment variables are properly configured
 * for production deployment.
 */

// ============================================
// Types
// ============================================

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate that a string is a valid 64-character hex string
 */
function isValidHexKey(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

/**
 * Check if running in production mode
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Validate environment configuration
 * 
 * @returns Validation result with errors, warnings, and info messages
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  // ============================================
  // Required in Production
  // ============================================

  if (isProduction()) {
    // JWT_SECRET validation
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      errors.push('JWT_SECRET is required in production');
    } else if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    } else if (jwtSecret.includes('your_') || jwtSecret.includes('change_this')) {
      errors.push('JWT_SECRET appears to be a placeholder value');
    }

    // ENCRYPTION_KEY validation
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      errors.push('ENCRYPTION_KEY is required in production');
    } else if (!isValidHexKey(encryptionKey)) {
      if (encryptionKey.includes('your_') || encryptionKey.includes('change_this')) {
        errors.push('ENCRYPTION_KEY appears to be a placeholder value');
      } else {
        errors.push('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Generate with: openssl rand -hex 32');
      }
    }

    // DATABASE_URL validation
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      errors.push('DATABASE_URL is required in production');
    } else if (databaseUrl.includes('localhost') && !databaseUrl.includes('db:5432')) {
      warnings.push('DATABASE_URL points to localhost - ensure this is correct for your deployment');
    }

    // NEXT_PUBLIC_APP_URL validation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      errors.push('NEXT_PUBLIC_APP_URL is required in production');
    } else if (appUrl.includes('localhost')) {
      errors.push('NEXT_PUBLIC_APP_URL should not point to localhost in production');
    } else if (!appUrl.startsWith('https://')) {
      warnings.push('NEXT_PUBLIC_APP_URL should use HTTPS in production');
    }
  }

  // ============================================
  // Recommended in Production
  // ============================================

  if (isProduction()) {
    // Redis configuration
    if (!process.env.REDIS_PASSWORD && !process.env.REDIS_URL) {
      warnings.push('Redis is not configured. Caching will be disabled.');
    }

    // CORS configuration
    if (!process.env.CORS_ORIGINS && !process.env.ALLOWED_ORIGINS) {
      warnings.push('CORS_ORIGINS is not set. API may be accessible from any origin.');
    }

    // Email configuration
    if (!process.env.SMTP_HOST) {
      info.push('SMTP is not configured. Email notifications will be disabled.');
    }

    // Stripe configuration
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      warnings.push('Using Stripe test keys in production. Switch to live keys for real payments.');
    }

    // Monitoring
    if (!process.env.SENTRY_DSN) {
      info.push('Sentry DSN is not configured. Error monitoring will be limited.');
    }
  }

  // ============================================
  // Development Mode Checks
  // ============================================

  if (!isProduction()) {
    // Check if using default development keys
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (encryptionKey === '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef') {
      info.push('Using default development ENCRYPTION_KEY. This is OK for development but must be changed for production.');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret?.includes('blueprint-saas-2024')) {
      info.push('Using default development JWT_SECRET. This is OK for development but must be changed for production.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
  };
}

/**
 * Log environment validation results
 * Call this at application startup
 */
export function logEnvironmentStatus(): void {
  const result = validateEnvironment();

  if (result.errors.length > 0) {
    console.error('\n❌ Environment Configuration Errors:');
    result.errors.forEach(err => console.error(`   - ${err}`));
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Configuration Warnings:');
    result.warnings.forEach(warn => console.warn(`   - ${warn}`));
  }

  if (result.info.length > 0) {
    console.info('\nℹ️  Environment Configuration Info:');
    result.info.forEach(info => console.info(`   - ${info}`));
  }

  if (result.valid && result.warnings.length === 0) {
    console.info('\n✅ Environment configuration is valid\n');
  } else if (result.valid) {
    console.warn('\n✅ Environment configuration is valid (with warnings)\n');
  } else {
    console.error('\n❌ Environment configuration is invalid. Please fix the errors above.\n');
    if (isProduction()) {
      console.error('Application may not start correctly in production with missing configuration.\n');
    }
  }
}

/**
 * Validate and throw if configuration is invalid
 * Use this for critical paths that require valid configuration
 */
export function requireValidEnvironment(): void {
  const result = validateEnvironment();
  
  if (!result.valid) {
    throw new Error(
      `Invalid environment configuration:\n${result.errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}

// ============================================
// Export helper for specific validations
// ============================================

export const envValidators = {
  isValidHexKey,
  isProduction,
  validateEnvironment,
};
