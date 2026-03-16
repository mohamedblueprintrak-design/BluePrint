import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';

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

// Demo invoices
const DEMO_INVOICES = [
  {
    id: 'demo-inv-001',
    invoiceNumber: 'INV-2025-0001',
    clientId: 'demo-client-001',
    client: 'شركة البناء الحديث',
    projectId: null,
    project: null,
    items: [],
    subtotal: 50000,
    taxRate: 5,
    taxAmount: 2500,
    discountAmount: 0,
    total: 52500,
    paidAmount: 40000,
    status: 'partial',
    issueDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-15'),
    createdAt: new Date()
  },
  {
    id: 'demo-inv-002',
    invoiceNumber: 'INV-2025-0002',
    clientId: 'demo-client-002',
    client: 'مؤسسة الخليج للمقاولات',
    projectId: null,
    project: null,
    items: [],
    subtotal: 75000,
    taxRate: 5,
    taxAmount: 3750,
    discountAmount: 0,
    total: 78750,
    paidAmount: 0,
    status: 'sent',
    issueDate: new Date('2025-01-20'),
    dueDate: new Date('2025-02-20'),
    createdAt: new Date()
  }
];

// GET - List invoices
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status;

      const invoices = await db.invoice.findMany({
        where,
        include: { client: true, project: true },
        orderBy: { createdAt: 'desc' }
      });

      return successResponse(invoices.map(i => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        clientId: i.clientId,
        client: i.client?.name,
        projectId: i.projectId,
        project: i.project?.name,
        items: i.items ? JSON.parse(i.items as string) : [],
        subtotal: i.subtotal,
        taxRate: i.taxRate,
        taxAmount: i.taxAmount,
        discountAmount: i.discountAmount,
        total: i.total,
        paidAmount: i.paidAmount,
        status: i.status,
        issueDate: i.issueDate,
        dueDate: i.dueDate,
        createdAt: i.createdAt
      })));
    } catch (dbError) {
      // Demo mode
      let invoices = DEMO_INVOICES;
      if (status) {
        invoices = invoices.filter(i => i.status === status);
      }
      return successResponse(invoices);
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// POST - Create invoice
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const { clientId, projectId, items, subtotal, taxRate, discountAmount, dueDate, notes, terms, sendNotification } = body;

    try {
      const count = await db.invoice.count({ where: { organizationId: user.organizationId } });
      const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
      
      const taxAmount = (subtotal || 0) * (taxRate || 5) / 100;
      const total = (subtotal || 0) + taxAmount - (discountAmount || 0);

      const invoice = await db.invoice.create({
        data: {
          invoiceNumber,
          clientId,
          projectId,
          items: JSON.stringify(items || []),
          subtotal: subtotal || 0,
          taxRate: taxRate || 5,
          taxAmount,
          discountAmount: discountAmount || 0,
          total,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
          terms,
          issueDate: new Date(),
          organizationId: user.organizationId
        },
        include: { client: true }
      });

      // Send email notification if client has email and sendNotification is true
      if (sendNotification !== false && invoice.client?.email) {
        try {
          // Check if user has email notifications enabled for invoices
          const notificationSettings = await db.notificationSettings.findUnique({
            where: { userId: user.id }
          });

          if (!notificationSettings || notificationSettings.emailInvoices) {
            const formattedDueDate = dueDate 
              ? new Date(dueDate).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })
              : undefined;

            const emailTemplate = emailTemplates.invoiceCreated(
              invoice.client.name,
              invoiceNumber,
              total,
              formattedDueDate
            );

            await sendEmail({
              to: invoice.client.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text
            });
          }
        } catch (emailError) {
          console.error('Failed to send invoice email:', emailError);
          // Don't fail the request if email fails
        }
      }

      return successResponse({ id: invoice.id, invoiceNumber, total });
    } catch (dbError) {
      // Demo mode
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      const taxAmount = (subtotal || 0) * (taxRate || 5) / 100;
      const total = (subtotal || 0) + taxAmount - (discountAmount || 0);

      // In demo mode, simulate email sending
      if (sendNotification !== false && clientId) {
        try {
          const client = await db.client.findUnique({ where: { id: clientId } });
          if (client?.email) {
            const formattedDueDate = dueDate 
              ? new Date(dueDate).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })
              : undefined;

            const emailTemplate = emailTemplates.invoiceCreated(
              client.name,
              invoiceNumber,
              total,
              formattedDueDate
            );

            await sendEmail({
              to: client.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text
            });
          }
        } catch (emailError) {
          console.error('Failed to send invoice email (demo):', emailError);
        }
      }

      return successResponse({ 
        id: `demo-inv-${Date.now()}`, 
        invoiceNumber, 
        total,
        message: 'تم إنشاء الفاتورة (وضع تجريبي)'
      });
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// PUT - Update invoice status
export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const { id, status, paidAmount } = body;

    if (!id) return errorResponse('معرف الفاتورة مطلوب');

    try {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (paidAmount !== undefined) updateData.paidAmount = paidAmount;

      const invoice = await db.invoice.update({
        where: { id, organizationId: user.organizationId },
        data: updateData
      });
      return successResponse(invoice);
    } catch (dbError) {
      return successResponse({ id, status, message: 'تم التحديث (وضع تجريبي)' });
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// DELETE - Delete invoice
export async function DELETE(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('معرف الفاتورة مطلوب');

    try {
      await db.invoice.delete({
        where: { id, organizationId: user.organizationId }
      });
      return successResponse({ message: 'تم حذف الفاتورة' });
    } catch (dbError) {
      return successResponse({ message: 'تم الحذف (وضع تجريبي)' });
    }
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
