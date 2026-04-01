/**
 * Backup Restore API Route
 * مسار استعادة النسخ الاحتياطي
 *
 * POST /api/backup/restore - Restore from backup
 */

import { NextRequest} from 'next/server';
import { backupService } from '@/lib/backup';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response';
import { getUserFromRequest } from '../../utils/demo-config';

/**
 * POST - Restore from backup
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user || user.role !== 'ADMIN') {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { backupId, targetDir } = body;

    if (!backupId) {
      return errorResponse('معرف النسخة الاحتياطية مطلوب', 'BACKUP_ID_REQUIRED', 400);
    }

    // SECURITY: Validate targetDir to prevent command injection and path traversal
    if (targetDir && (!/^[\w./-]+$/.test(targetDir) || targetDir.includes('..'))) {
      return errorResponse('مسار غير صالح', 'INVALID_PATH', 400);
    }

    // Get backup info
    const backups = await backupService.listBackups();
    const backup = backups.find((b) => b.id === backupId);

    if (!backup) {
      return errorResponse('النسخة الاحتياطية غير موجودة', 'BACKUP_NOT_FOUND', 404);
    }

    let result;

    switch (backup.type) {
      case 'database':
        result = await backupService.restoreDatabase(backup.location);
        break;
      case 'files':
        result = await backupService.restoreFiles(backup.location, targetDir || './uploads');
        break;
      case 'full':
        // For full backup, restore both database and files
        const dbResult = await backupService.restoreDatabase(backup.location);
        const filesResult = await backupService.restoreFiles(backup.location, targetDir || './uploads');
        result = {
          success: dbResult.success && filesResult.success,
          error: dbResult.error || filesResult.error,
        };
        break;
      default:
        return errorResponse('نوع النسخة الاحتياطية غير صالح', 'INVALID_TYPE', 400);
    }

    if (!result.success) {
      return errorResponse(
        result.error || 'فشل في استعادة النسخة الاحتياطية',
        'RESTORE_FAILED',
        500
      );
    }

    return successResponse({
      message: 'تم استعادة النسخة الاحتياطية بنجاح',
      backupId,
      type: backup.type,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return errorResponse('حدث خطأ أثناء استعادة النسخة الاحتياطية', 'INTERNAL_ERROR', 500);
  }
}
