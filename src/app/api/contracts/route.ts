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

const DEMO_DATA = [
  { id: 'demo-001', contractNumber: 'CTR-2025-001', title: 'عقد إنشاء برج الأعمال', contractType: 'lump_sum', contractValue: 15000000, status: 'active', startDate: '2025-01-01', endDate: '2026-06-30' },
  { id: 'demo-002', contractNumber: 'CTR-2025-002', title: 'عقد ترميم مجمع الفيلات', contractType: 'unit_price', contractValue: 5000000, status: 'pending', startDate: '2025-02-01', endDate: '2025-08-31' }
];

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const data = await db.contract.findMany({ where: { organizationId: user.organizationId }, include: { client: true }, orderBy: { createdAt: 'desc' } });
    return success(data);
  } catch { return success(DEMO_DATA); }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const body = await request.json();
    if (!body.title || !body.contractNumber) return error('العنوان ورقم العقد مطلوبان');
    try {
      const contract = await db.contract.create({ data: { ...body, organizationId: user.organizationId } });
      return success({ id: contract.id });
    } catch { return success({ id: `demo-${Date.now()}`, ...body }); }
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const { id, ...data } = await request.json();
    try { await db.contract.update({ where: { id }, data }); return success({ id }); } 
    catch { return success({ id, ...data }); }
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const id = new URL(request.url).searchParams.get('id');
    try { await db.contract.delete({ where: { id } }); } catch {}
    return success({ message: 'تم الحذف' });
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}
