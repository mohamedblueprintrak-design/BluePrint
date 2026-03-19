/**
 * Projects API Route
 * مسار واجهة برمجة التطبيقات للمشاريع
 * 
 * Handles CRUD operations for projects
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from '../utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '../utils/response';
import { projectService } from '@/lib/services';

/**
 * GET - List projects with pagination and filtering
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  // Demo mode - return demo data for demo users
  if (isDemoUser(user.id)) {
    let filteredProjects = [...DEMO_DATA.projects];
    
    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.projectNumber.toLowerCase().includes(searchLower) ||
        p.location.toLowerCase().includes(searchLower)
      );
    }
    
    const total = filteredProjects.length;
    const startIndex = (page - 1) * limit;
    const paginatedProjects = filteredProjects.slice(startIndex, startIndex + limit);
    
    return successResponse(
      paginatedProjects.map(p => ({
        id: p.id,
        name: p.name,
        projectNumber: p.projectNumber,
        location: p.location,
        status: p.status,
        contractValue: p.contractValue,
        clientId: p.clientId,
        client: p.client,
        progressPercentage: p.progressPercentage,
        createdAt: p.createdAt
      })),
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  }

  // Real database queries for actual users
  try {
    const result = await projectService.getProjects(
      user.organizationId,
      { status, search },
      { page, limit }
    );

    return successResponse(
      result.data.map(p => ({
        id: p.id,
        name: p.name,
        projectNumber: p.projectNumber,
        location: p.location,
        status: p.status,
        contractValue: p.contractValue,
        clientId: p.clientId,
        client: (p as any).client?.name,
        progressPercentage: p.progressPercentage,
        createdAt: p.createdAt
      })),
      result.pagination
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * POST - Create a new project
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) {
    return unauthorizedResponse();
  }

  // Demo mode - cannot create real projects
  if (isDemoUser(user.id)) {
    return errorResponse('لا يمكن إنشاء مشاريع في الوضع التجريبي', 'DEMO_MODE', 403);
  }

  try {
    const body = await request.json();
    const { name, location, projectType, clientId, contractValue, description, managerId } = body;

    if (!name) {
      return errorResponse('اسم المشروع مطلوب', 'VALIDATION_ERROR', 400);
    }

    const project = await projectService.createProject(
      {
        name,
        location,
        projectType,
        clientId,
        contractValue: contractValue ? parseFloat(contractValue) : undefined,
        description,
        managerId,
      },
      user.organizationId,
      user.id
    );

    return successResponse({
      id: project.id,
      projectNumber: project.projectNumber,
      name: project.name
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
