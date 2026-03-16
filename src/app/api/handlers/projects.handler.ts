import { NextResponse } from 'next/server';
import { HandlerContext, ApiSuccessResponse, ApiErrorResponse } from '../types';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response';
import { getDb } from '../utils/db';
import { 
  parsePaginationParams, 
  isPaginationRequested, 
  buildPaginationMeta, 
  calculateSkip, 
  getEffectiveLimit,
  BACKWARD_COMPAT_LIMIT 
} from '../utils/pagination';

/**
 * GET handlers for projects actions
 */
export const getHandlers = {
  /**
   * Get all projects with pagination
   */
  projects: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
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
    
    // Build where clause with search
    const projectWhere: Record<string, unknown> = { organizationId: context.user.organizationId };
    if (pagination.search) {
      projectWhere.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { projectNumber: { contains: pagination.search, mode: 'insensitive' } },
        { location: { contains: pagination.search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count
    const totalProjects = await database.project.count({ where: projectWhere });
    
    // Determine limit based on pagination request
    const projectLimit = getEffectiveLimit(usePagination, pagination.limit);
    const projectSkip = usePagination ? calculateSkip(pagination.page, pagination.limit) : 0;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allProjects: any[] = await database.project.findMany({ 
      where: projectWhere,
      include: { client: true }, 
      orderBy: { createdAt: 'desc' },
      skip: projectSkip,
      take: projectLimit
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedProjects = allProjects.map((p: any) => ({
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
    }));
    
    if (usePagination) {
      return successResponse(mappedProjects, buildPaginationMeta(pagination.page, pagination.limit, totalProjects));
    }
    return successResponse(mappedProjects);
  },

  /**
   * Get single project by ID
   */
  project: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const projectId = context.searchParams.get('id');
    if (!projectId) return errorResponse('معرف المشروع مطلوب');
    
    const database = await getDb();
    if (!database) return notFoundResponse('المشروع غير موجود');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project: any = await database.project.findFirst({
      where: { id: projectId, organizationId: context.user.organizationId },
      include: {
        client: true,
        analyses: { take: 10, orderBy: { createdAt: 'desc' } },
        boqItems: true,
        defects: true,
        tasks: true,
        siteReports: { take: 10, orderBy: { createdAt: 'desc' } },
        milestones: true,
        files: true
      }
    });
    
    if (!project) return notFoundResponse('المشروع غير موجود');
    
    const totalCost = project.boqItems.reduce((sum: number, b: { totalPrice?: number }) => sum + (b.totalPrice || 0), 0);
    const openDefects = project.defects.filter((d: { status: string }) => d.status === 'Open');
    const healthScore = Math.max(0, Math.min(100, 100 - openDefects.length * 5));
    
    return successResponse({
      ...project,
      healthScore,
      totalCost,
      filesCount: project.files.length
    });
  }
};

/**
 * POST handlers for projects actions
 */
export const postHandlers = {
  /**
   * Create new project
   */
  project: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { name, location, projectType, clientId, contractValue, description, projectManagerId } = (context.body || {}) as Record<string, unknown>;
    if (!name) return errorResponse('اسم المشروع مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    const count = await database.project.count({ where: { organizationId: context.user.organizationId } });
    const projectNumber = `PRJ-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project: any = await database.project.create({
      data: {
        name: name as string,
        projectNumber,
        location: (location as string) || '',
        projectType,
        clientId,
        contractValue: contractValue ? parseFloat(contractValue as string) : 0,
        description,
        projectManagerId,
        organizationId: context.user.organizationId
      }
    });

    // Add user to project
    await database.projectUser.create({
      data: {
        projectId: project.id,
        userId: context.user.id,
        permission: 'admin'
      }
    });

    // Create audit log
    await database.auditLog.create({
      data: {
        userId: context.user.id,
        action: 'create',
        entityType: 'project',
        entityId: project.id,
        newValues: JSON.stringify(project)
      }
    });

    return successResponse({ id: project.id, projectNumber, name: project.name });
  }
};

/**
 * PUT handlers for projects actions
 */
export const putHandlers = {
  /**
   * Update project
   */
  project: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const body = (context.body || {}) as Record<string, unknown>;
    const { id, ...data } = body;
    if (!id) return errorResponse('معرف المشروع مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify project belongs to user's organization
    const project = await database.project.findFirst({
      where: { id: id as string, organizationId: context.user.organizationId }
    });
    if (!project) return notFoundResponse('المشروع غير موجود');

    await database.project.update({ where: { id: id as string }, data });
    return successResponse(true);
  }
};

/**
 * DELETE handlers for projects actions
 */
export const deleteHandlers = {
  /**
   * Delete project
   */
  project: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف المشروع مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify project belongs to user's organization
    const project = await database.project.findFirst({
      where: { id, organizationId: context.user.organizationId }
    });
    if (!project) return notFoundResponse('المشروع غير موجود');
    
    await database.project.delete({ where: { id } });
    return successResponse(true);
  }
};
