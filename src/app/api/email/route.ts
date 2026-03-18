import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';
import { getJWTSecret } from '../utils/auth';

// Helper functions
function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret());
    return await db.user.findUnique({ 
      where: { id: payload.userId as string },
      include: { organization: true }
    });
  } catch {
    return null;
  }
}

// POST - Send email
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return errorResponse('نوع الإيميل والبيانات مطلوبان');
    }

    let template;
    let to = data.email || data.to;

    switch (type) {
      case 'welcome':
        template = emailTemplates.welcome(data.name, data.loginUrl);
        break;

      case 'invoice_created':
        template = emailTemplates.invoiceCreated(
          data.clientName,
          data.invoiceNumber,
          data.amount,
          data.dueDate,
          data.invoiceUrl
        );
        to = data.clientEmail || to;
        break;

      case 'task_assigned':
        template = emailTemplates.taskAssigned(
          data.userName,
          data.taskTitle,
          data.projectName,
          data.dueDate,
          data.priority,
          data.taskUrl
        );
        to = data.userEmail || to;
        break;

      case 'leave_approved':
        template = emailTemplates.leaveApproved(
          data.userName,
          data.leaveType,
          data.startDate,
          data.endDate,
          data.daysCount
        );
        break;

      case 'leave_rejected':
        template = emailTemplates.leaveRejected(
          data.userName,
          data.leaveType,
          data.startDate,
          data.endDate,
          data.rejectionReason
        );
        break;

      case 'password_reset':
        template = emailTemplates.passwordReset(
          data.userName,
          data.resetLink,
          data.expiresInMinutes
        );
        break;

      case 'project_assigned':
        template = emailTemplates.projectAssigned(
          data.userName,
          data.projectName,
          data.role,
          data.projectUrl
        );
        break;

      case 'payment_received':
        template = emailTemplates.paymentReceived(
          data.clientName,
          data.invoiceNumber,
          data.amount,
          data.paymentDate,
          data.paymentMethod
        );
        to = data.clientEmail || to;
        break;

      case 'task_reminder':
        template = emailTemplates.taskDueReminder(
          data.userName,
          data.taskTitle,
          data.projectName,
          data.dueDate,
          data.daysRemaining,
          data.taskUrl
        );
        break;

      case 'custom':
        // Custom email - data contains: to, subject, html
        if (!data.to || !data.subject || !data.html) {
          return errorResponse('البيانات غير مكتملة للإيميل المخصص');
        }
        const sent = await sendEmail({
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text
        });
        return successResponse({ sent, type: 'custom' });

      default:
        return errorResponse(`نوع الإيميل "${type}" غير معروف`);
    }

    if (!to) {
      return errorResponse('عنوان البريد الإلكتروني مطلوب');
    }

    // Send email
    const sent = await sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    if (sent) {
      return successResponse({ 
        message: 'تم إرسال البريد الإلكتروني بنجاح',
        to,
        type 
      });
    } else {
      return errorResponse('فشل في إرسال البريد الإلكتروني', 'SEND_ERROR', 500);
    }

  } catch (error) {
    console.error('Email API Error:', error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg || 'حدث خطأ في إرسال البريد', 'SERVER_ERROR', 500);
  }
}

// GET - Test email connection
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
  }

  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get('email');

  if (!testEmail) {
    // Just check SMTP configuration
    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    return successResponse({
      smtpConfigured,
      smtpHost: process.env.SMTP_HOST || 'غير معد',
      emailFrom: process.env.EMAIL_FROM || 'noreply@blueprint.ae'
    });
  }

  // Send test email
  const template = emailTemplates.welcome(user.fullName || user.username, `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`);
  
  const sent = await sendEmail({
    to: testEmail,
    subject: `[اختبار] ${template.subject}`,
    html: template.html,
    text: template.text
  });

  return successResponse({
    sent,
    message: sent ? 'تم إرسال بريد الاختبار بنجاح' : 'فشل في إرسال بريد الاختبار',
    to: testEmail
  });
}
