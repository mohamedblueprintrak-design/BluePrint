/**
 * Enhanced Transmittal System API
 * API محسن لنظام الإرسال مع تتبع وإشعارات
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getJWTSecret } from '../utils/auth';

// Helper functions
function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jose.jwtVerify(authHeader.substring(7), getJWTSecret());
    return await db.user.findUnique({ where: { id: payload.userId as string }, include: { organization: true } });
  } catch { return null; }
}

// Generate transmittal number
async function generateTransmittalNumber(organizationId?: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = 'TRN';
  
  try {
    const count = await db.transmittal.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}-${year}${month}-${sequence}`;
  } catch {
    const sequence = String(Date.now()).slice(-4);
    return `${prefix}-${year}${month}-${sequence}`;
  }
}

// Status labels
const STATUS_LABELS = {
  draft: { ar: 'مسودة', en: 'Draft', color: 'gray' },
  sent: { ar: 'مرسل', en: 'Sent', color: 'blue' },
  acknowledged: { ar: 'مستلم', en: 'Acknowledged', color: 'green' },
  rejected: { ar: 'مرفوض', en: 'Rejected', color: 'red' },
  overdue: { ar: 'متأخر', en: 'Overdue', color: 'orange' }
};

const RESPONSE_TYPES = {
  acknowledged: { ar: 'تأكيد الاستلام', color: 'green' },
  approved: { ar: 'موافقة', color: 'green' },
  approved_with_comments: { ar: 'موافقة مع ملاحظات', color: 'yellow' },
  rejected: { ar: 'رفض', color: 'red' },
  revise_resubmit: { ar: 'مراجعة وإعادة إرسال', color: 'orange' }
};

// GET - Fetch transmittals
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const action = searchParams.get('action');

    if (action === 'stats') {
      // Get statistics
      const total = await db.transmittal.count();
      const sent = await db.transmittal.count({ where: { status: 'SENT' } });
      const acknowledged = await db.transmittal.count({ where: { status: 'ACKNOWLEDGED' } });
      const overdue = await db.transmittal.count({ 
        where: { 
          status: { not: 'ACKNOWLEDGED' },
          dueDate: { lt: new Date() }
        }
      });

      return successResponse({
        total,
        byStatus: { sent, acknowledged, overdue, draft: total - sent - acknowledged },
        pendingAction: total - acknowledged
      });
    }

    if (action === 'overdue') {
      // Get overdue transmittals
      const overdue = await db.transmittal.findMany({
        where: {
          status: { notIn: ['ACKNOWLEDGED', 'REJECTED'] },
          dueDate: { lt: new Date() }
        },
        include: { items: true, project: true },
        orderBy: { dueDate: 'asc' }
      });

      return successResponse({
        count: overdue.length,
        transmittals: overdue.map(t => ({
          ...t,
          statusLabel: STATUS_LABELS[t.status as keyof typeof STATUS_LABELS]
        }))
      });
    }

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const transmittals = await db.transmittal.findMany({
      where,
      include: {
        items: true,
        responses: true,
        project: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(transmittals.map(t => ({
      ...t,
      statusLabel: STATUS_LABELS[t.status as keyof typeof STATUS_LABELS]
    })));
  } catch (error) {
    console.error('Error fetching transmittals:', error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg || 'فشل في جلب الإرسالات', 'SERVER_ERROR', 500);
  }
}

// POST - Create new transmittal
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'create') {
      const { items, sendEmail: shouldSendEmail, ...transmittalData } = data;

      // Generate transmittal number if not provided
      const transmittalNumber = transmittalData.transmittalNumber || 
        await generateTransmittalNumber(user.organizationId || undefined);

      const transmittal = await db.transmittal.create({
        data: {
          transmittalNumber,
          subject: transmittalData.subject,
          description: transmittalData.description,
          projectId: transmittalData.projectId,
          senderId: user.id,
          recipientName: transmittalData.recipientName,
          recipientEmail: transmittalData.recipientEmail,
          recipientCompany: transmittalData.recipientCompany,
          recipientPhone: transmittalData.recipientPhone,
          sendDate: transmittalData.sendDate ? new Date(transmittalData.sendDate) : new Date(),
          dueDate: transmittalData.dueDate ? new Date(transmittalData.dueDate) : null,
          status: transmittalData.status || 'draft',
          priority: transmittalData.priority || 'normal',
          deliveryMethod: transmittalData.deliveryMethod || 'email',
          trackingNumber: transmittalData.trackingNumber,
          notes: transmittalData.notes,
          items: items ? {
            create: items.map((item: any) => ({
              documentNumber: item.documentNumber,
              documentTitle: item.documentTitle,
              revision: item.revision || 'A',
              copies: item.copies || 1,
              documentType: item.documentType,
              status: item.status || 'for_review',
              notes: item.notes,
            }))
          } : undefined,
        },
        include: { items: true, project: true }
      });

      // Send email if requested
      if (shouldSendEmail && transmittal.recipientEmail) {
        await sendEmail({
          to: transmittal.recipientEmail,
          subject: `إرسال مستندات - ${transmittal.transmittalNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; direction: rtl;">
              <h2 style="color: #1e40af;">إرسال مستندات</h2>
              <p>مرحباً ${transmittal.recipientName}،</p>
              <p>تم إرسال المستندات التالية إليكم:</p>
              <p><strong>رقم الإرسال:</strong> ${transmittal.transmittalNumber}</p>
              <p><strong>الموضوع:</strong> ${transmittal.subject}</p>
              ${transmittal.dueDate ? `<p><strong>تاريخ الاستحقاق:</strong> ${new Date(transmittal.dueDate).toLocaleDateString('ar-AE')}</p>` : ''}
              
              <h3 style="margin-top: 20px;">المستندات المرسلة:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">رقم المستند</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">العنوان</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">النسخة</th>
                </tr>
                ${transmittal.items.map(item => `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.documentNumber}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.documentTitle}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.revision}</td>
                  </tr>
                `).join('')}
              </table>
              
              <p style="margin-top: 20px;">يرجى تأكيد الاستلام.</p>
              <p>مع أطيب التحيات،<br>${user.organization?.name || 'BluePrint Engineering'}</p>
            </div>
          `
        });
      }

      // Create notification
      try {
        await db.notification.create({
          data: {
            userId: user.id,
            title: 'تم إنشاء إرسال جديد',
            message: `تم إنشاء الإرسال ${transmittalNumber}`,
            notificationType: 'system',
            referenceType: 'transmittal',
            referenceId: transmittal.id
          }
        });
      } catch {}

      return successResponse({
        ...transmittal,
        statusLabel: STATUS_LABELS[transmittal.status as keyof typeof STATUS_LABELS]
      });
    }

    if (action === 'add_response') {
      const { transmittalId, responseType, respondentName, respondentEmail, comments, attachments } = data;

      const response = await db.transmittalResponse.create({
        data: {
          transmittalId,
          responseType,
          respondentName,
          respondentEmail,
          comments,
          attachments: attachments ? JSON.stringify(attachments) : null as any
        }
      });

      // Update transmittal status
      const newStatus: any = responseType === 'acknowledged' ? 'ACKNOWLEDGED' : 
                       responseType === 'rejected' ? 'REJECTED' : 'ACKNOWLEDGED';
      
      await db.transmittal.update({
        where: { id: transmittalId },
        data: { 
          status: newStatus,
          acknowledgedDate: new Date(),
          acknowledgedBy: respondentName
        }
      });

      return successResponse({
        ...response,
        responseLabel: RESPONSE_TYPES[responseType as keyof typeof RESPONSE_TYPES]
      });
    }

    if (action === 'send_reminder') {
      const { transmittalId } = data;

      const transmittal = await db.transmittal.findUnique({
        where: { id: transmittalId },
        include: { items: true }
      });

      if (!transmittal) return errorResponse('الإرسال غير موجود');
      if (!transmittal.recipientEmail) return errorResponse('لا يوجد بريد إلكتروني للمستلم');

      // Send reminder email
      await sendEmail({
        to: transmittal.recipientEmail,
        subject: `تذكير - إرسال مستندات ${transmittal.transmittalNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; direction: rtl;">
            <h2 style="color: #ea580c;">تذكير: إرسال مستندات</h2>
            <p>مرحباً ${transmittal.recipientName}،</p>
            <p>هذا تذكير بخصوص الإرسال رقم <strong>${transmittal.transmittalNumber}</strong></p>
            <p><strong>الموضوع:</strong> ${transmittal.subject}</p>
            ${transmittal.dueDate ? `<p style="color: #dc2626;"><strong>تاريخ الاستحقاق:</strong> ${new Date(transmittal.dueDate).toLocaleDateString('ar-AE')}</p>` : ''}
            <p>يرجى تأكيد الاستلام في أقرب وقت.</p>
          </div>
        `
      });

      return successResponse({ message: 'تم إرسال التذكير', sentAt: new Date().toISOString() });
    }

    return errorResponse(`الإجراء "${action}" غير معروف`);
  } catch (error) {
    console.error('Error in transmittal POST:', error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg || 'حدث خطأ', 'SERVER_ERROR', 500);
  }
}

// PUT - Update transmittal
export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const { id, items, responses, ...data } = body;

    if (!id) return errorResponse('معرف الإرسال مطلوب');

    const updateData: any = {};
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.deliveryMethod !== undefined) updateData.deliveryMethod = data.deliveryMethod;
    if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.acknowledgedDate !== undefined) updateData.acknowledgedDate = data.acknowledgedDate ? new Date(data.acknowledgedDate) : null;
    if (data.acknowledgedBy !== undefined) updateData.acknowledgedBy = data.acknowledgedBy;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const transmittal = await db.transmittal.update({
      where: { id },
      data: updateData,
      include: { items: true, responses: true }
    });

    return successResponse({
      ...transmittal,
      statusLabel: STATUS_LABELS[transmittal.status as keyof typeof STATUS_LABELS]
    });
  } catch (error) {
    console.error('Error updating transmittal:', error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg || 'فشل في تحديث الإرسال', 'SERVER_ERROR', 500);
  }
}

// DELETE - Delete transmittal
export async function DELETE(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('معرف الإرسال مطلوب');

    await db.transmittalItem.deleteMany({ where: { transmittalId: id } });
    await db.transmittalResponse.deleteMany({ where: { transmittalId: id } });
    await db.transmittal.delete({ where: { id } });

    return successResponse({ message: 'تم حذف الإرسال بنجاح' });
  } catch (error) {
    console.error('Error deleting transmittal:', error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg || 'فشل في حذف الإرسال', 'SERVER_ERROR', 500);
  }
}
