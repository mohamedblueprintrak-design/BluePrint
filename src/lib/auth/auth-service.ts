/**
 * Authentication Service
 * خدمة المصادقة مع JWT وإدارة الجلسات
 */

import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { prisma } from '../db';
import { env } from '../env';

const JWT_ALG = 'HS256';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    fullName?: string | null;
    role: string;
    organizationId?: string | null;
  };
  token?: string;
  error?: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      organizationId: payload.organizationId as string | undefined,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Check if user is active
    if (!user.isActive) {
      return { success: false, error: 'Account is deactivated' };
    }
    
    // Verify password
    if (!user.password) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    // Generate token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined,
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
      },
      token,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Register a new user
 */
export async function registerUser(data: {
  email: string;
  password: string;
  fullName: string;
  username?: string;
  organizationId?: string;
  role?: string;
}): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    
    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }
    
    // Generate username if not provided
    const username = data.username || data.email.split('@')[0] + '_' + Date.now();
    
    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    
    if (existingUsername) {
      return { success: false, error: 'Username already taken' };
    }
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        username,
        password: hashedPassword,
        fullName: data.fullName,
        organizationId: data.organizationId,
        role: data.role || 'viewer',
      },
    });
    
    // Generate token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined,
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
      },
      token,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      role: true,
      avatar: true,
      language: true,
      theme: true,
      phone: true,
      jobTitle: true,
      department: true,
      organizationId: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

/**
 * Check if user has permission
 */
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  const roleHierarchy: Record<string, number> = {
    admin: 100,
    manager: 75,
    engineer: 50,
    accountant: 50,
    viewer: 25,
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  return requiredRoles.some(role => userLevel >= (roleHierarchy[role] || 0));
}
