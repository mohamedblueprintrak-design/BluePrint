# ===========================================
# Project Service
# خدمة المشاريع
# ===========================================

import { prisma } from '@/lib/db';
import { getProjectRepository, getUserRepository } from '@/lib/repositories';
import { logAudit } from './audit.service';
import type { Project, ProjectStatus } from '@prisma/client';

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
  onHold: number;
  totalValue: number;
  averageProgress: number;
}

export interface ProjectFilters {
  status?: string;
  managerId?: string;
  clientId?: string;
  projectType?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ProjectService {
  /**
   * Get all projects with pagination and filtering
   */
  async getProjects(
    organizationId: string,
    filters?: ProjectFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Project>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    // Apply filters
    if (filters?.status) where.status = filters.status;
    if (filters?.managerId) where.managerId = filters.managerId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.projectType) where.projectType = filters.projectType;
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { projectNumber: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters?.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: pagination?.sortBy 
          ? { [pagination.sortBy]: pagination.sortOrder || 'desc' }
          : { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          manager: { select: { id: true, fullName: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get project by ID with full details
   */
  async getProjectById(id: string, organizationId: string) {
    return prisma.project.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        manager: { select: { id: true, fullName: true, email: true } },
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        risks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { tasks: true, documents: true, risks: true },
        },
      },
    });
  }

  /**
   * Create a new project
   */
  async createProject(
    data: {
      name: string;
      projectNumber?: string;
      location?: string;
      projectType?: string;
      description?: string;
      contractValue?: number;
      contractDate?: Date;
      expectedStartDate?: Date;
      expectedEndDate?: Date;
      managerId?: string;
      clientId?: string;
      budget?: number;
    },
    organizationId: string,
    userId: string
  ) {
    // Generate project number if not provided
    const projectNumber = data.projectNumber || await this.generateProjectNumber(organizationId);

    const project = await prisma.project.create({
      data: {
        ...data,
        projectNumber,
        organizationId,
      },
    });

    // Log audit
    await logAudit({
      userId,
      organizationId,
      projectId: project.id,
      entityType: 'project',
      entityId: project.id,
      action: 'create',
      description: `تم إنشاء المشروع: ${project.name}`,
      newValue: project as any,
    });

    return project;
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    data: Partial<Project>,
    organizationId: string,
    userId: string
  ) {
    const oldProject = await prisma.project.findFirst({
      where: { id, organizationId },
    });

    if (!oldProject) {
      throw new Error('Project not found');
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    // Log audit
    await logAudit({
      userId,
      organizationId,
      projectId: project.id,
      entityType: 'project',
      entityId: project.id,
      action: 'update',
      description: `تم تحديث المشروع: ${project.name}`,
      oldValue: oldProject as any,
      newValue: project as any,
    });

    return project;
  }

  /**
   * Delete project
   */
  async deleteProject(id: string, organizationId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id, organizationId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    await prisma.project.delete({
      where: { id },
    });

    // Log audit
    await logAudit({
      userId,
      organizationId,
      entityType: 'project',
      entityId: id,
      action: 'delete',
      description: `تم حذف المشروع: ${project.name}`,
      oldValue: project as any,
    });
  }

  /**
   * Get project statistics
   */
  async getProjectStats(organizationId: string): Promise<ProjectStats> {
    const [statusCounts, valueAggregate, progressAggregate] = await Promise.all([
      prisma.project.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true,
      }),
      prisma.project.aggregate({
        where: { organizationId },
        _sum: { contractValue: true },
      }),
      prisma.project.aggregate({
        where: { organizationId, status: 'active' },
        _avg: { progressPercentage: true },
      }),
    ]);

    const stats: ProjectStats = {
      total: 0,
      active: 0,
      completed: 0,
      pending: 0,
      onHold: 0,
      totalValue: valueAggregate._sum.contractValue || 0,
      averageProgress: progressAggregate._avg.progressPercentage || 0,
    };

    for (const item of statusCounts) {
      stats.total += item._count;
      switch (item.status) {
        case 'active':
          stats.active = item._count;
          break;
        case 'completed':
          stats.completed = item._count;
          break;
        case 'pending':
          stats.pending = item._count;
          break;
        case 'on_hold':
          stats.onHold = item._count;
          break;
      }
    }

    return stats;
  }

  /**
   * Generate unique project number
   */
  private async generateProjectNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.project.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    return `PRJ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Update project progress
   */
  async updateProgress(id: string, organizationId: string) {
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      select: { progress: true },
    });

    if (tasks.length === 0) return;

    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    const averageProgress = Math.round(totalProgress / tasks.length);

    await prisma.project.update({
      where: { id },
      data: { progressPercentage: averageProgress },
    });

    return averageProgress;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
