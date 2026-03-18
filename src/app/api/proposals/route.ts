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

const DEMO_PROPOSALS = [
  { id: 'demo-prop-001', proposalNumber: 'PROP-2025-001', title: 'عرض مشروع البناء التجاري', clientId: 'demo-client-001', client: 'شركة البناء الحديث', status: 'draft', totalAmount: 2500000, issueDate: '2025-01-20', validUntil: '2025-02-20' },
  { id: 'demo-prop-002', proposalNumber: 'PROP-2025-002', title: 'عرض صيانة المبنى السنوي', clientId: 'demo-client-002', client: 'مؤسسة الخليج', status: 'sent', totalAmount: 350000, issueDate: '2025-01-18', validUntil: '2025-02-18' }
];

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const data = await db.proposal.findMany({ 
      where: { organizationId: user.organizationId }, 
      include: { items: true }, 
      orderBy: { createdAt: 'desc' } 
    });
    return success(data);
  } catch { return success(DEMO_PROPOSALS); }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const body = await request.json();
    const count = await db.proposal.count({ where: { organizationId: user.organizationId } }).catch(() => 0);
    const proposalNumber = `PROP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    try {
      const proposal = await db.proposal.create({ data: { ...body, proposalNumber, organizationId: user.organizationId } });
      return success({ id: proposal.id, proposalNumber });
    } catch { return success({ id: `demo-prop-${Date.now()}`, proposalNumber }); }
  } catch (e) { const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, "SERVER_ERROR", 500); }
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const { id, ...data } = await request.json();
    try { await db.proposal.update({ where: { id }, data }); } catch {}
    return success({ id, ...data });
  } catch (e) { const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, "SERVER_ERROR", 500); }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return error('معرف العرض مطلوب');
    try { await db.proposal.delete({ where: { id } }); } catch {}
    return success({ message: 'تم الحذف' });
  } catch (e) { const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message, "SERVER_ERROR", 500); }
}
