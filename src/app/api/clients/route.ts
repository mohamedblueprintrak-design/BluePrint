import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from '../utils/demo-config';

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

// GET - List clients
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

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
    const { db } = await import('@/lib/db');
    const clients = await db.client.findMany({
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
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// POST - Create client
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create real clients
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن إنشاء عملاء في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { name, email, phone, address, city, country, contactPerson, taxNumber, creditLimit, paymentTerms, notes } = body;

    if (!name) return errorResponse('اسم العميل مطلوب');

    const client = await db.client.create({
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
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// PUT - Update client
export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update clients
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن تحديث العملاء في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return errorResponse('معرف العميل مطلوب');

    // Remove fields that don't exist in schema
    const { clientType, totalInvoiced, totalPaid, website, ...validData } = data as any;

    const client = await db.client.update({
      where: { id, organizationId: user.organizationId },
      data: validData
    });
    return successResponse(client);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// DELETE - Delete client
export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete clients
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن حذف العملاء في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('معرف العميل مطلوب');

    await db.client.update({
      where: { id, organizationId: user.organizationId },
      data: { isActive: false }
    });
    return successResponse({ message: 'تم حذف العميل' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}
