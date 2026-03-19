/**
 * Authentication Middleware
 * وسيط المصادقة
 * 
 * Protects routes and validates authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { Permission, UserRole } from '@/lib/auth/types';

/**
 * Public paths that don't require authentication
 */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/api/stripe/webhook',
];

/**
 * Paths that require specific roles
 */
const ROLE_PROTECTED_PATHS: Record<string, UserRole[]> = {
  '/admin': [UserRole.ADMIN],
  '/settings': [UserRole.ADMIN, UserRole.MANAGER],
  '/reports': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
};

/**
 * API paths that require specific permissions
 */
const API_PERMISSION_MAP: Record<string, { method: string; permission: Permission }[]> = {
  '/api/projects': [
    { method: 'POST', permission: Permission.PROJECT_CREATE },
    { method: 'PUT', permission: Permission.PROJECT_UPDATE },
    { method: 'DELETE', permission: Permission.PROJECT_DELETE },
  ],
  '/api/clients': [
    { method: 'POST', permission: Permission.CLIENT_CREATE },
    { method: 'PUT', permission: Permission.CLIENT_UPDATE },
    { method: 'DELETE', permission: Permission.CLIENT_DELETE },
  ],
  '/api/tasks': [
    { method: 'POST', permission: Permission.TASK_CREATE },
    { method: 'PUT', permission: Permission.TASK_UPDATE },
    { method: 'DELETE', permission: Permission.TASK_DELETE },
  ],
  '/api/invoices': [
    { method: 'POST', permission: Permission.INVOICE_CREATE },
    { method: 'PUT', permission: Permission.INVOICE_UPDATE },
    { method: 'DELETE', permission: Permission.INVOICE_DELETE },
  ],
  '/api/users': [
    { method: 'GET', permission: Permission.USER_READ },
    { method: 'POST', permission: Permission.USER_CREATE },
    { method: 'PUT', permission: Permission.USER_UPDATE },
    { method: 'DELETE', permission: Permission.USER_DELETE },
  ],
};

/**
 * Extract token from request
 */
function extractToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  // Try cookie
  const tokenCookie = request.cookies.get('token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  return null;
}

/**
 * Check if path matches public paths
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );
}

/**
 * Check if path matches static files
 */
function isStaticFile(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/public') ||
    pathname.includes('.') // Files with extensions
  );
}

/**
 * Get required role for path
 */
function getRequiredRole(pathname: string): UserRole[] | null {
  for (const [path, roles] of Object.entries(ROLE_PROTECTED_PATHS)) {
    if (pathname.startsWith(path)) {
      return roles;
    }
  }
  return null;
}

/**
 * Get required permission for API request
 */
function getRequiredPermission(pathname: string, method: string): Permission | null {
  for (const [path, permissions] of Object.entries(API_PERMISSION_MAP)) {
    if (pathname.startsWith(path)) {
      const permissionConfig = permissions.find(p => p.method === method);
      return permissionConfig?.permission || null;
    }
  }
  return null;
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }
  
  // Skip public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Extract token
  const token = extractToken(request);
  
  // No token found
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // For pages, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verify token
  const payload = await authService.verifyToken(token);
  
  // Invalid token
  if (!payload) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }
    
    // For pages, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check role-based access
  const requiredRoles = getRequiredRole(pathname);
  if (requiredRoles && !requiredRoles.includes(payload.role as UserRole)) {
    // For API routes, return 403
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    
    // For pages, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Check permission-based access for API routes
  if (pathname.startsWith('/api/')) {
    const requiredPermission = getRequiredPermission(pathname, request.method);
    if (requiredPermission) {
      const hasPermission = authService.hasPermission(payload.role as UserRole, requiredPermission);
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
          { status: 403 }
        );
      }
    }
  }
  
  // Add user info to headers for API routes
  const response = NextResponse.next();
  if (pathname.startsWith('/api/')) {
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-role', payload.role);
    if (payload.organizationId) {
      response.headers.set('x-organization-id', payload.organizationId);
    }
  }
  
  return response;
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
