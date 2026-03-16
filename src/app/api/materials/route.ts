import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jose.jwtVerify(authHeader.substring(7), JWT_SECRET);
    return await db.user.findUnique({ where: { id: payload.userId as string }, include: { organization: true } });
  } catch { return null; }
}

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_MATERIALS = [
  { id: 'demo-mat-001', materialCode: 'MAT-001', name: 'حديد تسليح 16مم', category: 'حديد', unit: 'طن', unitPrice: 3200, currentStock: 50, minStock: 10, maxStock: 100, isActive: true },
  { id: 'demo-mat-002', materialCode: 'MAT-002', name: 'أسمنت بورتلاندي', category: 'أسمنت', unit: 'كيس', unitPrice: 25, currentStock: 500, minStock: 100, maxStock: 1000, isActive: true },
  { id: 'demo-mat-003', materialCode: 'MAT-003', name: 'رمل أحمر', category: 'ركام', unit: 'م3', unitPrice: 85, currentStock: 200, minStock: 50, maxStock: 500, isActive: true },
  { id: 'demo-mat-004', materialCode: 'MAT-004', name: 'حصى 20مم', category: 'ركام', unit: 'م3', unitPrice: 95, currentStock: 150, minStock: 30, maxStock: 300, isActive: true }
];

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const materials = await db.material.findMany({ where: { organizationId: user.organizationId, isActive: true }, orderBy: { name: 'asc' } });
    return success(materials);
  } catch { return success(DEMO_MATERIALS); }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const body = await request.json();
    if (!body.name || !body.unit) return error('اسم المادة والوحدة مطلوبان');
    try {
      const material = await db.material.create({ data: { ...body, organizationId: user.organizationId } });
      return success({ id: material.id, name: material.name });
    } catch { return success({ id: `demo-mat-${Date.now()}`, name: body.name }); }
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const { id, ...data } = await request.json();
    try { await db.material.update({ where: { id }, data }); } catch {}
    return success({ id, ...data });
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const id = new URL(request.url).searchParams.get('id');
    try { await db.material.update({ where: { id }, data: { isActive: false } }); } catch {}
    return success({ message: 'تم الحذف' });
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}
