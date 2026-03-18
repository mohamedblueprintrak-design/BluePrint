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
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let invoices = [...DEMO_INVOICES];
    if (status) {
      invoices = invoices.filter(i => i.status === status);
    }
    return successResponse(invoices);
  }

  try {
    const { db } = await import('@/lib/db');
    
    const where: any = { organizationId: user.organizationId };
    if (status) where.status = status;

    const invoices = await db.invoice.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(invoices.map(i => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      clientId: i.clientId,
      client: i.client?.name,
      projectId: i.projectId,
      project: null,
      items: [],
      subtotal: i.subtotal,
      taxRate: i.taxRate,
      taxAmount: i.taxAmount,
      discountAmount: 0,
      total: i.total,
      paidAmount: i.paidAmount,
      status: i.status,
      issueDate: i.issueDate,
      dueDate: i.dueDate,
      createdAt: i.createdAt
    })));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// POST - Create invoice
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create invoices
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن إنشاء فواتير في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const { sendEmail } = await import('@/lib/email');
    const { emailTemplates } = await import('@/lib/email-templates');
    
    const body = await request.json();
    const { clientId, projectId, subtotal, taxRate, dueDate, notes, sendNotification } = body;

    const count = await db.invoice.count({ where: { organizationId: user.organizationId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    
    const calculatedTaxAmount = (subtotal || 0) * (taxRate || 5) / 100;
    const total = (subtotal || 0) + calculatedTaxAmount;

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        projectId,
        subtotal: subtotal || 0,
        taxRate: taxRate || 5,
        taxAmount: calculatedTaxAmount,
        total,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        issueDate: new Date(),
        organizationId: user.organizationId
      },
      include: { client: true }
    });

    // Send email notification if client has email and sendNotification is true
    if (sendNotification !== false && invoice.client?.email) {
      try {
        const notificationSettings = await (db as any).notificationSettings?.findUnique({
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
      }
    }

    return successResponse({ id: invoice.id, invoiceNumber, total });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// PUT - Update invoice status
export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update invoices
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن تحديث الفواتير في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { id, status, paidAmount } = body;

    if (!id) return errorResponse('معرف الفاتورة مطلوب');

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;

    const invoice = await db.invoice.update({
      where: { id, organizationId: user.organizationId },
      data: updateData
    });
    return successResponse(invoice);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// DELETE - Delete invoice
export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete invoices
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن حذف الفواتير في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('معرف الفاتورة مطلوب');

    await db.invoice.delete({
      where: { id, organizationId: user.organizationId }
    });
    return successResponse({ message: 'تم حذف الفاتورة' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}
