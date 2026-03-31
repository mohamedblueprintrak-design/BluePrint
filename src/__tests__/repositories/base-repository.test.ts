/**
 * Base Repository Tests
 * اختبارات المستودع الأساسي
 *
 * Tests the repository pattern:
 * - CRUD operations
 * - Filtering logic
 * - Pagination
 * - findMany with options
 * - count / exists checks
 * - soft delete
 * - transaction execution
 */

import {
  BaseRepository,
  IRepository,
  FindManyOptions,
} from '@/lib/repositories/base.repository';

// ============================================
// Mock Prisma Setup
// ============================================

type MockModel = {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
};

function createMockModel(): MockModel {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
}

type MockPrisma = {
  user: MockModel;
  project: MockModel;
  client: MockModel;
  $transaction: jest.Mock;
};

function createMockPrisma(): MockPrisma {
  return {
    user: createMockModel(),
    project: createMockModel(),
    client: createMockModel(),
    $transaction: jest.fn(),
  };
}

// ============================================
// Concrete Test Repository
// ============================================

interface TestEntity {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

class TestRepository extends BaseRepository<TestEntity> {
  constructor(prisma: any) {
    super(prisma, 'user');
  }
}

// ============================================
// Tests
// ============================================

describe('BaseRepository', () => {
  let mockPrisma: MockPrisma;
  let repository: TestRepository;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    repository = new TestRepository(mockPrisma as any);
    jest.clearAllMocks();
  });

  // ============================================
  // Constructor
  // ============================================

  describe('constructor', () => {
    it('should set prisma client and model name', () => {
      expect(repository['prisma']).toBe(mockPrisma);
      expect(repository['model']).toBe('user');
    });

    it('should access correct delegate', () => {
      const delegate = repository['delegate'];
      expect(delegate).toBe(mockPrisma.user);
    });
  });

  // ============================================
  // findById
  // ============================================

  describe('findById', () => {
    it('should find entity by id', async () => {
      const mockEntity: TestEntity = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        isActive: true,
        createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockEntity);

      const result = await repository.findById('user-1');
      expect(result).toEqual(mockEntity);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should return null when entity not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ============================================
  // findOne
  // ============================================

  describe('findOne', () => {
    it('should find entity by conditions', async () => {
      const mockEntity: TestEntity = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        isActive: true,
        createdAt: new Date(),
      };
      mockPrisma.user.findFirst.mockResolvedValue(mockEntity);

      const result = await repository.findOne({ email: 'test@example.com' });
      expect(result).toEqual(mockEntity);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when no match found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findOne({ email: 'none@example.com' });
      expect(result).toBeNull();
    });
  });

  // ============================================
  // findMany
  // ============================================

  describe('findMany', () => {
    it('should return all entities without options', async () => {
      const entities: TestEntity[] = [
        { id: '1', name: 'A', email: 'a@test.com', isActive: true, createdAt: new Date() },
        { id: '2', name: 'B', email: 'b@test.com', isActive: true, createdAt: new Date() },
      ];
      mockPrisma.user.findMany.mockResolvedValue(entities);

      const result = await repository.findMany();
      expect(result).toHaveLength(2);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: undefined,
        orderBy: undefined,
        include: undefined,
      });
    });

    it('should apply pagination with skip and take', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const options: FindManyOptions = { skip: 10, take: 5 };
      await repository.findMany(options);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 })
      );
    });

    it('should apply where conditions for filtering', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const options: FindManyOptions = { where: { isActive: true } };
      await repository.findMany(options);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } })
      );
    });

    it('should apply orderBy', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const options: FindManyOptions = { orderBy: { createdAt: 'desc' } };
      await repository.findMany(options);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } })
      );
    });

    it('should apply include for relations', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const options: FindManyOptions = { include: { organization: true } };
      await repository.findMany(options);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: { organization: true } })
      );
    });

    it('should combine all options together', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const options: FindManyOptions = {
        skip: 20,
        take: 10,
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: { organization: true },
      };
      await repository.findMany(options);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: { organization: true },
      });
    });
  });

  // ============================================
  // create
  // ============================================

  describe('create', () => {
    it('should create new entity with provided data', async () => {
      const newEntity: TestEntity = {
        id: 'new-1',
        name: 'New User',
        email: 'new@test.com',
        isActive: true,
        createdAt: new Date(),
      };
      mockPrisma.user.create.mockResolvedValue(newEntity);

      const data = { name: 'New User', email: 'new@test.com' };
      const result = await repository.create(data);
      expect(result).toEqual(newEntity);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { name: 'New User', email: 'new@test.com' },
      });
    });
  });

  // ============================================
  // update
  // ============================================

  describe('update', () => {
    it('should update entity by id', async () => {
      const updatedEntity: TestEntity = {
        id: 'user-1',
        name: 'Updated Name',
        email: 'test@example.com',
        isActive: true,
        createdAt: new Date(),
      };
      mockPrisma.user.update.mockResolvedValue(updatedEntity);

      const result = await repository.update('user-1', { name: 'Updated Name' });
      expect(result).toEqual(updatedEntity);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated Name' },
      });
    });

    it('should propagate update errors from Prisma', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('Record not found'));

      await expect(repository.update('nonexistent', { name: 'X' }))
        .rejects.toThrow('Record not found');
    });
  });

  // ============================================
  // delete
  // ============================================

  describe('delete', () => {
    it('should delete entity by id', async () => {
      mockPrisma.user.delete.mockResolvedValue({ id: 'user-1' });

      await repository.delete('user-1');
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should propagate delete errors from Prisma', async () => {
      mockPrisma.user.delete.mockRejectedValue(new Error('Record not found'));

      await expect(repository.delete('nonexistent'))
        .rejects.toThrow('Record not found');
    });
  });

  // ============================================
  // count
  // ============================================

  describe('count', () => {
    it('should return total count without conditions', async () => {
      mockPrisma.user.count.mockResolvedValue(42);

      const result = await repository.count();
      expect(result).toBe(42);
      expect(mockPrisma.user.count).toHaveBeenCalledWith({ where: undefined });
    });

    it('should return filtered count with conditions', async () => {
      mockPrisma.user.count.mockResolvedValue(10);

      const result = await repository.count({ isActive: true });
      expect(result).toBe(10);
      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });
  });

  // ============================================
  // exists
  // ============================================

  describe('exists', () => {
    it('should return true when entity exists', async () => {
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await repository.exists('user-1');
      expect(result).toBe(true);
      expect(mockPrisma.user.count).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('should return false when entity does not exist', async () => {
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await repository.exists('nonexistent');
      expect(result).toBe(false);
    });
  });

  // ============================================
  // softDelete
  // ============================================

  describe('softDelete', () => {
    it('should update entity with deletedAt timestamp', async () => {
      const softDeleted = {
        id: 'user-1',
        deletedAt: new Date(),
      };
      mockPrisma.user.update.mockResolvedValue(softDeleted);

      const result = await repository.softDelete('user-1');
      expect(result).toEqual(softDeleted);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  // ============================================
  // transaction
  // ============================================

  describe('transaction', () => {
    it('should execute callback in transaction', async () => {
      const txResult = { success: true };
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn('mock-tx'));

      const result = await repository.transaction(async (tx) => {
        return txResult;
      });

      expect(result).toEqual(txResult);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should propagate transaction errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(repository.transaction(async () => { throw new Error('test'); }))
        .rejects.toThrow('Transaction failed');
    });
  });

  // ============================================
  // IRepository interface compliance
  // ============================================

  describe('IRepository interface compliance', () => {
    it('should implement all IRepository methods', () => {
      const repo: IRepository<TestEntity> = repository;
      expect(typeof repo.findById).toBe('function');
      expect(typeof repo.findOne).toBe('function');
      expect(typeof repo.findMany).toBe('function');
      expect(typeof repo.create).toBe('function');
      expect(typeof repo.update).toBe('function');
      expect(typeof repo.delete).toBe('function');
      expect(typeof repo.count).toBe('function');
      expect(typeof repo.exists).toBe('function');
    });
  });

  // ============================================
  // Multi-model support
  // ============================================

  describe('Multi-model support', () => {
    it('should work with different models', () => {
      const projectRepo = new BaseRepository(mockPrisma as any, 'project');
      expect(projectRepo['model']).toBe('project');
      expect(projectRepo['delegate']).toBe(mockPrisma.project);
    });

    it('should call correct model delegate for each repo', async () => {
      const userRepo = new BaseRepository(mockPrisma as any, 'user');
      const projectRepo = new BaseRepository(mockPrisma as any, 'project');

      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }]);
      mockPrisma.project.findMany.mockResolvedValue([{ id: 'p1' }]);

      const users = await userRepo.findMany();
      const projects = await projectRepo.findMany();

      expect(users).toEqual([{ id: 'u1' }]);
      expect(projects).toEqual([{ id: 'p1' }]);
    });
  });
});
