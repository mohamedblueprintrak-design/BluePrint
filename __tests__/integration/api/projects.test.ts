/**
 * Projects API Integration Tests
 * Full CRUD and permission tests for project endpoints.
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
  type UserRole,
} from '../../utils/setup';
import { generateAuthToken, TEST_CONSTANTS } from '../../utils/test-helpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.body = data; return res; },
  };
  return res;
}

function createMockRequest(body: any = {}, headers: Record<string, string> = {}) {
  return { body, headers: { 'content-type': 'application/json', ...headers } };
}

function verifyToken(token: string): { userId: string; role: UserRole } | null {
  if (!token || !token.startsWith('Bearer ')) return null;
  const payload = token.replace('Bearer ', '');
  const parts = payload.split('_');
  if (parts[0] === 'encoded' && parts[1] === 'jwt') {
    return { userId: parts[2], role: parts[3] as UserRole };
  }
  return null;
}

const ROLE_PERMISSIONS: Record<UserRole, { canCreate: boolean; canUpdate: boolean; canDelete: boolean; canManageUsers: boolean }> = {
  ADMIN: { canCreate: true, canUpdate: true, canDelete: true, canManageUsers: true },
  MANAGER: { canCreate: true, canUpdate: true, canDelete: false, canManageUsers: false },
  ENGINEER: { canCreate: false, canUpdate: true, canDelete: false, canManageUsers: false },
  VIEWER: { canCreate: false, canUpdate: false, canDelete: false, canManageUsers: false },
};

// ─── Mock Handlers ───────────────────────────────────────────────────────────

class ProjectHandlers {
  async list(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const { page, limit, status, managerId, search } = req.query || {};
      const where: any = { deletedAt: null };
      if (status) where.status = status;
      if (managerId) where.managerId = managerId;
      if (search) where.OR = [{ name: { contains: search } }, { nameAr: { contains: search } }];

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;

      const [projects, total] = await Promise.all([
        mockPrisma.project.findMany({
          where,
          include: { manager: true, client: true },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        mockPrisma.project.count({ where }),
      ]);

      return res.status(200).json({
        data: projects,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async create(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const perms = ROLE_PERMISSIONS[auth.role];
      if (!perms.canCreate) return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });

      const { name, nameAr, description, budget, startDate, endDate, clientId, address, city, country } = req.body;

      if (!name || !budget || !startDate || !endDate || !clientId) {
        return res.status(400).json({ error: 'Missing required fields', code: 'VALIDATION_ERROR' });
      }

      const project = await mockPrisma.project.create({
        data: {
          name, nameAr, description,
          budget: parseFloat(budget),
          startDate, endDate,
          clientId,
          managerId: auth.userId,
          address, city, country,
          status: 'PLANNING',
          progress: 0,
          spent: 0,
          governmentApprovalStatus: 'PENDING',
          utilityConnectionStatus: 'PENDING',
        },
      });

      return res.status(201).json({ data: project });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async getById(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const { id } = req.params || req.body;
      const project = await mockPrisma.project.findUnique({
        where: { id },
        include: { manager: true, client: true, tasks: { where: { parentId: null } } },
      });

      if (!project) return res.status(404).json({ error: 'Project not found', code: 'NOT_FOUND' });
      if (project.deletedAt) return res.status(404).json({ error: 'Project has been deleted', code: 'NOT_FOUND' });

      return res.status(200).json({ data: project });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async update(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const perms = ROLE_PERMISSIONS[auth.role];
      if (!perms.canUpdate) return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });

      const { id, ...data } = req.body;
      const existing = await mockPrisma.project.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Project not found', code: 'NOT_FOUND' });

      const project = await mockPrisma.project.update({ where: { id }, data });
      return res.status(200).json({ data: project });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async remove(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const perms = ROLE_PERMISSIONS[auth.role];
      if (!perms.canDelete) return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });

      const { id } = req.body;
      const existing = await mockPrisma.project.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Project not found', code: 'NOT_FOUND' });

      const project = await mockPrisma.project.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return res.status(200).json({ data: project, message: 'Project deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Projects API Integration', () => {
  let handlers: ProjectHandlers;
  let adminUser: any;
  let managerUser: any;
  let engineerUser: any;
  let viewerUser: any;
  let testProject: TestProject;

  beforeEach(async () => {
    await setupTestDatabase();
    handlers = new ProjectHandlers();
    adminUser = createTestUserData({ role: 'ADMIN' });
    managerUser = createTestUserData({ role: 'MANAGER' });
    engineerUser = createTestUserData({ role: 'ENGINEER' });
    viewerUser = createTestUserData({ role: 'VIEWER' });
    testProject = createTestProjectData(managerUser.id, generateTestId('client'));
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  // ─── GET /api/projects (list with filters) ────────────────────────────────

  describe('GET /api/projects', () => {
    it('should return paginated project list', async () => {
      mockPrisma.project.findMany.mockResolvedValue([testProject]);
      mockPrisma.project.count.mockResolvedValue(1);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token, ...createMockRequest().headers });
      req.query = { page: '1', limit: '20' };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('should return 401 without authentication', async () => {
      const req = createMockRequest();
      req.query = {};
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should filter by status', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.query = { status: 'IN_PROGRESS' };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
    });

    it('should filter by manager', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.query = { managerId: managerUser.id };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ managerId: managerUser.id }),
        })
      );
    });

    it('should search by name', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.query = { search: 'Tower' };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'Tower' } },
              { nameAr: { contains: 'Tower' } },
            ]),
          }),
        })
      );
    });
  });

  // ─── POST /api/projects (create) ──────────────────────────────────────────

  describe('POST /api/projects', () => {
    it('should create project as admin', async () => {
      mockPrisma.project.create.mockResolvedValue(testProject);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({
        name: testProject.name,
        nameAr: testProject.nameAr,
        budget: testProject.budget,
        startDate: testProject.startDate,
        endDate: testProject.endDate,
        clientId: generateTestId('client'),
        address: '123 Test St',
        city: 'Riyadh',
        country: 'Saudi Arabia',
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toBeDefined();
    });

    it('should create project as manager', async () => {
      mockPrisma.project.create.mockResolvedValue(testProject);

      const token = `Bearer encoded_jwt_${managerUser.id}_MANAGER`;
      const req = createMockRequest({
        name: 'Manager Project',
        budget: 500000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        clientId: generateTestId('client'),
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(201);
    });

    it('should return 403 when engineer tries to create project', async () => {
      const token = `Bearer encoded_jwt_${engineerUser.id}_ENGINEER`;
      const req = createMockRequest({
        name: 'Engineer Project',
        budget: 100000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        clientId: generateTestId('client'),
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should return 403 when viewer tries to create project', async () => {
      const token = `Bearer encoded_jwt_${viewerUser.id}_VIEWER`;
      const req = createMockRequest({
        name: 'Viewer Project',
        budget: 100000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        clientId: generateTestId('client'),
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 400 for missing required fields', async () => {
      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ name: 'Incomplete' }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without authentication', async () => {
      const req = createMockRequest({
        name: 'Test', budget: 100000, startDate: '2024-01-01', endDate: '2024-12-31', clientId: 'c1',
      });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(401);
    });

    it('should set manager to authenticated user', async () => {
      mockPrisma.project.create.mockImplementation(async (args: any) => args.data);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({
        name: 'Test Project',
        budget: 500000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        clientId: 'c1',
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.body.data.managerId).toBe(adminUser.id);
    });
  });

  // ─── GET /api/projects/:id (get one) ──────────────────────────────────────

  describe('GET /api/projects/:id', () => {
    it('should return project details', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testProject,
        manager: managerUser,
        client: { id: 'c1', name: 'Client' },
        tasks: [],
      });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = { id: testProject.id };
      const res = createMockResponse();
      await handlers.getById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(testProject.id);
    });

    it('should return 404 for non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = { id: 'nonexistent' };
      const res = createMockResponse();
      await handlers.getById(req, res);

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const req = createMockRequest();
      req.params = { id: testProject.id };
      const res = createMockResponse();
      await handlers.getById(req, res);

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── PUT /api/projects/:id (update) ───────────────────────────────────────

  describe('PUT /api/projects/:id', () => {
    it('should update project as admin', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue({ ...testProject, name: 'Updated' });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testProject.id, name: 'Updated' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Updated');
    });

    it('should update project as manager', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue({ ...testProject, description: 'Updated desc' });

      const token = `Bearer encoded_jwt_${managerUser.id}_MANAGER`;
      const req = createMockRequest({ id: testProject.id, description: 'Updated desc' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(200);
    });

    it('should update project as engineer', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue({ ...testProject, progress: 50 });

      const token = `Bearer encoded_jwt_${engineerUser.id}_ENGINEER`;
      const req = createMockRequest({ id: testProject.id, progress: 50 }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(200);
    });

    it('should return 403 when viewer tries to update', async () => {
      const token = `Bearer encoded_jwt_${viewerUser.id}_VIEWER`;
      const req = createMockRequest({ id: testProject.id, name: 'Hack' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: 'nonexistent', name: 'Updated' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── DELETE /api/projects/:id (soft delete) ──────────────────────────────

  describe('DELETE /api/projects/:id', () => {
    it('should soft delete project as admin', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue({ ...testProject, deletedAt: new Date() });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testProject.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('should return 403 when manager tries to delete', async () => {
      const token = `Bearer encoded_jwt_${managerUser.id}_MANAGER`;
      const req = createMockRequest({ id: testProject.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 403 when engineer tries to delete', async () => {
      const token = `Bearer encoded_jwt_${engineerUser.id}_ENGINEER`;
      const req = createMockRequest({ id: testProject.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 403 when viewer tries to delete', async () => {
      const token = `Bearer encoded_jwt_${viewerUser.id}_VIEWER`;
      const req = createMockRequest({ id: testProject.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: 'nonexistent' }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const req = createMockRequest({ id: testProject.id });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Permission Matrix ────────────────────────────────────────────────────

  describe('permission matrix', () => {
    it('admin should have full access (create, update, delete)', async () => {
      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;

      // List
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);
      const listReq = createMockRequest({}, { authorization: token });
      listReq.query = {};
      const listRes = createMockResponse();
      await handlers.list(listReq, listRes);
      expect(listRes.statusCode).toBe(200);

      // Create
      mockPrisma.project.create.mockResolvedValue(testProject);
      const createReq = createMockRequest({
        name: 'Test', budget: 500000, startDate: '2024-01-01', endDate: '2024-12-31', clientId: 'c1',
      }, { authorization: token });
      const createRes = createMockResponse();
      await handlers.create(createReq, createRes);
      expect(createRes.statusCode).toBe(201);

      // Update
      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue(testProject);
      const updateReq = createMockRequest({ id: testProject.id, name: 'Updated' }, { authorization: token });
      const updateRes = createMockResponse();
      await handlers.update(updateReq, updateRes);
      expect(updateRes.statusCode).toBe(200);

      // Delete
      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue({ ...testProject, deletedAt: new Date() });
      const deleteReq = createMockRequest({ id: testProject.id }, { authorization: token });
      const deleteRes = createMockResponse();
      await handlers.remove(deleteReq, deleteRes);
      expect(deleteRes.statusCode).toBe(200);
    });

    it('viewer should only have read access', async () => {
      const token = `Bearer encoded_jwt_${viewerUser.id}_VIEWER`;

      // List - OK
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);
      const listReq = createMockRequest({}, { authorization: token });
      listReq.query = {};
      const listRes = createMockResponse();
      await handlers.list(listReq, listRes);
      expect(listRes.statusCode).toBe(200);

      // Create - FORBIDDEN
      const createReq = createMockRequest({
        name: 'Test', budget: 500000, startDate: '2024-01-01', endDate: '2024-12-31', clientId: 'c1',
      }, { authorization: token });
      const createRes = createMockResponse();
      await handlers.create(createReq, createRes);
      expect(createRes.statusCode).toBe(403);

      // Update - FORBIDDEN
      const updateReq = createMockRequest({ id: 'p1', name: 'Hack' }, { authorization: token });
      const updateRes = createMockResponse();
      await handlers.update(updateReq, updateRes);
      expect(updateRes.statusCode).toBe(403);

      // Delete - FORBIDDEN
      const deleteReq = createMockRequest({ id: 'p1' }, { authorization: token });
      const deleteRes = createMockResponse();
      await handlers.remove(deleteReq, deleteRes);
      expect(deleteRes.statusCode).toBe(403);
    });
  });
});
