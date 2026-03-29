import { NextRequest } from 'next/server';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '../utils/response';
import { prisma } from '@/lib/db';

// ============================================
// Capacity Planning Constants
// ============================================

const MAX_WEEKLY_CAPACITY_HOURS = 40; // Standard full-time work week
const _MAX_DAILY_CAPACITY_HOURS = 8;  // Standard work day (reserved for future use)

/**
 * Get suggested action based on utilization percentage
 */
function getSuggestedAction(utilizationPercentage: number): string {
  if (utilizationPercentage <= 60) return 'available';
  if (utilizationPercentage <= 80) return 'moderate';
  if (utilizationPercentage <= 100) return 'heavy';
  return 'overloaded';
}

/**
 * Get color for suggested action
 */
function getActionColor(action: string): string {
  switch (action) {
    case 'available': return 'green';
    case 'moderate': return 'yellow';
    case 'heavy': return 'orange';
    case 'overloaded': return 'red';
    default: return 'gray';
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  try {
    // Get all users in the organization
    const users = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        role: { not: 'VIEWER' },
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        avatar: true,
        role: true,
        department: true,
      },
      orderBy: { fullName: 'asc' },
    });

    // Get task counts and details per user
    const now = new Date();
    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: { in: users.map(u => u.id) },
        status: { not: 'CANCELLED' },
        deletedAt: null,
      },
      select: {
        assignedTo: true,
        status: true,
        priority: true,
        dueDate: true,
        progress: true,
        projectId: true,
        estimatedHours: true,
        actualHours: true,
      },
    });

    // Build workload map
    const workloadMap = new Map<string, {
      totalTasks: number;
      todoTasks: number;
      inProgressTasks: number;
      reviewTasks: number;
      doneTasks: number;
      overdueTasks: number;
      highPriorityTasks: number;
      totalEstimatedHours: number;
      totalActualHours: number;
      completionRate: number;
      pressureScore: number;
      maxCapacity: number;
      currentLoad: number;
      availableCapacity: number;
      utilizationPercentage: number;
      suggestedAction: string;
      suggestedActionColor: string;
    }>();

    // Initialize with capacity planning data
    for (const u of users) {
      workloadMap.set(u.id, {
        totalTasks: 0, todoTasks: 0, inProgressTasks: 0, reviewTasks: 0, doneTasks: 0,
        overdueTasks: 0, highPriorityTasks: 0, totalEstimatedHours: 0, totalActualHours: 0,
        completionRate: 0, pressureScore: 0,
        maxCapacity: MAX_WEEKLY_CAPACITY_HOURS,
        currentLoad: 0,
        availableCapacity: MAX_WEEKLY_CAPACITY_HOURS,
        utilizationPercentage: 0,
        suggestedAction: 'available',
        suggestedActionColor: 'green',
      });
    }

    // Aggregate
    for (const task of tasks) {
      const w = workloadMap.get(task.assignedTo!);
      if (!w) continue;
      w.totalTasks++;
      w.totalEstimatedHours += task.estimatedHours || 0;
      w.totalActualHours += task.actualHours || 0;

      if (task.status === 'TODO') w.todoTasks++;
      else if (task.status === 'IN_PROGRESS') w.inProgressTasks++;
      else if (task.status === 'REVIEW') w.reviewTasks++;
      else if (task.status === 'DONE') w.doneTasks++;

      if (task.priority === 'HIGH' || task.priority === 'URGENT') w.highPriorityTasks++;
      if (task.dueDate && task.dueDate < now && task.status !== 'DONE') w.overdueTasks++;
    }

    // Calculate derived metrics including capacity planning
    const workloadData = users.map(u => {
      const w = workloadMap.get(u.id)!;
      w.completionRate = w.totalTasks > 0 ? Math.round((w.doneTasks / w.totalTasks) * 100) : 0;

      // Pressure score: weighted combination of overdue, high priority, and in-progress tasks
      const overdueWeight = w.overdueTasks * 30;
      const highPriorityWeight = w.highPriorityTasks * 15;
      const activeWeight = w.inProgressTasks * 10;
      const reviewWeight = w.reviewTasks * 5;
      w.pressureScore = Math.min(100, Math.round(overdueWeight + highPriorityWeight + activeWeight + reviewWeight));

      // Capacity planning calculations
      // Use remaining estimated hours as current load (tasks not yet done)
      const activeTaskHours = tasks
        .filter(t => t.assignedTo === u.id && t.status !== 'DONE' && t.status !== 'CANCELLED')
        .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

      w.currentLoad = Math.round(activeTaskHours * 10) / 10;
      w.availableCapacity = Math.max(0, Math.round((w.maxCapacity - w.currentLoad) * 10) / 10);
      w.utilizationPercentage = w.maxCapacity > 0
        ? Math.round((w.currentLoad / w.maxCapacity) * 100)
        : 0;
      w.suggestedAction = getSuggestedAction(w.utilizationPercentage);
      w.suggestedActionColor = getActionColor(w.suggestedAction);

      return {
        userId: u.id,
        fullName: u.fullName || u.username,
        avatar: u.avatar,
        role: u.role,
        department: u.department,
        ...w,
      };
    });

    // Sort by utilization percentage descending (most loaded first)
    workloadData.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

    // Team-level summary with capacity stats
    const totalCapacity = users.length * MAX_WEEKLY_CAPACITY_HOURS;
    const totalCurrentLoad = workloadData.reduce((sum, w) => sum + w.currentLoad, 0);
    const totalAvailableCapacity = Math.max(0, totalCapacity - totalCurrentLoad);
    const teamUtilization = totalCapacity > 0 ? Math.round((totalCurrentLoad / totalCapacity) * 100) : 0;

    const summary = {
      totalEmployees: users.length,
      overloadedEmployees: workloadData.filter(w => w.suggestedAction === 'overloaded').length,
      heavyLoadEmployees: workloadData.filter(w => w.suggestedAction === 'heavy').length,
      moderateLoadEmployees: workloadData.filter(w => w.suggestedAction === 'moderate').length,
      availableEmployees: workloadData.filter(w => w.suggestedAction === 'available').length,
      totalActiveTasks: tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED').length,
      totalOverdueTasks: tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'DONE').length,
      avgCompletionRate: workloadData.length > 0
        ? Math.round(workloadData.reduce((sum, w) => sum + w.completionRate, 0) / workloadData.length)
        : 0,
      // Capacity planning summary
      maxWeeklyCapacity: MAX_WEEKLY_CAPACITY_HOURS,
      totalTeamCapacity: totalCapacity,
      totalCurrentLoad: Math.round(totalCurrentLoad * 10) / 10,
      totalAvailableCapacity: Math.round(totalAvailableCapacity * 10) / 10,
      teamUtilizationPercentage: teamUtilization,
      teamSuggestedAction: getSuggestedAction(teamUtilization),
      avgUtilizationPerEmployee: workloadData.length > 0
        ? Math.round(workloadData.reduce((sum, w) => sum + w.utilizationPercentage, 0) / workloadData.length)
        : 0,
    };

    return successResponse(workloadData, summary);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
