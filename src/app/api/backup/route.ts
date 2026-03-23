/**
 * Backup API Routes
 * مسارات API للنسخ الاحتياطي
 *
 * GET /api/backup - List all backups
 * POST /api/backup - Create new backup
 */

import { NextRequest, NextResponse } from 'next/server';
import { backupService } from '@/lib/backup';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response';
import { getUserFromRequest } from '../../utils/demo-config';

/**
 * GET - List all backups
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return unauthorizedResponse();
  }

  try {
    const backups = await backupService.listBackups();
    const stats = await backupService.getStats();

    return successResponse({
      backups,
      stats,
      schedules: backupService.getDefaultSchedules(),
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    return errorResponse('فشل في جلب قائمة النسخ الاحتياطي', 'FETCH_ERROR', 500);
  }
}

/**
 * POST - Create new backup
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user || user.role !== 'admin') {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { type = 'database', filesDir } = body;

    let result;

    switch (type) {
      case 'full':
        result = await backupService.createFullBackup(filesDir);
        break;
      case 'files':
        result = await backupService.createFilesBackup(filesDir);
        break;
      case 'database':
      default:
        result = await backupService.createDatabaseBackup();
        break;
    }

    if (!result.success) {
      return errorResponse(
        result.error || 'فشل في إنشاء النسخة الاحتياطية',
        'BACKUP_FAILED',
        500
      );
    }

    return successResponse({
      message: 'تم إنشاء النسخة الاحتياطية بنجاح',
      backup: {
        id: result.backupId,
        type: result.type,
        timestamp: result.timestamp,
        size: result.size,
        duration: result.duration,
        location: result.location,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return errorResponse('حدث خطأ أثناء إنشاء النسخة الاحتياطية', 'INTERNAL_ERROR', 500);
  }
}
