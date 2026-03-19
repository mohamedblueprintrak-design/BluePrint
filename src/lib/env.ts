/**
 * Environment Variables Validation
 * التحقق من متغيرات البيئة مع نوعية آمنة
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
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
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // In development, allow missing optional vars
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    
    // In production, throw error
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables');
    }
    
    // In development, return partial with defaults
    return {
      DATABASE_URL: process.env.DATABASE_URL || '',
      JWT_SECRET: process.env.JWT_SECRET || 'development-secret-key-at-least-32-chars',
      JWT_EXPIRES_IN: '7d',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_NAME: 'BluePrint SaaS',
      RATE_LIMIT_MAX: 100,
      RATE_LIMIT_WINDOW_MS: 60000,
    } as Env;
  }
  
  return parsed.data;
}

export const env = validateEnv();

// Helper to check if a feature is configured
export const isConfigured = {
  github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  stripe: !!(process.env.STRIPE_SECRET_KEY),
  email: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
  redis: !!process.env.REDIS_URL,
  openai: !!process.env.OPENAI_API_KEY,
  sentry: !!process.env.SENTRY_DSN,
};
