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
 * 
 * SECURITY:
 * - Rate limiting on all auth endpoints to prevent brute force
 * - Input validation on all fields
 * - HTTP-only cookies for refresh tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response';
import { 
  checkRateLimitByType, 
  getClientIP, 
  rateLimitError,
  RateLimitType 
} from '../utils/rate-limit';
import { cookies } from 'next/headers';

/**
 * Helper to check rate limit and return error if exceeded
 */
function checkAuthRateLimit(request: NextRequest): { allowed: boolean; response?: NextResponse } {
  const ip = getClientIP(request);
  const result = checkRateLimitByType(ip, 'auth' as RateLimitType);
  
  if (!result.allowed) {
    // Detect language from Accept-Language header
    const acceptLanguage = request.headers.get('accept-language') || '';
    const language = acceptLanguage.includes('ar') ? 'ar' : 'en';
    return { 
      allowed: false, 
      response: rateLimitError(result.resetTime, 'auth', language) 
    };
  }
  
  return { allowed: true };
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(
  response: NextResponse, 
  remaining: number, 
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', '10');
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());
  return response;
}

/**
 * POST - Handle authentication actions
 * SECURITY: Rate limited to prevent brute force attacks
 */
export async function POST(request: NextRequest) {
  // Check rate limit before processing
  const rateCheck = checkAuthRateLimit(request);
  if (!rateCheck.allowed && rateCheck.response) {
    return rateCheck.response;
  }
  
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 'INVALID_JSON', 400);
  }
  
  const action = body.action || 'login';

  let response: NextResponse;
  
  switch (action) {
    case 'login':
      response = await handleLogin(body, request);
      break;
    case 'signup':
      response = await handleSignup(body, request);
      break;
    case 'logout':
      response = await handleLogout(request);
      break;
    case 'refresh':
      response = await handleRefreshToken(body, request);
      break;
    case 'forgot-password':
      response = await handleForgotPassword(body, request);
      break;
    case 'reset-password':
      response = await handleResetPassword(body, request);
      break;
    default:
      response = errorResponse(`Invalid action: ${action}`, 'BAD_REQUEST', 400);
  }
  
  // Add rate limit headers to response
  const ip = getClientIP(request);
  const rateResult = checkRateLimitByType(ip, 'auth' as RateLimitType);
  return addRateLimitHeaders(response, rateResult.remaining, rateResult.resetTime);
}

/**
 * Handle user login
 * SECURITY: 
 * - Rate limited to 10 attempts per minute
 * - Generic error messages to prevent enumeration
 * - Supports 2FA verification
 * - Supports login with email OR username
 */
async function handleLogin(
  data: { email?: string; username?: string; password: string; rememberMe?: boolean; twoFactorCode?: string }, 
  request: NextRequest
): Promise<NextResponse> {
  // Accept either email or username for login
  const loginIdentifier = data.email || data.username;
  
  if (!loginIdentifier || !data.password) {
    return errorResponse('البريد الإلكتروني أو اسم المستخدم وكلمة المرور مطلوبان', 'VALIDATION_ERROR', 400);
  }

  // Check if identifier is email or username
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = emailRegex.test(loginIdentifier);

  const result = await authService.login({
    email: isEmail ? loginIdentifier : undefined,
    username: !isEmail ? loginIdentifier : undefined,
    password: data.password,
    rememberMe: data.rememberMe,
  });

  if (!result.success) {
    // Generic error to prevent user enumeration
    return errorResponse(
      'البريد الإلكتروني أو كلمة المرور غير صحيحة', 
      'INVALID_CREDENTIALS', 
      401
    );
  }

  // Check if user has 2FA enabled
  const has2FA = await authService.hasTwoFactorEnabled(result.user!.id);

  if (has2FA) {
    // If 2FA is enabled but no code provided, require 2FA
    if (!data.twoFactorCode) {
      return successResponse({
        requiresTwoFactor: true,
        userId: result.user!.id,
        message: 'مطلوب رمز المصادقة الثنائية',
      });
    }

    // Verify 2FA code
    const isValidCode = await authService.verifyTwoFactorCode(result.user!.id, data.twoFactorCode);
    if (!isValidCode) {
      return errorResponse('رمز المصادقة الثنائية غير صحيح', 'INVALID_2FA_CODE', 401);
    }
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
 * SECURITY:
 * - Rate limited to 10 attempts per minute
 * - Input validation on all fields
 */
async function handleSignup(
  data: {
    email: string;
    username: string;
    password: string;
    fullName: string;
    organizationName?: string;
  },
  request: NextRequest
): Promise<NextResponse> {
  // Validate required fields
  if (!data.email || !data.username || !data.password || !data.fullName) {
    return errorResponse('جميع الحقول المطلوبة يجب ملؤها', 'VALIDATION_ERROR', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return errorResponse('صيغة البريد الإلكتروني غير صحيحة', 'VALIDATION_ERROR', 400);
  }

  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!usernameRegex.test(data.username)) {
    return errorResponse(
      'اسم المستخدم يجب أن يكون 3-30 حرف ويحتوي فقط على أحرف أو أرقام أو _ أو -',
      'VALIDATION_ERROR',
      400
    );
  }

  // Validate password length
  if (data.password.length < 8) {
    return errorResponse('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'VALIDATION_ERROR', 400);
  }

  // Validate full name length
  if (data.fullName.length < 2 || data.fullName.length > 100) {
    return errorResponse('الاسم يجب أن يكون بين 2 و 100 حرف', 'VALIDATION_ERROR', 400);
  }

  const result = await authService.signup({
    email: data.email,
    username: data.username,
    password: data.password,
    fullName: data.fullName,
    organizationName: data.organizationName,
  });

  if (!result.success) {
    return errorResponse(
      result.error || 'فشل إنشاء الحساب',
      result.code || 'SIGNUP_FAILED',
      400
    );
  }

  // Send verification email
  try {
    await authService.sendVerificationEmail(
      data.email,
      data.fullName,
      result.user?.id
    );
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Continue anyway - user can request resend
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
    emailVerificationSent: true,
    message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني.',
  });
}

/**
 * Handle user logout
 */
async function handleLogout(request: NextRequest): Promise<NextResponse> {
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

    return successResponse({ message: 'تم تسجيل الخروج بنجاح' });
  } catch {
    return successResponse({ message: 'تم تسجيل الخروج بنجاح' });
  }
}

/**
 * Handle token refresh
 */
async function handleRefreshToken(
  data: { refreshToken?: string },
  request: NextRequest
): Promise<NextResponse> {
  // Try to get refresh token from body or cookie
  let refreshToken = data.refreshToken;
  
  if (!refreshToken) {
    const cookieStore = await cookies();
    refreshToken = cookieStore.get('refreshToken')?.value;
  }

  if (!refreshToken) {
    return errorResponse('رمز التحديث مطلوب', 'REFRESH_TOKEN_REQUIRED', 401);
  }

  const result = await authService.refreshToken(refreshToken);

  if (!result.success) {
    return errorResponse(
      result.error || 'فشل تحديث الرمز',
      result.code || 'REFRESH_FAILED',
      401
    );
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
 * SECURITY:
 * - Rate limited to prevent abuse
 * - Always returns success to prevent email enumeration
 */
async function handleForgotPassword(
  data: { email: string },
  request: NextRequest
): Promise<NextResponse> {
  if (!data.email) {
    return errorResponse('البريد الإلكتروني مطلوب', 'VALIDATION_ERROR', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return errorResponse('صيغة البريد الإلكتروني غير صحيحة', 'VALIDATION_ERROR', 400);
  }

  await authService.requestPasswordReset({ email: data.email });

  // Always return success to prevent email enumeration
  return successResponse({
    message: 'إذا كان هناك حساب بهذا البريد، سيتم إرسال رابط إعادة تعيين كلمة المرور',
  });
}

/**
 * Handle password reset
 * SECURITY:
 * - Rate limited to prevent token brute force
 * - Validates token expiry
 */
async function handleResetPassword(
  data: { token: string; newPassword: string; confirmPassword: string },
  request: NextRequest
): Promise<NextResponse> {
  if (!data.token || !data.newPassword || !data.confirmPassword) {
    return errorResponse('جميع الحقول مطلوبة', 'VALIDATION_ERROR', 400);
  }

  // Validate password match
  if (data.newPassword !== data.confirmPassword) {
    return errorResponse('كلمتا المرور غير متطابقتين', 'PASSWORD_MISMATCH', 400);
  }

  // Validate password strength
  if (data.newPassword.length < 8) {
    return errorResponse('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'WEAK_PASSWORD', 400);
  }

  const result = await authService.confirmPasswordReset({
    token: data.token,
    newPassword: data.newPassword,
    confirmPassword: data.confirmPassword,
  });

  if (!result.success) {
    return errorResponse(
      result.error || 'فشل إعادة تعيين كلمة المرور',
      result.code || 'RESET_FAILED',
      400
    );
  }

  return successResponse({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
}

/**
 * GET - Get current user
 * Uses API rate limit (less strict) since it's just reading data
 */
export async function GET(request: NextRequest) {
  // Check API rate limit (less strict for read operations)
  const ip = getClientIP(request);
  const rateResult = checkRateLimitByType(ip, 'api' as RateLimitType);
  
  if (!rateResult.allowed) {
    const acceptLanguage = request.headers.get('accept-language') || '';
    const language = acceptLanguage.includes('ar') ? 'ar' : 'en';
    return rateLimitError(rateResult.resetTime, 'api', language);
  }
  
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return unauthorizedResponse();
  }

  const payload = await authService.verifyToken(token);
  if (!payload) {
    return errorResponse('رمز غير صالح أو منتهي الصلاحية', 'INVALID_TOKEN', 401);
  }

  const user = await authService.getUserById(payload.userId);
  if (!user) {
    return errorResponse('المستخدم غير موجود', 'USER_NOT_FOUND', 404);
  }

  const response = successResponse({
    user: {
      ...user,
      permissions: authService.getRolePermissions(user.role as any),
    },
  });
  
  return addRateLimitHeaders(response, rateResult.remaining, rateResult.resetTime);
}
