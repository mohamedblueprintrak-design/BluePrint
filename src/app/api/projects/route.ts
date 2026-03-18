import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from '../utils/demo-config';

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
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let filteredProjects = [...DEMO_DATA.projects];
    
    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.projectNumber.toLowerCase().includes(searchLower) ||
        p.location.toLowerCase().includes(searchLower)
      );
    }
    
    const total = filteredProjects.length;
    const startIndex = (page - 1) * limit;
    const paginatedProjects = filteredProjects.slice(startIndex, startIndex + limit);
    
    return successResponse(
      paginatedProjects.map(p => ({
        id: p.id,
        name: p.name,
        projectNumber: p.projectNumber,
        location: p.location,
        status: p.status,
        contractValue: p.contractValue,
        clientId: p.clientId,
        client: p.client,
        progressPercentage: p.progressPercentage,
        createdAt: p.createdAt
      })),
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  }

  // Real database queries for actual users
  const orgId = user.organizationId;

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
    const { db } = await import('@/lib/db');
    
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
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// POST - Create project
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - cannot create real projects
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن إنشاء مشاريع في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  const orgId = user.organizationId;

  try {
    const { db } = await import('@/lib/db');
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
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}
