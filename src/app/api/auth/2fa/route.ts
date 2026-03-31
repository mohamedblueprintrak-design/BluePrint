/**
 * Two-Factor Authentication API Route
 * مسار المصادقة الثنائية
 * 
 * GET /api/auth/2fa - Get 2FA status and setup info
 * POST /api/auth/2fa - Setup or Enable 2FA
 * DELETE /api/auth/2fa - Disable 2FA
 * 
 * Sub-routes:
 * POST /api/auth/2fa/verify - Verify 2FA code during login
 * POST /api/auth/2fa/backup-codes - Regenerate backup codes
 */

import { NextRequest } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response';
import { getUserFromRequest } from '../../utils/demo-config';

/**
 * GET - Get 2FA status and setup info
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const has2FA = await authService.hasTwoFactorEnabled(user.id);

    return successResponse({
      enabled: has2FA,
      message: has2FA 
        ? 'المصادقة الثنائية مفعلة' 
        : 'المصادقة الثنائية غير مفعلة',
    });
  } catch {
    return errorResponse('حدث خطأ في جلب حالة المصادقة الثنائية', 'FETCH_ERROR', 500);
  }
}

/**
 * POST - Setup or Enable 2FA
 * Body: { action: 'setup' | 'enable', code?: string }
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { action, code } = body;

    if (action === 'setup') {
      // Generate new 2FA secret and return QR code URL
      const { secret, qrCodeUrl } = await authService.generateTwoFactorSecret(user.id);

      return successResponse({
        message: 'تم إنشاء رمز المصادقة الثنائية. امسح الرمز بتطبيق المصادقة الخاص بك.',
        secret,
        qrCodeUrl,
        manualEntryKey: secret,
      });
    }

    if (action === 'enable') {
      if (!code) {
        return errorResponse('رمز التحقق مطلوب', 'CODE_REQUIRED', 400);
      }

      const result = await authService.enableTwoFactor(user.id, code);

      if (!result.success) {
        return errorResponse(
          result.error || 'فشل تفعيل المصادقة الثنائية',
          result.code || 'ENABLE_FAILED',
          400
        );
      }

      return successResponse({
        message: 'تم تفعيل المصادقة الثنائية بنجاح',
        backupCodes: result.backupCodes,
      });
    }

    return errorResponse('إجراء غير صحيح', 'INVALID_ACTION', 400);
  } catch (error) {
    console.error('2FA POST error:', error);
    return errorResponse('حدث خطأ غير متوقع', 'INTERNAL_ERROR', 500);
  }
}

/**
 * DELETE - Disable 2FA
 * Body: { password: string }
 */
export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return errorResponse('كلمة المرور مطلوبة', 'PASSWORD_REQUIRED', 400);
    }

    const result = await authService.disableTwoFactor(user.id, password);

    if (!result.success) {
      return errorResponse(
        result.error || 'فشل إلغاء المصادقة الثنائية',
        result.code || 'DISABLE_FAILED',
        400
      );
    }

    return successResponse({
      message: 'تم إلغاء المصادقة الثنائية بنجاح',
    });
  } catch (error) {
    console.error('2FA DELETE error:', error);
    return errorResponse('حدث خطأ غير متوقع', 'INTERNAL_ERROR', 500);
  }
}
