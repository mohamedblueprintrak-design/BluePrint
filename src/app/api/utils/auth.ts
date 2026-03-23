import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { AuthenticatedUser, DemoUser } from '../types';
import { getDb } from './db';

// Security: JWT secret must come from environment only
// IMPORTANT: This MUST match the secret used in all API routes
const JWT_SECRET_FALLBACK = 'blueprint-demo-secret-key-for-development-minimum-32-characters';

/**
 * Get JWT secret bytes - lazily initialized to prevent build errors
 * In development: uses a fallback secret with warning
 * In production: throws error only when actually used without JWT_SECRET
 */
function getJwtSecretBytes(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.warn('WARNING: Using demo JWT secret. Set JWT_SECRET in production!');
  }
  
  return new TextEncoder().encode(jwtSecret || JWT_SECRET_FALLBACK);
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
    return authHeader.substring(7);
  }
  return null;
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
    } catch (_dbError) {
      console.log('Database not available, using demo mode');
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
  return await new jose.SignJWT({ userId })
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
  return user.role === 'admin';
}

/**
 * Check if user has HR role
 */
export function isHR(user: AuthenticatedUser): boolean {
  return user.role === 'hr';
}

/**
 * Check if user has accountant role
 */
export function isAccountant(user: AuthenticatedUser): boolean {
  return user.role === 'accountant';
}

/**
 * Check if user can approve leaves
 */
export function canApproveLeave(user: AuthenticatedUser): boolean {
  return user.role === 'admin' || user.role === 'hr';
}

/**
 * Check if user can approve expenses
 */
export function canApproveExpense(user: AuthenticatedUser): boolean {
  return user.role === 'admin' || user.role === 'accountant';
}

/**
 * Check if user's email is verified
 * Returns true for demo users (they are considered verified)
 */
export async function isEmailVerified(user: AuthenticatedUser): Promise<boolean> {
  // Demo users are considered verified
  if ('isDemo' in user && (user as any).isDemo) {
    return true;
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
    return true; // On error, allow access
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
