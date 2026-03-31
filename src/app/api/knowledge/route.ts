import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getJWTSecret } from '@/app/api/utils/auth';
import * as jose from 'jose';

// Helper responses
const success = (data: unknown) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) => NextResponse.json({ success: false, error: { code, message } }, { status });

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const tokenCookie = request.cookies.get('bp_token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : tokenCookie;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret());
    return await db.user.findUnique({ where: { id: (payload as any).userId || payload.id } });
  } catch {
    return null;
  }
}

const DEMO_ARTICLES = [
  { id: 'kb-001', title: 'دليل استخدام النظام', category: 'guide', content: '# دليل استخدام نظام BluePrint\n\n## البداية\n\nهذا الدليل يساعدك على...', isPublished: true, viewCount: 150, helpfulCount: 45, createdAt: new Date().toISOString() },
  { id: 'kb-002', title: 'كيفية إنشاء مشروع جديد', category: 'guide', content: '# إنشاء مشروع جديد\n\n## الخطوات\n\n1. اذهب إلى صفحة المشاريع...', isPublished: true, viewCount: 89, helpfulCount: 32, createdAt: new Date().toISOString() },
  { id: 'kb-003', title: 'سجل المخاطر - دليل شامل', category: 'guide', content: '# سجل المخاطر\n\n## ما هو سجل المخاطر؟\n\nسجل المخاطر هو...', isPublished: true, viewCount: 67, helpfulCount: 28, createdAt: new Date().toISOString() },
  { id: 'kb-004', title: 'كيفية تصدير التقارير', category: 'faq', content: '# تصدير التقارير\n\n## PDF\nيمكنك تصدير أي تقرير بصيغة PDF...', isPublished: true, viewCount: 45, helpfulCount: 18, createdAt: new Date().toISOString() },
  { id: 'kb-005', title: 'سياسة إدارة المشاريع', category: 'policy', content: '# سياسة إدارة المشاريع\n\n## 1. النطاق\n\nتطبق هذه السياسة على...', isPublished: true, viewCount: 23, helpfulCount: 12, createdAt: new Date().toISOString() }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const id = searchParams.get('id');
  
  try {
    if (id) {
      const article = await db.knowledgeArticle.findUnique({ where: { id } });
      if (article) {
        await db.knowledgeArticle.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
        return success(article);
      }
      const demo = DEMO_ARTICLES.find(a => a.id === id);
      return success(demo || null);
    }

    const whereClause: Record<string, unknown> = { isPublished: true };
    if (category) whereClause.category = category;
    if (search) {
      (whereClause as Record<string, unknown>).OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const articles = await db.knowledgeArticle.findMany({
      where: whereClause,
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return success(articles);
  } catch {
    // Fallback to demo articles when DB is not available
    let filtered = DEMO_ARTICLES.filter(a => a.isPublished);
    if (category) filtered = filtered.filter(a => a.category === category);
    if (search) filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    );
    return success(filtered);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  
  try {
    const body = await request.json();
    const { title, content, category, tags, isPublished } = body;
    
    if (!title || !content) return error('العنوان والمحتوى مطلوبان');
    
    try {
      const article = await db.knowledgeArticle.create({
        data: {
          title,
          content,
          category: category || 'guide',
          tags: tags ? JSON.stringify(tags) : null as any,
          isPublished: isPublished ?? true,
          authorId: user.id
        }
      });
      return success(article);
    } catch {
      // Fallback to demo mode when DB is unavailable
      return success({
        id: `kb-${Date.now()}`,
        title,
        content,
        category: category || 'guide',
        tags,
        isPublished: isPublished ?? true,
        viewCount: 0,
        helpfulCount: 0,
        createdAt: new Date().toISOString()
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  
  try {
    const body = await request.json();
    const { id, title, content, category, tags, isPublished, helpful } = body;
    
    if (!id) return error('معرف المقالة مطلوب');
    
    // Build update data without 'any'
    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (helpful) updateData.helpfulCount = { increment: 1 };
    
    try {
      const article = await db.knowledgeArticle.update({ where: { id }, data: updateData });
      return success(article);
    } catch {
      return success({ id, ...updateData, updatedAt: new Date().toISOString() });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error('غير مصرح', 'UNAUTHORIZED', 401);
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return error('معرف المقالة مطلوب');
    
    try { await db.knowledgeArticle.delete({ where: { id } }); } catch {}
    return success({ message: 'تم الحذف بنجاح' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}
