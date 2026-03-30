/**
 * 2FA Verification API Route
 * مسار التحقق من رمز المصادقة الثنائية
 * 
 * POST /api/auth/2fa/verify - Verify 2FA code during login
 */

import { NextRequest } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { successResponse, errorResponse } from '../../../utils/response';

// SECURITY: In-memory rate limiter for failed 2FA attempts
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);
  
  if (!entry || now > entry.resetTime) {
    return false;
  }
  
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(userId: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

function clearFailedAttempts(userId: string): void {
  rateLimitStore.delete(userId);
}

// Periodically clean up expired entries (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(userId);
    }
  }
}, 10 * 60 * 1000);

/**
 * POST - Verify 2FA code
 * Body: { userId: string, code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return errorResponse(
        'معرف المستخدم والرمز مطلوبان',
        'USER_ID_AND_CODE_REQUIRED',
        400
      );
    }

    // SECURITY: Check rate limit for failed attempts
    if (isRateLimited(userId)) {
      return errorResponse(
        'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة بعد 5 دقائق',
        'RATE_LIMIT_EXCEEDED',
        429
      );
    }

    // Validate code format (6 digits for TOTP or 8 digits for backup)
    const codeRegex = /^(\d{6}|\d{8})$/;
    if (!codeRegex.test(code)) {
      return errorResponse(
        'صيغة الرمز غير صحيحة',
        'INVALID_CODE_FORMAT',
        400
      );
    }

    const isValid = await authService.verifyTwoFactorCode(userId, code);

    if (!isValid) {
      recordFailedAttempt(userId);
      return errorResponse(
        'رمز التحقق غير صحيح أو منتهي الصلاحية',
        'INVALID_CODE',
        401
      );
    }

    // Generate tokens after successful 2FA verification
    clearFailedAttempts(userId);
    const user = await authService.getUserById(userId);
    if (!user) {
      return errorResponse('المستخدم غير موجود', 'USER_NOT_FOUND', 404);
    }

    const accessToken = await authService.generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId || undefined,
    });

    const refreshToken = await authService.generateRefreshToken(user.id);

    return successResponse({
      message: 'تم التحقق بنجاح',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        organizationId: user.organizationId,
      },
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return errorResponse('حدث خطأ غير متوقع', 'INTERNAL_ERROR', 500);
  }
}
