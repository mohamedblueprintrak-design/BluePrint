/**
 * Authentication API Route
 * مسار واجهة برمجة التطبيقات للمصادقة
 * 
 * Handles:
 * - POST /api/auth/login - User login
 * - POST /api/auth/signup - User registration
 * - POST /api/auth/logout - User logout
 * - POST /api/auth/refresh - Refresh token
 * - POST /api/auth/forgot-password - Request password reset
 * - POST /api/auth/reset-password - Reset password
 */

import { NextRequest } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response';
import { cookies } from 'next/headers';

/**
 * POST - Handle authentication actions
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body.action || 'login';

  switch (action) {
    case 'login':
      return handleLogin(body);
    case 'signup':
      return handleSignup(body);
    case 'logout':
      return handleLogout(request);
    case 'refresh':
      return handleRefreshToken(body);
    case 'forgot-password':
      return handleForgotPassword(body);
    case 'reset-password':
      return handleResetPassword(body);
    default:
      return errorResponse(`Invalid action: ${action}`, 'BAD_REQUEST', 400);
  }
}

/**
 * Handle user login
 */
async function handleLogin(data: { email: string; password: string; rememberMe?: boolean }) {
  if (!data.email || !data.password) {
    return errorResponse('Email and password are required', 'VALIDATION_ERROR', 400);
  }

  const result = await authService.login({
    email: data.email,
    password: data.password,
    rememberMe: data.rememberMe,
  });

  if (!result.success) {
    return errorResponse(result.error || 'Login failed', result.code || 'LOGIN_FAILED', 401);
  }

  // Set HTTP-only cookie for refresh token
  const cookieStore = await cookies();
  cookieStore.set('refreshToken', result.refreshToken!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: data.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days or 7 days
    path: '/',
  });

  return successResponse({
    user: result.user,
    token: result.token,
  });
}

/**
 * Handle user signup
 */
async function handleSignup(data: {
  email: string;
  username: string;
  password: string;
  fullName: string;
  organizationName?: string;
}) {
  // Validate required fields
  if (!data.email || !data.username || !data.password || !data.fullName) {
    return errorResponse('All required fields must be provided', 'VALIDATION_ERROR', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return errorResponse('Invalid email format', 'VALIDATION_ERROR', 400);
  }

  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!usernameRegex.test(data.username)) {
    return errorResponse('Username must be 3-30 characters and contain only letters, numbers, underscore, or hyphen', 'VALIDATION_ERROR', 400);
  }

  const result = await authService.signup({
    email: data.email,
    username: data.username,
    password: data.password,
    fullName: data.fullName,
    organizationName: data.organizationName,
  });

  if (!result.success) {
    return errorResponse(result.error || 'Signup failed', result.code || 'SIGNUP_FAILED', 400);
  }

  // Set HTTP-only cookie for refresh token
  const cookieStore = await cookies();
  cookieStore.set('refreshToken', result.refreshToken!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return successResponse({
    user: result.user,
    token: result.token,
  }, 'Account created successfully');
}

/**
 * Handle user logout
 */
async function handleLogout(request: NextRequest) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
      const payload = await authService.verifyToken(token);
      if (payload) {
        await authService.logout(payload.userId);
      }
    }

    // Clear refresh token cookie
    const cookieStore = await cookies();
    cookieStore.delete('refreshToken');

    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    return successResponse({ message: 'Logged out successfully' });
  }
}

/**
 * Handle token refresh
 */
async function handleRefreshToken(data: { refreshToken?: string }) {
  // Try to get refresh token from body or cookie
  let refreshToken = data.refreshToken;
  
  if (!refreshToken) {
    const cookieStore = await cookies();
    refreshToken = cookieStore.get('refreshToken')?.value;
  }

  if (!refreshToken) {
    return errorResponse('Refresh token required', 'REFRESH_TOKEN_REQUIRED', 401);
  }

  const result = await authService.refreshToken(refreshToken);

  if (!result.success) {
    return errorResponse(result.error || 'Token refresh failed', result.code || 'REFRESH_FAILED', 401);
  }

  // Update refresh token cookie
  const cookieStore = await cookies();
  cookieStore.set('refreshToken', result.refreshToken!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return successResponse({
    user: result.user,
    token: result.token,
  });
}

/**
 * Handle forgot password request
 */
async function handleForgotPassword(data: { email: string }) {
  if (!data.email) {
    return errorResponse('Email is required', 'VALIDATION_ERROR', 400);
  }

  await authService.requestPasswordReset({ email: data.email });

  // Always return success to prevent email enumeration
  return successResponse({
    message: 'If an account with that email exists, a password reset link has been sent',
  });
}

/**
 * Handle password reset
 */
async function handleResetPassword(data: { token: string; newPassword: string; confirmPassword: string }) {
  if (!data.token || !data.newPassword || !data.confirmPassword) {
    return errorResponse('All fields are required', 'VALIDATION_ERROR', 400);
  }

  const result = await authService.confirmPasswordReset({
    token: data.token,
    newPassword: data.newPassword,
    confirmPassword: data.confirmPassword,
  });

  if (!result.success) {
    return errorResponse(result.error || 'Password reset failed', result.code || 'RESET_FAILED', 400);
  }

  return successResponse({ message: 'Password reset successfully' });
}

/**
 * GET - Get current user
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return unauthorizedResponse();
  }

  const payload = await authService.verifyToken(token);
  if (!payload) {
    return errorResponse('Invalid or expired token', 'INVALID_TOKEN', 401);
  }

  const user = await authService.getUserById(payload.userId);
  if (!user) {
    return errorResponse('User not found', 'USER_NOT_FOUND', 404);
  }

  return successResponse({
    user: {
      ...user,
      permissions: authService.getRolePermissions(user.role as any),
    },
  });
}
