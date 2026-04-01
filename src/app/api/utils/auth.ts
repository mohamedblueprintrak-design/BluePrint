import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { AuthenticatedUser, DemoUser } from '../types';
import { getDb } from './db';

// ============================================
// Security Configuration
// ============================================

/**
 * Get JWT secret bytes
 * SECURITY: JWT_SECRET is REQUIRED and must be at least 32 characters
 * - In production: Throws error if JWT_SECRET is not set
 * - In development/test: Shows warning but allows a dev secret
 */
function getJwtSecretBytes(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV;
  
  // Production: JWT_SECRET is MANDATORY
  if (nodeEnv === 'production') {
    if (!jwtSecret) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is required in production. ' +
        'Set JWT_SECRET to a secure random string of at least 32 characters. ' +
        'Generate one with: openssl rand -base64 32'
      );
    }
    
    if (jwtSecret.length < 32) {
      throw new Error(
        'FATAL: JWT_SECRET must be at least 32 characters long. ' +
        `Current length: ${jwtSecret.length} characters. ` +
        'Generate a secure secret with: openssl rand -base64 32'
      );
    }
    
    return new TextEncoder().encode(jwtSecret);
  }
  
  // Development/Test: Allow dev secret with strong warning
  if (!jwtSecret || jwtSecret.length < 32) {
    console.warn(
      '\n' + '='.repeat(70) +
      '\n⚠️  SECURITY WARNING: JWT_SECRET is not properly configured!' +
      '\n   Using development-only secret. DO NOT use in production!' +
      '\n   Set JWT_SECRET in your .env file (min 32 characters)' +
      '\n   Generate with: openssl rand -base64 32' +
      '\n' + '='.repeat(70) + '\n'
    );
    
    // Use a development-only secret — MUST match middleware.ts and demo-config.ts
    return new TextEncoder().encode('blueprint-dev-secret-do-not-use-in-production-min32chars!');
  }
  
  return new TextEncoder().encode(jwtSecret);
}

// Export JWT_SECRET as a function that returns Uint8Array
// This allows lazy evaluation and prevents build-time errors
export function getJWTSecret(): Uint8Array {
  return getJwtSecretBytes();
}

/**
 * Extract JWT token from request headers
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Skip the 'httpOnly' placeholder — real JWT is in the cookie
    if (token === 'httpOnly') {
      const tokenCookie = request.cookies.get('token');
      return tokenCookie?.value || null;
    }
    return token;
  }
  // Fall back to httpOnly cookie
  const tokenCookie = request.cookies.get('token');
  return tokenCookie?.value || null;
}

/**
 * Verify JWT token and extract user information
 */
export async function getUserFromToken(request: NextRequest, demoUsers: DemoUser[]): Promise<AuthenticatedUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret());
    const userId = payload.userId as string;
    
    // Check demo users first
    const demoUser = demoUsers.find(u => u.id === userId);
    if (demoUser) {
      return { ...demoUser, organization: demoUser.organization };
    }
    
    // Then try database
    try {
      const database = await getDb();
      if (!database) return null;
      
      const user = await database.user.findUnique({ 
        where: { id: userId },
        include: { organization: true }
      });
      return user;
    } catch {
      console.warn('Database not available, using demo mode');
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(userId: string): Promise<string> {
  return new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(getJWTSecret());
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: NextRequest,
  demoUsers: DemoUser[]
): Promise<{ user: AuthenticatedUser } | { error: ReturnType<typeof import('../utils/response').unauthorizedResponse> }> {
  const user = await getUserFromToken(request, demoUsers);
  if (!user) {
    const { unauthorizedResponse } = await import('../utils/response');
    return { error: unauthorizedResponse() };
  }
  return { user };
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'ADMIN' || user.role === 'admin';
}

/**
 * Check if user has HR role
 */
export function isHR(user: AuthenticatedUser): boolean {
  return user.role === 'HR' || user.role === 'hr';
}

/**
 * Check if user has accountant role
 */
export function isAccountant(user: AuthenticatedUser): boolean {
  return user.role === 'ACCOUNTANT' || user.role === 'accountant';
}

/**
 * Check if user can approve leaves
 */
export function canApproveLeave(user: AuthenticatedUser): boolean {
  const r = user.role?.toUpperCase();
  return r === 'ADMIN' || r === 'HR' || r === 'MANAGER';
}

/**
 * Check if user can approve expenses
 */
export function canApproveExpense(user: AuthenticatedUser): boolean {
  const r = user.role?.toUpperCase();
  return r === 'ADMIN' || r === 'ACCOUNTANT' || r === 'MANAGER';
}

/**
 * Check if user's email is verified
 * Returns true for demo users (they are considered verified)
 */
export async function isEmailVerified(user: AuthenticatedUser): Promise<boolean> {
  // Demo users are considered verified
  if ('isDemo' in user && typeof (user as Record<string, unknown>).isDemo === 'boolean') {
    return (user as Record<string, unknown>).isDemo as boolean;
  }

  try {
    const database = await getDb();
    if (!database) return true; // If no DB, allow access (demo mode)
    
    const dbUser = await database.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });
    
    return !!dbUser?.emailVerified;
  } catch {
    // SECURITY: Fail closed on DB errors for email verification
    // In production, always require email verification
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    // In development/demo mode, allow access when DB is unavailable
    return true;
  }
}

/**
 * Middleware to require email verification
 * Use this for sensitive operations like payments, changing password, etc.
 */
export async function requireEmailVerified(
  user: AuthenticatedUser
): Promise<{ verified: true } | { verified: false; error: ReturnType<typeof import('../utils/response').errorResponse> }> {
  const verified = await isEmailVerified(user);
  
  if (!verified) {
    const { errorResponse } = await import('../utils/response');
    return {
      verified: false,
      error: errorResponse(
        'يجب التحقق من بريدك الإلكتروني أولاً',
        'EMAIL_NOT_VERIFIED',
        403
      ),
    };
  }
  
  return { verified: true };
}

/**
 * Combined middleware: require auth + email verified
 */
export async function requireAuthAndVerified(
  request: NextRequest,
  demoUsers: DemoUser[]
): Promise<
  { user: AuthenticatedUser } | 
  { error: ReturnType<typeof import('../utils/response').unauthorizedResponse> | ReturnType<typeof import('../utils/response').errorResponse> }
> {
  const authResult = await requireAuth(request, demoUsers);
  
  if ('error' in authResult) {
    return authResult;
  }
  
  const verifiedResult = await requireEmailVerified(authResult.user);
  
  if ('error' in verifiedResult) {
    return { error: verifiedResult.error };
  }
  
  return { user: authResult.user };
}
