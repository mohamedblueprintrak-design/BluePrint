// @ts-nocheck
import { DbClient, DemoUser } from '../types';

// Demo users for testing without database
export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-admin-001',
    username: 'admin',
    email: 'admin@blueprint.ae',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.sCP9eNiBx.qL/4ZcS.', // admin123
    fullName: 'مدير النظام',
    role: 'admin',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  }
];

// Dynamic database import to avoid failures when DB is not available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: DbClient | null = null;

/**
 * Get database client (lazy loaded)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDb(): Promise<any> {
  if (!db) {
    try {
      const dbModule = await import('@/lib/db');
      db = dbModule.db;
    } catch (e) {
      console.log('Database not available, using demo mode');
      db = null;
    }
  }
  return db;
}

/**
 * Safe database operation wrapper
 */
export async function safeDbOp<T>(
  operation: (database: DbClient) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const database = await getDb();
    if (!database) return fallback;
    return await operation(database);
  } catch (e) {
    console.log('Database operation failed, using fallback');
    return fallback;
  }
}

/**
 * Check if database is available
 */
export async function isDbAvailable(): Promise<boolean> {
  const database = await getDb();
  return database !== null;
}

/**
 * Get empty pagination response
 */
export function getEmptyPaginationResponse() {
  return {
    data: [],
    meta: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  };
}
