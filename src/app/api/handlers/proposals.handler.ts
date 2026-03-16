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
 * GET handlers for proposals actions
 */
export const getHandlers = {
  /**
   * Get all proposals with pagination
   */
  proposals: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
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
    const proposalWhere: Record<string, unknown> = { organizationId: context.user.organizationId };
    if (pagination.search) {
      proposalWhere.OR = [
        { title: { contains: pagination.search, mode: 'insensitive' } },
        { proposalNumber: { contains: pagination.search, mode: 'insensitive' } },
        { client: { name: { contains: pagination.search, mode: 'insensitive' } } }
      ];
    }
    
    // Get total count
    const totalProposals = await database.proposal.count({ where: proposalWhere });
    
    // Determine limit based on pagination request
    const proposalLimit = getEffectiveLimit(usePagination, pagination.limit);
    const proposalSkip = usePagination ? calculateSkip(pagination.page, pagination.limit) : 0;
    
    const proposals: any[] = await database.proposal.findMany({
      where: proposalWhere,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      skip: proposalSkip,
      take: proposalLimit
    });
    
    const mappedProposals = proposals.map((p: any) => ({
      id: p.id,
      proposalNumber: p.proposalNumber,
      client: p.client?.name,
      clientId: p.clientId,
      title: p.title,
      totalAmount: p.totalAmount,
      status: p.status,
      issueDate: p.issueDate,
      validUntil: p.validUntil,
      createdAt: p.createdAt
    }));
    
    if (usePagination) {
      return successResponse(mappedProposals, buildPaginationMeta(pagination.page, pagination.limit, totalProposals));
    }
    return successResponse(mappedProposals);
  }
};

/**
 * POST handlers for proposals actions
 */
export const postHandlers = {
  /**
   * Create new proposal
   */
  proposal: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { proposalNumber, clientId, projectId, title, totalAmount, issueDate, validUntil, items, notes, terms } = (context.body || {}) as Record<string, unknown>;

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    let finalProposalNumber = proposalNumber as string;
    if (!finalProposalNumber) {
      const count = await database.proposal.count({ where: { organizationId: context.user.organizationId } });
      finalProposalNumber = `PRP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    }

    const proposal: any = await database.proposal.create({
      data: {
        proposalNumber: finalProposalNumber,
        clientId,
        projectId,
        title: title as string,
        totalAmount: totalAmount ? parseFloat(totalAmount as string) : 0,
        issueDate: issueDate ? new Date(issueDate as string) : null,
        validUntil: validUntil ? new Date(validUntil as string) : null,
        items: items ? JSON.stringify(items) : null,
        notes: notes as string,
        terms: terms as string,
        status: 'draft',
        organizationId: context.user.organizationId
      }
    });

    return successResponse({ id: proposal.id, proposalNumber: finalProposalNumber });
  }
};

/**
 * PUT handlers for proposals actions
 */
export const putHandlers = {
  /**
   * Update proposal
   */
  proposal: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const body = (context.body || {}) as Record<string, unknown>;
    const { id, ...data } = body;
    if (!id) return errorResponse('معرف العرض مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify proposal belongs to user's organization
    const proposal = await database.proposal.findFirst({
      where: { id: id as string, organizationId: context.user.organizationId }
    });
    if (!proposal) return notFoundResponse('العرض غير موجود');

    if (data.items) {
      data.items = JSON.stringify(data.items);
    }

    await database.proposal.update({ where: { id: id as string }, data });
    return successResponse(true);
  },

  /**
   * Update proposal status
   */
  'proposal-status': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { id, status } = (context.body || {}) as Record<string, unknown>;
    if (!id || !status) return errorResponse('المعرف والحالة مطلوبان');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify proposal belongs to user's organization
    const proposal = await database.proposal.findFirst({
      where: { id: id as string, organizationId: context.user.organizationId }
    });
    if (!proposal) return notFoundResponse('العرض غير موجود');

    await database.proposal.update({ where: { id: id as string }, data: { status: status as string } });
    return successResponse(true);
  }
};

/**
 * DELETE handlers for proposals actions
 */
export const deleteHandlers = {
  /**
   * Delete proposal
   */
  proposal: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف العرض مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify proposal belongs to user's organization
    const proposal = await database.proposal.findFirst({
      where: { id, organizationId: context.user.organizationId }
    });
    if (!proposal) return notFoundResponse('العرض غير موجود');
    
    await database.proposal.delete({ where: { id } });
    return successResponse(true);
  }
};
