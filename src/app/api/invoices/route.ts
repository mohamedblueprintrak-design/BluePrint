/**
 * Invoices API Route
 * مسار واجهة برمجة التطبيقات للفواتير
 * 
 * Handles CRUD operations for invoices
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';
import { 
  successResponse, 
  errorResponse, 
  unauthorizedResponse, 
  serverErrorResponse,
  validationErrorResponse
} from '../utils/response';
import { invoiceService } from '@/lib/services';
import { prisma } from '@/lib/db';
import { cachedQuery, invalidateCache, buildCacheKey, CACHE_TTL } from '@/lib/cache/query-cache';

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

/**
 * GET - List invoices
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let invoices = [...DEMO_INVOICES];
    if (status) {
      invoices = invoices.filter(i => i.status === status);
    }
    return successResponse(invoices);
  }

  try {
    const cacheKey = buildCacheKey('invoices', 'list', user.organizationId || '', 's', status || '');
    const result = await cachedQuery(
      cacheKey,
      () => invoiceService.getInvoices(
        user.organizationId!,
        { status },
        {}
      ),
      CACHE_TTL.INVOICES
    );

    return successResponse(result.data.map(i => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      clientId: i.clientId,
      client: (i as { client?: { name?: string } }).client?.name,
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
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * POST - Create invoice
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  // Demo mode - cannot create invoices
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن إنشاء فواتير في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { sendEmail } = await import('@/lib/email');
    const { emailTemplates } = await import('@/lib/email-templates');
    
    const body = await request.json();
    const { clientId, projectId, subtotal, taxRate, dueDate, notes, sendNotification } = body;

    const invoice = await invoiceService.createInvoice(
      {
        clientId,
        projectId,
        subtotal: subtotal || 0,
        taxRate: taxRate || 5,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
      },
      user.organizationId,
      user.id
    );

    // Send email notification if client has email and sendNotification is true
    if (sendNotification !== false && clientId) {
      try {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
        });

        if (client?.email) {
          // Default to notifying - NotificationSettings table not in Prisma schema
          // TODO: Add NotificationSettings model to schema when notification preferences are implemented
          let shouldNotify = true;

          if (shouldNotify) {
            const formattedDueDate = dueDate 
              ? new Date(dueDate).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })
              : undefined;

            const emailTemplate = emailTemplates.invoiceCreated(
              client.name,
              invoice.invoiceNumber,
              invoice.total,
              formattedDueDate
            );

            await sendEmail({
              to: client.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError);
      }
    }

    return successResponse({ id: invoice.id, invoiceNumber: invoice.invoiceNumber, total: invoice.total });

    // Invalidate invoice caches on creation
    await invalidateCache('invoices', 'projects');
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * PUT - Update invoice status or record payment
 */
export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  // Demo mode - cannot update invoices
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن تحديث الفواتير في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const body = await request.json();
    const { id, status, paidAmount } = body;

    if (!id) {
      return validationErrorResponse('معرف الفاتورة مطلوب');
    }

    let invoice;
    
    if (paidAmount !== undefined) {
      // Record payment
      invoice = await invoiceService.recordPayment(id, paidAmount, user.organizationId, user.id);
    } else {
      // Update status
      invoice = await invoiceService.updateInvoice(
        id,
        { status },
        user.organizationId,
        user.id
      );
    }

    return successResponse(invoice);

    // Invalidate invoice caches on update
    await invalidateCache('invoices', 'projects');
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * DELETE - Delete invoice
 */
export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  // Demo mode - cannot delete invoices
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن حذف الفواتير في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return validationErrorResponse('معرف الفاتورة مطلوب');
    }

    await invoiceService.deleteInvoice(id, user.organizationId, user.id);
    
    // Invalidate invoice caches on delete
    await invalidateCache('invoices', 'projects');
    return successResponse({ message: 'تم حذف الفاتورة' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
