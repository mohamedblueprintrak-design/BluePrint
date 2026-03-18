import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';

function successResponse(data: any) { return NextResponse.json({ success: true, data }); }
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
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
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

    const supplier = await db.supplier.create({ data: { ...body, organizationId: user.organizationId } });
    return successResponse({ id: supplier.id, name: supplier.name });
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
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
    const { id, ...data } = await request.json();
    const supplier = await db.supplier.update({ where: { id, organizationId: user.organizationId }, data });
    return successResponse(supplier);
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
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
    
    await db.supplier.update({ where: { id }, data: { isActive: false } });
    return successResponse({ message: 'تم حذف المورد' });
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
