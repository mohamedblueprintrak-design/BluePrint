import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_MATERIALS = [
  { id: 'demo-mat-001', materialCode: 'MAT-001', name: 'حديد تسليح 16مم', category: 'حديد', unit: 'طن', unitPrice: 3200, currentStock: 50, minStock: 10, maxStock: 100, isActive: true },
  { id: 'demo-mat-002', materialCode: 'MAT-002', name: 'أسمنت بورتلاندي', category: 'أسمنت', unit: 'كيس', unitPrice: 25, currentStock: 500, minStock: 100, maxStock: 1000, isActive: true },
  { id: 'demo-mat-003', materialCode: 'MAT-003', name: 'رمل أحمر', category: 'ركام', unit: 'م3', unitPrice: 85, currentStock: 200, minStock: 50, maxStock: 500, isActive: true },
  { id: 'demo-mat-004', materialCode: 'MAT-004', name: 'حصى 20مم', category: 'ركام', unit: 'م3', unitPrice: 95, currentStock: 150, minStock: 30, maxStock: 300, isActive: true }
];

// Allowed fields for material creation/update to prevent mass assignment
const ALLOWED_MATERIAL_FIELDS = [
  'name', 'materialCode', 'category', 'unit', 'unitPrice',
  'currentStock', 'minStock', 'maxStock', 'description', 'supplierId',
] as const;

function extractAllowedFields(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const field of ALLOWED_MATERIAL_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    return success(DEMO_MATERIALS);
  }

  try {
    const { db } = await import('@/lib/db');
    const materials = await db.material.findMany({ where: { organizationId: user.organizationId, isActive: true }, orderBy: { name: 'asc' } });
    return success(materials);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create materials
  if (isDemoUser(user.id)) {
    return error('لا يمكن إنشاء مواد في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    if (!body.name || !body.unit) return error('اسم المادة والوحدة مطلوبان');

    // SECURITY: Only allow whitelisted fields
    const materialData = extractAllowedFields(body);
    materialData.organizationId = user.organizationId;

    const material = await db.material.create({ data: materialData });
    return success({ id: material.id, name: material.name });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update materials
  if (isDemoUser(user.id)) {
    return error('لا يمكن تحديث المواد في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const { id, ...body } = await request.json();
    if (!id) return error('معرف المادة مطلوب');

    // SECURITY: Only allow whitelisted fields + verify ownership
    const materialData = extractAllowedFields(body);

    // Verify the material belongs to the user's organization
    const existing = await db.material.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) return error('المادة غير موجودة', 'NOT_FOUND', 404);

    await db.material.update({ where: { id }, data: materialData });
    return success({ id, ...materialData });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete materials
  if (isDemoUser(user.id)) {
    return error('لا يمكن حذف المواد في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return error('معرف المادة مطلوب');

    // SECURITY: Verify the material belongs to the user's organization
    const existing = await db.material.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) return error('المادة غير موجودة', 'NOT_FOUND', 404);

    await db.material.update({ where: { id }, data: { isActive: false } });
    return success({ message: 'تم الحذف' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}
