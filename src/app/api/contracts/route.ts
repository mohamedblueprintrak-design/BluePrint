import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

const DEMO_CONTRACTS = [
  { id: 'demo-001', contractNumber: 'CTR-2025-001', title: 'عقد إنشاء برج الأعمال', contractType: 'lump_sum', contractValue: 15000000, status: 'active', startDate: '2025-01-01', endDate: '2026-06-30' },
  { id: 'demo-002', contractNumber: 'CTR-2025-002', title: 'عقد ترميم مجمع الفيلات', contractType: 'unit_price', contractValue: 5000000, status: 'pending', startDate: '2025-02-01', endDate: '2025-08-31' }
];

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    return success(DEMO_CONTRACTS);
  }

  try {
    const { db } = await import('@/lib/db');
    const data = await db.contract.findMany({ where: { organizationId: user.organizationId }, orderBy: { createdAt: 'desc' } });
    return success(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create contracts
  if (isDemoUser(user.id)) {
    return error('لا يمكن إنشاء عقود في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    if (!body.title || !body.contractNumber) return error('العنوان ورقم العقد مطلوبان');
    // SECURITY: Only allow specific fields (prevent mass assignment)
    const contractData: Record<string, unknown> = {
      title: body.title,
      contractNumber: body.contractNumber,
      contractType: body.contractType || null,
      contractValue: body.contractValue || null,
      status: body.status || 'pending',
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      description: body.description || null,
      clientId: body.clientId || null,
      organizationId: user.organizationId,
    };
    const contract = await db.contract.create({ data: contractData });
    return success({ id: contract.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot update contracts
  if (isDemoUser(user.id)) {
    return error('لا يمكن تحديث العقود في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json() as Record<string, unknown>;
    const id = body.id as string;
    // SECURITY: Only allow updating specific fields (prevent mass assignment)
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.contractNumber !== undefined) updateData.contractNumber = body.contractNumber;
    if (body.contractType !== undefined) updateData.contractType = body.contractType;
    if (body.contractValue !== undefined) updateData.contractValue = body.contractValue;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate as string) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate as string) : null;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.clientId !== undefined) updateData.clientId = body.clientId;
    await db.contract.update({ where: { id }, data: updateData });
    return success({ id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot delete contracts
  if (isDemoUser(user.id)) {
    return error('لا يمكن حذف العقود في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const { db } = await import('@/lib/db');
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return error('معرف العقد مطلوب');
    await db.contract.delete({ where: { id } });
    return success({ message: 'تم الحذف' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, 'SERVER_ERROR', 500);
  }
}
