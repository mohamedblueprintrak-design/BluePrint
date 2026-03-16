import { NextResponse } from 'next/server';
import { HandlerContext, ApiSuccessResponse, ApiErrorResponse } from '../types';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response';
import { getDb } from '../utils/db';
import { 
  parsePaginationParams, 
  isPaginationRequested, 
  buildPaginationMeta, 
  calculateSkip, 
  getEffectiveLimit 
} from '../utils/pagination';

/**
 * GET handlers for documents actions
 */
export const getHandlers = {
  /**
   * Get all documents with pagination
   */
  documents: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
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
    const documentWhere: Record<string, unknown> = {};
    if (pagination.search) {
      documentWhere.OR = [
        { filename: { contains: pagination.search, mode: 'insensitive' } },
        { originalName: { contains: pagination.search, mode: 'insensitive' } },
        { category: { contains: pagination.search, mode: 'insensitive' } },
        { description: { contains: pagination.search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count
    const totalDocuments = await database.document.count({ where: documentWhere });
    
    // Determine limit based on pagination request
    const documentLimit = getEffectiveLimit(usePagination, pagination.limit);
    const documentSkip = usePagination ? calculateSkip(pagination.page, pagination.limit) : 0;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documents: any[] = await database.document.findMany({
      where: documentWhere,
      include: { uploader: true },
      orderBy: { createdAt: 'desc' },
      skip: documentSkip,
      take: documentLimit
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedDocuments = documents.map((d: any) => ({
      id: d.id,
      filename: d.filename,
      originalName: d.originalName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      category: d.category,
      description: d.description,
      uploadedBy: d.uploader?.fullName || d.uploader?.username,
      createdAt: d.createdAt
    }));
    
    if (usePagination) {
      return successResponse(mappedDocuments, buildPaginationMeta(pagination.page, pagination.limit, totalDocuments));
    }
    return successResponse(mappedDocuments);
  }
};

/**
 * DELETE handlers for documents actions
 */
export const deleteHandlers = {
  /**
   * Delete document
   */
  document: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف المستند مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // SECURITY: Verify document belongs to user's organization before deletion
    const document = await database.document.findFirst({
      where: { 
        id,
        organizationId: context.user.organizationId 
      }
    });
    
    if (!document) {
      return errorResponse('المستند غير موجود أو ليس لديك صلاحية لحذفه', 'NOT_FOUND', 404);
    }
    
    await database.document.delete({ where: { id } });
    return successResponse(true);
  }
};
