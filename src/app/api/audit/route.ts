import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '../utils/response';

// GET /api/audit - Fetch audit logs with filters
// Query params: entityType, entityId, organizationId, projectId, userId, action, limit, offset
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const organizationId = user.organizationId;
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    where.organizationId = organizationId;
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      db.activity.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, avatar: true },
          },
          project: {
            select: { id: true, name: true, projectNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.activity.count({ where }),
    ]);

    // Get summary stats
    const actionSummary = await db.activity.groupBy({
      by: ['action'],
      where,
      _count: { id: true },
    });

    const entitySummary = await db.activity.groupBy({
      by: ['entityType'],
      where,
      _count: { id: true },
    });

    return successResponse(logs, {
      pagination: {
        limit,
        offset,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        byAction: actionSummary.reduce(
          (acc, item) => {
            acc[item.action] = item._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
        byEntityType: entitySummary.reduce(
          (acc, item) => {
            acc[item.entityType] = item._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    });
  } catch (error) {
    console.error('Audit GET error:', error);
    return serverErrorResponse();
  }
}

// POST /api/audit - Create audit log entry
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const {
      organizationId,
      projectId,
      userId,
      entityType,
      entityId,
      action,
      description,
      oldValue,
      newValue,
      ipAddress,
    } = body;

    // Validate required fields
    if (!organizationId || !entityType || !action || !description) {
      return errorResponse('organizationId, entityType, action, and description are required');
    }

    // Validate entityType
    const validEntityTypes = [
      'project',
      'task',
      'invoice',
      'contract',
      'workflow_phase',
      'client_interaction',
      'client',
      'employee',
      'material',
      'supplier',
      'document',
      'site_report',
      'defect',
      'boq_item',
      'leave_request',
      'attendance',
      'article',
      'stock_movement',
      'organization',
    ];
    if (!validEntityTypes.includes(entityType)) {
      return errorResponse(`Invalid entityType. Must be one of: ${validEntityTypes.join(', ')}`);
    }

    // Validate action
    const validActions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SIGN', 'VIEW'];
    if (!validActions.includes(action)) {
      return errorResponse(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    // Use authenticated userId if not explicitly provided
    const effectiveUserId = userId || user.id;

    // Extract IP from headers if not provided
    const effectiveIpAddress =
      ipAddress ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null;

    const auditLog = await db.activity.create({
      data: {
        organizationId,
        projectId: projectId || null,
        userId: effectiveUserId || null,
        entityType,
        entityId: entityId || null,
        action,
        description,
        oldValue: oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : undefined,
        ipAddress: effectiveIpAddress,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, projectNumber: true },
        },
      },
    });

    return successResponse(auditLog);
  } catch (error) {
    console.error('Audit POST error:', error);
    return serverErrorResponse();
  }
}
