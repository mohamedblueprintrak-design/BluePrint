/**
 * 2FA Verification API Route
 * مسار التحقق من رمز المصادقة الثنائية
 * 
 * POST /api/auth/2fa/verify - Verify 2FA code during login
 */

import { NextRequest } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { successResponse, errorResponse } from '../../../utils/response';

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
      return errorResponse(
        'رمز التحقق غير صحيح أو منتهي الصلاحية',
        'INVALID_CODE',
        401
      );
    }

    // Generate tokens after successful 2FA verification
    const user = await authService.getUserById(userId);
    if (!user) {
      return errorResponse('المستخدم غير موجود', 'USER_NOT_FOUND', 404);
    }

    const accessToken = await authService.generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as any,
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
