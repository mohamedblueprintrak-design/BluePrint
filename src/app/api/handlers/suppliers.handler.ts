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
 * GET handlers for suppliers actions
 */
export const getHandlers = {
  /**
   * Get all suppliers with pagination
   */
  suppliers: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
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
    const supplierWhere: Record<string, unknown> = { isActive: true, organizationId: context.user.organizationId };
    if (pagination.search) {
      supplierWhere.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { email: { contains: pagination.search, mode: 'insensitive' } },
        { phone: { contains: pagination.search, mode: 'insensitive' } },
        { contactPerson: { contains: pagination.search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count
    const totalSuppliers = await database.supplier.count({ where: supplierWhere });
    
    // Determine limit based on pagination request
    const supplierLimit = getEffectiveLimit(usePagination, pagination.limit);
    const supplierSkip = usePagination ? calculateSkip(pagination.page, pagination.limit) : 0;
    
    const suppliers: any[] = await database.supplier.findMany({
      where: supplierWhere,
      orderBy: { createdAt: 'desc' },
      skip: supplierSkip,
      take: supplierLimit
    });
    
    const mappedSuppliers = suppliers.map((s: any) => ({
      id: s.id,
      name: s.name,
      supplierType: s.supplierType,
      email: s.email,
      phone: s.phone,
      address: s.address,
      contactPerson: s.contactPerson,
      rating: s.rating,
      isApproved: s.isApproved
    }));
    
    if (usePagination) {
      return successResponse(mappedSuppliers, buildPaginationMeta(pagination.page, pagination.limit, totalSuppliers));
    }
    return successResponse(mappedSuppliers);
  }
};

/**
 * POST handlers for suppliers actions
 */
export const postHandlers = {
  /**
   * Create new supplier
   */
  supplier: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { name, supplierType, email, phone, address, contactPerson, taxNumber, notes } = (context.body || {}) as Record<string, unknown>;
    if (!name) return errorResponse('اسم المورد مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    const supplier: any = await database.supplier.create({
      data: { 
        name: name as string, 
        supplierType: (supplierType as string) || 'supplier', 
        email: email as string, 
        phone: phone as string, 
        address: address as string, 
        contactPerson: contactPerson as string,
        taxNumber: taxNumber as string,
        notes: notes as string,
        organizationId: context.user.organizationId
      }
    });

    return successResponse({ id: supplier.id, name: supplier.name });
  }
};

/**
 * PUT handlers for suppliers actions
 */
export const putHandlers = {
  /**
   * Update supplier
   */
  supplier: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const body = (context.body || {}) as Record<string, unknown>;
    const { id, ...data } = body;
    if (!id) return errorResponse('معرف المورد مطلوب');

    // SECURITY: Whitelist allowed fields to prevent mass assignment
    const ALLOWED_FIELDS = ['name', 'supplierType', 'email', 'phone', 'address', 'taxNumber', 'contactPerson', 'rating', 'creditLimit', 'isActive', 'notes'];
    const sanitizedData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in data && data[key] !== undefined) {
        sanitizedData[key] = data[key];
      }
    }

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify supplier belongs to user's organization
    const supplier = await database.supplier.findFirst({
      where: { id: id as string, organizationId: context.user.organizationId }
    });
    if (!supplier) return notFoundResponse('المورد غير موجود');

    await database.supplier.update({ where: { id: id as string }, data: sanitizedData });
    return successResponse(true);
  }
};

/**
 * DELETE handlers for suppliers actions
 */
export const deleteHandlers = {
  /**
   * Delete supplier (soft delete)
   */
  supplier: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف المورد مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify supplier belongs to user's organization
    const supplier = await database.supplier.findFirst({
      where: { id, organizationId: context.user.organizationId }
    });
    if (!supplier) return notFoundResponse('المورد غير موجود');
    
    // Soft delete
    await database.supplier.update({ where: { id }, data: { isActive: false } });
    return successResponse(true);
  }
};
