import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '../utils/response';

// GET /api/workflow?projectId=xxx - List workflow phases for a project
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return errorResponse('projectId is required');
    }

    const phases = await db.workflowPhase.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        dependsOn: { select: { id: true, phaseType: true, phaseCategory: true } },
      },
      orderBy: { order: 'asc' },
    });

    // Group phases by category
    const grouped: Record<string, typeof phases> = {};
    for (const phase of phases) {
      const cat = phase.phaseCategory || 'OTHER';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(phase);
    }

    return successResponse({
      phases,
      grouped,
    });
  } catch (error) {
    console.error('Workflow GET error:', error);
    return serverErrorResponse();
  }
}

// PUT /api/workflow - Update a workflow phase
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return errorResponse('Phase ID is required');
    }

    // Convert date strings if present
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const phase = await db.workflowPhase.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    return successResponse({ phase });
  } catch (error) {
    console.error('Workflow PUT error:', error);
    return serverErrorResponse();
  }
}

// POST /api/workflow - Create workflow phases for a project (bulk seed)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { projectId, phases } = body;

    if (!projectId) {
      return errorResponse('projectId is required');
    }

    const created = await db.workflowPhase.createMany({
      data: phases.map((p: { phaseType: string; phaseCategory: string; order: number; slaDays?: number; assignedToId?: string }, i: number) => ({
        projectId,
        phaseType: p.phaseType,
        phaseCategory: p.phaseCategory,
        order: p.order ?? i,
        slaDays: p.slaDays ?? 0,
        assignedToId: p.assignedToId ?? null,
        status: 'NOT_STARTED',
      })),
    });

    return successResponse({ count: created.count });
  } catch (error) {
    console.error('Workflow POST error:', error);
    return serverErrorResponse();
  }
}
