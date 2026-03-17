/**
 * Database Mock for Testing
 * Mock لقاعدة البيانات للاختبارات
 */

// Mock Prisma Client
export const mockPrismaClient = {
  // Organization
  organization: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  // User
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  // Session
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // Project
  project: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  // Client
  client: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  // Invoice
  invoice: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  // Task
  task: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  // Plan
  plan: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  // Subscription
  subscription: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  // Payment
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // Document
  document: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Mock db module
jest.mock('@/lib/db', () => ({
  db: mockPrismaClient,
}));

// Helper to reset all mocks
export function resetDbMocks() {
  Object.values(mockPrismaClient).forEach((model) => {
    Object.values(model as Record<string, jest.Mock>).forEach((mock) => {
      if (jest.isMockFunction(mock)) {
        mock.mockReset();
      }
    });
  });
}

// Helper to create mock data
export const mockData = {
  organization: {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    email: 'test@org.com',
    currency: 'AED',
    isActive: true,
    subscriptionStatus: 'trial',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  user: {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'admin',
    isActive: true,
    language: 'ar',
    theme: 'dark',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  plan: {
    id: 'plan-123',
    name: 'Professional',
    slug: 'professional',
    description: 'Ideal for growing consultancies',
    price: 499,
    currency: 'AED',
    interval: 'month',
    features: JSON.stringify(['Feature 1', 'Feature 2']),
    limits: JSON.stringify({ projects: 25, users: 10 }),
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
  },
  subscription: {
    id: 'sub-123',
    organizationId: 'org-123',
    planId: 'plan-123',
    status: 'active',
    stripeSubscriptionId: 'stripe-sub-123',
    stripeCustomerId: 'stripe-cust-123',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  project: {
    id: 'proj-123',
    name: 'Test Project',
    projectNumber: 'PRJ-001',
    status: 'active',
    progressPercentage: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export default mockPrismaClient;
