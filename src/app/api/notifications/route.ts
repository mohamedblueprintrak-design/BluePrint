import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';

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
    title: 'مهمة جديدة معينة',
    message: 'تم تعيين مهمة جديدة لك: مراجعة مخططات البناء',
    notificationType: 'task_assigned',
    referenceType: 'task',
    referenceId: 'demo-task-001',
    isRead: false,
    priority: 'high',
    actionUrl: '/dashboard/tasks?id=demo-task-001',
    createdAt: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: 'demo-notif-002',
    userId: 'demo-user-001',
    title: 'إجازة موافق عليها',
    message: 'تم الموافقة على طلب الإجازة الخاص بك',
    notificationType: 'leave_approved',
    referenceType: 'leave',
    referenceId: 'demo-leave-001',
    isRead: true,
    priority: 'normal',
    actionUrl: '/dashboard/hr',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
  },
  {
    id: 'demo-notif-003',
    userId: 'demo-user-001',
    title: 'فاتورة جديدة',
    message: 'تم إنشاء فاتورة جديدة: INV-2025-0001',
    notificationType: 'invoice_created',
    referenceType: 'invoice',
    referenceId: 'demo-inv-001',
    isRead: false,
    priority: 'normal',
    actionUrl: '/dashboard/finance?id=demo-inv-001',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    id: 'demo-notif-004',
    userId: 'demo-user-001',
    title: 'مخزون منخفض',
    message: 'التنبيه: المخزون من الحديد أقل من الحد الأدنى',
    notificationType: 'low_stock',
    referenceType: 'material',
    referenceId: 'demo-mat-001',
    isRead: false,
    priority: 'urgent',
    actionUrl: '/dashboard/assets?material=demo-mat-001',
    createdAt: new Date(Date.now() - 1000 * 60 * 15)
  },
  {
    id: 'demo-notif-005',
    userId: 'demo-user-001',
    title: 'موعد تسليم قريب',
    message: 'موعد تسليم مشروع فيلا النخيل بعد 3 أيام',
    notificationType: 'deadline_approaching',
    referenceType: 'project',
    referenceId: 'demo-proj-001',
    isRead: false,
    priority: 'high',
    actionUrl: '/dashboard/projects?id=demo-proj-001',
    createdAt: new Date(Date.now() - 1000 * 60 * 60)
  },
  {
    id: 'demo-notif-006',
    userId: 'demo-user-001',
    title: 'دفعة مستلمة',
    message: 'تم استلام دفعة بقيمة 50,000 درهم من عميل شركة الفجر',
    notificationType: 'payment_received',
    referenceType: 'invoice',
    referenceId: 'demo-inv-002',
    isRead: true,
    priority: 'normal',
    actionUrl: '/dashboard/finance?id=demo-inv-002',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
  },
  {
    id: 'demo-notif-007',
    userId: 'demo-user-001',
    title: 'عيب مُبلغ عنه',
    message: 'تم الإبلاغ عن عيب جديد في موقع مشروع البرج',
    notificationType: 'defect_reported',
    referenceType: 'defect',
    referenceId: 'demo-defect-001',
    isRead: false,
    priority: 'high',
    actionUrl: '/dashboard/site-management?id=demo-defect-001',
    createdAt: new Date(Date.now() - 1000 * 60 * 45)
  }
];

// GET - List notifications
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const type = searchParams.get('type');

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let notifications = [...DEMO_NOTIFICATIONS];
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }
    if (type) {
      notifications = notifications.filter(n => n.notificationType === type);
    }
    
    const typeStats = notifications
      .filter(n => !n.isRead)
      .reduce((acc, n) => {
        acc[n.notificationType] = (acc[n.notificationType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    return successResponse(
      notifications.slice(0, limit),
      { 
        unreadCount: notifications.filter(n => !n.isRead).length,
        typeStats: Object.entries(typeStats).map(([notificationType, count]) => ({
          notificationType,
          _count: count
        }))
      }
    );
  }

  try {
    const { db } = await import('@/lib/db');
    
    const where: any = { userId: user.id };
    if (unreadOnly) where.isRead = false;
    if (type) where.notificationType = type;

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.id, isRead: false }
    });

    const typeStats = await db.notification.groupBy({
      by: ['notificationType'],
      where: { userId: user.id, isRead: false },
      _count: true
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
      { unreadCount, typeStats }
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// PUT - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - just return success
  if (isDemoUser(user.id)) {
    return successResponse({ message: 'تم التحديث (وضع تجريبي)' });
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { id, markAllRead, types } = body;

    if (markAllRead) {
      const where: any = { userId: user.id, isRead: false };
      if (types && types.length > 0) {
        where.notificationType = { in: types };
      }
      
      await db.notification.updateMany({
        where,
        data: { isRead: true, readAt: new Date() }
      });
      return successResponse({ message: 'تم تحديد جميع الإشعارات كمقروءة' });
    }

    if (!id) return errorResponse('معرف الإشعار مطلوب');

    await db.notification.update({
      where: { id, userId: user.id },
      data: { isRead: true, readAt: new Date() }
    });

    return successResponse({ message: 'تم تحديد الإشعار كمقروء' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - just return success
  if (isDemoUser(user.id)) {
    return successResponse({ message: 'تم الحذف (وضع تجريبي)' });
  }

  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';
    const deleteRead = searchParams.get('read') === 'true';

    if (deleteAll) {
      await db.notification.deleteMany({
        where: { userId: user.id }
      });
      return successResponse({ message: 'تم حذف جميع الإشعارات' });
    }

    if (deleteRead) {
      await db.notification.deleteMany({
        where: { userId: user.id, isRead: true }
      });
      return successResponse({ message: 'تم حذف الإشعارات المقروءة' });
    }

    if (!id) return errorResponse('معرف الإشعار مطلوب');

    await db.notification.delete({
      where: { id, userId: user.id }
    });

    return successResponse({ message: 'تم حذف الإشعار' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// POST - Create notification (internal use)
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - just return success
  if (isDemoUser(user.id)) {
    const body = await request.json();
    return successResponse({
      id: `demo-notif-${Date.now()}`,
      title: body.title,
      message: 'تم إنشاء الإشعار (وضع تجريبي)',
      realtime: true
    });
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { 
      userId, 
      title, 
      message, 
      notificationType, 
      referenceType, 
      referenceId, 
      priority, 
      actionUrl 
    } = body;

    if (!userId || !title) {
      return errorResponse('معرف المستخدم والعنوان مطلوبان');
    }

    const targetUser = await db.user.findFirst({
      where: { id: userId, organizationId: user.organizationId }
    });
    if (!targetUser) {
      return errorResponse('User not found in your organization', 'NOT_FOUND', 404);
    }

    const validTypes = [
      'task_assigned', 'task_completed', 'task_due_soon',
      'invoice_created', 'invoice_paid', 'invoice_overdue',
      'low_stock', 'new_message', 'deadline_approaching',
      'project_update', 'contract_signed',
      'leave_approved', 'leave_rejected',
      'payment_received', 'defect_reported',
      'system', 'approval_required'
    ];
    
    const finalType = validTypes.includes(notificationType) ? notificationType : 'system';

    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        notificationType: finalType,
        referenceType,
        referenceId,
        priority: priority || 'normal',
        actionUrl
      }
    });

    return successResponse({
      id: notification.id,
      title: notification.title,
      message: 'تم إنشاء الإشعار',
      realtime: true
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}
