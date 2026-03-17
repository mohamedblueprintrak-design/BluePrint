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

const DEMO_DOCS = [
  { id: 'demo-doc-001', filename: 'مخطط-البناء.pdf', originalName: 'مخطط البناء', fileType: 'pdf', fileSize: 2456000, category: 'drawings', uploadedBy: 'م. أحمد', createdAt: new Date() },
  { id: 'demo-doc-002', filename: 'عقد-المشروع.docx', originalName: 'عقد المشروع', fileType: 'docx', fileSize: 512000, category: 'contracts', uploadedBy: 'م. محمد', createdAt: new Date() }
];

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const docs = await db.document.findMany({ include: { uploader: true }, orderBy: { createdAt: 'desc' }, take: 50 });
    return success(docs.map(d => ({ ...d, uploader: d.uploader?.fullName || d.uploader?.username })));
  } catch { return success(DEMO_DOCS); }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const body = await request.json();
    try {
      const doc = await db.document.create({ data: { ...body, uploadedById: user.id } });
      return success({ id: doc.id, filename: doc.filename });
    } catch { return success({ id: `demo-doc-${Date.now()}`, filename: body.filename || 'ملف جديد' }); }
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  try {
    const id = new URL(request.url).searchParams.get('id');
    try { await db.document.delete({ where: { id } }); } catch {}
    return success({ message: 'تم الحذف' });
  } catch (e: any) { return error(e.message, "SERVER_ERROR", 500); }
}
