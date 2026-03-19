/**
 * Clients API Route
 * مسار واجهة برمجة التطبيقات للعملاء
 * 
 * Handles CRUD operations for clients
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from '../utils/demo-config';
import { 
  successResponse, 
  errorResponse, 
  unauthorizedResponse, 
  serverErrorResponse,
  validationErrorResponse
} from '../utils/response';
import { prisma } from '@/lib/db';

/**
 * GET - List clients
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    return successResponse(DEMO_DATA.clients.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      isActive: c.isActive,
      createdAt: new Date()
    })));
  }

  try {
    const clients = await prisma.client.findMany({
      where: { 
        isActive: true,
        organizationId: user.organizationId 
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return successResponse(clients.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city,
      country: c.country,
      contactPerson: c.contactPerson,
      taxNumber: c.taxNumber,
      creditLimit: c.creditLimit,
      paymentTerms: c.paymentTerms,
      notes: c.notes,
      isActive: c.isActive,
      createdAt: c.createdAt
    })));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * POST - Create client
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  // Demo mode - cannot create real clients
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن إنشاء عملاء في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const body = await request.json();
    const { name, email, phone, address, city, country, contactPerson, taxNumber, creditLimit, paymentTerms, notes } = body;

    if (!name) {
      return validationErrorResponse('اسم العميل مطلوب');
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        country,
        contactPerson,
        taxNumber,
        creditLimit: creditLimit || 0,
        paymentTerms: paymentTerms || 30,
        notes,
        organizationId: user.organizationId
      }
    });

    return successResponse({ id: client.id, name: client.name });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * PUT - Update client
 */
export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  // Demo mode - cannot update clients
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن تحديث العملاء في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return validationErrorResponse('معرف العميل مطلوب');
    }

    // Remove fields that don't exist in schema
    const { clientType, totalInvoiced, totalPaid, website, ...validData } = data as Record<string, unknown>;

    const client = await prisma.client.update({
      where: { id, organizationId: user.organizationId },
      data: validData
    });

    return successResponse(client);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * DELETE - Soft delete client
 */
export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  // Demo mode - cannot delete clients
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن حذف العملاء في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return validationErrorResponse('معرف العميل مطلوب');
    }

    await prisma.client.update({
      where: { id, organizationId: user.organizationId },
      data: { isActive: false }
    });

    return successResponse({ message: 'تم حذف العميل' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
