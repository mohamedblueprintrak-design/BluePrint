# ===========================================
# Project Repository
# مستودع المشاريع
# ===========================================

import { PrismaClient, Project } from '@prisma/client';
import { BaseRepository, FindManyOptions } from './base.repository';

export interface ProjectWithDetails extends Project {
  client?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  manager?: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
  _count?: {
    tasks: number;
    documents: number;
    risks: number;
  };
}

export interface CreateProjectData {
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
  organizationId?: string;
}

export interface UpdateProjectData {
  name?: string;
  location?: string;
  projectType?: string;
  status?: string;
  progressPercentage?: number;
  description?: string;
  contractValue?: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  managerId?: string | null;
}

export class ProjectRepository extends BaseRepository<Project> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.project);
  }

  async findByIdWithDetails(id: string): Promise<ProjectWithDetails | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        manager: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { tasks: true, documents: true, risks: true },
        },
      },
    });
  }

  async findByProjectNumber(projectNumber: string): Promise<Project | null> {
    return this.model.findUnique({
      where: { projectNumber },
    });
  }

  async findManyByOrganization(
    organizationId: string,
    options?: FindManyOptions
  ): Promise<Project[]> {
    return this.model.findMany({
      where: { organizationId, ...options?.where },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findManyByStatus(
    status: string,
    organizationId: string,
    options?: FindManyOptions
  ): Promise<Project[]> {
    return this.model.findMany({
      where: { status, organizationId },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
    });
  }

  async findManyByManager(
    managerId: string,
    options?: FindManyOptions
  ): Promise<Project[]> {
    return this.model.findMany({
      where: { managerId },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
    });
  }

  async updateProgress(id: string, progress: number): Promise<Project> {
    return this.model.update({
      where: { id },
      data: { progressPercentage: progress },
    });
  }

  async updateStatus(id: string, status: string): Promise<Project> {
    return this.model.update({
      where: { id },
      data: { status },
    });
  }

  async countByStatus(organizationId: string): Promise<Record<string, number>> {
    const statuses = ['pending', 'active', 'on_hold', 'completed', 'cancelled'];
    const counts: Record<string, number> = {};

    for (const status of statuses) {
      counts[status] = await this.model.count({
        where: { status, organizationId },
      });
    }

    return counts;
  }

  async search(
    query: string,
    organizationId: string,
    options?: FindManyOptions
  ): Promise<Project[]> {
    return this.model.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { projectNumber: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip: options?.skip,
      take: options?.take,
    });
  }
}
