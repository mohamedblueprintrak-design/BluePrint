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
 * GET handlers for contracts actions
 */
export const getHandlers = {
  /**
   * Get all contracts with pagination
   */
  contracts: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
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
    const contractWhere: Record<string, unknown> = { organizationId: context.user.organizationId };
    if (pagination.search) {
      contractWhere.OR = [
        { title: { contains: pagination.search, mode: 'insensitive' } },
        { contractNumber: { contains: pagination.search, mode: 'insensitive' } },
        { client: { name: { contains: pagination.search, mode: 'insensitive' } } }
      ];
    }
    
    // Get total count
    const totalContracts = await database.contract.count({ where: contractWhere });
    
    // Determine limit based on pagination request
    const contractLimit = getEffectiveLimit(usePagination, pagination.limit);
    const contractSkip = usePagination ? calculateSkip(pagination.page, pagination.limit) : 0;
    
    const contracts: any[] = await database.contract.findMany({
      where: contractWhere,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      skip: contractSkip,
      take: contractLimit
    });
    
    const mappedContracts = contracts.map((c: any) => ({
      id: c.id,
      contractNumber: c.contractNumber,
      title: c.title,
      contractType: c.contractType,
      contractValue: c.contractValue,
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
      client: c.client?.name,
      clientId: c.clientId
    }));
    
    if (usePagination) {
      return successResponse(mappedContracts, buildPaginationMeta(pagination.page, pagination.limit, totalContracts));
    }
    return successResponse(mappedContracts);
  }
};

/**
 * POST handlers for contracts actions
 */
export const postHandlers = {
  /**
   * Create new contract
   */
  contract: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { contractNumber, title, clientId, projectId, contractValue, startDate, endDate, contractType, notes, terms } = (context.body || {}) as Record<string, unknown>;
    if (!title) return errorResponse('عنوان العقد مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    let finalContractNumber = contractNumber as string;
    if (!finalContractNumber) {
      const count = await database.contract.count({ where: { organizationId: context.user.organizationId } });
      finalContractNumber = `CNT-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    }

    const contract: any = await database.contract.create({
      data: {
        contractNumber: finalContractNumber,
        title: title as string,
        clientId,
        projectId,
        contractValue: contractValue ? parseFloat(contractValue as string) : 0,
        startDate: startDate ? new Date(startDate as string) : null,
        endDate: endDate ? new Date(endDate as string) : null,
        contractType: (contractType as string) || 'lump_sum',
        notes: notes as string,
        terms: terms as string,
        status: 'draft',
        organizationId: context.user.organizationId
      }
    });

    return successResponse({ id: contract.id, contractNumber: finalContractNumber });
  }
};

/**
 * PUT handlers for contracts actions
 */
export const putHandlers = {
  /**
   * Update contract
   */
  contract: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const body = (context.body || {}) as Record<string, unknown>;
    const { id, ...data } = body;
    if (!id) return errorResponse('معرف العقد مطلوب');

    // SECURITY: Whitelist allowed fields to prevent mass assignment
    const ALLOWED_FIELDS = ['title', 'description', 'contractType', 'status', 'value', 'currency', 'startDate', 'endDate', 'terms', 'notes', 'clientId', 'projectId'];
    const sanitizedData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in data && data[key] !== undefined) {
        sanitizedData[key] = data[key];
      }
    }

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify contract belongs to user's organization
    const contract = await database.contract.findFirst({
      where: { id: id as string, organizationId: context.user.organizationId }
    });
    if (!contract) return notFoundResponse('العقد غير موجود');

    await database.contract.update({ where: { id: id as string }, data: sanitizedData });
    return successResponse(true);
  }
};

/**
 * DELETE handlers for contracts actions
 */
export const deleteHandlers = {
  /**
   * Delete contract
   */
  contract: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف العقد مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify contract belongs to user's organization
    const contract = await database.contract.findFirst({
      where: { id, organizationId: context.user.organizationId }
    });
    if (!contract) return notFoundResponse('العقد غير موجود');
    
    await database.contract.delete({ where: { id } });
    return successResponse(true);
  }
};
