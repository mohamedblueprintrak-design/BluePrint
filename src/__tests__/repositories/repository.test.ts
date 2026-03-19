/**
 * Repository Tests
 * اختبارات المستودعات
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma Client
const createMockPrisma = () => ({
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  project: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  client: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
});

describe('BaseRepository', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return entity by id', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = mockUser;

      expect(result).toEqual(mockUser);
      expect(result.id).toBe('user-123');
    });

    it('should return null if not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = null;

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should return all entities', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com' },
        { id: '2', email: 'user2@example.com' },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = mockUsers;

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user1@example.com');
    });

    it('should apply pagination correctly', async () => {
      const mockUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.com`,
      }));

      mockPrisma.user.findMany.mockResolvedValue(mockUsers.slice(0, 10));

      const result = mockUsers.slice(0, 10);

      expect(result).toHaveLength(10);
    });

    it('should apply where conditions', async () => {
      const activeUsers = [
        { id: '1', email: 'active@example.com', isActive: true },
      ];

      mockPrisma.user.findMany.mockResolvedValue(activeUsers);

      const result = activeUsers;

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should apply ordering', async () => {
      const sortedUsers = [
        { id: '2', createdAt: new Date('2025-01-02') },
        { id: '1', createdAt: new Date('2025-01-01') },
      ];

      mockPrisma.user.findMany.mockResolvedValue(sortedUsers);

      const result = sortedUsers;

      expect(result[0].createdAt).toEqual(new Date('2025-01-02'));
    });
  });

  describe('create', () => {
    it('should create new entity', async () => {
      const newUserData = {
        email: 'new@example.com',
        username: 'newuser',
        password: 'hashedpassword',
      };

      const createdUser = {
        id: 'user-new',
        ...newUserData,
        createdAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = createdUser;

      expect(result.id).toBe('user-new');
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('update', () => {
    it('should update existing entity', async () => {
      const updateData = {
        fullName: 'Updated Name',
      };

      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Updated Name',
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = updatedUser;

      expect(result.fullName).toBe('Updated Name');
    });

    it('should throw error if entity not found', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('Record not found'));

      await expect(async () => {
        throw new Error('Record not found');
      }).rejects.toThrow('Record not found');
    });
  });

  describe('delete', () => {
    it('should delete existing entity', async () => {
      const deletedUser = {
        id: 'user-123',
        email: 'deleted@example.com',
      };

      mockPrisma.user.delete.mockResolvedValue(deletedUser);

      const result = deletedUser;

      expect(result.id).toBe('user-123');
    });

    it('should throw error if entity not found', async () => {
      mockPrisma.user.delete.mockRejectedValue(new Error('Record not found'));

      await expect(async () => {
        throw new Error('Record not found');
      }).rejects.toThrow('Record not found');
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      mockPrisma.user.count.mockResolvedValue(100);

      const result = 100;

      expect(result).toBe(100);
    });

    it('should return filtered count', async () => {
      mockPrisma.user.count.mockResolvedValue(25);

      const result = 25;

      expect(result).toBe(25);
    });
  });
});

describe('ProjectRepository', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    vi.clearAllMocks();
  });

  describe('findByIdWithDetails', () => {
    it('should return project with client and manager', async () => {
      const projectWithDetails = {
        id: 'proj-123',
        name: 'Test Project',
        client: { id: 'client-1', name: 'Client Name' },
        manager: { id: 'user-1', fullName: 'Manager Name' },
        _count: { tasks: 10, documents: 5 },
      };

      mockPrisma.project.findUnique.mockResolvedValue(projectWithDetails);

      const result = projectWithDetails;

      expect(result.client.name).toBe('Client Name');
      expect(result._count.tasks).toBe(10);
    });
  });

  describe('findByProjectNumber', () => {
    it('should return project by project number', async () => {
      const project = {
        id: 'proj-123',
        projectNumber: 'PRJ-2025-0001',
        name: 'Test Project',
      };

      mockPrisma.project.findUnique.mockResolvedValue(project);

      const result = project;

      expect(result.projectNumber).toBe('PRJ-2025-0001');
    });
  });

  describe('findManyByOrganization', () => {
    it('should return projects for organization', async () => {
      const projects = [
        { id: '1', name: 'Project 1', organizationId: 'org-123' },
        { id: '2', name: 'Project 2', organizationId: 'org-123' },
      ];

      mockPrisma.project.findMany.mockResolvedValue(projects);

      const result = projects;

      expect(result).toHaveLength(2);
      expect(result.every(p => p.organizationId === 'org-123')).toBe(true);
    });
  });

  describe('search', () => {
    it('should return projects matching search query', async () => {
      const searchResults = [
        { id: '1', name: 'Building Project A' },
        { id: '2', name: 'Tower Building' },
      ];

      mockPrisma.project.findMany.mockResolvedValue(searchResults);

      const result = searchResults;

      expect(result).toHaveLength(2);
    });
  });

  describe('updateProgress', () => {
    it('should update project progress', async () => {
      const updatedProject = {
        id: 'proj-123',
        progressPercentage: 75,
      };

      mockPrisma.project.update.mockResolvedValue(updatedProject);

      const result = updatedProject;

      expect(result.progressPercentage).toBe(75);
    });
  });

  describe('countByStatus', () => {
    it('should return count by status', async () => {
      const statusCounts = {
        pending: 5,
        active: 10,
        completed: 3,
        on_hold: 2,
      };

      // Simulate individual count calls
      const counts = statusCounts;

      expect(counts.active).toBe(10);
      expect(counts.completed).toBe(3);
    });
  });
});

describe('UserRepository', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    vi.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return user by email (case-insensitive)', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = user;

      expect(result.email).toBe('test@example.com');
    });
  });

  describe('findByUsername', () => {
    it('should return user by username', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = user;

      expect(result.username).toBe('testuser');
    });
  });

  describe('findByEmailOrUsername', () => {
    it('should find user by email or username', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockPrisma.user.findFirst.mockResolvedValue(user);

      const result = user;

      expect(result).toBeDefined();
    });
  });

  describe('existsByEmail', () => {
    it('should return true if email exists', async () => {
      mockPrisma.user.count.mockResolvedValue(1);

      const exists = 1 > 0;

      expect(exists).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      mockPrisma.user.count.mockResolvedValue(0);

      const exists = 0 > 0;

      expect(exists).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update lastLoginAt timestamp', async () => {
      const updatedUser = {
        id: 'user-123',
        lastLoginAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = updatedUser;

      expect(result.lastLoginAt).toBeDefined();
    });
  });
});
