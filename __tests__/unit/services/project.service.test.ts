/**
 * Project Service Unit Tests
 * Tests for project CRUD, status transitions, progress, budget, and government approvals.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  mockPrisma,
  setupTestDatabase,
  teardownTestDatabase,
  createTestProjectData,
  createTestUserData,
  createTestTaskData,
  generateTestId,
  type TestProject,
  type TestTask,
} from '../../utils/setup';
import { createTestUser, createTestProject, createTestTask, calculateProjectProgress, TEST_CONSTANTS } from '../../utils/test-helpers';

// ─── Mock Project Service ────────────────────────────────────────────────────

class ProjectService {
  async createProject(data: any, managerId: string) {
    const project = await mockPrisma.project.create({
      data: {
        ...data,
        managerId,
        status: data.status || 'PLANNING',
        progress: 0,
        spent: 0,
      },
    });
    return project;
  }

  async getProjectById(id: string) {
    const project = await mockPrisma.project.findUnique({
      where: { id },
      include: { manager: true, client: true, tasks: true },
    });
    if (!project) throw new Error('PROJECT_NOT_FOUND');
    if (project.deletedAt) throw new Error('PROJECT_DELETED');
    return project;
  }

  async updateProject(id: string, data: any) {
    const existing = await mockPrisma.project.findUnique({ where: { id } });
    if (!existing) throw new Error('PROJECT_NOT_FOUND');
    if (existing.deletedAt) throw new Error('PROJECT_DELETED');

    // Validate status transitions
    if (data.status) {
      const validTransitions: Record<string, string[]> = {
        PLANNING: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
        ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: [],
      };
      const allowed = validTransitions[existing.status] || [];
      if (!allowed.includes(data.status)) {
        throw new Error(`INVALID_STATUS_TRANSITION: ${existing.status} → ${data.status}`);
      }
    }

    return mockPrisma.project.update({ where: { id }, data });
  }

  async deleteProject(id: string) {
    const project = await mockPrisma.project.findUnique({ where: { id } });
    if (!project) throw new Error('PROJECT_NOT_FOUND');

    return mockPrisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listProjects(filters: any = {}) {
    const where: any = { deletedAt: null };

    if (filters.status) where.status = filters.status;
    if (filters.managerId) where.managerId = filters.managerId;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { nameAr: { contains: filters.search } },
      ];
    }
    if (filters.startDateFrom) where.startDate = { ...where.startDate, gte: filters.startDateFrom };
    if (filters.startDateTo) where.startDate = { ...where.startDate, lte: filters.startDateTo };

    const [projects, total] = await Promise.all([
      mockPrisma.project.findMany({
        where,
        include: { manager: true, client: true },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
        orderBy: { createdAt: 'desc' },
      }),
      mockPrisma.project.count({ where }),
    ]);

    return {
      data: projects,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total,
        totalPages: Math.ceil(total / (filters.limit || 20)),
      },
    };
  }

  async calculateProgress(projectId: string) {
    const tasks = await mockPrisma.task.findMany({
      where: { projectId, deletedAt: null },
    });
    if (tasks.length === 0) return 0;

    const totalProgress = tasks.reduce((sum: number, t: any) => sum + (t.progress || 0), 0);
    return Math.round(totalProgress / tasks.length);
  }

  async trackBudget(projectId: string) {
    const project = await mockPrisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('PROJECT_NOT_FOUND');

    const utilization = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
    return {
      budget: project.budget,
      spent: project.spent,
      remaining: project.budget - project.spent,
      utilization: Math.round(utilization * 100) / 100,
    };
  }

  async updateGovernmentApproval(projectId: string, status: string) {
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new Error('INVALID_GOVERNMENT_APPROVAL_STATUS');
    }

    return mockPrisma.project.update({
      where: { id: projectId },
      data: { governmentApprovalStatus: status },
    });
  }

  async updateUtilityConnection(projectId: string, status: string) {
    const validStatuses = ['PENDING', 'CONNECTED', 'DISCONNECTED'];
    if (!validStatuses.includes(status)) {
      throw new Error('INVALID_UTILITY_CONNECTION_STATUS');
    }

    return mockPrisma.project.update({
      where: { id: projectId },
      data: { utilityConnectionStatus: status },
    });
  }

  async assignManager(projectId: string, managerId: string) {
    const manager = await mockPrisma.user.findUnique({ where: { id: managerId } });
    if (!manager) throw new Error('MANAGER_NOT_FOUND');
    if (manager.role !== 'MANAGER' && manager.role !== 'ADMIN') {
      throw new Error('INVALID_MANAGER_ROLE');
    }

    return mockPrisma.project.update({
      where: { id: projectId },
      data: { managerId },
    });
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('ProjectService', () => {
  let projectService: ProjectService;
  let adminUser: any;
  let managerUser: any;
  let testProject: any;
  let testClientId: string;

  beforeEach(async () => {
    await setupTestDatabase();
    projectService = new ProjectService();
    testClientId = generateTestId('client');

    adminUser = createTestUserData({ role: 'ADMIN' });
    managerUser = createTestUserData({ role: 'MANAGER' });
    testProject = createTestProjectData(managerUser.id, testClientId);
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  // ─── Create Project Tests ─────────────────────────────────────────────────

  describe('createProject', () => {
    it('should create a project with all required fields', async () => {
      mockPrisma.project.create.mockResolvedValue(testProject);

      const result = await projectService.createProject({
        name: testProject.name,
        nameAr: testProject.nameAr,
        description: testProject.description,
        budget: testProject.budget,
        startDate: testProject.startDate,
        endDate: testProject.endDate,
        clientId: testClientId,
      }, managerUser.id);

      expect(result).toEqual(testProject);
      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: testProject.name,
            nameAr: testProject.nameAr,
            managerId: managerUser.id,
            status: 'PLANNING',
            progress: 0,
            spent: 0,
          }),
        })
      );
    });

    it('should create a project with Arabic name and description', async () => {
      const arabicProject = { ...testProject, nameAr: 'مشروع البناء الجديد' };
      mockPrisma.project.create.mockResolvedValue(arabicProject);

      const result = await projectService.createProject({
        name: 'New Construction',
        nameAr: 'مشروع البناء الجديد',
        descriptionAr: 'وصف المشروع',
        budget: 1000000,
        startDate: '2024-03-01',
        endDate: '2025-03-01',
        clientId: testClientId,
      }, managerUser.id);

      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nameAr: 'مشروع البناء الجديد',
          }),
        })
      );
    });

    it('should set default status to PLANNING', async () => {
      mockPrisma.project.create.mockResolvedValue(testProject);

      await projectService.createProject({
        name: 'New Project',
        budget: 500000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        clientId: testClientId,
      }, managerUser.id);

      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PLANNING' }),
        })
      );
    });

    it('should initialize progress and spent to 0', async () => {
      mockPrisma.project.create.mockResolvedValue(testProject);

      await projectService.createProject({
        name: 'New Project',
        budget: 500000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        clientId: testClientId,
      }, managerUser.id);

      const callData = mockPrisma.project.create.mock.calls[0][0].data;
      expect(callData.progress).toBe(0);
      expect(callData.spent).toBe(0);
    });

    it('should accept custom initial status when provided', async () => {
      const customProject = { ...testProject, status: 'IN_PROGRESS' };
      mockPrisma.project.create.mockResolvedValue(customProject);

      await projectService.createProject({
        name: 'Active Project',
        status: 'IN_PROGRESS',
        budget: 2000000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        clientId: testClientId,
      }, managerUser.id);

      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
    });

    it('should create project with geographic coordinates', async () => {
      const geoProject = { ...testProject, latitude: 24.7136, longitude: 46.6753 };
      mockPrisma.project.create.mockResolvedValue(geoProject);

      await projectService.createProject({
        name: 'Geo Project',
        latitude: 24.7136,
        longitude: 46.6753,
        address: 'Riyadh, Saudi Arabia',
        budget: 3000000,
        startDate: '2024-01-01',
        endDate: '2025-01-01',
        clientId: testClientId,
      }, managerUser.id);

      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            latitude: 24.7136,
            longitude: 46.6753,
          }),
        })
      );
    });
  });

  // ─── Project Status Transitions ───────────────────────────────────────────

  describe('status transitions', () => {
    it('should transition from PLANNING to IN_PROGRESS', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ ...testProject, status: 'PLANNING' });
      mockPrisma.project.update.mockResolvedValue({ ...testProject, status: 'IN_PROGRESS' });

      const result = await projectService.updateProject(testProject.id, { status: 'IN_PROGRESS' });

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should transition from IN_PROGRESS to ON_HOLD', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ ...testProject, status: 'IN_PROGRESS' });
      mockPrisma.project.update.mockResolvedValue({ ...testProject, status: 'ON_HOLD' });

      const result = await projectService.updateProject(testProject.id, { status: 'ON_HOLD' });

      expect(result.status).toBe('ON_HOLD');
    });

    it('should transition from IN_PROGRESS to COMPLETED', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ ...testProject, status: 'IN_PROGRESS' });
      mockPrisma.project.update.mockResolvedValue({ ...testProject, status: 'COMPLETED' });

      const result = await projectService.updateProject(testProject.id, { status: 'COMPLETED' });

      expect(result.status).toBe('COMPLETED');
    });

    it('should transition from ON_HOLD back to IN_PROGRESS', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ ...testProject, status: 'ON_HOLD' });
      mockPrisma.project.update.mockResolvedValue({ ...testProject, status: 'IN_PROGRESS' });

      const result = await projectService.updateProject(testProject.id, { status: 'IN_PROGRESS' });

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should reject transition from PLANNING directly to COMPLETED', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ ...testProject, status: 'PLANNING' });

      await expect(projectService.updateProject(testProject.id, { status: 'COMPLETED' }))
        .rejects.toThrow('INVALID_STATUS_TRANSITION');
    });

    it('should reject transition from COMPLETED to any other status', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ ...testProject, status: 'COMPLETED' });

      await expect(projectService.updateProject(testProject.id, { status: 'IN_PROGRESS' }))
        .rejects.toThrow('INVALID_STATUS_TRANSITION');
    });

    it('should allow transition to CANCELLED from any active status', async () => {
      for (const status of ['PLANNING', 'IN_PROGRESS', 'ON_HOLD']) {
        mockPrisma.project.findUnique.mockResolvedValue({ ...testProject, status });
        mockPrisma.project.update.mockResolvedValue({ ...testProject, status: 'CANCELLED' });

        const result = await projectService.updateProject(testProject.id, { status: 'CANCELLED' });
        expect(result.status).toBe('CANCELLED');
      }
    });

    it('should reject transition from CANCELLED to any status', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ ...testProject, status: 'CANCELLED' });

      await expect(projectService.updateProject(testProject.id, { status: 'IN_PROGRESS' }))
        .rejects.toThrow('INVALID_STATUS_TRANSITION');
    });
  });

  // ─── Progress Calculation ─────────────────────────────────────────────────

  describe('calculateProgress', () => {
    it('should return 0 when project has no tasks', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const progress = await projectService.calculateProgress(testProject.id);

      expect(progress).toBe(0);
    });

    it('should calculate average progress across all tasks', async () => {
      const tasks = [
        { progress: 100 },
        { progress: 50 },
        { progress: 0 },
      ];
      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const progress = await projectService.calculateProgress(testProject.id);

      expect(progress).toBe(50); // (100 + 50 + 0) / 3 = 50
    });

    it('should return 100 when all tasks are complete', async () => {
      const tasks = [
        { progress: 100 },
        { progress: 100 },
        { progress: 100 },
      ];
      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const progress = await projectService.calculateProgress(testProject.id);

      expect(progress).toBe(100);
    });

    it('should return 0 when all tasks have 0 progress', async () => {
      const tasks = [
        { progress: 0 },
        { progress: 0 },
      ];
      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const progress = await projectService.calculateProgress(testProject.id);

      expect(progress).toBe(0);
    });

    it('should round progress to nearest integer', async () => {
      const tasks = [
        { progress: 33 },
        { progress: 66 },
      ];
      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const progress = await projectService.calculateProgress(testProject.id);

      expect(progress).toBe(50); // (33 + 66) / 2 = 49.5 → 50
    });

    it('should handle tasks with undefined progress as 0', async () => {
      const tasks = [
        { progress: 100 },
        {},
        { progress: undefined },
      ];
      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const progress = await projectService.calculateProgress(testProject.id);

      expect(progress).toBe(33); // (100 + 0 + 0) / 3 = 33.33 → 33
    });
  });

  // ─── Budget Tracking ──────────────────────────────────────────────────────

  describe('trackBudget', () => {
    it('should return budget tracking summary', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testProject,
        budget: 500000,
        spent: 125000,
      });

      const result = await projectService.trackBudget(testProject.id);

      expect(result).toEqual({
        budget: 500000,
        spent: 125000,
        remaining: 375000,
        utilization: 25,
      });
    });

    it('should calculate utilization as percentage', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testProject,
        budget: 1000000,
        spent: 750000,
      });

      const result = await projectService.trackBudget(testProject.id);

      expect(result.utilization).toBe(75);
    });

    it('should handle 100% budget utilization', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testProject,
        budget: 500000,
        spent: 500000,
      });

      const result = await projectService.trackBudget(testProject.id);

      expect(result.utilization).toBe(100);
      expect(result.remaining).toBe(0);
    });

    it('should handle over-budget scenario', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testProject,
        budget: 500000,
        spent: 600000,
      });

      const result = await projectService.trackBudget(testProject.id);

      expect(result.utilization).toBe(120);
      expect(result.remaining).toBe(-100000);
    });

    it('should handle zero budget', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testProject,
        budget: 0,
        spent: 0,
      });

      const result = await projectService.trackBudget(testProject.id);

      expect(result.utilization).toBe(0);
    });

    it('should throw error when project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(projectService.trackBudget('nonexistent'))
        .rejects.toThrow('PROJECT_NOT_FOUND');
    });
  });

  // ─── Government Approval Tests ─────────────────────────────────────────────

  describe('governmentApproval', () => {
    it('should update government approval to APPROVED', async () => {
      mockPrisma.project.update.mockResolvedValue({
        ...testProject,
        governmentApprovalStatus: 'APPROVED',
      });

      const result = await projectService.updateGovernmentApproval(testProject.id, 'APPROVED');

      expect(result.governmentApprovalStatus).toBe('APPROVED');
      expect(mockPrisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { governmentApprovalStatus: 'APPROVED' },
        })
      );
    });

    it('should update government approval to REJECTED', async () => {
      mockPrisma.project.update.mockResolvedValue({
        ...testProject,
        governmentApprovalStatus: 'REJECTED',
      });

      const result = await projectService.updateGovernmentApproval(testProject.id, 'REJECTED');

      expect(result.governmentApprovalStatus).toBe('REJECTED');
    });

    it('should reject invalid government approval status', async () => {
      await expect(projectService.updateGovernmentApproval(testProject.id, 'INVALID'))
        .rejects.toThrow('INVALID_GOVERNMENT_APPROVAL_STATUS');
    });
  });

  // ─── Utility Connection Tests ──────────────────────────────────────────────

  describe('utilityConnection', () => {
    it('should update utility connection to CONNECTED', async () => {
      mockPrisma.project.update.mockResolvedValue({
        ...testProject,
        utilityConnectionStatus: 'CONNECTED',
      });

      const result = await projectService.updateUtilityConnection(testProject.id, 'CONNECTED');

      expect(result.utilityConnectionStatus).toBe('CONNECTED');
    });

    it('should update utility connection to DISCONNECTED', async () => {
      mockPrisma.project.update.mockResolvedValue({
        ...testProject,
        utilityConnectionStatus: 'DISCONNECTED',
      });

      const result = await projectService.updateUtilityConnection(testProject.id, 'DISCONNECTED');

      expect(result.utilityConnectionStatus).toBe('DISCONNECTED');
    });

    it('should reject invalid utility connection status', async () => {
      await expect(projectService.updateUtilityConnection(testProject.id, 'INVALID'))
        .rejects.toThrow('INVALID_UTILITY_CONNECTION_STATUS');
    });
  });

  // ─── Soft Delete Tests ────────────────────────────────────────────────────

  describe('soft delete', () => {
    it('should soft delete a project by setting deletedAt', async () => {
      const now = new Date();
      jest.useFakeTimers({ now });
      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockImplementation(async (args: any) => ({
        ...testProject,
        ...args.data,
      }));

      const result = await projectService.deleteProject(testProject.id);

      expect(result.deletedAt).toBeDefined();
      expect(result.deletedAt).toBeInstanceOf(Date);
      jest.useRealTimers();
    });

    it('should throw error when deleting non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(projectService.deleteProject('nonexistent'))
        .rejects.toThrow('PROJECT_NOT_FOUND');
    });

    it('should not hard delete the project from database', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue({ ...testProject, deletedAt: new Date() });

      await projectService.deleteProject(testProject.id);

      expect(mockPrisma.project.delete).not.toHaveBeenCalled();
      expect(mockPrisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });
  });

  // ─── Project Listing with Filters ─────────────────────────────────────────

  describe('listProjects', () => {
    it('should return paginated project list', async () => {
      const projects = [testProject];
      mockPrisma.project.findMany.mockResolvedValue(projects);
      mockPrisma.project.count.mockResolvedValue(1);

      const result = await projectService.listProjects({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter projects by status', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await projectService.listProjects({ status: 'IN_PROGRESS' });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
    });

    it('should filter projects by manager', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await projectService.listProjects({ managerId: managerUser.id });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ managerId: managerUser.id }),
        })
      );
    });

    it('should search projects by name (English and Arabic)', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await projectService.listProjects({ search: 'Tower' });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'Tower' } },
              { nameAr: { contains: 'Tower' } },
            ],
          }),
        })
      );
    });

    it('should calculate correct total pages', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(25);

      const result = await projectService.listProjects({ page: 2, limit: 10 });

      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.page).toBe(2);
    });

    it('should exclude soft-deleted projects', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await projectService.listProjects();

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      );
    });

    it('should order projects by creation date descending', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await projectService.listProjects();

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  // ─── Project Assignment ───────────────────────────────────────────────────

  describe('assignManager', () => {
    it('should assign a manager to a project', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(managerUser);
      mockPrisma.project.update.mockResolvedValue({
        ...testProject,
        managerId: managerUser.id,
      });

      const result = await projectService.assignManager(testProject.id, managerUser.id);

      expect(result.managerId).toBe(managerUser.id);
    });

    it('should throw error when assigning non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(projectService.assignManager(testProject.id, 'nonexistent'))
        .rejects.toThrow('MANAGER_NOT_FOUND');
    });

    it('should throw error when assigning a viewer as manager', async () => {
      const viewer = createTestUserData({ role: 'VIEWER' });
      mockPrisma.user.findUnique.mockResolvedValue(viewer);

      await expect(projectService.assignManager(testProject.id, viewer.id))
        .rejects.toThrow('INVALID_MANAGER_ROLE');
    });

    it('should throw error when assigning an engineer as manager', async () => {
      const engineer = createTestUserData({ role: 'ENGINEER' });
      mockPrisma.user.findUnique.mockResolvedValue(engineer);

      await expect(projectService.assignManager(testProject.id, engineer.id))
        .rejects.toThrow('INVALID_MANAGER_ROLE');
    });

    it('should allow admin to be assigned as manager', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      mockPrisma.project.update.mockResolvedValue({
        ...testProject,
        managerId: adminUser.id,
      });

      const result = await projectService.assignManager(testProject.id, adminUser.id);

      expect(result.managerId).toBe(adminUser.id);
    });
  });

  // ─── Get Project Tests ────────────────────────────────────────────────────

  describe('getProjectById', () => {
    it('should return project with related entities', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testProject,
        manager: managerUser,
        client: { id: testClientId, name: 'Test Client' },
        tasks: [],
      });

      const result = await projectService.getProjectById(testProject.id);

      expect(result.id).toBe(testProject.id);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testProject.id },
          include: expect.objectContaining({
            manager: true,
            client: true,
            tasks: true,
          }),
        })
      );
    });

    it('should throw error for non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(projectService.getProjectById('nonexistent'))
        .rejects.toThrow('PROJECT_NOT_FOUND');
    });

    it('should throw error for soft-deleted project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testProject,
        deletedAt: new Date('2024-06-01'),
      });

      await expect(projectService.getProjectById(testProject.id))
        .rejects.toThrow('PROJECT_DELETED');
    });
  });
});
