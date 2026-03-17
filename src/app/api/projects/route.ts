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
    return await db.user.findUnique({ 
      where: { id: payload.userId as string },
      include: { organization: true }
    });
  } catch {
    return null;
  }
}

function successResponse(data: any, meta?: any) {
  const response = { success: true, data };
  if (meta) Object.assign(response, { meta });
  return NextResponse.json(response);
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// GET - List projects
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  const orgId = user.organizationId;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where: any = { organizationId: orgId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { projectNumber: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } }
    ];
  }

  try {
    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: { client: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.project.count({ where })
    ]);

    return successResponse(
      projects.map(p => ({
        id: p.id,
        name: p.name,
        projectNumber: p.projectNumber,
        location: p.location,
        status: p.status,
        contractValue: p.contractValue,
        clientId: p.clientId,
        client: p.client?.name,
        progressPercentage: p.progressPercentage,
        createdAt: p.createdAt
      })),
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}

// POST - Create project
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  const orgId = user.organizationId;

  try {
    const body = await request.json();
    const { name, location, projectType, clientId, contractValue, description, managerId } = body;

    if (!name) return errorResponse('اسم المشروع مطلوب');

    const count = await db.project.count({ where: { organizationId: orgId } });
    const projectNumber = `PRJ-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const project = await db.project.create({
      data: {
        name,
        projectNumber,
        location: location || '',
        projectType,
        clientId,
        contractValue: contractValue ? parseFloat(contractValue) : 0,
        description,
        managerId,
        organizationId: orgId
      }
    });

    // Create activity log
    await db.activity.create({
      data: {
        userId: user.id,
        projectId: project.id,
        entityType: 'project',
        entityId: project.id,
        action: 'create',
        description: `تم إنشاء مشروع جديد: ${project.name}`,
        newValue: JSON.stringify(project),
        organizationId: orgId
      }
    });

    return successResponse({ id: project.id, projectNumber, name });
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
