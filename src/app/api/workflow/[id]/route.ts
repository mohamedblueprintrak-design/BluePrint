import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '../utils/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/workflow/[id] - Get phase with its interactions and dependencies
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    const phase = await db.workflowPhase.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, code: true, organizationId: true },
        },
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        dependsOn: {
          select: {
            id: true,
            phaseType: true,
            phaseCategory: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        dependentPhases: {
          select: {
            id: true,
            phaseType: true,
            phaseCategory: true,
            status: true,
          },
        },
        interactions: {
          include: {
            respondedBy: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!phase) {
      return notFoundResponse('Workflow phase not found');
    }

    // Calculate SLA info if applicable
    let slaInfo = null;
    if (phase.slaDays > 0 && phase.startDate) {
      const start = new Date(phase.startDate).getTime();
      const now = Date.now();
      const end = phase.endDate ? new Date(phase.endDate).getTime() : start + phase.slaDays * 24 * 60 * 60 * 1000;
      const totalMs = end - start;
      const elapsedMs = now - start;
      const remainingMs = end - now;
      const progress = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;
      const remainingDays = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

      slaInfo = {
        totalDays: phase.slaDays,
        remainingDays,
        progress: Math.round(progress),
        isOverdue: remainingMs < 0,
        startDate: phase.startDate,
        endDate: phase.endDate || new Date(end).toISOString(),
      };
    }

    return successResponse({
      ...phase,
      slaInfo,
    });
  } catch (error) {
    console.error('Workflow [id] GET error:', error);
    return serverErrorResponse();
  }
}

// PUT /api/workflow/[id] - Update phase status (triggers SLA countdown start when status becomes IN_PROGRESS)
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, assignedToId, notes, slaDays, startDate, endDate, order, phaseType: newPhaseType } = body;

    // Fetch existing phase
    const existingPhase = await db.workflowPhase.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true, organizationId: true } } },
    });

    if (!existingPhase) {
      return notFoundResponse('Workflow phase not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (notes !== undefined) updateData.notes = notes;
    if (slaDays !== undefined) updateData.slaDays = slaDays;
    if (order !== undefined) updateData.order = order;
    if (newPhaseType !== undefined) updateData.phaseType = newPhaseType;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    // Track old values for audit
    const oldValues: Record<string, unknown> = {};
    if (status !== undefined && existingPhase.status !== status) oldValues.status = existingPhase.status;
    if (assignedToId !== undefined && existingPhase.assignedToId !== assignedToId) oldValues.assignedToId = existingPhase.assignedToId;
    if (notes !== undefined && existingPhase.notes !== notes) oldValues.notes = existingPhase.notes;

    // When status becomes IN_PROGRESS, start SLA countdown
    if (status === 'IN_PROGRESS') {
      if (!startDate) {
        // Auto-set startDate to now if not provided
        updateData.startDate = new Date();
      }

      // If no endDate and slaDays > 0, calculate endDate from now
      if (!endDate && existingPhase.slaDays > 0) {
        const slaEnd = new Date();
        slaEnd.setDate(slaEnd.getDate() + existingPhase.slaDays);
        updateData.endDate = slaEnd;
      }
    }

    // Update the phase
    const updatedPhase = await db.workflowPhase.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        dependsOn: { select: { id: true, phaseType: true, status: true } },
        dependentPhases: { select: { id: true, phaseType: true, status: true } },
        interactions: true,
      },
    });

    // When status changes to COMPLETED, check and notify dependent phases
    if (status === 'COMPLETED') {
      const dependentPhases = await db.workflowPhase.findMany({
        where: { dependsOnId: id, status: 'NOT_STARTED' },
        include: { dependsOn: true },
      });

      for (const depPhase of dependentPhases) {
        const allDepsCompleted = await checkAllDependenciesCompleted(depPhase.id);
        if (allDepsCompleted) {
          // Create audit log for each dependent phase that becomes available
          await db.activity.create({
            data: {
              organizationId: existingPhase.project.organizationId,
              projectId: existingPhase.projectId,
              userId: user.id,
              entityType: 'workflow_phase',
              entityId: depPhase.id,
              action: 'UPDATE',
              description: `Phase ${depPhase.phaseType} is now ready to start (dependency completed)`,
              newValue: JSON.stringify({ status: 'available', unblocked: true }),
            },
          });
        }
      }

      // Update linked auto-generated task
      const phaseLabel = existingPhase.phaseType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await db.task.updateMany({
        where: {
          projectId: existingPhase.projectId,
          title: `[Workflow] ${phaseLabel}`,
          status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
        },
        data: { status: 'DONE', completedAt: new Date() },
      });
    }

    // When status changes to REJECTED, increment rejectionCount
    if (status === 'REJECTED') {
      await db.workflowPhase.update({
        where: { id },
        data: { rejectionCount: { increment: 1 } },
      });
    }

    // When status changes to IN_PROGRESS, update linked task
    if (status === 'IN_PROGRESS') {
      const phaseLabel = existingPhase.phaseType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await db.task.updateMany({
        where: {
          projectId: existingPhase.projectId,
          title: `[Workflow] ${phaseLabel}`,
          status: 'TODO',
        },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Create audit log
    await db.activity.create({
      data: {
        organizationId: existingPhase.project.organizationId,
        projectId: existingPhase.projectId,
        userId: user.id,
        entityType: 'workflow_phase',
        entityId: id,
        action: 'UPDATE',
        description: `Updated workflow phase ${existingPhase.phaseType}: ${JSON.stringify(updateData)}`,
        oldValue: Object.keys(oldValues).length > 0 ? JSON.stringify(oldValues) : null,
        newValue: JSON.stringify(updateData),
      },
    });

    return successResponse(updatedPhase);
  } catch (error) {
    console.error('Workflow [id] PUT error:', error);
    return serverErrorResponse();
  }
}

// DELETE /api/workflow/[id] - Delete a phase
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    // Fetch existing phase with project info
    const existingPhase = await db.workflowPhase.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        dependentPhases: { select: { id: true } },
      },
    });

    if (!existingPhase) {
      return notFoundResponse('Workflow phase not found');
    }

    // Check if any phases depend on this one
    if (existingPhase.dependentPhases.length > 0) {
      return errorResponse(
        `Cannot delete phase: ${existingPhase.dependentPhases.length} other phase(s) depend on it`
      );
    }

    // Delete linked auto-generated task if it exists
    const phaseLabel = existingPhase.phaseType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    await db.task.deleteMany({
      where: {
        projectId: existingPhase.projectId,
        title: `[Workflow] ${phaseLabel}`,
      },
    });

    // Create audit log before deletion
    await db.activity.create({
      data: {
        organizationId: existingPhase.project.organizationId,
        projectId: existingPhase.projectId,
        userId: user.id,
        entityType: 'workflow_phase',
        entityId: id,
        action: 'DELETE',
        description: `Deleted workflow phase ${existingPhase.phaseType} from project ${existingPhase.project.name}`,
        oldValue: JSON.stringify({
          phaseType: existingPhase.phaseType,
          phaseCategory: existingPhase.phaseCategory,
          status: existingPhase.status,
        }),
      },
    });

    // Delete the phase (cascade will handle interactions)
    await db.workflowPhase.delete({ where: { id } });

    return successResponse({ message: 'Phase deleted successfully' });
  } catch (error) {
    console.error('Workflow [id] DELETE error:', error);
    return serverErrorResponse();
  }
}

// Helper: check if all dependencies of a phase are COMPLETED
async function checkAllDependenciesCompleted(phaseId: string): Promise<boolean> {
  const phase = await db.workflowPhase.findUnique({
    where: { id: phaseId },
    include: { dependsOn: { select: { id: true, status: true } } },
  });

  if (!phase || !phase.dependsOnId || !phase.dependsOn) return true;
  return phase.dependsOn.status === 'COMPLETED';
}
