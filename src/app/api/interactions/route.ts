import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '../utils/response';

// Supported interaction types
const VALID_INTERACTION_TYPES = ['COMMENT', 'APPROVAL', 'REJECTION', 'REQUEST_CHANGE', 'QUESTION'];

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
    const interactionType = searchParams.get('interactionType');

    if (!projectId) {
      return errorResponse('projectId is required');
    }

    const where: Record<string, unknown> = { projectId };
    if (phaseId) where.phaseId = phaseId;
    if (interactionType && VALID_INTERACTION_TYPES.includes(interactionType)) {
      where.interactionType = interactionType;
    }

    const interactions = await db.clientInteraction.findMany({
      where,
      include: {
        phase: { select: { id: true, phaseType: true, phaseCategory: true } },
        respondedBy: { select: { id: true, fullName: true, avatar: true } },
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
// Supports: COMMENT, APPROVAL, REJECTION, REQUEST_CHANGE, QUESTION
// APPROVAL: auto-updates workflowPhase status to COMPLETED, creates audit log
// REJECTION: increments rejectionCount on phase, sets status to REJECTED
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

    // Validate interactionType
    const type = interactionType || 'COMMENT';
    if (!VALID_INTERACTION_TYPES.includes(type)) {
      return errorResponse(`Invalid interactionType. Must be one of: ${VALID_INTERACTION_TYPES.join(', ')}`);
    }

    // Create the interaction
    const interaction = await db.clientInteraction.create({
      data: {
        projectId,
        phaseId: phaseId || null,
        interactionType: type,
        content,
        respondedById: respondedById || null,
        responseContent: responseContent || null,
        responseDate: responseContent ? new Date() : null,
      },
      include: {
        phase: { select: { id: true, phaseType: true, phaseCategory: true } },
        respondedBy: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    // Auto-update workflow phase based on interaction type
    let phaseUpdateResult = null;

    if (phaseId) {
      if (type === 'APPROVAL') {
        // Set phase to COMPLETED and create audit log
        const updatedPhase = await db.workflowPhase.update({
          where: { id: phaseId },
          data: {
            status: 'COMPLETED',
            endDate: new Date(),
          },
        });

        phaseUpdateResult = { action: 'APPROVED', phaseId, newStatus: 'COMPLETED' };

        // Create audit log entry
        await db.activity.create({
          data: {
            userId: user.id,
            organizationId: user.organizationId,
            projectId,
            entityType: 'WORKFLOW_PHASE',
            entityId: phaseId,
            action: 'APPROVE',
            description: `Phase "${updatedPhase.phaseType}" approved by ${user.fullName || user.username}`,
            oldValue: { status: 'IN_PROGRESS' },
            newValue: { status: 'COMPLETED' },
            metadata: {
              interactionId: interaction.id,
              phaseType: updatedPhase.phaseType,
              phaseCategory: updatedPhase.phaseCategory,
            },
          },
        });

        // Update project progress if applicable
        await updateProjectProgress(projectId);

      } else if (type === 'REJECTION') {
        // Increment rejection count and set status to REJECTED
        const updatedPhase = await db.workflowPhase.update({
          where: { id: phaseId },
          data: {
            status: 'REJECTED',
            rejectionCount: {
              increment: 1,
            },
          },
        });

        phaseUpdateResult = {
          action: 'REJECTED',
          phaseId,
          newStatus: 'REJECTED',
          rejectionCount: updatedPhase.rejectionCount,
        };

        // Create audit log entry
        await db.activity.create({
          data: {
            userId: user.id,
            organizationId: user.organizationId,
            projectId,
            entityType: 'WORKFLOW_PHASE',
            entityId: phaseId,
            action: 'REJECT',
            description: `Phase "${updatedPhase.phaseType}" rejected by ${user.fullName || user.username}. Rejection count: ${updatedPhase.rejectionCount}`,
            oldValue: { status: 'IN_PROGRESS' },
            newValue: { status: 'REJECTED', rejectionCount: updatedPhase.rejectionCount },
            metadata: {
              interactionId: interaction.id,
              phaseType: updatedPhase.phaseType,
              rejectionCount: updatedPhase.rejectionCount,
            },
          },
        });

      } else if (type === 'REQUEST_CHANGE') {
        // Set phase back to IN_PROGRESS if it was in REVIEW
        const currentPhase = await db.workflowPhase.findUnique({
          where: { id: phaseId },
          select: { status: true },
        });

        if (currentPhase && currentPhase.status === 'REVIEW') {
          await db.workflowPhase.update({
            where: { id: phaseId },
            data: { status: 'IN_PROGRESS' },
          });
          phaseUpdateResult = { action: 'CHANGE_REQUESTED', phaseId, newStatus: 'IN_PROGRESS' };
        }
      }
    }

    return successResponse({
      interaction,
      phaseUpdate: phaseUpdateResult,
    });
  } catch (error) {
    console.error('Interactions POST error:', error);
    return serverErrorResponse();
  }
}

// ============================================
// Helper: Update project progress based on phases
// ============================================

async function updateProjectProgress(projectId: string): Promise<void> {
  try {
    const phases = await db.workflowPhase.findMany({
      where: { projectId },
      select: { status: true },
    });

    if (phases.length === 0) return;

    const completed = phases.filter(p => p.status === 'COMPLETED').length;
    const total = phases.length;
    const progressPercentage = Math.round((completed / total) * 100 * 10) / 10;

    await db.project.update({
      where: { id: projectId },
      data: { progressPercentage },
    });
  } catch (error) {
    console.error('Failed to update project progress:', error);
    // Don't throw - this is a side effect
  }
}
