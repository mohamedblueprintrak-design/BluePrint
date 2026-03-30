import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';

function successResponse(data: unknown) { return NextResponse.json({ success: true, data }); }
function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

const DEMO_SUPPLIERS = [
  { id: 'demo-supp-001', name: 'شركة مواد البناء المتحدة', supplierType: 'materials', email: 'info@unitedmaterials.ae', phone: '+971 50 111 2222', contactPerson: 'محمد عبدالله', rating: 4.5, isActive: true },
  { id: 'demo-supp-002', name: 'مؤسسة الأمان للمعدات', supplierType: 'equipment', email: 'sales@aman-equipment.ae', phone: '+971 50 333 4444', contactPerson: 'خالد أحمد', rating: 4.8, isActive: true },
];

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    return successResponse(DEMO_SUPPLIERS);
  }

  try {
    const { db } = await import('@/lib/db');
    const suppliers = await db.supplier.findMany({ where: { organizationId: user.organizationId, isActive: true }, orderBy: { name: 'asc' } });
    return successResponse(suppliers);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create suppliers
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن إنشاء موردين في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    if (!body.name) return errorResponse('اسم المورد مطلوب');

    // SECURITY: Only allow specific fields (prevent mass assignment)
    const supplierData: Record<string, unknown> = {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      contactPerson: body.contactPerson || null,
      supplierType: body.supplierType || null,
      rating: body.rating || null,
      organizationId: user.organizationId,
    };
    const supplier = await db.supplier.create({ data: supplierData as any });
    return successResponse({ id: supplier.id, name: supplier.name });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update suppliers
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن تحديث الموردين في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json() as Record<string, unknown>;
    const id = body.id as string;
    // SECURITY: Only allow updating specific fields (prevent mass assignment)
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson;
    if (body.supplierType !== undefined) updateData.supplierType = body.supplierType;
    if (body.rating !== undefined) updateData.rating = body.rating;
    const supplier = await db.supplier.update({ where: { id, organizationId: user.organizationId }, data: updateData });
    return successResponse(supplier);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete suppliers
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن حذف الموردين في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('معرف المورد مطلوب');
    
    await db.supplier.update({ where: { id, organizationId: user.organizationId }, data: { isActive: false } });
    return successResponse({ message: 'تم حذف المورد' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}
