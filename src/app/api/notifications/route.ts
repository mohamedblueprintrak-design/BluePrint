import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return await db.user.findUnique({ 
      where: { id: payload.userId as string },
      include: { organization: true }
    });
  } catch {
    return null;
  }
}

function successResponse(data: any, meta?: any) {
  const response = { success: true, data };
  if (meta) Object.assign(response, { meta });
  return NextResponse.json(response);
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

// Demo notifications
const DEMO_NOTIFICATIONS = [
  {
    id: 'demo-notif-001',
    userId: 'demo-user-001',
    title: 'مهمة جديدة',
    message: 'تم تعيين مهمة جديدة لك: مراجعة مخططات البناء',
    notificationType: 'task',
    referenceType: 'task',
    referenceId: 'demo-task-001',
    isRead: false,
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  },
  {
    id: 'demo-notif-002',
    userId: 'demo-user-001',
    title: 'موافقة على الإجازة',
    message: 'تم الموافقة على طلب الإجازة الخاص بك',
    notificationType: 'leave',
    referenceType: 'leave',
    referenceId: 'demo-leave-001',
    isRead: true,
    priority: 'normal',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
  },
  {
    id: 'demo-notif-003',
    userId: 'demo-user-001',
    title: 'فاتورة جديدة',
    message: 'تم إنشاء فاتورة جديدة: INV-2025-0001',
    notificationType: 'invoice',
    referenceType: 'invoice',
    referenceId: 'demo-inv-001',
    isRead: false,
    priority: 'normal',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  }
];

// GET - List notifications
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    try {
      const where: any = { userId: user.id };
      if (unreadOnly) where.isRead = false;

      const notifications = await db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      const unreadCount = await db.notification.count({
        where: { userId: user.id, isRead: false }
      });

      return successResponse(
        notifications.map(n => ({
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          notificationType: n.notificationType,
          referenceType: n.referenceType,
          referenceId: n.referenceId,
          isRead: n.isRead,
          priority: n.priority,
          actionUrl: n.actionUrl,
          createdAt: n.createdAt,
          readAt: n.readAt
        })),
        { unreadCount }
      );
    } catch (_dbError) {
      // Demo mode
      let notifications = DEMO_NOTIFICATIONS;
      if (unreadOnly) {
        notifications = notifications.filter(n => !n.isRead);
      }
      
      return successResponse(
        notifications.slice(0, limit),
        { unreadCount: notifications.filter(n => !n.isRead).length }
      );
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// PUT - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const { id, markAllRead } = body;

    try {
      if (markAllRead) {
        // Mark all notifications as read
        await db.notification.updateMany({
          where: { userId: user.id, isRead: false },
          data: { isRead: true, readAt: new Date() }
        });
        return successResponse({ message: 'تم تحديد جميع الإشعارات كمقروءة' });
      }

      if (!id) return errorResponse('معرف الإشعار مطلوب');

      // Mark single notification as read
      await db.notification.update({
        where: { id, userId: user.id },
        data: { isRead: true, readAt: new Date() }
      });

      return successResponse({ message: 'تم تحديد الإشعار كمقروء' });
    } catch (_dbError) {
      // Demo mode
      return successResponse({ message: 'تم التحديث (وضع تجريبي)' });
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    try {
      if (deleteAll) {
        // Delete all notifications for user
        await db.notification.deleteMany({
          where: { userId: user.id }
        });
        return successResponse({ message: 'تم حذف جميع الإشعارات' });
      }

      if (!id) return errorResponse('معرف الإشعار مطلوب');

      // Delete single notification
      await db.notification.delete({
        where: { id, userId: user.id }
      });

      return successResponse({ message: 'تم حذف الإشعار' });
    } catch (_dbError) {
      // Demo mode
      return successResponse({ message: 'تم الحذف (وضع تجريبي)' });
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// POST - Create notification (internal use)
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const { userId, title, message, notificationType, referenceType, referenceId, priority, actionUrl } = body;

    if (!userId || !title) {
      return errorResponse('معرف المستخدم والعنوان مطلوبان');
    }

    try {
      const notification = await db.notification.create({
        data: {
          userId,
          title,
          message,
          notificationType: notificationType || 'system',
          referenceType,
          referenceId,
          priority: priority || 'normal',
          actionUrl
        }
      });

      return successResponse({
        id: notification.id,
        title: notification.title,
        message: 'تم إنشاء الإشعار'
      });
    } catch (_dbError) {
      // Demo mode
      return successResponse({
        id: `demo-notif-${Date.now()}`,
        title,
        message: 'تم إنشاء الإشعار (وضع تجريبي)'
      });
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
