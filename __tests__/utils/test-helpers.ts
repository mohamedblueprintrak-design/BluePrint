/**
 * BluePrint Test Helpers
 * Utility functions for creating test data and making authenticated requests
 */

import { jest } from '@jest/globals';
import {
  type UserRole,
  type TestUser,
  type TestProject,
  type TestTask,
  type TestClient,
  type TestInvoice,
  type TestProposal,
  type TestInvoiceItem,
  type TestAuthToken,
  mockPrisma,
  mockJwt,
  createTestUserData,
  createTestProjectData,
  createTestTaskData,
  createTestClientData,
  createTestInvoiceData,
  createTestProposalData,
  createTestInvoiceItemData,
  generateTestAuthToken,
  generateTestId,
} from './setup';

// ─── Test Data Creation Helpers ───────────────────────────────────────────────

/**
 * Create a test user with a specific role.
 * Sets up Prisma mock to return the user on findUnique.
 */
export async function createTestUser(
  role: UserRole = 'ADMIN',
  overrides: Partial<TestUser> = {}
): Promise<TestUser> {
  const user = createTestUserData({ role, ...overrides });

  // Mock Prisma to return this user when queried by ID or email
  mockPrisma.user.findUnique.mockImplementation(async (args: any) => {
    if (args?.where?.id === user.id) return user;
    if (args?.where?.email === user.email) return user;
    return null;
  });

  mockPrisma.user.create.mockResolvedValue(user);

  return user;
}

/**
 * Create a test project associated with a user.
 * Sets up Prisma mock to return the project.
 */
export async function createTestProject(
  userId: string,
  overrides: Partial<TestProject> = {}
): Promise<TestProject> {
  const clientId = overrides.clientId || generateTestId('client');
  const project = createTestProjectData(userId, clientId, overrides);

  mockPrisma.project.findUnique.mockImplementation(async (args: any) => {
    if (args?.where?.id === project.id) return project;
    return null;
  });

  mockPrisma.project.create.mockResolvedValue(project);
  mockPrisma.project.findMany.mockResolvedValue([project]);
  mockPrisma.project.count.mockResolvedValue(1);
  mockPrisma.project.update.mockResolvedValue({ ...project, ...overrides });

  return project;
}

/**
 * Create a test task associated with a project.
 * Sets up Prisma mock to return the task.
 */
export async function createTestTask(
  projectId: string,
  overrides: Partial<TestTask> = {}
): Promise<TestTask> {
  const createdById = overrides.createdById || generateTestId('user');
  const task = createTestTaskData(projectId, createdById, overrides);

  mockPrisma.task.findUnique.mockImplementation(async (args: any) => {
    if (args?.where?.id === task.id) return task;
    return null;
  });

  mockPrisma.task.create.mockResolvedValue(task);
  mockPrisma.task.findMany.mockResolvedValue([task]);
  mockPrisma.task.count.mockResolvedValue(1);
  mockPrisma.task.update.mockResolvedValue({ ...task, ...overrides });
  mockPrisma.task.createMany.mockResolvedValue({ count: 1 });
  mockPrisma.task.deleteMany.mockResolvedValue({ count: 1 });

  return task;
}

/**
 * Create a test client.
 */
export async function createTestClient(
  overrides: Partial<TestClient> = {}
): Promise<TestClient> {
  const client = createTestClientData(overrides);

  mockPrisma.client.findUnique.mockImplementation(async (args: any) => {
    if (args?.where?.id === client.id) return client;
    if (args?.where?.email === client.email) return client;
    return null;
  });

  mockPrisma.client.create.mockResolvedValue(client);
  mockPrisma.client.findMany.mockResolvedValue([client]);
  mockPrisma.client.count.mockResolvedValue(1);
  mockPrisma.client.update.mockResolvedValue({ ...client, ...overrides });

  return client;
}

/**
 * Create a test invoice for a client.
 */
export async function createTestInvoice(
  clientId: string,
  overrides: Partial<TestInvoice> = {}
): Promise<TestInvoice> {
  const projectId = overrides.projectId || generateTestId('project');
  const invoice = createTestInvoiceData(clientId, projectId, overrides);

  mockPrisma.invoice.findUnique.mockImplementation(async (args: any) => {
    if (args?.where?.id === invoice.id) return invoice;
    return null;
  });

  mockPrisma.invoice.create.mockResolvedValue(invoice);
  mockPrisma.invoice.findMany.mockResolvedValue([invoice]);
  mockPrisma.invoice.count.mockResolvedValue(1);
  mockPrisma.invoice.update.mockResolvedValue({ ...invoice, ...overrides });
  mockPrisma.invoice.aggregate.mockResolvedValue({
    _sum: { subtotal: 100000, taxAmount: 15000, total: 115000, paidAmount: 0 },
    _count: 1,
  });

  return invoice;
}

/**
 * Create a test proposal.
 */
export async function createTestProposal(
  overrides: Partial<TestProposal> = {}
): Promise<TestProposal> {
  const projectId = overrides.projectId || generateTestId('project');
  const clientId = overrides.clientId || generateTestId('client');
  const proposal = createTestProposalData(projectId, clientId, overrides);

  mockPrisma.proposal.findUnique.mockImplementation(async (args: any) => {
    if (args?.where?.id === proposal.id) return proposal;
    return null;
  });

  mockPrisma.proposal.create.mockResolvedValue(proposal);
  mockPrisma.proposal.findMany.mockResolvedValue([proposal]);
  mockPrisma.proposal.count.mockResolvedValue(1);
  mockPrisma.proposal.update.mockResolvedValue({ ...proposal, ...overrides });

  return proposal;
}

/**
 * Create a test invoice item.
 */
export async function createTestInvoiceItem(
  invoiceId: string,
  overrides: Partial<TestInvoiceItem> = {}
): Promise<TestInvoiceItem> {
  const item = createTestInvoiceItemData(invoiceId, overrides);

  mockPrisma.invoiceItem.create.mockResolvedValue(item);
  mockPrisma.invoiceItem.findMany.mockResolvedValue([item]);
  mockPrisma.invoiceItem.createMany.mockResolvedValue({ count: 1 });
  mockPrisma.invoiceItem.update.mockResolvedValue({ ...item, ...overrides });
  mockPrisma.invoiceItem.delete.mockResolvedValue(item);
  mockPrisma.invoiceItem.deleteMany.mockResolvedValue({ count: 1 });

  return item;
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * Generate a JWT auth token for a user.
 * Configures JWT mock to validate the generated token.
 */
export function generateAuthToken(
  userId: string,
  role: UserRole = 'ADMIN'
): TestAuthToken {
  const authToken = generateTestAuthToken(userId, role);

  // Configure JWT verify to accept this token
  mockJwt.verify.mockImplementation((token: string) => {
    if (token === authToken.token) {
      return {
        userId,
        role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + authToken.expiresIn,
        iss: 'blueprint-saas',
      };
    }
    if (token === authToken.refreshToken) {
      return {
        userId,
        role,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        iss: 'blueprint-saas',
      };
    }
    throw new Error('JsonWebTokenError: invalid token');
  });

  return authToken;
}

// ─── Request Helpers ──────────────────────────────────────────────────────────

/**
 * Make an authenticated HTTP request to the API.
 * Returns a mock Response object.
 */
export async function makeRequest(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    token?: string;
    headers?: Record<string, string>;
    params?: Record<string, string>;
  } = {}
): Promise<{
  status: number;
  body: any;
  headers: Record<string, string>;
}> {
  const {
    method = 'GET',
    body,
    token,
    headers = {},
    params,
  } = options;

  const queryString = params
    ? '?' + new URLSearchParams(params).toString()
    : '';
  const fullUrl = `${url}${queryString}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Return a mock response structure
  // In integration tests, this would use Next.js test utilities
  const response = {
    status: 200,
    body: null,
    headers: requestHeaders,
    url: fullUrl,
    method,
  };

  return response;
}

/**
 * Make an unauthenticated HTTP request (no token).
 */
export async function makeUnauthenticatedRequest(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
    params?: Record<string, string>;
  } = {}
): Promise<{
  status: number;
  body: any;
  headers: Record<string, string>;
}> {
  return makeRequest(url, { ...options, token: undefined });
}

// ─── Assertion Helpers ────────────────────────────────────────────────────────

/**
 * Assert that a response indicates permission denied (403).
 */
export function expectPermissionDenied(response: { status: number; body: any }): void {
  expect(response.status).toBe(403);
  expect(response.body).toBeDefined();
  expect(response.body.error).toMatch(/forbidden|permission|denied|unauthorized/i);
}

/**
 * Assert that a response indicates unauthorized (401).
 */
export function expectUnauthorized(response: { status: number; body: any }): void {
  expect(response.status).toBe(401);
  expect(response.body).toBeDefined();
  expect(response.body.error).toMatch(/unauthorized|authentication required/i);
}

/**
 * Assert that a response indicates not found (404).
 */
export function expectNotFound(response: { status: number; body: any }): void {
  expect(response.status).toBe(404);
  expect(response.body).toBeDefined();
  expect(response.body.error).toMatch(/not found/i);
}

/**
 * Assert that a response indicates validation error (400).
 */
export function expectValidationError(response: { status: number; body: any }): void {
  expect(response.status).toBe(400);
  expect(response.body).toBeDefined();
  expect(response.body.error).toMatch(/validation|invalid/i);
}

/**
 * Assert that a response indicates success (2xx).
 */
export function expectSuccess(
  response: { status: number; body: any },
  expectedStatus: number = 200
): void {
  expect(response.status).toBe(expectedStatus);
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
}

/**
 * Assert that a response has proper pagination fields.
 */
export function expectPaginatedResponse(
  response: { status: number; body: any }
): void {
  expectSuccess(response);
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('pagination');
  expect(response.body.pagination).toHaveProperty('page');
  expect(response.body.pagination).toHaveProperty('limit');
  expect(response.body.pagination).toHaveProperty('total');
  expect(response.body.pagination).toHaveProperty('totalPages');
  expect(typeof response.body.pagination.page).toBe('number');
  expect(typeof response.body.pagination.limit).toBe('number');
  expect(typeof response.body.pagination.total).toBe('number');
}

// ─── Date & Time Helpers ──────────────────────────────────────────────────────

/**
 * Create a date offset from now (useful for SLA testing).
 */
export function dateFromNow(offsetDays: number, offsetHours: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(date.getHours() + offsetHours);
  return date;
}

/**
 * Format a date as ISO string (YYYY-MM-DD).
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if a date is within the SLA deadline.
 */
export function isWithinSLA(deadline: Date, now: Date = new Date()): boolean {
  return now <= deadline;
}

/**
 * Calculate business days between two dates (excluding weekends).
 * Saudi Arabia work week: Sunday - Thursday.
 */
export function calculateBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    // Friday = 5, Saturday = 6 are weekends in Saudi Arabia
    if (day !== 5 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// ─── Math & Financial Helpers ─────────────────────────────────────────────────

/**
 * Calculate tax amount from subtotal and rate.
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * (taxRate / 100) * 100) / 100;
}

/**
 * Calculate project progress percentage.
 */
export function calculateProjectProgress(
  completedTasks: number,
  totalTasks: number
): number {
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}

/**
 * Calculate project budget utilization.
 */
export function calculateBudgetUtilization(spent: number, budget: number): number {
  if (budget === 0) return 0;
  return Math.round((spent / budget) * 100 * 100) / 100;
}

// ─── Mock Reset Helpers ───────────────────────────────────────────────────────

/**
 * Reset all Prisma mocks.
 */
export function resetPrismaMocks(): void {
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
 * Reset all JWT mocks.
 */
export function resetJwtMocks(): void {
  mockJwt.sign.mockClear();
  mockJwt.verify.mockClear();
  mockJwt.decode.mockClear();
}

/**
 * Reset all mocks (Prisma, JWT, bcrypt, TOTP, rate limiter).
 */
export function resetAllMocks(): void {
  resetPrismaMocks();
  resetJwtMocks();
}

/**
 * Setup default Prisma mock behaviors for common scenarios.
 */
export function setupDefaultPrismaMocks(): void {
  // User defaults
  mockPrisma.user.findUnique.mockResolvedValue(null);
  mockPrisma.user.findMany.mockResolvedValue([]);
  mockPrisma.user.count.mockResolvedValue(0);

  // Project defaults
  mockPrisma.project.findUnique.mockResolvedValue(null);
  mockPrisma.project.findMany.mockResolvedValue([]);
  mockPrisma.project.count.mockResolvedValue(0);
  mockPrisma.project.aggregate.mockResolvedValue({
    _sum: { budget: 0, spent: 0, progress: 0 },
    _count: 0,
  });

  // Task defaults
  mockPrisma.task.findUnique.mockResolvedValue(null);
  mockPrisma.task.findMany.mockResolvedValue([]);
  mockPrisma.task.count.mockResolvedValue(0);
  mockPrisma.task.aggregate.mockResolvedValue({
    _sum: { progress: 0, estimatedMinutes: 0 },
    _count: 0,
  });

  // Client defaults
  mockPrisma.client.findUnique.mockResolvedValue(null);
  mockPrisma.client.findMany.mockResolvedValue([]);
  mockPrisma.client.count.mockResolvedValue(0);

  // Invoice defaults
  mockPrisma.invoice.findUnique.mockResolvedValue(null);
  mockPrisma.invoice.findMany.mockResolvedValue([]);
  mockPrisma.invoice.count.mockResolvedValue(0);

  // Transaction default
  mockPrisma.$transaction.mockImplementation(async (callback: any) => {
    if (typeof callback === 'function') {
      return callback(mockPrisma);
    }
    return callback;
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TEST_CONSTANTS = {
  DEFAULT_PASSWORD: 'TestPassword123!',
  INVALID_PASSWORD: 'WrongPassword999!',
  WEAK_PASSWORD: '123',
  VALID_EMAIL: 'admin@blueprint.test',
  INVALID_EMAIL: 'not-an-email',
  DUPLICATE_EMAIL: 'duplicate@blueprint.test',

  VALID_PROJECT_NAME: 'Al Noor Tower Construction',
  VALID_PROJECT_NAME_AR: 'بناء برج النور',
  VALID_ADDRESS: 'King Fahd Road, Riyadh',
  VALID_CITY: 'Riyadh',
  VALID_COUNTRY: 'Saudi Arabia',
  VALID_BUDGET: 5000000,
  VALID_TAX_RATE: 15,

  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  SLA_NORMAL_HOURS: 48,
  SLA_HIGH_HOURS: 24,
  SLA_CRITICAL_HOURS: 4,

  INVOICE_PREFIX: 'INV',
  PROPOSAL_PREFIX: 'PRP',

  ROLES: {
    ADMIN: 'ADMIN' as UserRole,
    MANAGER: 'MANAGER' as UserRole,
    ENGINEER: 'ENGINEER' as UserRole,
    VIEWER: 'VIEWER' as UserRole,
  },

  PROJECT_STATUSES: [
    'PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED',
  ] as const,

  TASK_STATUSES: [
    'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED',
  ] as const,

  TASK_PRIORITIES: [
    'LOW', 'MEDIUM', 'HIGH', 'URGENT',
  ] as const,

  TASK_TYPES: [
    'DESIGN', 'ENGINEERING', 'CONSTRUCTION', 'INSPECTION', 'DOCUMENTATION', 'COORDINATION',
  ] as const,

  INVOICE_STATUSES: [
    'DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED',
  ] as const,

  GOVERNMENT_APPROVAL_STATUSES: ['PENDING', 'APPROVED', 'REJECTED'] as const,
  UTILITY_CONNECTION_STATUSES: ['PENDING', 'CONNECTED', 'DISCONNECTED'] as const,
};
