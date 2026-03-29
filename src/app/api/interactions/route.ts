import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '../utils/response';

// GET /api/interactions?projectId=xxx - List client interactions for a project
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const phaseId = searchParams.get('phaseId');

    if (!projectId) {
      return errorResponse('projectId is required');
    }

    const where: Record<string, unknown> = { projectId };
    if (phaseId) where.phaseId = phaseId;

    const interactions = await db.clientInteraction.findMany({
      where,
      include: {
        phase: { select: { id: true, phaseType: true, phaseCategory: true } },
        respondedBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ interactions });
  } catch (error) {
    console.error('Interactions GET error:', error);
    return serverErrorResponse();
  }
}

// POST /api/interactions - Create a client interaction
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { projectId, phaseId, interactionType, content, respondedById, responseContent } = body;

    if (!projectId || !content) {
      return errorResponse('projectId and content are required');
    }

    const interaction = await db.clientInteraction.create({
      data: {
        projectId,
        phaseId: phaseId || null,
        interactionType: interactionType || 'COMMENT',
        content,
        respondedById: respondedById || null,
        responseContent: responseContent || null,
        responseDate: responseContent ? new Date() : null,
      },
      include: {
        phase: { select: { id: true, phaseType: true, phaseCategory: true } },
        respondedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    return successResponse({ interaction });
  } catch (error) {
    console.error('Interactions POST error:', error);
    return serverErrorResponse();
  }
}
