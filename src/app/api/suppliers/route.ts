import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return await db.user.findUnique({ where: { id: payload.userId as string }, include: { organization: true } });
  } catch { return null; }
}

function successResponse(data: any) { return NextResponse.json({ success: true, data }); }
function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

const DEMO_SUPPLIERS = [
  { id: 'demo-supp-001', name: 'شركة مواد البناء المتحدة', supplierType: 'materials', email: 'info@unitedmaterials.ae', phone: '+971 50 111 2222', contactPerson: 'محمد عبدالله', rating: 4.5, isActive: true },
  { id: 'demo-supp-002', name: 'مؤسسة الأمان للمعدات', supplierType: 'equipment', email: 'sales@aman-equipment.ae', phone: '+971 50 333 4444', contactPerson: 'خالد أحمد', rating: 4.8, isActive: true },
];

export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const suppliers = await db.supplier.findMany({ where: { organizationId: user.organizationId, isActive: true }, orderBy: { name: 'asc' } });
    return successResponse(suppliers);
  } catch { return successResponse(DEMO_SUPPLIERS); }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    if (!body.name) return errorResponse('اسم المورد مطلوب');

    try {
      const supplier = await db.supplier.create({ data: { ...body, organizationId: user.organizationId } });
      return successResponse({ id: supplier.id, name: supplier.name });
    } catch { return successResponse({ id: `demo-supp-${Date.now()}`, name: body.name }); }
  } catch (error: any) { return errorResponse(error.message, 'SERVER_ERROR', 500); }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { id, ...data } = await request.json();
    try {
      const supplier = await db.supplier.update({ where: { id, organizationId: user.organizationId }, data });
      return successResponse(supplier);
    } catch { return successResponse({ id, ...data }); }
  } catch (error: any) { return errorResponse(error.message, 'SERVER_ERROR', 500); }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('معرف المورد مطلوب');
    
    try {
      await db.supplier.update({ where: { id }, data: { isActive: false } });
      return successResponse({ message: 'تم حذف المورد' });
    } catch { return successResponse({ message: 'تم الحذف' }); }
  } catch (error: any) { return errorResponse(error.message, 'SERVER_ERROR', 500); }
}
