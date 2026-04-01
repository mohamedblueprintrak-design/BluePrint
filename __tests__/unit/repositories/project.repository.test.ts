/**
 * Project Repository Unit Tests
 * Tests for CRUD, filtering, pagination, search, and statistics aggregation.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  mockPrisma,
  setupTestDatabase,
  teardownTestDatabase,
  createTestProjectData,
  createTestUserData,
  generateTestId,
  type TestProject,
} from '../../utils/setup';

// ─── Mock Project Repository ─────────────────────────────────────────────────

class ProjectRepository {
  async findById(id: string) {
    return mockPrisma.project.findUnique({
      where: { id },
      include: {
        manager: true,
        client: true,
        tasks: { where: { parentId: null } },
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: string;
    managerId?: string;
    search?: string;
    startDateFrom?: string;
    startDateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const { page = 1, limit = 20 } = params;
    const where: any = { deletedAt: null };

    if (params.status) where.status = params.status;
    if (params.managerId) where.managerId = params.managerId;

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { nameAr: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.startDateFrom || params.startDateTo) {
      where.startDate = {};
      if (params.startDateFrom) where.startDate.gte = params.startDateFrom;
      if (params.startDateTo) where.startDate.lte = params.startDateTo;
    }

    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    const orderBy = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      mockPrisma.project.findMany({
        where,
        include: { manager: true, client: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      mockPrisma.project.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: any) {
    return mockPrisma.project.create({ data });
  }

  async update(id: string, data: any) {
    return mockPrisma.project.update({ where: { id }, data });
  }

  async remove(id: string) {
    return mockPrisma.project.delete({ where: { id } });
  }

  async softDelete(id: string) {
    return mockPrisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await mockPrisma.project.count({ where: { id } });
    return count > 0;
  }

  async searchByName(query: string, limit: number = 10) {
    return mockPrisma.project.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query } },
          { nameAr: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async getStatistics() {
    const [statusCounts, budgetAgg] = await Promise.all([
      mockPrisma.project.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { status: true },
      }),
      mockPrisma.project.aggregate({
        where: { deletedAt: null },
        _sum: { budget: true, spent: true, progress: true },
        _count: true,
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const item of statusCounts) {
      statusMap[item.status as string] = item._count.status;
    }

    return {
      totalProjects: budgetAgg._count,
      totalBudget: budgetAgg._sum.budget || 0,
      totalSpent: budgetAgg._sum.spent || 0,
      averageProgress: budgetAgg._count > 0
        ? Math.round((budgetAgg._sum.progress || 0) / budgetAgg._count)
        : 0,
      byStatus: statusMap,
    };
  }

  async getManagerProjects(managerId: string) {
    return mockPrisma.project.findMany({
      where: { managerId, deletedAt: null },
      include: { client: true, tasks: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async countByStatus(): Promise<Record<string, number>> {
    const result = await mockPrisma.project.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { status: true },
    });

    const counts: Record<string, number> = {};
    for (const item of result) {
      counts[item.status as string] = item._count.status;
    }
    return counts;
  }

  async getOverdueProjects() {
    const today = new Date().toISOString().split('T')[0];
    return mockPrisma.project.findMany({
      where: {
        deletedAt: null,
        endDate: { lt: today },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: { manager: true },
    });
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('ProjectRepository', () => {
  let repository: ProjectRepository;
  let managerUser: any;
  let testProject: TestProject;

  beforeEach(async () => {
    await setupTestDatabase();
    repository = new ProjectRepository();
    managerUser = createTestUserData({ role: 'MANAGER' });
    testProject = createTestProjectData(managerUser.id, generateTestId('client'));
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  // ─── CRUD Operations ──────────────────────────────────────────────────────

  describe('CRUD operations', () => {
    it('should find project by ID with relations', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testProject,
        manager: managerUser,
        client: { id: 'client-1', name: 'Client' },
        tasks: [],
      });

      const result = await repository.findById(testProject.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(testProject.id);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testProject.id },
          include: expect.objectContaining({
            manager: true,
            client: true,
            tasks: expect.objectContaining({ where: { parentId: null } }),
          }),
        })
      );
    });

    it('should return null when project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should create a project', async () => {
      mockPrisma.project.create.mockResolvedValue(testProject);

      const result = await repository.create({
        name: testProject.name,
        managerId: managerUser.id,
        budget: testProject.budget,
      });

      expect(result).toEqual(testProject);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: testProject.name,
          managerId: managerUser.id,
        }),
      });
    });

    it('should update a project', async () => {
      const updates = { name: 'Updated Project', budget: 1000000 };
      mockPrisma.project.update.mockResolvedValue({ ...testProject, ...updates });

      const result = await repository.update(testProject.id, updates);

      expect(result.name).toBe('Updated Project');
      expect(result.budget).toBe(1000000);
      expect(mockPrisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testProject.id },
          data: updates,
        })
      );
    });

    it('should hard delete a project', async () => {
      mockPrisma.project.delete.mockResolvedValue(testProject);

      const result = await repository.remove(testProject.id);

      expect(result).toEqual(testProject);
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({ where: { id: testProject.id } });
    });

    it('should soft delete a project', async () => {
      jest.useFakeTimers({ now: new Date('2024-06-15T12:00:00Z') });
      mockPrisma.project.update.mockImplementation(async (args: any) => ({
        ...testProject,
        ...args.data,
      }));

      const result = await repository.softDelete(testProject.id);

      expect(result.deletedAt).toBeInstanceOf(Date);
      jest.useRealTimers();
    });

    it('should check if project exists', async () => {
      mockPrisma.project.count.mockResolvedValue(1);

      const result = await repository.exists(testProject.id);

      expect(result).toBe(true);
      expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { id: testProject.id } });
    });

    it('should return false for non-existent project', async () => {
      mockPrisma.project.count.mockResolvedValue(0);

      const result = await repository.exists('nonexistent');

      expect(result).toBe(false);
    });
  });

  // ─── Complex Filtering ────────────────────────────────────────────────────

  describe('complex filtering', () => {
    it('should filter by status', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await repository.findAll({ status: 'IN_PROGRESS' });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
    });

    it('should filter by manager ID', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await repository.findAll({ managerId: managerUser.id });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ managerId: managerUser.id }),
        })
      );
    });

    it('should filter by start date range', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await repository.findAll({
        startDateFrom: '2024-01-01',
        startDateTo: '2024-06-30',
      });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: { gte: '2024-01-01', lte: '2024-06-30' },
          }),
        })
      );
    });

    it('should filter by start date from only', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await repository.findAll({ startDateFrom: '2024-06-01' });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: { gte: '2024-06-01' },
          }),
        })
      );
    });

    it('should apply multiple filters simultaneously', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await repository.findAll({
        status: 'IN_PROGRESS',
        managerId: managerUser.id,
        startDateFrom: '2024-01-01',
        startDateTo: '2024-12-31',
      });

      const calledWhere = mockPrisma.project.findMany.mock.calls[0][0].where;
      expect(calledWhere.status).toBe('IN_PROGRESS');
      expect(calledWhere.managerId).toBe(managerUser.id);
      expect(calledWhere.startDate.gte).toBe('2024-01-01');
      expect(calledWhere.startDate.lte).toBe('2024-12-31');
    });

    it('should always exclude soft-deleted projects', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await repository.findAll({ status: 'COMPLETED' });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      );
    });
  });

  // ─── Pagination ───────────────────────────────────────────────────────────

  describe('pagination', () => {
    it('should apply default page and limit', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      const result = await repository.findAll();

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 })
      );
    });

    it('should apply custom page and limit', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(50);

      const result = await repository.findAll({ page: 3, limit: 10 });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(10);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }) // (3-1)*10 = 20
      );
    });

    it('should calculate total pages correctly', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(47);

      const result = await repository.findAll({ limit: 10 });

      expect(result.pagination.total).toBe(47);
      expect(result.pagination.totalPages).toBe(5); // ceil(47/10)
    });

    it('should handle total pages of 1 for small result sets', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(5);

      const result = await repository.findAll({ limit: 20 });

      expect(result.pagination.totalPages).toBe(1);
    });

    it('should handle zero results', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      const result = await repository.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  // ─── Search by Name ───────────────────────────────────────────────────────

  describe('searchByName', () => {
    it('should search projects by English name', async () => {
      mockPrisma.project.findMany.mockResolvedValue([testProject]);

      const results = await repository.searchByName('Tower');

      expect(results).toHaveLength(1);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'Tower' } },
            ]),
          }),
        })
      );
    });

    it('should search projects by Arabic name', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      await repository.searchByName('برج');

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { nameAr: { contains: 'برج' } },
            ]),
          }),
        })
      );
    });

    it('should limit search results', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      await repository.searchByName('test', 5);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });

    it('should order search results by name ascending', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      await repository.searchByName('test');

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } })
      );
    });

    it('should exclude soft-deleted projects from search', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      await repository.searchByName('test');

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      );
    });
  });

  // ─── Statistics Aggregation ───────────────────────────────────────────────

  describe('statistics aggregation', () => {
    it('should return project statistics summary', async () => {
      mockPrisma.project.groupBy.mockResolvedValue([
        { status: 'PLANNING', _count: { status: 5 } },
        { status: 'IN_PROGRESS', _count: { status: 10 } },
        { status: 'COMPLETED', _count: { status: 3 } },
      ]);
      mockPrisma.project.aggregate.mockResolvedValue({
        _sum: { budget: 50000000, spent: 15000000, progress: 500 },
        _count: 18,
      });

      const stats = await repository.getStatistics();

      expect(stats).toEqual({
        totalProjects: 18,
        totalBudget: 50000000,
        totalSpent: 15000000,
        averageProgress: 28, // 500/18 ≈ 27.78 → 28
        byStatus: {
          PLANNING: 5,
          IN_PROGRESS: 10,
          COMPLETED: 3,
        },
      });
    });

    it('should handle zero projects in statistics', async () => {
      mockPrisma.project.groupBy.mockResolvedValue([]);
      mockPrisma.project.aggregate.mockResolvedValue({
        _sum: { budget: 0, spent: 0, progress: 0 },
        _count: 0,
      });

      const stats = await repository.getStatistics();

      expect(stats.totalProjects).toBe(0);
      expect(stats.averageProgress).toBe(0);
      expect(stats.byStatus).toEqual({});
    });

    it('should count projects by status', async () => {
      mockPrisma.project.groupBy.mockResolvedValue([
        { status: 'PLANNING', _count: { status: 3 } },
        { status: 'IN_PROGRESS', _count: { status: 7 } },
        { status: 'ON_HOLD', _count: { status: 2 } },
        { status: 'COMPLETED', _count: { status: 15 } },
        { status: 'CANCELLED', _count: { status: 1 } },
      ]);

      const counts = await repository.countByStatus();

      expect(counts).toEqual({
        PLANNING: 3,
        IN_PROGRESS: 7,
        ON_HOLD: 2,
        COMPLETED: 15,
        CANCELLED: 1,
      });
    });

    it('should handle empty status counts', async () => {
      mockPrisma.project.groupBy.mockResolvedValue([]);

      const counts = await repository.countByStatus();

      expect(counts).toEqual({});
    });

    it('should identify overdue projects', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockPrisma.project.findMany.mockResolvedValue([
        { ...testProject, endDate: '2024-01-01', status: 'IN_PROGRESS' },
      ]);

      const overdue = await repository.getOverdueProjects();

      expect(overdue).toHaveLength(1);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            endDate: { lt: today },
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          }),
        })
      );
    });

    it('should get manager-specific projects', async () => {
      mockPrisma.project.findMany.mockResolvedValue([testProject]);

      const projects = await repository.getManagerProjects(managerUser.id);

      expect(projects).toHaveLength(1);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { managerId: managerUser.id, deletedAt: null },
          include: expect.objectContaining({
            client: true,
            tasks: true,
          }),
          orderBy: { updatedAt: 'desc' },
        })
      );
    });
  });

  // ─── Sorting ──────────────────────────────────────────────────────────────

  describe('sorting', () => {
    it('should default sort by createdAt descending', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await repository.findAll();

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should sort by specified field in ascending order', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await repository.findAll({ sortBy: 'name', sortOrder: 'asc' });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should sort by budget descending', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await repository.findAll({ sortBy: 'budget', sortOrder: 'desc' });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { budget: 'desc' },
        })
      );
    });
  });
});
