/**
 * Audit Service
 * خدمة تسجيل الأنشطة والتدقيق
 */

import { prisma } from '../db';

export interface AuditLogData {
  userId?: string;
  organizationId?: string;
  projectId?: string;
  entityType: string;
  entityId?: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'approve' | 'reject' | 'sign' | 'login' | 'logout';
  description: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit entry
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        projectId: data.projectId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        description: data.description,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit entry:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Get audit logs for an entity
 */
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  return prisma.activity.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    entityType?: string;
    action?: string;
  }
) {
  return prisma.activity.findMany({
    where: {
      userId,
      ...(options?.entityType && { entityType: options.entityType }),
      ...(options?.action && { action: options.action }),
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

/**
 * Get audit logs for an organization
 */
export async function getOrganizationAuditLogs(
  organizationId: string,
  options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  return prisma.activity.findMany({
    where: {
      organizationId,
      ...(options?.userId && { userId: options.userId }),
      ...(options?.entityType && { entityType: options.entityType }),
      ...(options?.action && { action: options.action }),
      ...(options?.startDate && { createdAt: { gte: options.startDate } }),
      ...(options?.endDate && { createdAt: { lte: options.endDate } }),
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  });
}

/**
 * Clean up old audit logs (data retention)
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 365): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await prisma.activity.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });
  
  return result.count;
}
