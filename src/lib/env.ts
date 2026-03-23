/**
 * Environment Variables Validation
 * التحقق من متغيرات البيئة مع نوعية آمنة
 * 
 * SECURITY: This module validates all environment variables at startup
 * and ensures required secrets are properly configured in production.
 */

import { z } from 'zod';

// ============================================
// Environment Schema
// ============================================

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_DATABASE_URL: z.string().url().optional(),
  
  // Authentication - REQUIRED in production
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .refine(
      (val) => !val.includes('change') && !val.includes('secret') && !val.includes('dev'),
      'JWT_SECRET should not contain common placeholder words'
    ),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Encryption Key for sensitive data - REQUIRED in production
  ENCRYPTION_KEY: z.string()
    .length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
    .regex(/^[a-f0-9]{64}$/i, 'ENCRYPTION_KEY must be a valid hex string')
    .optional(),
  
  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // Database Password
  DATABASE_PASSWORD: z.string().optional(),
  
  // AI
  OPENAI_API_KEY: z.string().optional(),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('BluePrint SaaS'),
  
  // Sentry
  SENTRY_DSN: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_AUTH_MAX: z.string().transform(Number).default('10'),
  RATE_LIMIT_AUTH_WINDOW_MS: z.string().transform(Number).default('60000'),
  
  // CORS
  CORS_ORIGINS: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// ============================================
// Validation Function
// ============================================

function validateEnv(): Env {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';
  
  // Parse environment variables
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('\n❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    
    // In production, throw error
    if (isProduction) {
      throw new Error('Invalid environment variables. Check your .env file or environment configuration.');
    }
    
    // In development/test, return partial with warnings
    console.warn('\n⚠️  Using development defaults for missing variables.\n');
    
    return {
      NODE_ENV: nodeEnv,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://blueprint:dev@localhost:5432/blueprint',
      JWT_SECRET: process.env.JWT_SECRET || 'development-secret-key-at-least-32-chars-do-not-use-in-prod',
      JWT_EXPIRES_IN: '7d',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_NAME: 'BluePrint SaaS',
      RATE_LIMIT_MAX: 100,
      RATE_LIMIT_WINDOW_MS: 60000,
      RATE_LIMIT_AUTH_MAX: 10,
      RATE_LIMIT_AUTH_WINDOW_MS: 60000,
    } as Env;
  }
  
  const env = parsed.data;
  
  // ============================================
  // Production-specific validations
  // ============================================
  
  if (isProduction) {
    const missingRequired: string[] = [];
    
    // Check required production variables
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
      missingRequired.push('JWT_SECRET (min 32 characters)');
    }
    
    if (!env.ENCRYPTION_KEY) {
      console.warn('⚠️  ENCRYPTION_KEY is not set. Sensitive data will not be encrypted.');
    }
    
    if (!env.DATABASE_PASSWORD) {
      console.warn('⚠️  DATABASE_PASSWORD is not set. Using default connection.');
    }
    
    if (!env.REDIS_PASSWORD && env.REDIS_URL) {
      console.warn('⚠️  REDIS_PASSWORD is not set. Redis connection may be insecure.');
    }
    
    // Check for common placeholder values
    const dangerousValues = ['change-me', 'changeme', 'secret123', 'password', 'test', 'dev'];
    const secretFields = ['JWT_SECRET', 'ENCRYPTION_KEY', 'DATABASE_PASSWORD', 'REDIS_PASSWORD'] as const;
    
    for (const field of secretFields) {
      const value = process.env[field];
      if (value && dangerousValues.some(danger => value.toLowerCase().includes(danger))) {
        console.error(`❌ SECURITY: ${field} contains a placeholder value. Use a secure random value!`);
        missingRequired.push(field);
      }
    }
    
    if (missingRequired.length > 0) {
      throw new Error(
        `Missing or invalid required environment variables for production:\n` +
        missingRequired.map(v => `  - ${v}`).join('\n') +
        '\n\nGenerate secure secrets with:\n' +
        '  JWT_SECRET: openssl rand -base64 32\n' +
        '  ENCRYPTION_KEY: openssl rand -hex 32'
      );
    }
  }
  
  // ============================================
  // Development warnings
  // ============================================
  
  if (!isProduction && !isTest) {
    if (!env.ENCRYPTION_KEY) {
      console.warn('⚠️  ENCRYPTION_KEY not set. Run: openssl rand -hex 32');
    }
    
    if (env.JWT_SECRET && env.JWT_SECRET.includes('dev')) {
      console.warn('⚠️  JWT_SECRET appears to be a development value. Set a secure secret for production.');
    }
  }
  
  return env;
}

// ============================================
// Exports
// ============================================

export const env = validateEnv();

/**
 * Check if a feature is configured
 */
export const isConfigured = {
  get github() {
    return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  },
  get stripe() {
    return !!process.env.STRIPE_SECRET_KEY;
  },
  get email() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER);
  },
  get redis() {
    return !!process.env.REDIS_URL;
  },
  get openai() {
    return !!process.env.OPENAI_API_KEY;
  },
  get sentry() {
    return !!process.env.SENTRY_DSN;
  },
  get encryption() {
    return !!process.env.ENCRYPTION_KEY;
  },
};

/**
 * Get the current environment
 */
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isTest = process.env.NODE_ENV === 'test';

/**
 * Validate that a feature is configured before using it
 * Throws an error if the feature is not configured
 */
export function requireFeature(feature: keyof typeof isConfigured): void {
  if (!isConfigured[feature]) {
    throw new Error(
      `Feature "${feature}" is not configured. ` +
      `Please set the required environment variables.`
    );
  }
}
