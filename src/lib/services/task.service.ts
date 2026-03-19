/**
 * Task Service
 * خدمة المهام
 * 
 * Business logic layer for task operations
 */

import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';
import type { Task } from '@prisma/client';

/**
 * Task filtering options
 */
export interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  projectId?: string;
  search?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

/**
 * Pagination parameters
 */
export interface TaskPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result wrapper
 */
export interface TaskPaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create task input
 */
export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId?: string;
  parentId?: string;
  assignedTo?: string;
  priority?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  isMilestone?: boolean;
  color?: string;
}

/**
 * Task Service
 * Handles all business logic related to tasks
 */
class TaskService {
  /**
   * Get all tasks with pagination and filtering
   */
  async getTasks(
    organizationId: string,
    filters?: TaskFilters,
    pagination?: TaskPaginationParams
  ): Promise<TaskPaginatedResult<Task>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Apply filters
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters?.projectId) where.projectId = filters.projectId;

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.dueDateFrom || filters?.dueDateTo) {
      where.dueDate = {};
      if (filters?.dueDateFrom) (where.dueDate as Record<string, Date>).gte = filters.dueDateFrom;
      if (filters?.dueDateTo) (where.dueDate as Record<string, Date>).lte = filters.dueDateTo;
    }

    // For organization filter, we need to join with project
    if (organizationId) {
      where.project = { organizationId };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: pagination?.sortBy
          ? { [pagination.sortBy]: pagination.sortOrder || 'desc' }
          : { createdAt: 'desc' },
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, title: true },
        },
        subtasks: {
          take: 20,
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Create a new task
   */
  async createTask(
    data: CreateTaskInput,
    organizationId: string,
    userId: string
  ): Promise<Task> {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        parentId: data.parentId,
        assignedTo: data.assignedTo,
        priority: data.priority || 'medium',
        status: data.status || 'todo',
        startDate: data.startDate,
        endDate: data.endDate,
        dueDate: data.dueDate,
        estimatedHours: data.estimatedHours,
        isMilestone: data.isMilestone || false,
        color: data.color,
      },
    });

    if (data.projectId) {
      await logAudit({
        userId,
        organizationId,
        projectId: data.projectId,
        entityType: 'task',
        entityId: task.id,
        action: 'create',
        description: `تم إنشاء المهمة: ${task.title}`,
        newValue: task,
      });
    }

    return task;
  }

  /**
   * Update task
   */
  async updateTask(
    id: string,
    data: Partial<Task>,
    organizationId: string,
    userId: string
  ): Promise<Task> {
    const oldTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!oldTask) {
      throw new Error('Task not found');
    }

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    await logAudit({
      userId,
      organizationId,
      projectId: task.projectId || undefined,
      entityType: 'task',
      entityId: task.id,
      action: 'update',
      description: `تم تحديث المهمة: ${task.title}`,
      oldValue: oldTask,
      newValue: task,
    });

    return task;
  }

  /**
   * Delete task
   */
  async deleteTask(id: string, organizationId: string, userId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    await prisma.task.delete({
      where: { id },
    });

    await logAudit({
      userId,
      organizationId,
      projectId: task.projectId || undefined,
      entityType: 'task',
      entityId: id,
      action: 'delete',
      description: `تم حذف المهمة: ${task.title}`,
      oldValue: task,
    });
  }

  /**
   * Update task progress
   */
  async updateProgress(id: string, progress: number, organizationId: string, userId: string): Promise<Task> {
    return this.updateTask(id, { progress }, organizationId, userId);
  }

  /**
   * Change task status
   */
  async changeStatus(
    id: string,
    status: string,
    organizationId: string,
    userId: string
  ): Promise<Task> {
    const updateData: Partial<Task> = { status };
    
    // If completing the task, set progress to 100%
    if (status === 'done') {
      updateData.progress = 100;
    }

    return this.updateTask(id, updateData, organizationId, userId);
  }

  /**
   * Get tasks for Gantt chart
   */
  async getTasksForGantt(projectId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: { projectId },
      orderBy: [{ order: 'asc' }, { startDate: 'asc' }],
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        progress: true,
        status: true,
        priority: true,
        parentId: true,
        dependencies: true,
        color: true,
        isMilestone: true,
        order: true,
        assignedTo: true,
      },
    });
  }

  /**
   * Get task statistics for dashboard
   */
  async getTaskStats(organizationId: string): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    overdue: number;
  }> {
    const [statusCounts, overdueCount] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: {
          project: { organizationId },
        },
        _count: true,
      }),
      prisma.task.count({
        where: {
          project: { organizationId },
          dueDate: { lt: new Date() },
          status: { notIn: ['done', 'cancelled'] },
        },
      }),
    ]);

    const stats = {
      total: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
      overdue: overdueCount,
    };

    for (const item of statusCounts) {
      stats.total += item._count;
      switch (item.status) {
        case 'todo':
          stats.todo = item._count;
          break;
        case 'in_progress':
          stats.inProgress = item._count;
          break;
        case 'review':
          stats.review = item._count;
          break;
        case 'done':
          stats.done = item._count;
          break;
      }
    }

    return stats;
  }
}

// Export singleton instance
export const taskService = new TaskService();
