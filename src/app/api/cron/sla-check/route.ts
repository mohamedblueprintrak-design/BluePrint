/**
 * SLA Check Cron Endpoint
 * نقطة نهاية للتحقق من SLA عبر المهام المجدولة
 *
 * Should be called every hour by a cron scheduler (Vercel Cron, node-cron, etc.)
 *
 * Logic:
 * 1. Find all tasks with slaStartDate set and status IN_PROGRESS
 * 2. Calculate days elapsed since slaStartDate
 * 3. If elapsed > slaDays -> create/update SLABreach record
 * 4. If elapsed >= slaWarningDays and not yet breached -> create WARNING breach
 * 5. Send notifications for new breaches
 * 6. Resolve breaches for completed tasks
 * 7. Auto-escalate: create notifications for manager on breach
 * 8. Critical state (2x SLA): create urgent notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, isDatabaseAvailable } from '@/lib/db';

// ============================================
// Cron Job Secret Validation
// ============================================

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow without secret
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // In production, require valid secret
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// ============================================
// Notification Helpers
// ============================================

/**
 * Create a notification for a user about SLA breach
 */
async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  referenceType: string;
  referenceId: string;
  priority: 'NORMAL' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notificationType: string;
  actionUrl?: string;
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        priority: params.priority,
        notificationType: params.notificationType,
        actionUrl: params.actionUrl || `/projects/${params.referenceId}`,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

/**
 * Get managers for a project (project manager + org admins)
 */
async function getProjectManagers(projectId: string, organizationId: string | null): Promise<Array<{ id: string }>> {
  try {
    const managers: Array<{ id: string }> = [];

    // Get project manager
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { managerId: true },
    });
    if (project?.managerId) {
      managers.push({ id: project.managerId });
    }

    // Get task assignees for notifications
    const taskAssignees = await db.task.findMany({
      where: { projectId, assignedTo: { not: null }, status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] } },
      select: { assignedTo: true },
      distinct: ['assignedTo'],
    });
    for (const ta of taskAssignees) {
      if (ta.assignedTo && !managers.find(m => m.id === ta.assignedTo)) {
        managers.push({ id: ta.assignedTo });
      }
    }

    // Get organization admins
    if (organizationId) {
      const admins = await db.user.findMany({
        where: { organizationId, role: 'ADMIN', isActive: true },
        select: { id: true },
      });
      for (const admin of admins) {
        if (!managers.find(m => m.id === admin.id)) {
          managers.push({ id: admin.id });
        }
      }
    }

    return managers;
  } catch {
    return [];
  }
}

// ============================================
// Main Handler
// ============================================

export async function GET(request: NextRequest) {
  // Validate authorization
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid or missing cron secret' },
      { status: 401 }
    );
  }

  if (!isDatabaseAvailable()) {
    return NextResponse.json({
      success: false,
      message: 'Database not available - running in demo mode',
      checkedAt: new Date().toISOString(),
    });
  }

  try {
    const now = new Date();

    // Find all active tasks with SLA tracking
    const tasks = await db.task.findMany({
      where: {
        slaStartDate: { not: null },
        status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
        deletedAt: null,
      },
      include: {
        project: {
          select: { id: true, name: true, organizationId: true },
        },
      },
    });

    let warningsCreated = 0;
    let breachesCreated = 0;
    let criticalEscalations = 0;
    let notificationsSent = 0;
    let resolvedCount = 0;
    const escalationDetails: Array<Record<string, unknown>> = [];

    for (const task of tasks) {
      if (!task.slaStartDate || !task.slaDays) continue;

      const startDate = new Date(task.slaStartDate);
      const elapsedMs = now.getTime() - startDate.getTime();
      const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

      // CRITICAL STATE: 2x the SLA days
      if (elapsedDays >= task.slaDays * 2) {
        const existingBreach = await db.sLABreach.findFirst({
          where: {
            taskId: task.id,
            status: { in: ['WARNING', 'BREACHED', 'CRITICAL'] },
          },
        });

        if (!existingBreach || existingBreach.status !== 'CRITICAL') {
          // Create or upgrade to CRITICAL breach
          await db.sLABreach.upsert({
            where: { id: existingBreach?.id || '' },
            create: {
              taskId: task.id,
              projectId: task.projectId,
              status: 'CRITICAL',
              daysElapsed: elapsedDays,
              slaDays: task.slaDays,
              breachDays: elapsedDays - task.slaDays,
              notifiedAt: now,
            },
            update: {
              status: 'CRITICAL',
              daysElapsed: elapsedDays,
              breachDays: elapsedDays - task.slaDays,
              notifiedAt: now,
              resolutionNotes: 'Escalated to CRITICAL - 2x SLA exceeded',
            },
          });
          criticalEscalations++;

          // Send urgent notification to managers and admins
          const managers = await getProjectManagers(
            task.projectId || '',
            task.project?.organizationId || null
          );

          for (const manager of managers) {
            await createNotification({
              userId: manager.id,
              title: `URGENT: SLA Critically Breached - ${task.title}`,
              message: `Task "${task.title}" in project "${task.project?.name || 'N/A'}" has exceeded 2x the SLA deadline (${task.slaDays} days). Currently ${elapsedDays} days elapsed. Immediate action required.`,
              referenceType: 'TASK',
              referenceId: task.projectId || task.id,
              priority: 'URGENT',
              notificationType: 'approval',
            });
            notificationsSent++;
          }

          escalationDetails.push({
            taskId: task.id,
            taskTitle: task.title,
            projectName: task.project?.name,
            severity: 'CRITICAL',
            elapsedDays,
            slaDays: task.slaDays,
            notifiedManagers: managers.length,
          });

          // Also mark the task as breached
          if (!task.slaBreachedAt) {
            await db.task.update({
              where: { id: task.id },
              data: { slaBreachedAt: now },
            });
          }
        }
      } else if (elapsedDays >= task.slaDays) {
        // BREACHED - SLA deadline exceeded
        const existingBreach = await db.sLABreach.findFirst({
          where: {
            taskId: task.id,
            status: { in: ['WARNING', 'BREACHED'] },
          },
        });

        if (!existingBreach) {
          await db.sLABreach.create({
            data: {
              taskId: task.id,
              projectId: task.projectId,
              status: 'BREACHED',
              daysElapsed: elapsedDays,
              slaDays: task.slaDays,
              breachDays: elapsedDays - task.slaDays,
              notifiedAt: now,
            },
          });
          breachesCreated++;

          // Auto-escalation: notify manager on breach
          const managers = await getProjectManagers(
            task.projectId || '',
            task.project?.organizationId || null
          );

          for (const manager of managers) {
            await createNotification({
              userId: manager.id,
              title: `SLA Breached - ${task.title}`,
              message: `Task "${task.title}" in project "${task.project?.name || 'N/A'}" has exceeded its SLA deadline of ${task.slaDays} days. Currently ${elapsedDays} days elapsed (${elapsedDays - task.slaDays} days overdue).`,
              referenceType: 'TASK',
              referenceId: task.projectId || task.id,
              priority: 'HIGH',
              notificationType: 'task',
            });
            notificationsSent++;
          }

          escalationDetails.push({
            taskId: task.id,
            taskTitle: task.title,
            projectName: task.project?.name,
            severity: 'BREACHED',
            elapsedDays,
            slaDays: task.slaDays,
            notifiedManagers: managers.length,
          });

          // Mark the task as breached
          if (!task.slaBreachedAt) {
            await db.task.update({
              where: { id: task.id },
              data: { slaBreachedAt: now },
            });
          }
        }
      } else if (task.slaWarningDays && elapsedDays >= task.slaWarningDays) {
        // WARNING - approaching SLA deadline
        const existingBreach = await db.sLABreach.findFirst({
          where: {
            taskId: task.id,
            status: 'WARNING',
          },
        });

        if (!existingBreach) {
          await db.sLABreach.create({
            data: {
              taskId: task.id,
              projectId: task.projectId,
              status: 'WARNING',
              daysElapsed: elapsedDays,
              slaDays: task.slaDays,
              breachDays: 0,
            },
          });
          warningsCreated++;
        }
      }
    }

    // Resolve breaches for completed tasks
    const completedBreaches = await db.sLABreach.findMany({
      where: {
        status: { in: ['WARNING', 'BREACHED', 'CRITICAL'] },
        task: { status: 'DONE' },
      },
      include: { task: true },
    });

    for (const breach of completedBreaches) {
      await db.sLABreach.update({
        where: { id: breach.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionNotes: 'Task completed',
        },
      });
      resolvedCount++;
    }

    return NextResponse.json({
      success: true,
      checkedAt: now.toISOString(),
      tasksChecked: tasks.length,
      warningsCreated,
      breachesCreated,
      criticalEscalations,
      notificationsSent,
      resolvedBreaches: resolvedCount,
      escalations: escalationDetails,
    });
  } catch (error) {
    console.error('SLA cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST Handler for Manual Trigger
// ============================================

export async function POST(request: NextRequest) {
  // Manual trigger uses same auth validation
  return GET(request);
}
