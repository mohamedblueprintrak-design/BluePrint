import { NextRequest } from 'next/server';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '../utils/response';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const entityType = searchParams.get('entityType') || undefined;
  const userId = searchParams.get('userId') || undefined;

  try {
    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, username: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activity.count({ where })
    ]);

    return successResponse(activities.map(a => ({
      id: a.id,
      userId: a.userId,
      userName: a.user?.fullName || a.user?.username || 'System',
      userAvatar: a.user?.avatar,
      entityType: a.entityType,
      entityId: a.entityId,
      action: a.action,
      description: a.description,
      oldValue: a.oldValue,
      newValue: a.newValue,
      ipAddress: a.ipAddress,
      createdAt: a.createdAt,
    })), { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
