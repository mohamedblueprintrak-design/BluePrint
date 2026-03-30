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
    // SECURITY: Bcrypt hash - never expose the plain password in production
    password: '$2b$10$UWaUflszu.zDeurvMcyIjezYBKG/kE9vjbDv52f4vUeVccE4dmqc6',
    fullName: 'مدير النظام',
    role: 'ADMIN',
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
    // SECURITY: Bcrypt hash - see demo-config.ts for generated credentials
    password: '$2b$10$SHEo0xb9OExBg5zzp7M4eeGDd0MFfppsC06l9B.DBl5wNwrtniRwu',
    fullName: 'مدير المشاريع',
    role: 'MANAGER',
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
    // SECURITY: Bcrypt hash - see demo-config.ts for generated credentials
    password: '$2b$10$SHEo0xb9OExBg5zzp7M4eeGDd0MFfppsC06l9B.DBl5wNwrtniRwu',
    fullName: 'المهندس المعماري',
    role: 'ENGINEER',
    department: 'ARCHITECTURAL',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  },
  {
    id: 'demo-draftsman-001',
    username: 'draftsman',
    email: 'draftsman@blueprint.ae',
    // SECURITY: Bcrypt hash - see demo-config.ts for generated credentials
    password: '$2b$10$SHEo0xb9OExBg5zzp7M4eeGDd0MFfppsC06l9B.DBl5wNwrtniRwu',
    fullName: 'عمر الرسام',
    role: 'DRAFTSMAN',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  },
  {
    id: 'demo-accountant-001',
    username: 'accountant',
    email: 'accountant@blueprint.ae',
    // SECURITY: Bcrypt hash - see demo-config.ts for generated credentials
    password: '$2b$10$SHEo0xb9OExBg5zzp7M4eeGDd0MFfppsC06l9B.DBl5wNwrtniRwu',
    fullName: 'فاطمة المحاسبة',
    role: 'ACCOUNTANT',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  },
  {
    id: 'demo-viewer-001',
    username: 'viewer',
    email: 'viewer@blueprint.ae',
    // SECURITY: Bcrypt hash - see demo-config.ts for generated credentials
    password: '$2b$10$SHEo0xb9OExBg5zzp7M4eeGDd0MFfppsC06l9B.DBl5wNwrtniRwu',
    fullName: 'أحمد المشاهد',
    role: 'VIEWER',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  },
  {
    id: 'demo-struct-eng-001',
    username: 'struct_eng',
    email: 'struct_eng@blueprint.ae',
    password: '$2b$10$SHEo0xb9OExBg5zzp7M4eeGDd0MFfppsC06l9B.DBl5wNwrtniRwu',
    fullName: 'خالد الإنشائي',
    role: 'ENGINEER',
    department: 'STRUCTURAL',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  },
  {
    id: 'demo-elec-eng-001',
    username: 'elec_eng',
    email: 'elec_eng@blueprint.ae',
    password: '$2b$10$SHEo0xb9OExBg5zzp7M4eeGDd0MFfppsC06l9B.DBl5wNwrtniRwu',
    fullName: 'محمد الكهربائي',
    role: 'ENGINEER',
    department: 'ELECTRICAL',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  },
  {
    id: 'demo-site-eng-001',
    username: 'site_eng',
    email: 'site_eng@blueprint.ae',
    password: '$2b$10$SHEo0xb9OExBg5zzp7M4eeGDd0MFfppsC06l9B.DBl5wNwrtniRwu',
    fullName: 'مهندس الموقع',
    role: 'ENGINEER',
    department: 'CIVIL',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  },
  {
    id: 'demo-mech-eng-001',
    username: 'mech_eng',
    email: 'mech_eng@blueprint.ae',
    password: '$2b$10$SHEo0xb9OExBg5zzp7M4eeGDd0MFfppsC06l9B.DBl5wNwrtniRwu',
    fullName: 'عمر الميكانيكي',
    role: 'ENGINEER',
    department: 'MECHANICAL',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
  },
  {
    id: 'demo-secretary-001',
    username: 'secretary',
    email: 'secretary@blueprint.ae',
    password: '$2b$10$SHEo0xb9OExBg5zzp7M4eeGDd0MFfppsC06l9B.DBl5wNwrtniRwu',
    fullName: 'نورا السكرتيرة',
    role: 'SECRETARY',
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
      console.warn('Database not available, using demo mode');
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
    console.warn('Database operation failed, using fallback');
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
