import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';

const success = (data: unknown) => NextResponse.json({ success: true, data });
const error = (message: string, code = "ERROR", status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_LEAVES = [
  { id: 'demo-leave-001', userId: 'demo-user-001', user: { id: 'demo-user-001', fullName: 'م. أحمد محمد' }, leaveType: 'annual', startDate: new Date('2025-02-01'), endDate: new Date('2025-02-05'), daysCount: 5, status: 'approved', reason: 'إجازة سنوية', createdAt: new Date() },
  { id: 'demo-leave-002', userId: 'demo-user-002', user: { id: 'demo-user-002', fullName: 'م. سعيد علي' }, leaveType: 'sick', startDate: new Date('2025-01-25'), endDate: new Date('2025-01-26'), daysCount: 2, status: 'pending', reason: 'مرض', createdAt: new Date() }
];

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  const status = new URL(request.url).searchParams.get('status');

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let data = [...DEMO_LEAVES];
    if (status) data = data.filter(l => l.status === status);
    return success(data);
  }

  try {
    const { db } = await import('@/lib/db');
    const where: Record<string, unknown> = { user: { organizationId: user.organizationId } };
    if (status) where.status = status;
    const leaves = await db.leaveRequest.findMany({ where, include: { user: true, approver: true }, orderBy: { createdAt: 'desc' } });
    return success(leaves.map((l: { id: string; user: { id: string; fullName?: string | null; username: string }; approver?: { fullName?: string | null } | null; leaveType: string; startDate: Date; endDate: Date; daysCount: number; status: string }) => ({ ...l, user: { id: l.user.id, fullName: l.user.fullName || l.user.username }, approver: l.approver?.fullName })));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create leaves
  if (isDemoUser(user.id)) {
    return error('لا يمكن إنشاء طلبات إجازة في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json() as Record<string, unknown>;
    if (!body.leaveType || !body.startDate || !body.endDate) return error('نوع الإجازة والتاريخين مطلوبان');
    const startDate = new Date(body.startDate as string);
    const endDate = new Date(body.endDate as string);
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // SECURITY: Only allow specific fields (prevent mass assignment)
    const leaveData: Record<string, unknown> = {
      leaveType: body.leaveType,
      startDate,
      endDate,
      daysCount,
      userId: user.id,
      reason: body.reason || null,
    };

    const leave = await db.leaveRequest.create({ data: leaveData });
    return success({ id: leave.id, daysCount });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update leaves
  if (isDemoUser(user.id)) {
    return error('لا يمكن تحديث طلبات الإجازة في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const { sendEmail } = await import('@/lib/email');
    const { emailTemplates } = await import('@/lib/email-templates');
    
    const body = await request.json() as Record<string, unknown>;
    const { id, approve, rejectionReason, sendNotification } = body;
    const status = approve ? 'approved' : 'rejected';
    
    if (!id || typeof id !== 'string') {
      return error('معرف طلب الإجازة مطلوب', 'VALIDATION_ERROR');
    }
    
    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id: id as string },
      include: { user: true }
    });

    if (!leaveRequest) {
      return error('طلب الإجازة غير موجود', 'NOT_FOUND', 404);
    }

    await db.leaveRequest.update({
      where: { id: id as string },
      data: { status, approvedById: user.id, approvedAt: new Date(), rejectionReason: rejectionReason as string | undefined }
    });

    try {
      await db.notification.create({
        data: {
          userId: leaveRequest.userId,
          title: approve ? 'تم الموافقة على طلب الإجازة' : 'تم رفض طلب الإجازة',
          message: approve 
            ? `تم الموافقة على طلب إجازتك من ${leaveRequest.startDate.toLocaleDateString('ar-AE')} إلى ${leaveRequest.endDate.toLocaleDateString('ar-AE')}`
            : `تم رفض طلب إجازتك. ${rejectionReason ? `السبب: ${rejectionReason}` : ''}`,
          notificationType: 'leave',
          referenceType: 'leave',
          referenceId: id as string
        }
      });
    } catch (notifError) {
      console.error('Failed to create leave notification:', notifError);
    }

    if (sendNotification !== false && leaveRequest.user?.email) {
      try {
        // Default to notifying - NotificationSettings table not in Prisma schema
        // TODO: Add NotificationSettings model to schema when notification preferences are implemented
        const shouldNotify = true;

        if (shouldNotify) {
          const startDate = leaveRequest.startDate.toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' });
          const endDate = leaveRequest.endDate.toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' });

          let emailTemplate;
          if (approve) {
            emailTemplate = emailTemplates.leaveApproved(
              leaveRequest.user.fullName || leaveRequest.user.username,
              leaveRequest.leaveType,
              startDate,
              endDate,
              leaveRequest.daysCount
            );
          } else {
            emailTemplate = emailTemplates.leaveRejected(
              leaveRequest.user.fullName || leaveRequest.user.username,
              leaveRequest.leaveType,
              startDate,
              endDate,
              rejectionReason as string | undefined
            );
          }

          await sendEmail({
            to: leaveRequest.user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
          });
        }
      } catch (emailError) {
        console.error('Failed to send leave email:', emailError);
      }
    }

    return success({ id, status });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}
