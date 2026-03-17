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
 * GET handlers for materials actions
 */
export const getHandlers = {
  /**
   * Get all materials with pagination
   */
  materials: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
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
    const materialWhere: Record<string, unknown> = { isActive: true, organizationId: context.user.organizationId };
    if (pagination.search) {
      materialWhere.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { materialCode: { contains: pagination.search, mode: 'insensitive' } },
        { category: { contains: pagination.search, mode: 'insensitive' } },
        { location: { contains: pagination.search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count
    const totalMaterials = await database.material.count({ where: materialWhere });
    
    // Determine limit based on pagination request
    const materialLimit = getEffectiveLimit(usePagination, pagination.limit);
    const materialSkip = usePagination ? calculateSkip(pagination.page, pagination.limit) : 0;
    
    const materials: any[] = await database.material.findMany({
      where: materialWhere,
      orderBy: { name: 'asc' },
      skip: materialSkip,
      take: materialLimit
    });
    
    const mappedMaterials = materials.map((m: any) => ({
      id: m.id,
      materialCode: m.materialCode,
      name: m.name,
      category: m.category,
      unit: m.unit,
      unitPrice: m.unitPrice,
      currentStock: m.currentStock,
      minStock: m.minStock,
      maxStock: m.maxStock,
      location: m.location
    }));
    
    if (usePagination) {
      return successResponse(mappedMaterials, buildPaginationMeta(pagination.page, pagination.limit, totalMaterials));
    }
    return successResponse(mappedMaterials);
  }
};

/**
 * POST handlers for materials actions
 */
export const postHandlers = {
  /**
   * Create new material
   */
  material: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { name, category, unit, unitPrice, minStock, maxStock, location } = (context.body || {}) as Record<string, unknown>;
    if (!name || !unit) return errorResponse('اسم المادة والوحدة مطلوبان');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    const count = await database.material.count({ where: { organizationId: context.user.organizationId } });
    const materialCode = `MAT-${(count + 1).toString().padStart(4, '0')}`;

    const material: any = await database.material.create({
      data: { 
        materialCode, 
        name: name as string, 
        category: category as string, 
        unit: unit as string, 
        unitPrice: (unitPrice as number) || 0, 
        minStock: (minStock as number) || 0,
        maxStock: (maxStock as number) || 0,
        location: location as string,
        organizationId: context.user.organizationId
      }
    });

    return successResponse({ id: material.id, materialCode });
  }
};

/**
 * PUT handlers for materials actions
 */
export const putHandlers = {
  /**
   * Update material
   */
  material: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const body = (context.body || {}) as Record<string, unknown>;
    const { id, ...data } = body;
    if (!id) return errorResponse('معرف المادة مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify material belongs to user's organization
    const material = await database.material.findFirst({
      where: { id: id as string, organizationId: context.user.organizationId }
    });
    if (!material) return notFoundResponse('المادة غير موجودة');

    await database.material.update({ where: { id: id as string }, data });
    return successResponse(true);
  }
};

/**
 * DELETE handlers for materials actions
 */
export const deleteHandlers = {
  /**
   * Delete material (soft delete)
   */
  material: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف المادة مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify material belongs to user's organization
    const material = await database.material.findFirst({
      where: { id, organizationId: context.user.organizationId }
    });
    if (!material) return notFoundResponse('المادة غير موجودة');
    
    // Soft delete
    await database.material.update({ where: { id }, data: { isActive: false } });
    return successResponse(true);
  }
};
