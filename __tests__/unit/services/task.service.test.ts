/**
 * Task Service Unit Tests
 * Tests for task CRUD, SLA, Gantt chart, hierarchy, workflow templates, and duration estimation.
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
} from '../../utils/setup';
import { TEST_CONSTANTS } from '../../utils/test-helpers';

// ─── Mock Task Service ───────────────────────────────────────────────────────

class TaskService {
  async createTask(data: any, createdById: string) {
    const task = await mockPrisma.task.create({
      data: {
        ...data,
        createdById,
        status: data.status || 'TODO',
        progress: data.progress ?? 0,
        slaPriority: data.slaPriority || 'NORMAL',
        orderIndex: data.orderIndex ?? 0,
      },
    });
    return task;
  }

  async getTaskById(id: string) {
    const task = await mockPrisma.task.findUnique({
      where: { id },
      include: { project: true, assignee: true, subtasks: true, parent: true },
    });
    if (!task) throw new Error('TASK_NOT_FOUND');
    return task;
  }

  async updateTask(id: string, data: any) {
    const existing = await mockPrisma.task.findUnique({ where: { id } });
    if (!existing) throw new Error('TASK_NOT_FOUND');

    // Auto-update progress based on status
    if (data.status && !data.progress) {
      const progressMap: Record<string, number> = {
        TODO: 0,
        IN_PROGRESS: 25,
        REVIEW: 75,
        DONE: 100,
        CANCELLED: existing.progress,
      };
      data.progress = progressMap[data.status] ?? existing.progress;
    }

    return mockPrisma.task.update({ where: { id }, data });
  }

  async deleteTask(id: string) {
    const task = await mockPrisma.task.findUnique({ where: { id } });
    if (!task) throw new Error('TASK_NOT_FOUND');

    await mockPrisma.task.deleteMany({ where: { parentId: id } });
    return mockPrisma.task.delete({ where: { id } });
  }

  async createSubtask(parentId: string, data: any, createdById: string) {
    const parent = await mockPrisma.task.findUnique({ where: { id: parentId } });
    if (!parent) throw new Error('PARENT_TASK_NOT_FOUND');

    return mockPrisma.task.create({
      data: {
        ...data,
        parentId,
        createdById,
        projectId: parent.projectId,
        status: data.status || 'TODO',
        progress: data.progress ?? 0,
      },
    });
  }

  async getSubtasks(parentId: string) {
    return mockPrisma.task.findMany({
      where: { parentId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async getGanttData(projectId: string) {
    const tasks = await mockPrisma.task.findMany({
      where: {
        projectId,
        ganttStartDate: { not: null },
        ganttEndDate: { not: null },
        parentId: null,
      },
      include: { subtasks: true, assignee: true },
      orderBy: { ganttStartDate: 'asc' },
    });

    return tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      startDate: task.ganttStartDate,
      endDate: task.ganttEndDate,
      progress: task.progress,
      assignee: task.assignee,
      dependencies: [],
      subtasks: task.subtasks?.map((st: any) => ({
        id: st.id,
        title: st.title,
        startDate: st.ganttStartDate,
        endDate: st.ganttEndDate,
        progress: st.progress,
      })) || [],
    }));
  }

  async validateGanttDates(projectId: string, tasks: Array<{
    id: string;
    ganttStartDate: Date;
    ganttEndDate: Date;
    parentId?: string;
  }>) {
    const errors: string[] = [];

    for (const task of tasks) {
      // End date must be after start date
      if (task.ganttEndDate <= task.ganttStartDate) {
        errors.push(`Task "${task.id}": end date must be after start date`);
      }
    }

    // Check subtask dates within parent dates
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    for (const task of tasks) {
      if (task.parentId) {
        const parent = taskMap.get(task.parentId);
        if (parent) {
          if (task.ganttStartDate < parent.ganttStartDate) {
            errors.push(`Task "${task.id}": start date is before parent's start date`);
          }
          if (task.ganttEndDate > parent.ganttEndDate) {
            errors.push(`Task "${task.id}": end date is after parent's end date`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async checkSLABreach(): Promise<Array<{ taskId: string; taskTitle: string; slaDeadline: Date; slaPriority: string }>> {
    const now = new Date();
    const tasks = await mockPrisma.task.findMany({
      where: {
        status: { notIn: ['DONE', 'CANCELLED'] },
        slaDeadline: { not: null },
      },
      include: { project: true },
    });

    return tasks
      .filter((task: any) => task.slaDeadline && new Date(task.slaDeadline) <= now)
      .map((task: any) => ({
        taskId: task.id,
        taskTitle: task.title,
        slaDeadline: task.slaDeadline,
        slaPriority: task.slaPriority,
      }));
  }

  async calculateSLADeadline(createdAt: Date, priority: string): Promise<Date> {
    const hoursMap: Record<string, number> = {
      NORMAL: 48,
      HIGH: 24,
      CRITICAL: 4,
    };
    const hours = hoursMap[priority] || 48;

    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + hours);

    // Skip weekends (Friday=5, Saturday=6 in Saudi Arabia)
    while (deadline.getDay() === 5 || deadline.getDay() === 6) {
      deadline.setDate(deadline.getDate() + 1);
    }

    return deadline;
  }

  async classifyTaskType(data: {
    title: string;
    description?: string;
  }): Promise<string> {
    const text = `${data.title} ${data.description || ''}`.toLowerCase();

    const typeKeywords: Record<string, string[]> = {
      DESIGN: ['design', 'drawing', 'blueprint', 'architect', 'plan', 'layout', 'render'],
      ENGINEERING: ['structural', 'electrical', 'mechanical', 'plumbing', 'hvac', 'calculation', 'analysis'],
      CONSTRUCTION: ['build', 'construct', 'pour', 'install', 'erect', 'assemble', 'lay', 'pour concrete'],
      INSPECTION: ['inspect', 'test', 'check', 'verify', 'audit', 'review', 'quality'],
      DOCUMENTATION: ['document', 'report', 'submit', 'certificate', 'permit', 'approval', 'form'],
      COORDINATION: ['meeting', 'coordinate', 'communicate', 'schedule', 'update', 'sync'],
    };

    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some((kw) => text.includes(kw))) {
        return type;
      }
    }

    return 'CONSTRUCTION'; // default
  }

  async assignWorkflowTemplate(taskId: string, templateId: string) {
    const template = await mockPrisma.workflowTemplate?.findUnique?.({ where: { id: templateId } });
    if (!template) throw new Error('WORKFLOW_TEMPLATE_NOT_FOUND');

    return mockPrisma.task.update({
      where: { id: taskId },
      data: { workflowTemplateId: templateId },
    });
  }

  async calculateDuration(tasks: TestTask[]): Promise<number> {
    if (tasks.length === 0) return 0;
    return tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
  }

  async listTasks(filters: any = {}) {
    const where: any = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.type) where.type = filters.type;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.parentId === null) where.parentId = null;
    if (filters.slaBreached === true) {
      where.status = { notIn: ['DONE', 'CANCELLED'] };
      where.slaDeadline = { lte: new Date() };
    }

    const [tasks, total] = await Promise.all([
      mockPrisma.task.findMany({
        where,
        include: { assignee: true, project: true },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
        orderBy: filters.orderBy || { createdAt: 'desc' },
      }),
      mockPrisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total,
        totalPages: Math.ceil(total / (filters.limit || 20)),
      },
    };
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('TaskService', () => {
  let taskService: TaskService;
  let testProjectId: string;
  let testUserId: string;
  let testTask: TestTask;

  beforeEach(async () => {
    await setupTestDatabase();
    taskService = new TaskService();
    testProjectId = generateTestId('project');
    testUserId = generateTestId('user');
    testTask = createTestTaskData(testProjectId, testUserId);
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  // ─── Create Task Tests ────────────────────────────────────────────────────

  describe('createTask', () => {
    it('should create a task with all required fields', async () => {
      mockPrisma.task.create.mockResolvedValue(testTask);

      const result = await taskService.createTask({
        title: testTask.title,
        description: testTask.description,
        projectId: testProjectId,
        priority: 'HIGH',
        type: 'CONSTRUCTION',
        estimatedMinutes: 480,
      }, testUserId);

      expect(result).toEqual(testTask);
      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: testTask.title,
            projectId: testProjectId,
            createdById: testUserId,
            status: 'TODO',
            progress: 0,
            slaPriority: 'NORMAL',
          }),
        })
      );
    });

    it('should create a task with SLA fields', async () => {
      const slaTask = {
        ...testTask,
        slaDeadline: new Date('2024-02-15T10:00:00Z'),
        slaPriority: 'HIGH',
      };
      mockPrisma.task.create.mockResolvedValue(slaTask);

      const result = await taskService.createTask({
        title: 'Urgent Inspection',
        projectId: testProjectId,
        slaDeadline: new Date('2024-02-15T10:00:00Z'),
        slaPriority: 'HIGH',
      }, testUserId);

      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slaDeadline: new Date('2024-02-15T10:00:00Z'),
            slaPriority: 'HIGH',
          }),
        })
      );
    });

    it('should set default status to TODO', async () => {
      mockPrisma.task.create.mockResolvedValue(testTask);

      await taskService.createTask({
        title: 'New Task',
        projectId: testProjectId,
      }, testUserId);

      const callData = mockPrisma.task.create.mock.calls[0][0].data;
      expect(callData.status).toBe('TODO');
    });

    it('should initialize progress to 0', async () => {
      mockPrisma.task.create.mockResolvedValue(testTask);

      await taskService.createTask({
        title: 'New Task',
        projectId: testProjectId,
      }, testUserId);

      const callData = mockPrisma.task.create.mock.calls[0][0].data;
      expect(callData.progress).toBe(0);
    });

    it('should set estimated duration in minutes', async () => {
      mockPrisma.task.create.mockResolvedValue({ ...testTask, estimatedMinutes: 120 });

      await taskService.createTask({
        title: 'Quick Review',
        projectId: testProjectId,
        estimatedMinutes: 120,
      }, testUserId);

      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estimatedMinutes: 120 }),
        })
      );
    });

    it('should allow custom initial status when provided', async () => {
      mockPrisma.task.create.mockResolvedValue({ ...testTask, status: 'IN_PROGRESS' });

      await taskService.createTask({
        title: 'Active Task',
        projectId: testProjectId,
        status: 'IN_PROGRESS',
        progress: 25,
      }, testUserId);

      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'IN_PROGRESS',
            progress: 25,
          }),
        })
      );
    });
  });

  // ─── Task Hierarchy Tests ─────────────────────────────────────────────────

  describe('task hierarchy (subtasks)', () => {
    it('should create a subtask under a parent task', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      const subtask = { ...testTask, id: 'subtask-1', parentId: testTask.id };
      mockPrisma.task.create.mockResolvedValue(subtask);

      const result = await taskService.createSubtask(testTask.id, {
        title: 'Subtask 1',
      }, testUserId);

      expect(result.parentId).toBe(testTask.id);
      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentId: testTask.id,
            projectId: testProjectId,
          }),
        })
      );
    });

    it('should throw error when parent task does not exist', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(taskService.createSubtask('nonexistent', { title: 'Subtask' }, testUserId))
        .rejects.toThrow('PARENT_TASK_NOT_FOUND');
    });

    it('should inherit project from parent task', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      mockPrisma.task.create.mockResolvedValue({ ...testTask, id: 'subtask-1' });

      await taskService.createSubtask(testTask.id, { title: 'Subtask' }, testUserId);

      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: testProjectId,
          }),
        })
      );
    });

    it('should retrieve all subtasks for a parent task', async () => {
      const subtasks = [
        { ...testTask, id: 'sub1', parentId: testTask.id, orderIndex: 0 },
        { ...testTask, id: 'sub2', parentId: testTask.id, orderIndex: 1 },
        { ...testTask, id: 'sub3', parentId: testTask.id, orderIndex: 2 },
      ];
      mockPrisma.task.findMany.mockResolvedValue(subtasks);

      const result = await taskService.getSubtasks(testTask.id);

      expect(result).toHaveLength(3);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: testTask.id },
          orderBy: { orderIndex: 'asc' },
        })
      );
    });

    it('should delete subtasks when parent task is deleted', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      mockPrisma.task.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.task.delete.mockResolvedValue(testTask);

      await taskService.deleteTask(testTask.id);

      expect(mockPrisma.task.deleteMany).toHaveBeenCalledWith({
        where: { parentId: testTask.id },
      });
      expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: testTask.id } });
    });

    it('should support multiple levels of nesting (sub-subtasks)', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      const nestedSubtask = { ...testTask, id: 'sub-subtask-1', parentId: 'subtask-1' };
      mockPrisma.task.create.mockResolvedValue(nestedSubtask);

      const result = await taskService.createSubtask('subtask-1', {
        title: 'Nested Subtask',
      }, testUserId);

      expect(result.parentId).toBe('subtask-1');
    });
  });

  // ─── Gantt Chart Tests ────────────────────────────────────────────────────

  describe('gantt chart', () => {
    it('should return Gantt data for project tasks', async () => {
      const ganttTasks = [
        {
          ...testTask,
          id: 'task-1',
          ganttStartDate: new Date('2024-01-15'),
          ganttEndDate: new Date('2024-02-15'),
          assignee: { id: 'user-1', name: 'Engineer 1' },
          subtasks: [
            { id: 'sub-1', title: 'Sub 1', ganttStartDate: new Date('2024-01-15'), ganttEndDate: new Date('2024-01-30'), progress: 50 },
          ],
        },
      ];
      mockPrisma.task.findMany.mockResolvedValue(ganttTasks);

      const result = await taskService.getGanttData(testProjectId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'task-1');
      expect(result[0]).toHaveProperty('startDate');
      expect(result[0]).toHaveProperty('endDate');
      expect(result[0]).toHaveProperty('subtasks');
      expect(result[0].subtasks).toHaveLength(1);
    });

    it('should only include tasks with Gantt dates', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await taskService.getGanttData(testProjectId);

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

    it('should order Gantt tasks by start date ascending', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await taskService.getGanttData(testProjectId);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { ganttStartDate: 'asc' },
        })
      );
    });

    it('should return empty dependencies array', async () => {
      mockPrisma.task.findMany.mockResolvedValue([
        {
          ...testTask,
          ganttStartDate: new Date('2024-01-15'),
          ganttEndDate: new Date('2024-02-15'),
          subtasks: [],
          assignee: null,
        },
      ]);

      const result = await taskService.getGanttData(testProjectId);

      expect(result[0].dependencies).toEqual([]);
    });
  });

  // ─── Gantt Date Validation ────────────────────────────────────────────────

  describe('gantt date validation', () => {
    it('should validate correct parent-child date constraints', async () => {
      const parentStart = new Date('2024-01-15');
      const parentEnd = new Date('2024-03-15');
      const tasks = [
        { id: 'parent-1', ganttStartDate: parentStart, ganttEndDate: parentEnd },
        { id: 'child-1', ganttStartDate: new Date('2024-01-20'), ganttEndDate: new Date('2024-02-20'), parentId: 'parent-1' },
      ];

      const result = await taskService.validateGanttDates(testProjectId, tasks);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject end date before start date', async () => {
      const tasks = [
        { id: 'task-1', ganttStartDate: new Date('2024-03-01'), ganttEndDate: new Date('2024-02-01') },
      ];

      const result = await taskService.validateGanttDates(testProjectId, tasks);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('end date must be after start date');
    });

    it('should reject end date equal to start date', async () => {
      const sameDate = new Date('2024-03-01');
      const tasks = [
        { id: 'task-1', ganttStartDate: sameDate, ganttEndDate: sameDate },
      ];

      const result = await taskService.validateGanttDates(testProjectId, tasks);

      expect(result.valid).toBe(false);
    });

    it('should reject subtask starting before parent', async () => {
      const tasks = [
        { id: 'parent-1', ganttStartDate: new Date('2024-02-01'), ganttEndDate: new Date('2024-03-01') },
        { id: 'child-1', ganttStartDate: new Date('2024-01-15'), ganttEndDate: new Date('2024-02-15'), parentId: 'parent-1' },
      ];

      const result = await taskService.validateGanttDates(testProjectId, tasks);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("before parent's start date");
    });

    it('should reject subtask ending after parent', async () => {
      const tasks = [
        { id: 'parent-1', ganttStartDate: new Date('2024-02-01'), ganttEndDate: new Date('2024-03-01') },
        { id: 'child-1', ganttStartDate: new Date('2024-02-15'), ganttEndDate: new Date('2024-03-15'), parentId: 'parent-1' },
      ];

      const result = await taskService.validateGanttDates(testProjectId, tasks);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("after parent's end date");
    });

    it('should return multiple errors for multiple violations', async () => {
      const tasks = [
        { id: 'task-1', ganttStartDate: new Date('2024-03-01'), ganttEndDate: new Date('2024-02-01') },
        { id: 'task-2', ganttStartDate: new Date('2024-05-01'), ganttEndDate: new Date('2024-04-01') },
      ];

      const result = await taskService.validateGanttDates(testProjectId, tasks);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── SLA Breach Detection ─────────────────────────────────────────────────

  describe('SLA breach detection', () => {
    it('should detect tasks past SLA deadline', async () => {
      const pastDeadline = new Date();
      pastDeadline.setHours(pastDeadline.getHours() - 2);

      mockPrisma.task.findMany.mockResolvedValue([
        {
          id: 'task-1',
          title: 'Overdue Inspection',
          slaDeadline: pastDeadline,
          slaPriority: 'HIGH',
          status: 'IN_PROGRESS',
        },
      ]);

      const result = await taskService.checkSLABreach();

      expect(result).toHaveLength(1);
      expect(result[0].taskId).toBe('task-1');
      expect(result[0].taskTitle).toBe('Overdue Inspection');
    });

    it('should not include completed or cancelled tasks in SLA breach check', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await taskService.checkSLABreach();

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { notIn: ['DONE', 'CANCELLED'] },
          }),
        })
      );
    });

    it('should not include tasks without SLA deadline', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await taskService.checkSLABreach();

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            slaDeadline: { not: null },
          }),
        })
      );
    });

    it('should return empty array when no breaches', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const result = await taskService.checkSLABreach();

      expect(result).toHaveLength(0);
    });

    it('should handle multiple breached tasks', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 5);

      mockPrisma.task.findMany.mockResolvedValue([
        { id: 't1', title: 'Task 1', slaDeadline: pastDate, slaPriority: 'CRITICAL', status: 'IN_PROGRESS' },
        { id: 't2', title: 'Task 2', slaDeadline: pastDate, slaPriority: 'HIGH', status: 'TODO' },
        { id: 't3', title: 'Task 3', slaDeadline: pastDate, slaPriority: 'NORMAL', status: 'REVIEW' },
      ]);

      const result = await taskService.checkSLABreach();

      expect(result).toHaveLength(3);
    });
  });

  // ─── SLA Deadline Calculation ─────────────────────────────────────────────

  describe('SLA deadline calculation', () => {
    it('should set 48-hour deadline for NORMAL priority', async () => {
      const created = new Date('2024-01-15T09:00:00Z');
      const deadline = await taskService.calculateSLADeadline(created, 'NORMAL');

      const hoursDiff = (deadline.getTime() - created.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(48);
    });

    it('should set 24-hour deadline for HIGH priority', async () => {
      const created = new Date('2024-01-15T09:00:00Z');
      const deadline = await taskService.calculateSLADeadline(created, 'HIGH');

      const hoursDiff = (deadline.getTime() - created.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(24);
    });

    it('should set 4-hour deadline for CRITICAL priority', async () => {
      const created = new Date('2024-01-15T09:00:00Z');
      const deadline = await taskService.calculateSLADeadline(created, 'CRITICAL');

      const hoursDiff = (deadline.getTime() - created.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(4);
    });

    it('should skip weekends when calculating deadline', async () => {
      // Thursday at 10:00 → 48 hours would be Saturday, should skip to Sunday
      const created = new Date('2024-01-18T10:00:00Z'); // Thursday
      const deadline = await taskService.calculateSLADeadline(created, 'NORMAL');

      // Should not land on Friday (5) or Saturday (6)
      expect(deadline.getDay()).not.toBe(5);
      expect(deadline.getDay()).not.toBe(6);
    });
  });

  // ─── Task Type Classification ─────────────────────────────────────────────

  describe('task type classification', () => {
    it('should classify DESIGN tasks', async () => {
      const result = await taskService.classifyTaskType({
        title: 'Create architectural blueprint',
      });
      expect(result).toBe('DESIGN');
    });

    it('should classify ENGINEERING tasks', async () => {
      const result = await taskService.classifyTaskType({
        title: 'Perform structural analysis',
      });
      expect(result).toBe('ENGINEERING');
    });

    it('should classify CONSTRUCTION tasks', async () => {
      const result = await taskService.classifyTaskType({
        title: 'Pour concrete foundation',
      });
      expect(result).toBe('CONSTRUCTION');
    });

    it('should classify INSPECTION tasks', async () => {
      const result = await taskService.classifyTaskType({
        title: 'Quality inspection check',
      });
      expect(result).toBe('INSPECTION');
    });

    it('should classify DOCUMENTATION tasks', async () => {
      const result = await taskService.classifyTaskType({
        title: 'Submit completion certificate',
      });
      expect(result).toBe('DOCUMENTATION');
    });

    it('should classify COORDINATION tasks', async () => {
      const result = await taskService.classifyTaskType({
        title: 'Schedule coordination meeting',
      });
      expect(result).toBe('COORDINATION');
    });

    it('should default to CONSTRUCTION when no keywords match', async () => {
      const result = await taskService.classifyTaskType({
        title: 'Some random task',
      });
      expect(result).toBe('CONSTRUCTION');
    });

    it('should check description for classification keywords', async () => {
      const result = await taskService.classifyTaskType({
        title: 'General task',
        description: 'Need to design the new layout plan',
      });
      expect(result).toBe('DESIGN');
    });
  });

  // ─── Workflow Template Tests ──────────────────────────────────────────────

  describe('workflow template assignment', () => {
    it('should assign workflow template to task', async () => {
      mockPrisma.task.update.mockResolvedValue({
        ...testTask,
        workflowTemplateId: 'template-1',
      });

      // Mock the workflowTemplate model
      (mockPrisma as any).workflowTemplate = {
        findUnique: jest.fn().mockResolvedValue({ id: 'template-1', name: 'Standard Construction' }),
      };

      const result = await taskService.assignWorkflowTemplate(testTask.id, 'template-1');

      expect(result.workflowTemplateId).toBe('template-1');
    });

    it('should throw error when workflow template not found', async () => {
      (mockPrisma as any).workflowTemplate = {
        findUnique: jest.fn().mockResolvedValue(null),
      };

      await expect(taskService.assignWorkflowTemplate(testTask.id, 'nonexistent'))
        .rejects.toThrow('WORKFLOW_TEMPLATE_NOT_FOUND');
    });
  });

  // ─── Progress Calculation ─────────────────────────────────────────────────

  describe('progress calculation', () => {
    it('should auto-update progress based on status change', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      mockPrisma.task.update.mockImplementation(async (args: any) => ({
        ...testTask,
        ...args.data,
      }));

      await taskService.updateTask(testTask.id, { status: 'IN_PROGRESS' });

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ progress: 25 }),
        })
      );
    });

    it('should set progress to 100 when status changes to DONE', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      mockPrisma.task.update.mockImplementation(async (args: any) => ({
        ...testTask,
        ...args.data,
      }));

      await taskService.updateTask(testTask.id, { status: 'DONE' });

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ progress: 100 }),
        })
      );
    });

    it('should set progress to 0 when status changes to TODO', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({ ...testTask, status: 'IN_PROGRESS', progress: 50 });
      mockPrisma.task.update.mockImplementation(async (args: any) => ({
        ...testTask,
        ...args.data,
      }));

      await taskService.updateTask(testTask.id, { status: 'TODO' });

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ progress: 0 }),
        })
      );
    });

    it('should not override explicit progress value', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      mockPrisma.task.update.mockImplementation(async (args: any) => ({
        ...testTask,
        ...args.data,
      }));

      await taskService.updateTask(testTask.id, { status: 'IN_PROGRESS', progress: 40 });

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ progress: 40 }),
        })
      );
    });

    it('should set progress to 75 when status changes to REVIEW', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(testTask);
      mockPrisma.task.update.mockImplementation(async (args: any) => ({
        ...testTask,
        ...args.data,
      }));

      await taskService.updateTask(testTask.id, { status: 'REVIEW' });

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ progress: 75 }),
        })
      );
    });
  });

  // ─── Duration Estimation Tests ────────────────────────────────────────────

  describe('duration estimation', () => {
    it('should calculate total duration in minutes', async () => {
      const tasks = [
        { ...testTask, estimatedMinutes: 480 },
        { ...testTask, estimatedMinutes: 240 },
        { ...testTask, estimatedMinutes: 60 },
      ];

      const duration = await taskService.calculateDuration(tasks);

      expect(duration).toBe(780); // 480 + 240 + 60
    });

    it('should return 0 for empty task list', async () => {
      const duration = await taskService.calculateDuration([]);

      expect(duration).toBe(0);
    });

    it('should handle tasks without estimated minutes', async () => {
      const tasks = [
        { ...testTask, estimatedMinutes: 120 },
        { ...testTask, estimatedMinutes: undefined },
        { ...testTask, estimatedMinutes: 0 },
      ];

      const duration = await taskService.calculateDuration(tasks);

      expect(duration).toBe(120);
    });
  });

  // ─── Task Listing Tests ───────────────────────────────────────────────────

  describe('listTasks', () => {
    it('should return paginated task list', async () => {
      mockPrisma.task.findMany.mockResolvedValue([testTask]);
      mockPrisma.task.count.mockResolvedValue(1);

      const result = await taskService.listTasks({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter tasks by project', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await taskService.listTasks({ projectId: testProjectId });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: testProjectId }),
        })
      );
    });

    it('should filter tasks by status', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await taskService.listTasks({ status: 'IN_PROGRESS' });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
    });

    it('should filter tasks by priority', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await taskService.listTasks({ priority: 'HIGH' });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: 'HIGH' }),
        })
      );
    });

    it('should filter tasks by type', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await taskService.listTasks({ type: 'INSPECTION' });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'INSPECTION' }),
        })
      );
    });

    it('should filter tasks by assignee', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await taskService.listTasks({ assignedToId: 'user-1' });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedToId: 'user-1' }),
        })
      );
    });

    it('should filter root-level tasks (no parent)', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await taskService.listTasks({ parentId: null });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ parentId: null }),
        })
      );
    });

    it('should filter SLA-breached tasks', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await taskService.listTasks({ slaBreached: true });

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
});
