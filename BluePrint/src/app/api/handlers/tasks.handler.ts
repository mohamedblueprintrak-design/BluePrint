import { NextResponse } from 'next/server';
import { HandlerContext, ApiSuccessResponse, ApiErrorResponse } from '../types';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response';
import { getDb } from '../utils/db';
import { 
  parsePaginationParams, 
  isPaginationRequested, 
  buildPaginationMeta, 
  calculateSkip, 
  getEffectiveLimit 
} from '../utils/pagination';

/**
 * GET handlers for tasks actions
 */
export const getHandlers = {
  /**
   * Get all tasks with pagination
   */
  tasks: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const database = await getDb();
    if (!database) {
      return successResponse([], { 
        page: 1, 
        limit: 20, 
        total: 0, 
        totalPages: 0, 
        hasNextPage: false, 
        hasPrevPage: false 
      });
    }
    
    const pagination = parsePaginationParams(context.searchParams);
    const usePagination = isPaginationRequested(context.searchParams);
    const taskProjectId = context.searchParams.get('projectId');
    const taskStatus = context.searchParams.get('status');
    
    // Build where clause with search
    const tasksQuery: Record<string, any> = {
      project: { organizationId: context.user.organizationId }
    };
    if (taskProjectId) tasksQuery.projectId = taskProjectId;
    if (taskStatus) tasksQuery.status = taskStatus;
    
    // Add search conditions
    if (pagination.search) {
      tasksQuery.OR = [
        { title: { contains: pagination.search, mode: 'insensitive' } },
        { description: { contains: pagination.search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count
    const totalTasks = await database.task.count({ where: tasksQuery });
    
    // Determine limit based on pagination request
    const taskLimit = getEffectiveLimit(usePagination, pagination.limit);
    const taskSkip = usePagination ? calculateSkip(pagination.page, pagination.limit) : 0;
    
    const tasks: any[] = await database.task.findMany({
      where: tasksQuery,
      include: { project: true, assignee: true },
      orderBy: { createdAt: 'desc' },
      skip: taskSkip,
      take: taskLimit
    });
    
    const mappedTasks = tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      progress: t.progress,
      project: t.project?.name,
      projectId: t.projectId,
      assignee: t.assignee?.fullName || t.assignee?.username,
      assigneeId: t.assignedToId,
      createdAt: t.createdAt
    }));
    
    if (usePagination) {
      return successResponse(mappedTasks, buildPaginationMeta(pagination.page, pagination.limit, totalTasks));
    }
    return successResponse(mappedTasks);
  }
};

/**
 * POST handlers for tasks actions
 */
export const postHandlers = {
  /**
   * Create new task
   */
  task: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { title, description, projectId, assignedToId, priority, dueDate, estimatedHours, tags } = (context.body || {}) as Record<string, unknown>;
    if (!title) return errorResponse('عنوان المهمة مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify project belongs to user's organization
    if (projectId) {
      const taskProject = await database.project.findFirst({
        where: { id: projectId as string, organizationId: context.user.organizationId }
      });
      if (!taskProject) return notFoundResponse('المشروع غير موجود');
    }

    const task: any = await database.task.create({
      data: {
        title: title as string,
        description: description as string,
        projectId: projectId as string,
        assignedToId: assignedToId as string,
        createdById: context.user.id,
        priority: (priority as string) || 'medium',
        dueDate: dueDate ? new Date(dueDate as string) : null,
        estimatedHours: estimatedHours as number,
        tags: tags ? JSON.stringify(tags) : null
      }
    });

    // Send notification to assignee
    if (assignedToId) {
      await database.notification.create({
        data: {
          userId: assignedToId as string,
          title: 'مهمة جديدة',
          message: `تم تعيين مهمة: ${title}`,
          notificationType: 'task',
          referenceType: 'task',
          referenceId: task.id
        }
      });
    }

    return successResponse({ id: task.id });
  }
};

/**
 * PUT handlers for tasks actions
 */
export const putHandlers = {
  /**
   * Update task
   */
  task: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { id, status, progress } = (context.body || {}) as Record<string, unknown>;
    if (!id) return errorResponse('معرف المهمة مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify task belongs to user's organization
    const task = await database.task.findFirst({
      where: { id: id as string, project: { organizationId: context.user.organizationId } }
    });
    if (!task) return notFoundResponse('المهمة غير موجودة');

    const updateData: Record<string, any> = {};
    if (status) {
      updateData.status = status;
      if (status === 'done') updateData.completedAt = new Date();
    }
    if (progress !== undefined) updateData.progress = progress;

    await database.task.update({ where: { id: id as string }, data: updateData });
    return successResponse(true);
  }
};

/**
 * DELETE handlers for tasks actions
 */
export const deleteHandlers = {
  /**
   * Delete task
   */
  task: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف المهمة مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify task belongs to user's organization
    const task = await database.task.findFirst({
      where: { id, project: { organizationId: context.user.organizationId } }
    });
    if (!task) return notFoundResponse('المهمة غير موجودة');
    
    await database.task.delete({ where: { id } });
    return successResponse(true);
  }
};
