/**
 * BluePrint Test Setup
 * Shared test configuration for all test suites
 *
 * Provides:
 * - Mock Prisma client
 * - Mock JWT verification
 * - Test database connection handling
 * - Helper functions for creating test data
 * - Auth helper utilities
 */

import { jest } from '@jest/globals';

// ─── Environment Configuration ────────────────────────────────────────────────

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-blueprint';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-nextauth-secret';
process.env.TOTP_SECRET = process.env.TOTP_SECRET || 'test-totp-secret-for-blueprint';

// ─── Type Definitions ─────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'MANAGER' | 'ENGINEER' | 'VIEWER';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TestProject {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  managerId: string;
  clientId: string;
  governmentApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  utilityConnectionStatus: 'PENDING' | 'CONNECTED' | 'DISCONNECTED';
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestTask {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type: 'DESIGN' | 'ENGINEERING' | 'CONSTRUCTION' | 'INSPECTION' | 'DOCUMENTATION' | 'COORDINATION';
  projectId: string;
  assignedToId?: string;
  createdById: string;
  parentId?: string;
  progress: number;
  estimatedMinutes: number;
  slaDeadline?: Date;
  slaPriority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  ganttStartDate?: Date;
  ganttEndDate?: Date;
  workflowTemplateId?: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestClient {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxNumber?: string;
  commercialRegistrationNumber?: string;
  type: 'INDIVIDUAL' | 'CORPORATE' | 'GOVERNMENT';
  createdAt: Date;
  updatedAt: Date;
}

export interface TestInvoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  clientId: string;
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  dueDate: string;
  issuedDate: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestInvoiceItem {
  id: string;
  invoiceId: string;
  boqItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  total: number;
}

export interface TestProposal {
  id: string;
  title: string;
  projectId: string;
  clientId: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  totalAmount: number;
  validUntil: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestAuthToken {
  userId: string;
  role: UserRole;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── Mock Prisma Client ──────────────────────────────────────────────────────

export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  client: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  invoice: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  invoiceItem: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  proposal: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  boqItem: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// ─── Mock JWT ─────────────────────────────────────────────────────────────────

export const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
};

export const mockJwtConfig = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  issuer: 'blueprint-saas',
};

// ─── Mock bcrypt ─────────────────────────────────────────────────────────────

export const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
};

// ─── Mock TOTP ────────────────────────────────────────────────────────────────

export const mockTotp = {
  generateSecret: jest.fn(),
  verify: jest.fn(),
  generateQR: jest.fn(),
  generateBackupCodes: jest.fn(),
};

// ─── Test Data Factories ─────────────────────────────────────────────────────

/**
 * Generate a unique test ID based on prefix and timestamp
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a test user with the specified role and optional overrides
 */
export function createTestUserData(overrides: Partial<TestUser> & { role: UserRole }): TestUser {
  const id = overrides.id || generateTestId('user');
  return {
    id,
    email: overrides.email || `${id}@blueprint.test`,
    name: overrides.name || `Test ${overrides.role} User`,
    password: overrides.password || 'hashed_test_password',
    role: overrides.role,
    isActive: overrides.isActive ?? true,
    isEmailVerified: overrides.isEmailVerified ?? true,
    twoFactorEnabled: overrides.twoFactorEnabled ?? false,
    twoFactorSecret: overrides.twoFactorSecret,
    backupCodes: overrides.backupCodes,
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt || new Date('2024-01-01T00:00:00.000Z'),
  };
}

/**
 * Create a test project with the specified manager and optional overrides
 */
export function createTestProjectData(
  managerId: string,
  clientId: string,
  overrides: Partial<TestProject> = {}
): TestProject {
  const id = overrides.id || generateTestId('project');
  return {
    id,
    name: overrides.name || `Test Project ${id.substring(0, 8)}`,
    nameAr: overrides.nameAr || `مشروع اختبار ${id.substring(0, 8)}`,
    description: overrides.description || 'A test construction project for unit testing',
    descriptionAr: overrides.descriptionAr || 'مشروع بناء اختبار للاختبار',
    status: overrides.status || 'PLANNING',
    progress: overrides.progress ?? 0,
    budget: overrides.budget ?? 500000,
    spent: overrides.spent ?? 0,
    startDate: overrides.startDate || '2024-01-15',
    endDate: overrides.endDate || '2024-12-31',
    managerId,
    clientId,
    governmentApprovalStatus: overrides.governmentApprovalStatus || 'PENDING',
    utilityConnectionStatus: overrides.utilityConnectionStatus || 'PENDING',
    address: overrides.address || '123 Test Street',
    city: overrides.city || 'Riyadh',
    country: overrides.country || 'Saudi Arabia',
    latitude: overrides.latitude ?? 24.7136,
    longitude: overrides.longitude ?? 46.6753,
    deletedAt: overrides.deletedAt,
    createdAt: overrides.createdAt || new Date('2024-01-15T00:00:00.000Z'),
    updatedAt: overrides.updatedAt || new Date('2024-01-15T00:00:00.000Z'),
  };
}

/**
 * Create a test task with the specified project and optional overrides
 */
export function createTestTaskData(
  projectId: string,
  createdById: string,
  overrides: Partial<TestTask> = {}
): TestTask {
  const id = overrides.id || generateTestId('task');
  return {
    id,
    title: overrides.title || `Test Task ${id.substring(0, 8)}`,
    description: overrides.description || 'A test task for construction project',
    status: overrides.status || 'TODO',
    priority: overrides.priority || 'MEDIUM',
    type: overrides.type || 'CONSTRUCTION',
    projectId,
    assignedToId: overrides.assignedToId,
    createdById,
    parentId: overrides.parentId,
    progress: overrides.progress ?? 0,
    estimatedMinutes: overrides.estimatedMinutes ?? 480,
    slaDeadline: overrides.slaDeadline,
    slaPriority: overrides.slaPriority || 'NORMAL',
    ganttStartDate: overrides.ganttStartDate,
    ganttEndDate: overrides.ganttEndDate,
    workflowTemplateId: overrides.workflowTemplateId,
    orderIndex: overrides.orderIndex ?? 0,
    createdAt: overrides.createdAt || new Date('2024-01-15T00:00:00.000Z'),
    updatedAt: overrides.updatedAt || new Date('2024-01-15T00:00:00.000Z'),
  };
}

/**
 * Create a test client with optional overrides
 */
export function createTestClientData(overrides: Partial<TestClient> = {}): TestClient {
  const id = overrides.id || generateTestId('client');
  return {
    id,
    name: overrides.name || `Test Client ${id.substring(0, 8)}`,
    nameAr: overrides.nameAr || `عميل اختبار ${id.substring(0, 8)}`,
    email: overrides.email || `${id}@client.test`,
    phone: overrides.phone || '+966500000000',
    address: overrides.address || '456 Client Avenue',
    city: overrides.city || 'Jeddah',
    country: overrides.country || 'Saudi Arabia',
    taxNumber: overrides.taxNumber || '300000000000003',
    commercialRegistrationNumber: overrides.commercialRegistrationNumber || '1234567890',
    type: overrides.type || 'CORPORATE',
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt || new Date('2024-01-01T00:00:00.000Z'),
  };
}

/**
 * Create a test invoice with the specified client and optional overrides
 */
export function createTestInvoiceData(
  clientId: string,
  projectId: string,
  overrides: Partial<TestInvoice> = {}
): TestInvoice {
  const id = overrides.id || generateTestId('invoice');
  const now = new Date();
  return {
    id,
    invoiceNumber: overrides.invoiceNumber || `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-0001`,
    projectId,
    clientId,
    status: overrides.status || 'DRAFT',
    subtotal: overrides.subtotal ?? 100000,
    taxRate: overrides.taxRate ?? 15,
    taxAmount: overrides.taxAmount ?? 15000,
    total: overrides.total ?? 115000,
    paidAmount: overrides.paidAmount ?? 0,
    dueDate: overrides.dueDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    issuedDate: overrides.issuedDate || now.toISOString().split('T')[0],
    notes: overrides.notes,
    createdAt: overrides.createdAt || new Date('2024-02-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt || new Date('2024-02-01T00:00:00.000Z'),
  };
}

/**
 * Create a test proposal with optional overrides
 */
export function createTestProposalData(
  projectId: string,
  clientId: string,
  overrides: Partial<TestProposal> = {}
): TestProposal {
  const id = overrides.id || generateTestId('proposal');
  return {
    id,
    title: overrides.title || `Test Proposal ${id.substring(0, 8)}`,
    projectId,
    clientId,
    status: overrides.status || 'DRAFT',
    totalAmount: overrides.totalAmount ?? 250000,
    validUntil: overrides.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: overrides.createdAt || new Date('2024-01-20T00:00:00.000Z'),
    updatedAt: overrides.updatedAt || new Date('2024-01-20T00:00:00.000Z'),
  };
}

/**
 * Create a test invoice item
 */
export function createTestInvoiceItemData(
  invoiceId: string,
  overrides: Partial<TestInvoiceItem> = {}
): TestInvoiceItem {
  const id = overrides.id || generateTestId('item');
  const quantity = overrides.quantity ?? 10;
  const unitPrice = overrides.unitPrice ?? 500;
  return {
    id,
    invoiceId,
    boqItemId: overrides.boqItemId,
    description: overrides.description || 'Construction Material Supply',
    quantity,
    unitPrice,
    unit: overrides.unit || 'SQM',
    total: overrides.total ?? (quantity * unitPrice),
  };
}

/**
 * Generate a mock JWT auth token for a user
 */
export function generateTestAuthToken(userId: string, role: UserRole): TestAuthToken {
  return {
    userId,
    role,
    token: `mock_access_token_${userId}_${role}`,
    refreshToken: `mock_refresh_token_${userId}_${role}`,
    expiresIn: 900, // 15 minutes in seconds
  };
}

/**
 * Helper to simulate a successful login and get an auth token
 */
export async function loginAndGetToken(
  email: string,
  password: string
): Promise<TestAuthToken> {
  // In real implementation, this would call the auth service
  const mockUser = {
    id: generateTestId('user'),
    role: 'ADMIN' as UserRole,
  };
  return generateTestAuthToken(mockUser.id, mockUser.role);
}

// ─── Rate Limiter Mock ────────────────────────────────────────────────────────

export const mockRateLimiter = {
  check: jest.fn().mockResolvedValue({ allowed: true, remaining: 99 }),
  consume: jest.fn().mockResolvedValue(true),
  reset: jest.fn(),
};

// ─── Test Database Connection Handling ────────────────────────────────────────

/**
 * Setup test database - ensures clean state before each test suite
 */
export async function setupTestDatabase(): Promise<void> {
  jest.clearAllMocks();
  // Reset all mock counts
  Object.values(mockPrisma).forEach((model: any) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method: any) => {
        if (typeof method === 'function' && typeof method.mockClear === 'function') {
          method.mockClear();
        }
      });
    }
  });
}

/**
 * Teardown test database - cleanup after test suite
 */
export async function teardownTestDatabase(): Promise<void> {
  jest.clearAllMocks();
  mockPrisma.$disconnect.mockClear();
}

/**
 * Run all pending mock promises (for async tests)
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

// ─── Global Test Setup ───────────────────────────────────────────────────────

// Default mock implementations
mockBcrypt.genSalt.mockResolvedValue('$2b$10$mocksalt');
mockBcrypt.hash.mockResolvedValue('$2b$10$mockhashedpassword');
mockBcrypt.compare.mockImplementation((plain, hashed) => {
  return Promise.resolve(plain === 'correct_password' || plain === 'TestPassword123!');
});

mockJwt.sign.mockImplementation((payload, secret, options) => {
  return `encoded_jwt_${payload.userId}_${payload.role}`;
});

mockJwt.verify.mockImplementation((token, secret) => {
  // Parse the mock token format
  const parts = token.split('_');
  if (parts.length >= 4 && parts[0] === 'encoded' && parts[1] === 'jwt') {
    return {
      userId: parts[2],
      role: parts[3],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      iss: 'blueprint-saas',
    };
  }
  throw new Error('Invalid token');
});

mockTotp.generateSecret.mockResolvedValue({
  ascii: 'JBSWY3DPEHPK3PXP',
  hex: '48656c6c6f21deadbeef',
  base32: 'KRSXG5DSN5XW4===' ,
  otpauth_url: 'otpauth://totp/BluePrint:user@test.com?secret=JBSWY3DPEHPK3PXP&issuer=BluePrint',
});

mockTotp.verify.mockResolvedValue(true);

mockTotp.generateQR.mockResolvedValue('data:image/png;base64,mock_qr_code_data');

mockTotp.generateBackupCodes.mockReturnValue([
  'ABCD-1234-EFGH',
  'IJKL-5678-MNOP',
  'QRST-9012-UVWX',
  'YZAB-3456-CDEF',
  'GHIJ-7890-KLMN',
]);

// Default Prisma mock implementations
mockPrisma.$transaction.mockImplementation(async (callback: any) => {
  if (typeof callback === 'function') {
    return callback(mockPrisma);
  }
  return callback;
});

mockPrisma.$connect.mockResolvedValue(undefined);
mockPrisma.$disconnect.mockResolvedValue(undefined);
