/**
 * JWT Token Management Module
 * وحدة إدارة رموز JWT
 * 
 * Handles JWT token generation, verification, and refresh
 */

import { SignJWT, jwtVerify } from 'jose';
import { JWT_CONFIG } from '@/lib/config/security';
import { UserRole } from '../types';

// ============================================
// Constants
// ============================================

const JWT_ALG = 'HS256';
const JWT_ISSUER = 'blueprint-saas';
const JWT_AUDIENCE = 'blueprint-users';

// Token types
export type TokenType = 'access' | 'refresh' | 'password-reset' | 'email-verification';

// ============================================
// Types
// ============================================

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  organizationId?: string;
  type?: TokenType;
  iat?: number;
  exp?: number;
}

export interface TokenOptions {
  expiresIn?: string;
  type?: TokenType;
}

// ============================================
// Token Generation
// ============================================

/**
 * Get JWT secret key
 */
function getJwtSecret(): Uint8Array {
  return JWT_CONFIG.secret;
}

/**
 * Generate an access token
 * Short-lived token for API authentication
 */
export async function generateAccessToken(
  payload: Omit<JwtPayload, 'iat' | 'exp' | 'type'>
): Promise<string> {
  const secret = getJwtSecret();
  
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_CONFIG.expiresIn || '2h')
    .sign(secret);
}

/**
 * Generate a refresh token
 * Long-lived token for refreshing access tokens
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const secret = getJwtSecret();
  
  return new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_CONFIG.refreshExpiresIn || '7d')
    .sign(secret);
}

/**
 * Generate a password reset token
 * Short-lived token for password reset
 */
export async function generatePasswordResetToken(userId: string): Promise<string> {
  const secret = getJwtSecret();
  
  return new SignJWT({ userId, type: 'password-reset' })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('1h')
    .sign(secret);
}

/**
 * Generate an email verification token
 */
export async function generateEmailVerificationToken(
  email: string, 
  userId?: string
): Promise<string> {
  const secret = getJwtSecret();
  
  return new SignJWT({ email, userId, type: 'email-verification' })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('24h')
    .sign(secret);
}

/**
 * Generate a custom token with specific options
 */
export async function generateToken(
  payload: Record<string, unknown>,
  options?: TokenOptions
): Promise<string> {
  const secret = getJwtSecret();
  
  const token = new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE);
  
  if (options?.expiresIn) {
    token.setExpirationTime(options.expiresIn);
  }
  
  if (options?.type) {
    token.setSubject(options.type);
  }
  
  return token.sign(secret);
}

// ============================================
// Token Verification
// ============================================

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      username: payload.username as string,
      role: payload.role as UserRole,
      organizationId: payload.organizationId as string | undefined,
      type: payload.type as TokenType | undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const payload = await verifyToken(token);
    
    if (!payload || payload.type !== 'refresh') {
      return null;
    }
    
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const payload = await verifyToken(token);
    
    if (!payload || payload.type !== 'password-reset') {
      return null;
    }
    
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

/**
 * Verify email verification token
 */
export async function verifyEmailVerificationToken(
  token: string
): Promise<{ email: string; userId?: string } | null> {
  try {
    const payload = await verifyToken(token);
    
    if (!payload || payload.type !== 'email-verification') {
      return null;
    }
    
    return { 
      email: payload.email, 
      userId: payload.userId 
    };
  } catch {
    return null;
  }
}

// ============================================
// Token Utilities
// ============================================

/**
 * Get token expiration time
 */
export function getTokenExpiration(expiresIn: string): Date {
  const now = new Date();
  
  // Parse the expiration string (e.g., '2h', '7d', '30m')
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    throw new Error(`Invalid expiration format: ${expiresIn}`);
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': // seconds
      return new Date(now.getTime() + value * 1000);
    case 'm': // minutes
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h': // hours
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd': // days
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(exp: number): boolean {
  return Date.now() >= exp * 1000;
}

/**
 * Decode token without verification (for debugging only)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf8')
    );
    
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
