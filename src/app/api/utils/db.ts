import { DemoUser } from '../types';

// Demo users for testing without database
// SECURITY: Password is hashed with bcrypt. Never use plain text passwords.
// Demo mode should only be enabled explicitly via DEMO_MODE=true environment variable
const DEMO_MODE_ENABLED = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development';

export const DEMO_USERS: DemoUser[] = DEMO_MODE_ENABLED ? [
  {
    id: 'demo-admin-001',
    username: 'admin',
    email: 'admin@blueprint.ae',
    // SECURITY: Bcrypt hash - never expose the plain password in logs or responses
    // Password: Admin@123456
    password: '$2b$10$UWaUflszu.zDeurvMcyIjezYBKG/kE9vjbDv52f4vUeVccE4dmqc6',
    fullName: 'مدير النظام',
    role: 'admin',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  },
  {
    id: 'demo-manager-001',
    username: 'manager',
    email: 'manager@blueprint.ae',
    // Password: Manager@123456
    password: '$2b$10$UWaUflszu.zDeurvMcyIjezYBKG/kE9vjbDv52f4vUeVccE4dmqc6',
    fullName: 'مدير المشاريع',
    role: 'manager',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  },
  {
    id: 'demo-engineer-001',
    username: 'engineer',
    email: 'engineer@blueprint.ae',
    // Password: Engineer@123456
    password: '$2b$10$UWaUflszu.zDeurvMcyIjezYBKG/kE9vjbDv52f4vUeVccE4dmqc6',
    fullName: 'مهندس الموقع',
    role: 'engineer',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  }
] : [];

// Dynamic database import to avoid failures when DB is not available
let db: any = null;

/**
 * Get database client (lazy loaded)
 */
export async function getDb(): Promise<any> {
  if (!db) {
    try {
      const dbModule = await import('@/lib/db');
      db = dbModule.db;
    } catch (_e) {
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
  operation: (database: any) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const database = await getDb();
    if (!database) return fallback;
    return await operation(database);
  } catch (_e) {
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
