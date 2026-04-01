/**
 * Tasks API Integration Tests
 * Full CRUD, filtering, SLA monitoring, and Gantt data tests for task endpoints.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  mockPrisma,
  setupTestDatabase,
  teardownTestDatabase,
  createTestTaskData,
  createTestUserData,
  generateTestId,
  type TestTask,
  type UserRole,
} from '../../utils/setup';
import { generateAuthToken } from '../../utils/test-helpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockResponse() {
  const res: any = { statusCode: 200, body: null };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (data: any) => { res.body = data; return res; };
  return res;
}

function createMockRequest(body: any = {}, headers: Record<string, string> = {}) {
  return { body, query: {}, params: {}, headers: { 'content-type': 'application/json', ...headers } };
}

function verifyToken(token: string): { userId: string; role: UserRole } | null {
  if (!token || !token.startsWith('Bearer ')) return null;
  const parts = token.replace('Bearer ', '').split('_');
  if (parts[0] === 'encoded' && parts[1] === 'jwt') return { userId: parts[2], role: parts[3] as UserRole };
  return null;
}

const ROLE_PERMISSIONS: Record<UserRole, { canCreate: boolean; canUpdate: boolean; canDelete: boolean; canDeleteOwn: boolean }> = {
  ADMIN: { canCreate: true, canUpdate: true, canDelete: true, canDeleteOwn: true },
  MANAGER: { canCreate: true, canUpdate: true, canDelete: false, canDeleteOwn: true },
  ENGINEER: { canCreate: true, canUpdate: true, canDelete: false, canDeleteOwn: false },
  VIEWER: { canCreate: false, canUpdate: false, canDelete: false, canDeleteOwn: false },
};

// ─── Mock Handlers ───────────────────────────────────────────────────────────

class TaskHandlers {
  async list(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const { page, limit, status, priority, type, assignedToId, projectId, slaBreached } = req.query;
      const where: any = {};
      if (projectId) where.projectId = projectId;
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (type) where.type = type;
      if (assignedToId) where.assignedToId = assignedToId;
      if (slaBreached === 'true') {
        where.status = { notIn: ['DONE', 'CANCELLED'] };
        where.slaDeadline = { lte: new Date() };
      }

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;

      const [tasks, total] = await Promise.all([
        mockPrisma.task.findMany({
          where,
          include: { assignee: true, project: true, subtasks: true },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        mockPrisma.task.count({ where }),
      ]);

      return res.status(200).json({
        data: tasks,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      });
    } catch {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async create(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const perms = ROLE_PERMISSIONS[auth.role];
      if (!perms.canCreate) return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });

      const { title, description, projectId, priority, type, assignedToId, estimatedMinutes, slaPriority, slaDeadline, parentId, ganttStartDate, ganttEndDate } = req.body;

      if (!title || !projectId) {
        return res.status(400).json({ error: 'Title and projectId are required', code: 'VALIDATION_ERROR' });
      }

      const task = await mockPrisma.task.create({
        data: {
          title, description, projectId, priority, type,
          assignedToId: assignedToId || auth.userId,
          createdById: auth.userId,
          parentId,
          estimatedMinutes: estimatedMinutes || 60,
          slaPriority: slaPriority || 'NORMAL',
          slaDeadline: slaDeadline ? new Date(slaDeadline) : null,
          ganttStartDate: ganttStartDate ? new Date(ganttStartDate) : null,
          ganttEndDate: ganttEndDate ? new Date(ganttEndDate) : null,
          status: 'TODO',
          progress: 0,
          orderIndex: 0,
        },
      });

      return res.status(201).json({ data: task });
    } catch {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async getById(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const { id } = req.params;
      const task = await mockPrisma.task.findUnique({
        where: { id },
        include: { assignee: true, project: true, subtasks: true, parent: true, creator: true },
      });

      if (!task) return res.status(404).json({ error: 'Task not found', code: 'NOT_FOUND' });

      return res.status(200).json({ data: task });
    } catch {
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
      const existing = await mockPrisma.task.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Task not found', code: 'NOT_FOUND' });

      const progressMap: Record<string, number> = { TODO: 0, IN_PROGRESS: 25, REVIEW: 75, DONE: 100, CANCELLED: existing.progress };
      if (data.status && !data.progress) data.progress = progressMap[data.status] ?? existing.progress;

      const task = await mockPrisma.task.update({ where: { id }, data });
      return res.status(200).json({ data: task });
    } catch {
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
      const existing = await mockPrisma.task.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Task not found', code: 'NOT_FOUND' });

      await mockPrisma.task.deleteMany({ where: { parentId: id } });
      await mockPrisma.task.delete({ where: { id } });

      return res.status(200).json({ message: 'Task deleted successfully' });
    } catch {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async getSLABreached(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const tasks = await mockPrisma.task.findMany({
        where: {
          status: { notIn: ['DONE', 'CANCELLED'] },
          slaDeadline: { lte: new Date() },
        },
        include: { project: true, assignee: true },
        orderBy: { slaDeadline: 'asc' },
      });

      return res.status(200).json({ data: tasks, count: tasks.length });
    } catch {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  async getGanttData(req: any, res: any) {
    try {
      const auth = verifyToken(req.headers.authorization);
      if (!auth) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

      const { projectId } = req.params;
      if (!projectId) return res.status(400).json({ error: 'projectId is required', code: 'VALIDATION_ERROR' });

      const tasks = await mockPrisma.task.findMany({
        where: { projectId, ganttStartDate: { not: null }, ganttEndDate: { not: null }, parentId: null },
        include: { subtasks: true, assignee: true },
        orderBy: { ganttStartDate: 'asc' },
      });

      const ganttData = tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        startDate: task.ganttStartDate,
        endDate: task.ganttEndDate,
        progress: task.progress,
        assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name } : null,
        dependencies: [],
        subtasks: (task.subtasks || []).map((st: any) => ({
          id: st.id,
          title: st.title,
          startDate: st.ganttStartDate,
          endDate: st.ganttEndDate,
          progress: st.progress,
        })),
      }));

      return res.status(200).json({ data: ganttData });
    } catch {
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Tasks API Integration', () => {
  let handlers: TaskHandlers;
  let adminUser: any;
  let managerUser: any;
  let engineerUser: any;
  let viewerUser: any;
  let testProjectId: string;
  let testTask: TestTask;

  beforeEach(async () => {
    await setupTestDatabase();
    handlers = new TaskHandlers();
    testProjectId = generateTestId('project');
    adminUser = createTestUserData({ role: 'ADMIN' });
    managerUser = createTestUserData({ role: 'MANAGER' });
    engineerUser = createTestUserData({ role: 'ENGINEER' });
    viewerUser = createTestUserData({ role: 'VIEWER' });
    testTask = createTestTaskData(testProjectId, adminUser.id);
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  // ─── GET /api/tasks ───────────────────────────────────────────────────────

  describe('GET /api/tasks', () => {
    it('should return paginated task list', async () => {
      mockPrisma.task.findMany.mockResolvedValue([testTask]);
      mockPrisma.task.count.mockResolvedValue(1);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('should return 401 without authentication', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(res.statusCode).toBe(401);
    });

    it('should filter by status', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.query = { status: 'IN_PROGRESS' };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'IN_PROGRESS' }) })
      );
    });

    it('should filter by priority', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.query = { priority: 'HIGH' };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ priority: 'HIGH' }) })
      );
    });

    it('should filter by type', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.query = { type: 'INSPECTION' };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'INSPECTION' }) })
      );
    });

    it('should filter by assignedToId', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.query = { assignedToId: engineerUser.id };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ assignedToId: engineerUser.id }) })
      );
    });

    it('should filter SLA breached tasks', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.query = { slaBreached: 'true' };
      const res = createMockResponse();
      await handlers.list(req, res);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { notIn: ['DONE', 'CANCELLED'] },
            slaDeadline: { lte: expect.any(Date) },
          }),
        })
      );
    });
  });

  // ─── POST /api/tasks ──────────────────────────────────────────────────────

  describe('POST /api/tasks', () => {
    it('should create task as admin', async () => {
      mockPrisma.task.create.mockResolvedValue(testTask);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({
        title: testTask.title,
        projectId: testProjectId,
        priority: 'HIGH',
        type: 'CONSTRUCTION',
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toBeDefined();
    });

    it('should create task as engineer', async () => {
      mockPrisma.task.create.mockResolvedValue(testTask);

      const token = `Bearer encoded_jwt_${engineerUser.id}_ENGINEER`;
      const req = createMockRequest({
        title: 'My Task',
        projectId: testProjectId,
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(201);
    });

    it('should return 403 when viewer tries to create', async () => {
      const token = `Bearer encoded_jwt_${viewerUser.id}_VIEWER`;
      const req = createMockRequest({
        title: 'Task',
        projectId: testProjectId,
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 400 for missing title', async () => {
      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ projectId: testProjectId }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for missing projectId', async () => {
      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ title: 'Task' }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should create subtask with parentId', async () => {
      mockPrisma.task.create.mockResolvedValue({ ...testTask, parentId: 'parent-task-1' });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({
        title: 'Subtask',
        projectId: testProjectId,
        parentId: 'parent-task-1',
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.statusCode).toBe(201);
      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ parentId: 'parent-task-1' }) })
      );
    });

    it('should default status to TODO', async () => {
      mockPrisma.task.create.mockImplementation(async (args: any) => args.data);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({
        title: 'Task',
        projectId: testProjectId,
      }, { authorization: token });
      const res = createMockResponse();
      await handlers.create(req, res);

      expect(res.body.data.status).toBe('TODO');
    });
  });

  // ─── GET /api/tasks/:id ───────────────────────────────────────────────────

  describe('GET /api/tasks/:id', () => {
    it('should return task with relations', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        ...testTask,
        assignee: adminUser,
        project: { id: testProjectId, name: 'Project' },
        subtasks: [],
        parent: null,
        creator: adminUser,
      });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = { id: testTask.id };
      const res = createMockResponse();
      await handlers.getById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(testTask.id);
    });

    it('should return 404 for non-existent task', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = { id: 'nonexistent' };
      const res = createMockResponse();
      await handlers.getById(req, res);

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── PUT /api/tasks/:id ───────────────────────────────────────────────────

  describe('PUT /api/tasks/:id', () => {
    it('should update task as admin', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      mockPrisma.task.update.mockResolvedValue({ ...testTask, status: 'IN_PROGRESS' });

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testTask.id, status: 'IN_PROGRESS' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(200);
    });

    it('should auto-update progress on status change', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      mockPrisma.task.update.mockImplementation(async (args: any) => ({ ...testTask, ...args.data }));

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testTask.id, status: 'DONE' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.body.data.progress).toBe(100);
    });

    it('should return 403 when viewer tries to update', async () => {
      const token = `Bearer encoded_jwt_${viewerUser.id}_VIEWER`;
      const req = createMockRequest({ id: testTask.id, title: 'Hack' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent task', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: 'nonexistent', title: 'X' }, { authorization: token });
      const res = createMockResponse();
      await handlers.update(req, res);

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── DELETE /api/tasks/:id ────────────────────────────────────────────────

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task as admin', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      mockPrisma.task.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.task.delete.mockResolvedValue(testTask);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testTask.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(200);
    });

    it('should return 403 when engineer tries to delete', async () => {
      const token = `Bearer encoded_jwt_${engineerUser.id}_ENGINEER`;
      const req = createMockRequest({ id: testTask.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should return 403 when viewer tries to delete', async () => {
      const token = `Bearer encoded_jwt_${viewerUser.id}_VIEWER`;
      const req = createMockRequest({ id: testTask.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should delete associated subtasks', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      mockPrisma.task.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.task.delete.mockResolvedValue(testTask);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({ id: testTask.id }, { authorization: token });
      const res = createMockResponse();
      await handlers.remove(req, res);

      expect(mockPrisma.task.deleteMany).toHaveBeenCalledWith({ where: { parentId: testTask.id } });
    });
  });

  // ─── SLA Monitoring Endpoint ──────────────────────────────────────────────

  describe('GET /api/tasks/sla/breached', () => {
    it('should return list of SLA breached tasks', async () => {
      const breachedTasks = [
        { id: 't1', title: 'Overdue', slaDeadline: new Date('2024-01-01'), status: 'IN_PROGRESS' },
      ];
      mockPrisma.task.findMany.mockResolvedValue(breachedTasks);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      const res = createMockResponse();
      await handlers.getSLABreached(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.count).toBe(1);
    });

    it('should return 401 without authentication', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      await handlers.getSLABreached(req, res);

      expect(res.statusCode).toBe(401);
    });

    it('should exclude completed and cancelled tasks', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      const res = createMockResponse();
      await handlers.getSLABreached(req, res);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { notIn: ['DONE', 'CANCELLED'] },
          }),
        })
      );
    });

    it('should order by SLA deadline ascending', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      const res = createMockResponse();
      await handlers.getSLABreached(req, res);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { slaDeadline: 'asc' } })
      );
    });
  });

  // ─── Gantt Data Endpoint ──────────────────────────────────────────────────

  describe('GET /api/tasks/gantt/:projectId', () => {
    it('should return Gantt data for project', async () => {
      mockPrisma.task.findMany.mockResolvedValue([
        {
          ...testTask,
          ganttStartDate: new Date('2024-01-15'),
          ganttEndDate: new Date('2024-02-15'),
          assignee: { id: 'u1', name: 'Engineer' },
          subtasks: [
            { id: 'sub1', title: 'Sub 1', ganttStartDate: new Date('2024-01-15'), ganttEndDate: new Date('2024-01-30'), progress: 50 },
          ],
        },
      ]);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = { projectId: testProjectId };
      const res = createMockResponse();
      await handlers.getGanttData(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('startDate');
      expect(res.body.data[0]).toHaveProperty('endDate');
      expect(res.body.data[0].subtasks).toHaveLength(1);
    });

    it('should return 400 when projectId is missing', async () => {
      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = {};
      const res = createMockResponse();
      await handlers.getGanttData(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const req = createMockRequest();
      req.params = { projectId: testProjectId };
      const res = createMockResponse();
      await handlers.getGanttData(req, res);

      expect(res.statusCode).toBe(401);
    });

    it('should only include tasks with Gantt dates', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const token = `Bearer encoded_jwt_${adminUser.id}_ADMIN`;
      const req = createMockRequest({}, { authorization: token });
      req.params = { projectId: testProjectId };
      const res = createMockResponse();
      await handlers.getGanttData(req, res);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ganttStartDate: { not: null },
            ganttEndDate: { not: null },
            parentId: null,
          }),
        })
      );
    });
  });
});
