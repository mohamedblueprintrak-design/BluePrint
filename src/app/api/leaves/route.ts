// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jose.jwtVerify(authHeader.substring(7), JWT_SECRET);
    return await db.user.findUnique({ where: { id: payload.userId as string }, include: { organization: true } });
  } catch { return null; }
}

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = "ERROR", status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_LEAVES = [
  { id: 'demo-leave-001', userId: 'demo-user-001', user: { id: 'demo-user-001', fullName: 'م. أحمد محمد' }, leaveType: 'annual', startDate: new Date('2025-02-01'), endDate: new Date('2025-02-05'), daysCount: 5, status: 'approved', reason: 'إجازة سنوية', createdAt: new Date() },
  { id: 'demo-leave-002', userId: 'demo-user-002', user: { id: 'demo-user-002', fullName: 'م. سعيد علي' }, leaveType: 'sick', startDate: new Date('2025-01-25'), endDate: new Date('2025-01-26'), daysCount: 2, status: 'pending', reason: 'مرض', createdAt: new Date() }
];

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const status = new URL(request.url).searchParams.get('status');
    try {
      const where: any = { user: { organizationId: user.organizationId } };
      if (status) where.status = status;
      const leaves = await db.leaveRequest.findMany({ where, include: { user: true, approver: true }, orderBy: { createdAt: 'desc' } });
      return success(leaves.map(l => ({ ...l, user: { id: l.user.id, fullName: l.user.fullName || l.user.username }, approver: l.approver?.fullName })));
    } catch { let data = DEMO_LEAVES; if (status) data = data.filter(l => l.status === status); return success(data); }
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const body = await request.json();
    if (!body.leaveType || !body.startDate || !body.endDate) return error('نوع الإجازة والتاريخين مطلوبان');
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    try {
      const leave = await db.leaveRequest.create({ data: { ...body, userId: user.id, daysCount, startDate, endDate } });
      return success({ id: leave.id, daysCount });
    } catch { return success({ id: `demo-leave-${Date.now()}`, daysCount }); }
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const { id, approve, rejectionReason, sendNotification } = await request.json();
    const status = approve ? 'approved' : 'rejected';
    
    try {
      // Get the leave request with user info
      const leaveRequest = await db.leaveRequest.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!leaveRequest) {
        return error('طلب الإجازة غير موجود', 'NOT_FOUND', 404);
      }

      // Update the leave request
      await db.leaveRequest.update({
        where: { id },
        data: { status, approvedById: user.id, approvedAt: new Date(), rejectionReason }
      });

      // Create notification for the user
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
            referenceId: id
          }
        });
      } catch (notifError) {
        console.error('Failed to create leave notification:', notifError);
      }

      // Send email notification
      if (sendNotification !== false && leaveRequest.user?.email) {
        try {
          // Check if user has email notifications enabled for leaves
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const notificationSettings = await (db as any).notificationSettings?.findUnique({
            where: { userId: leaveRequest.userId }
          });

          if (!notificationSettings || notificationSettings.emailLeaves) {
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
                rejectionReason
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
          // Don't fail the request if email fails
        }
      }
    } catch (dbError) {
      // Demo mode - simulate email sending
      if (sendNotification !== false) {
        console.log('📧 Leave notification (demo mode):', { id, status, rejectionReason });
      }
    }
    return success({ id, status });
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}
