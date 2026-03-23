/**
 * 2FA Backup Codes API Route
 * مسار رموز الاسترداد للمصادقة الثنائية
 * 
 * POST /api/auth/2fa/backup-codes - Regenerate backup codes
 */

import { NextRequest } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { successResponse, errorResponse, unauthorizedResponse } from '../../../utils/response';
import { getUserFromRequest } from '../../../utils/demo-config';

/**
 * POST - Regenerate backup codes
 * Body: { password: string }
 */
export async function POST(request: NextRequest) {
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

    const result = await authService.regenerateBackupCodes(user.id, password);

    if (!result.success) {
      return errorResponse(
        result.error || 'فشل إعادة توليد رموز الاسترداد',
        result.code || 'REGENERATE_FAILED',
        400
      );
    }

    return successResponse({
      message: 'تم إعادة توليد رموز الاسترداد بنجاح. احفظها في مكان آمن.',
      backupCodes: result.backupCodes,
      warning: 'ستصبح الرموز القديمة غير صالحة فوراً',
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return errorResponse('حدث خطأ غير متوقع', 'INTERNAL_ERROR', 500);
  }
}
