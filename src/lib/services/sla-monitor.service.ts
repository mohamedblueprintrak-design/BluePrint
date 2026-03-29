/**
 * SLA Monitoring Service
 * خدمة مراقبة SLA وتنبيهات الانتهاك
 * 
 * This service monitors tasks with SLA requirements and sends alerts
 * when SLA is about to breach or has been breached.
 */

import { db, isDatabaseAvailable } from '@/lib/db';
import { TaskStatus, TaskType, SLABreachStatus } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface SLACheckResult {
  taskId: string;
  projectId: string | null;
  taskName: string;
  daysElapsed: number;
  slaDays: number;
  breachDays: number;
  status: SLABreachStatus;
  assignedTo: string | null;
  governmentEntity: string | null;
}

export interface SLAMonitorReport {
  timestamp: Date;
  tasksChecked: number;
  warningsFound: number;
  breachesFound: number;
  criticalFound: number;
  results: SLACheckResult[];
}

// ============================================
// SLA Monitor Service
// ============================================

/**
 * Check all active tasks for SLA breaches
 * فحص جميع المهام النشطة لتجاوزات SLA
 */
export async function checkSLABreaches(): Promise<SLAMonitorReport> {
  const report: SLAMonitorReport = {
    timestamp: new Date(),
    tasksChecked: 0,
    warningsFound: 0,
    breachesFound: 0,
    criticalFound: 0,
    results: [],
  };

  if (!isDatabaseAvailable()) {
    console.log('SLA Monitor: Database not available, skipping check');
    return report;
  }

  try {
    // Get all active tasks with SLA requirements
    const activeTasks = await db.task.findMany({
      where: {
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        slaDays: { not: null, gt: 0 },
        slaStartDate: { not: null },
      },
      include: {
        project: {
          include: {
            manager: true,
          },
        },
        slaBreaches: {
          where: {
            status: { in: [SLABreachStatus.WARNING, SLABreachStatus.BREACHED, SLABreachStatus.CRITICAL] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    report.tasksChecked = activeTasks.length;

    const now = new Date();

    for (const task of activeTasks) {
      if (!task.slaStartDate || !task.slaDays) continue;

      const startDate = new Date(task.slaStartDate);
      const daysElapsed = Math.floor(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const slaDays = task.slaDays;
      const slaWarningDays = task.slaWarningDays || 1;
      const breachDays = daysElapsed - slaDays;

      let status: SLABreachStatus;

      if (breachDays >= 0) {
        // Already breached
        if (breachDays >= slaDays * 0.5) {
          status = SLABreachStatus.CRITICAL;
          report.criticalFound++;
        } else {
          status = SLABreachStatus.BREACHED;
          report.breachesFound++;
        }
      } else if (daysElapsed >= slaDays - slaWarningDays) {
        // Warning phase
        status = SLABreachStatus.WARNING;
        report.warningsFound++;
      } else {
        // Still within SLA
        continue;
      }

      const result: SLACheckResult = {
        taskId: task.id,
        projectId: task.projectId,
        taskName: task.title,
        daysElapsed,
        slaDays,
        breachDays,
        status,
        assignedTo: task.assignedTo,
        governmentEntity: task.governmentEntity,
      };

      report.results.push(result);

      // Create or update SLA breach record
      await createOrUpdateSLABreach(task, result);

      // Send notifications
      await sendSLANotifications(task, result);
    }

    return report;
  } catch (error) {
    console.error('SLA Monitor Error:', error);
    throw error;
  }
}

/**
 * Create or update SLA breach record
 * إنشاء أو تحديث سجل تجاوز SLA
 */
async function createOrUpdateSLABreach(
  task: any,
  result: SLACheckResult
): Promise<void> {
  try {
    const existingBreach = task.slaBreaches[0];

    if (existingBreach) {
      // Update existing breach
      await db.sLABreach.update({
        where: { id: existingBreach.id },
        data: {
          status: result.status,
          daysElapsed: result.daysElapsed,
          breachDays: result.breachDays,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new breach record
      await db.sLABreach.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          status: result.status,
          daysElapsed: result.daysElapsed,
          slaDays: result.slaDays,
          breachDays: result.breachDays,
        },
      });

      // Update task with breach timestamp
      await db.task.update({
        where: { id: task.id },
        data: { slaBreachedAt: new Date() },
      });
    }
  } catch (error) {
    console.error('Error creating SLA breach record:', error);
  }
}

/**
 * Send SLA notifications to relevant users
 * إرسال إشعارات SLA للمستخدمين المعنيين
 */
async function sendSLANotifications(
  task: any,
  result: SLACheckResult
): Promise<void> {
  try {
    const usersToNotify: string[] = [];

    // Notify assigned user
    if (task.assignedTo) {
      usersToNotify.push(task.assignedTo);
    }

    // Notify project manager
    if (task.project?.managerId) {
      usersToNotify.push(task.project.managerId);
    }

    // For critical breaches, also notify admins
    if (result.status === SLABreachStatus.CRITICAL) {
      const admins = await db.user.findMany({
        where: {
          role: 'ADMIN',
          isActive: true,
        },
        select: { id: true },
      });
      usersToNotify.push(...admins.map((a: any) => a.id));
    }

    // Create notifications
    const notificationPromises = [...new Set(usersToNotify)].map((userId) =>
      db.notification.create({
        data: {
          userId,
          title: getSLANotificationTitle(result.status, task.title),
          message: getSLANotificationMessage(result, task),
          notificationType: 'sla',
          referenceType: 'task',
          referenceId: task.id,
          priority: result.status === SLABreachStatus.CRITICAL ? 'URGENT' : 'HIGH',
          actionUrl: `/dashboard/tasks/${task.id}`,
        },
      })
    );

    await Promise.all(notificationPromises);

    console.log(
      `SLA Notification sent for task ${task.id}: ${result.status}`
    );
  } catch (error) {
    console.error('Error sending SLA notifications:', error);
  }
}

/**
 * Get notification title based on breach status
 */
function getSLANotificationTitle(status: SLABreachStatus, taskName: string): string {
  const titles = {
    [SLABreachStatus.WARNING]: `⚠️ تحذير SLA: ${taskName}`,
    [SLABreachStatus.BREACHED]: `🚨 تجاوز SLA: ${taskName}`,
    [SLABreachStatus.CRITICAL]: `🔴 تجاوز حرج: ${taskName}`,
    [SLABreachStatus.RESOLVED]: `✅ تم حل تجاوز SLA: ${taskName}`,
  };
  return titles[status] || `SLA: ${taskName}`;
}

/**
 * Get notification message based on breach details
 */
function getSLANotificationMessage(result: SLACheckResult, task: any): string {
  const entity = task.governmentEntity ? ` (${task.governmentEntity})` : '';
  
  if (result.status === SLABreachStatus.WARNING) {
    const daysRemaining = result.slaDays - result.daysElapsed;
    return `المهمة على وشك تجاوز SLA. متبقي ${daysRemaining} يوم${entity}.`;
  }
  
  if (result.status === SLABreachStatus.BREACHED) {
    return `تجاوزت المهمة SLA بـ ${result.breachDays} يوم${entity}.`;
  }
  
  if (result.status === SLABreachStatus.CRITICAL) {
    return `تجاوز حرج! المهمة متأخرة ${result.breachDays} يوم عن SLA${entity}.`;
  }
  
  return `تحديث SLA للمهمة: ${result.daysElapsed}/${result.slaDays} يوم`;
}

/**
 * Get SLA statistics for dashboard
 * إحصائيات SLA للوحة التحكم
 */
export async function getSLAStatistics(): Promise<{
  totalActive: number;
  onTrack: number;
  warning: number;
  breached: number;
  critical: number;
}> {
  if (!isDatabaseAvailable()) {
    return { totalActive: 0, onTrack: 0, warning: 0, breached: 0, critical: 0 };
  }

  const now = new Date();

  // Get all active tasks with SLA
  const tasks = await db.task.findMany({
    where: {
      status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      slaDays: { not: null, gt: 0 },
      slaStartDate: { not: null },
    },
    select: {
      slaStartDate: true,
      slaDays: true,
      slaWarningDays: true,
    },
  });

  let onTrack = 0;
  let warning = 0;
  let breached = 0;
  let critical = 0;

  for (const task of tasks) {
    if (!task.slaStartDate || !task.slaDays) continue;

    const daysElapsed = Math.floor(
      (now.getTime() - new Date(task.slaStartDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const breachDays = daysElapsed - task.slaDays;

    if (breachDays >= task.slaDays * 0.5) {
      critical++;
    } else if (breachDays >= 0) {
      breached++;
    } else if (daysElapsed >= task.slaDays - (task.slaWarningDays || 1)) {
      warning++;
    } else {
      onTrack++;
    }
  }

  return {
    totalActive: tasks.length,
    onTrack,
    warning,
    breached,
    critical,
  };
}

/**
 * Mark SLA breach as resolved
 * تحديد تجاوز SLA كمحلول
 */
export async function resolveSLABreach(
  breachId: string,
  resolutionNotes?: string
): Promise<void> {
  if (!isDatabaseAvailable()) return;

  await db.sLABreach.update({
    where: { id: breachId },
    data: {
      status: SLABreachStatus.RESOLVED,
      resolvedAt: new Date(),
      resolutionNotes,
    },
  });
}

export default {
  checkSLABreaches,
  getSLAStatistics,
  resolveSLABreach,
};
