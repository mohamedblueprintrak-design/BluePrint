import { NextResponse } from 'next/server';

// ============================================
// TypeScript Interfaces and Types
// ============================================

/** Demo user for testing without database */
export interface DemoUser {
  id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'PROJECT_MANAGER' | 'ENGINEER' | 'DRAFTSMAN' | 'ACCOUNTANT' | 'HR' | 'VIEWER';
  isActive: boolean;
  avatar: string | null;
  language: string;
  theme: string;
  department?: string;
  organizationId: string;
  organization: { id: string; name: string; currency: string };
}

/** Authenticated user type (from demo or database) */
export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  avatar: string | null;
  language: string;
  theme: string;
  organizationId: string | null;
  organization: { id: string; name: string; currency: string } | null;
  isActive?: boolean;
  password?: string;
}

/** API success response type */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** API error response type */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/** Combined API response type */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Rate limit store record */
export interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/** Pagination parameters */
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

/** Pagination meta response */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  [key: string]: unknown;
}

/** Minimal database client interface for type safety */
export interface DbClient {
  user: {
    findUnique: (args: { where: { id: string }; include?: Record<string, boolean> }) => Promise<AuthenticatedUser | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<AuthenticatedUser | null>;
    findMany: (args: { where?: Record<string, unknown>; select?: Record<string, boolean>; orderBy?: Record<string, string> }) => Promise<AuthenticatedUser[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; username: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<AuthenticatedUser>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  project: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string>; skip?: number; take?: number }) => Promise<unknown[]>;
    findFirst: (args: { where: Record<string, unknown>; include?: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; projectNumber?: string; name?: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  client: {
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string>; skip?: number; take?: number }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; name: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  invoice: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string>; skip?: number; take?: number }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; invoiceNumber: string; total?: number }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
    aggregate: (args: { where: Record<string, unknown>; _sum: Record<string, boolean> }) => Promise<{ _sum: Record<string, number | null> }>;
  };
  task: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string>; skip?: number; take?: number }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  supplier: {
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string>; skip?: number; take?: number }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; name: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  material: {
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string>; skip?: number; take?: number }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; materialCode?: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  contract: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string>; skip?: number; take?: number }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; contractNumber?: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  proposal: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string>; skip?: number; take?: number }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; proposalNumber?: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  siteReport: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string>; take?: number }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; reportNumber?: string }>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  document: {
    findMany: (args: { where?: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string>; skip?: number; take?: number }) => Promise<unknown[]>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  notification: {
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string>; take?: number }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    updateMany: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
  };
  leaveRequest: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, unknown>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  };
  attendance: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
  };
  projectUser: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  auditLog: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  organization: {
    findFirst: (args?: Record<string, unknown>) => Promise<unknown>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
  };
  plan: {
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
  };
  bOQItem: {
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; itemNumber?: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  };
  purchaseOrder: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; poNumber?: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };
  budget: {
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; category?: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
  };
  defect: {
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; title?: string }>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  payment: {
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; amount?: number }>;
  };
  expense: {
    findMany: (args: { where: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  };
  voucher: {
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; voucherNumber?: string }>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };
  certificate: {
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string> }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; certificateNumber?: string }>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };
  chatHistory: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  notificationSettings: {
    findUnique: (args: { where: { userId: string } }) => Promise<{ userId: string; emailLeaves: boolean } | null>;
  };
}

/** Handler context passed to each handler */
export interface HandlerContext {
  user: AuthenticatedUser | null;
  db: DbClient | null;
  searchParams: URLSearchParams;
  body?: Record<string, unknown>;
}

/** Handler function type for GET requests */
export type GetHandler = (
  context: HandlerContext
) => Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>>;

/** Handler function type for POST requests */
export type PostHandler = (
  context: HandlerContext
) => Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>>;

/** Handler function type for PUT requests */
export type PutHandler = (
  context: HandlerContext
) => Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>>;

/** Handler function type for DELETE requests */
export type DeleteHandler = (
  context: HandlerContext
) => Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>>;

/** Action handlers map for GET */
export type GetActionHandlers = Map<string, GetHandler>;

/** Action handlers map for POST */
export type PostActionHandlers = Map<string, PostHandler>;

/** Action handlers map for PUT */
export type PutActionHandlers = Map<string, PutHandler>;

/** Action handlers map for DELETE */
export type DeleteActionHandlers = Map<string, DeleteHandler>;

/** Rate limit result */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}
