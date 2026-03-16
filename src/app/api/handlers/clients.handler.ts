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
 * GET handlers for clients actions
 */
export const getHandlers = {
  /**
   * Get all clients with pagination
   */
  clients: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
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
    const clientWhere: Record<string, unknown> = { isActive: true, organizationId: context.user.organizationId };
    if (pagination.search) {
      clientWhere.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { email: { contains: pagination.search, mode: 'insensitive' } },
        { phone: { contains: pagination.search, mode: 'insensitive' } },
        { contactPerson: { contains: pagination.search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count
    const totalClients = await database.client.count({ where: clientWhere });
    
    // Determine limit based on pagination request
    const clientLimit = getEffectiveLimit(usePagination, pagination.limit);
    const clientSkip = usePagination ? calculateSkip(pagination.page, pagination.limit) : 0;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clients: any[] = await database.client.findMany({
      where: clientWhere,
      orderBy: { createdAt: 'desc' },
      skip: clientSkip,
      take: clientLimit
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedClients = clients.map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      contactPerson: c.contactPerson,
      taxNumber: c.taxNumber,
      clientType: c.clientType,
      creditLimit: c.creditLimit,
      totalInvoiced: c.totalInvoiced,
      totalPaid: c.totalPaid
    }));
    
    if (usePagination) {
      return successResponse(mappedClients, buildPaginationMeta(pagination.page, pagination.limit, totalClients));
    }
    return successResponse(mappedClients);
  }
};

/**
 * POST handlers for clients actions
 */
export const postHandlers = {
  /**
   * Create new client
   */
  client: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { name, email, phone, address, contactPerson, taxNumber, clientType, creditLimit, notes } = (context.body || {}) as Record<string, unknown>;
    if (!name) return errorResponse('اسم العميل مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: any = await database.client.create({
      data: { 
        name: name as string, 
        email: email as string, 
        phone: phone as string, 
        address: address as string, 
        contactPerson: contactPerson as string,
        taxNumber: taxNumber as string,
        clientType: (clientType as string) || 'company',
        creditLimit: (creditLimit as number) || 0,
        notes: notes as string,
        organizationId: context.user.organizationId
      }
    });

    return successResponse({ id: client.id, name: client.name });
  }
};

/**
 * PUT handlers for clients actions
 */
export const putHandlers = {
  /**
   * Update client
   */
  client: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const body = (context.body || {}) as Record<string, unknown>;
    const { id, ...data } = body;
    if (!id) return errorResponse('معرف العميل مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify client belongs to user's organization
    const client = await database.client.findFirst({
      where: { id: id as string, organizationId: context.user.organizationId }
    });
    if (!client) return notFoundResponse('العميل غير موجود');

    await database.client.update({ where: { id: id as string }, data });
    return successResponse(true);
  }
};

/**
 * DELETE handlers for clients actions
 */
export const deleteHandlers = {
  /**
   * Delete client (soft delete)
   */
  client: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف العميل مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify client belongs to user's organization
    const client = await database.client.findFirst({
      where: { id, organizationId: context.user.organizationId }
    });
    if (!client) return notFoundResponse('العميل غير موجود');
    
    // Soft delete
    await database.client.update({ where: { id }, data: { isActive: false } });
    return successResponse(true);
  }
};
