import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { AuthenticatedUser, DemoUser } from '../types';
import { getDb } from './db';

// Security: JWT secret must come from environment only
// In production, missing JWT_SECRET is a critical error
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  if (isProduction) {
    console.error('CRITICAL: JWT_SECRET environment variable is not set in production!');
  } else {
    console.warn('WARNING: Using demo JWT secret. Set JWT_SECRET in production!');
  }
}

// Use a secure fallback only in development mode
export const JWT_SECRET = new TextEncoder().encode(
  jwtSecret || (isProduction 
    ? (() => { throw new Error('JWT_SECRET must be set in production'); })()
    : 'blueprint-dev-secret-key-not-for-production-use-32chars'
  )
);

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
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
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
    } catch (dbError) {
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
    .sign(JWT_SECRET);
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
