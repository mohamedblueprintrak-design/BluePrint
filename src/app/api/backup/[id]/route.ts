/**
 * Backup [id] API Route
 * مسار النسخة الاحتياطية المحددة
 *
 * GET /api/backup/[id] - Get backup details
 * DELETE /api/backup/[id] - Delete a backup
 */

import { NextRequest, NextResponse } from 'next/server';
import { backupService } from '@/lib/backup';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response';
import { getUserFromRequest } from '../../utils/demo-config';

/**
 * GET - Get backup details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const backups = await backupService.listBackups();
    const backup = backups.find((b) => b.id === id);

    if (!backup) {
      return errorResponse('النسخة الاحتياطية غير موجودة', 'BACKUP_NOT_FOUND', 404);
    }

    return successResponse({ backup });
  } catch (error) {
    console.error('Error getting backup:', error);
    return errorResponse('حدث خطأ أثناء جلب تفاصيل النسخة الاحتياطية', 'INTERNAL_ERROR', 500);
  }
}

/**
 * DELETE - Delete a backup
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('معرف النسخة الاحتياطية مطلوب', 'BACKUP_ID_REQUIRED', 400);
    }

    const result = await backupService.deleteBackup(id);

    if (!result.success) {
      return errorResponse(
        result.error || 'فشل في حذف النسخة الاحتياطية',
        'DELETE_FAILED',
        500
      );
    }

    return successResponse({
      message: 'تم حذف النسخة الاحتياطية بنجاح',
      backupId: id,
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return errorResponse('حدث خطأ أثناء حذف النسخة الاحتياطية', 'INTERNAL_ERROR', 500);
  }
}
