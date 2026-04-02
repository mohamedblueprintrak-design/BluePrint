/**
 * Demo Configuration
 * إعدادات الوضع التجريبي
 * 
 * SECURITY:
 * - Demo mode is DISABLED in production
 * - Demo passwords are randomly generated on startup
 * - Credentials are only logged in development mode
 */

import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { DemoUser, AuthenticatedUser } from '../types';
import { hash } from 'bcryptjs';
import { DEMO_USERS as DB_DEMO_USERS } from './db';

// ============================================
// Environment Check
// ============================================

/**
 * Check if demo mode is allowed
 * SECURITY: Demo mode is DISABLED in production
 * Matches utils/db.ts behavior: defaults to TRUE unless DEMO_MODE=false
 */
function isDemoModeAllowed(): boolean {
  // Explicitly disable demo mode in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  
  // Match utils/db.ts: demo mode enabled unless explicitly disabled
  return process.env.DEMO_MODE !== 'false';
}

// ============================================
// JWT Secret Handling
// ============================================

let _jwtSecretBytes: Uint8Array | null = null;

// Stable development JWT secret (same as middleware fallback)
const DEV_JWT_SECRET = 'blueprint-dev-secret-do-not-use-in-production-min32chars!';

function getJWTSecretBytes(): Uint8Array {
  if (_jwtSecretBytes) return _jwtSecretBytes;
  
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: JWT_SECRET not set in production!');
      throw new Error('JWT_SECRET must be set in production');
    } else {
      console.warn('WARNING: Using development JWT secret. Set JWT_SECRET in production!');
    }
    // Use a STABLE development-only fallback (NOT Date.now() - sessions would break on restart)
    _jwtSecretBytes = new TextEncoder().encode(DEV_JWT_SECRET);
  } else {
    _jwtSecretBytes = new TextEncoder().encode(secret);
  }
  
  return _jwtSecretBytes;
}

// Export for use in JWT verification
const JWT_SECRET = { get bytes() { return getJWTSecretBytes(); } };

// ============================================
// Demo Users - Generated at Runtime
// ============================================

let _demoUsers: DemoUser[] = [];
let _demoCredentialsLogged = false;

/**
 * Generate demo users with random passwords
 * SECURITY: Passwords are generated at runtime, not hardcoded
 */
async function initializeDemoUsers(): Promise<DemoUser[]> {
  // SECURITY: Don't create demo users in production
  if (!isDemoModeAllowed()) {
    return [];
  }

  // Generate random password for demo users
  const demoPassword = generateRandomPassword(12);
  const hashedPassword = await hash(demoPassword, 10);
  
  const users: DemoUser[] = [
    {
      id: 'demo-admin-001',
      username: 'demo_admin',
      email: 'demo-admin@blueprint.local',
      password: hashedPassword,
      fullName: 'Demo Administrator',
      role: 'ADMIN',
      isActive: true,
      avatar: null,
      language: 'ar',
      theme: 'dark',
      organizationId: 'demo-org-001',
      organization: {
        id: 'demo-org-001',
        name: 'BluePrint Demo Company',
        currency: 'AED'
      }
    },
    {
      id: 'demo-user-001',
      username: 'demo_user',
      email: 'demo-user@blueprint.local',
      password: hashedPassword,
      fullName: 'Demo User',
      role: 'VIEWER',
      isActive: true,
      avatar: null,
      language: 'ar',
      theme: 'dark',
      organizationId: 'demo-org-001',
      organization: {
        id: 'demo-org-001',
        name: 'BluePrint Demo Company',
        currency: 'AED'
      }
    }
  ];
  
  // Log credentials ONCE in development mode only (password hidden for security)
  if (!_demoCredentialsLogged && process.env.NODE_ENV !== 'production') {
    console.warn('\n' + '='.repeat(60));
    console.warn('🔐 DEMO MODE ENABLED');
    console.warn('='.repeat(60));
    console.warn('Demo credentials (check .env for password):');
    console.warn('-'.repeat(60));
    console.warn('  Admin: demo_admin');
    console.warn('  User:  demo_user');
    console.warn('-'.repeat(60));
    console.warn('⚠️  These credentials are for development only!');
    console.warn('⚠️  They change every time the server restarts.');
    console.warn('='.repeat(60) + '\n');
    _demoCredentialsLogged = true;
  }
  
  return users;
}

/**
 * Generate a random password
 */
function generateRandomPassword(length: number): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Get demo users (lazy initialization)
 */
export async function getDemoUsers(): Promise<DemoUser[]> {
  if (_demoUsers.length === 0 && isDemoModeAllowed()) {
    _demoUsers = await initializeDemoUsers();
  }
  return _demoUsers;
}

// Legacy synchronous export for backward compatibility
// This will be empty in production
export const DEMO_USERS: DemoUser[] = [];

/**
 * Find a demo user by ID
 */
export async function findDemoUser(userId: string): Promise<DemoUser | undefined> {
  const users = await getDemoUsers();
  return users.find(u => u.id === userId);
}

/**
 * Find demo user by username or email (for login)
 */
export async function findDemoUserByCredentials(
  identifier: string
): Promise<DemoUser | undefined> {
  const users = await getDemoUsers();
  return users.find(u => 
    u.username.toLowerCase() === identifier.toLowerCase() ||
    u.email.toLowerCase() === identifier.toLowerCase()
  );
}

/**
 * Check if a user ID belongs to a demo user
 */
export function isDemoUser(userId: string): boolean {
  return userId.startsWith('demo-');
}

/**
 * Get user from JWT token - checks demo users first, then database
 * This is the standard function all API routes should use for authentication
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    // Skip if this is the 'httpOnly' placeholder (not a real JWT)
    if (token === 'httpOnly') token = null;
  }
  
  // Fall back to httpOnly cookie (set during login)
  if (!token) {
    const tokenCookie = request.cookies.get('token');
    if (tokenCookie?.value) {
      token = tokenCookie.value;
    }
  }
  
  if (!token) return null;
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET.bytes);
    const userId = payload.userId as string;
    
    // Check demo users first (only if demo mode is allowed)
    if (isDemoModeAllowed()) {
      const demoUser = await findDemoUser(userId);
      if (demoUser) {
        return {
          id: demoUser.id,
          username: demoUser.username,
          email: demoUser.email,
          fullName: demoUser.fullName,
          role: demoUser.role,
          avatar: demoUser.avatar,
          language: demoUser.language,
          theme: demoUser.theme,
          organizationId: demoUser.organizationId,
          organization: demoUser.organization,
          isActive: demoUser.isActive
        };
      }

      // Also check db.ts DEMO_USERS (used by login route)
      const dbDemoUser = DB_DEMO_USERS.find(u => u.id === userId);
      if (dbDemoUser) {
        return {
          id: dbDemoUser.id,
          username: dbDemoUser.username,
          email: dbDemoUser.email,
          fullName: dbDemoUser.fullName,
          role: dbDemoUser.role,
          avatar: dbDemoUser.avatar,
          language: dbDemoUser.language,
          theme: dbDemoUser.theme,
          organizationId: dbDemoUser.organizationId,
          organization: dbDemoUser.organization,
          isActive: dbDemoUser.isActive,
          department: (dbDemoUser as any).department,
        };
      }
    }
    
    // Then try database for real users
    try {
      const { db } = await import('@/lib/db');
      const dbUser = await db.user.findUnique({ 
        where: { id: userId },
        include: { organization: true }
      });
      
      if (dbUser) {
        return {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          fullName: dbUser.fullName,
          role: dbUser.role,
          avatar: dbUser.avatar,
          language: dbUser.language || 'ar',
          theme: dbUser.theme || 'dark',
          organizationId: dbUser.organizationId,
          organization: dbUser.organization ? {
            id: dbUser.organization.id,
            name: dbUser.organization.name,
            currency: dbUser.organization.currency || 'AED'
          } : null,
          isActive: dbUser.isActive
        };
      }
    } catch {
      console.warn('Database not available for user lookup');
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get demo data for demo users
 * Returns sample data for demo mode when database queries would fail
 */
export const DEMO_DATA = {
  projects: [
    {
      id: 'demo-project-001',
      name: 'برج الأعمال التجاري',
      projectNumber: 'PRJ-2024-0001',
      location: 'دبي، الإمارات',
      status: 'active',
      contractValue: 15000000,
      clientId: 'demo-client-001',
      client: 'شركة التطوير العقاري',
      progressPercentage: 45,
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'demo-project-002',
      name: 'مجمع الفلل السكني',
      projectNumber: 'PRJ-2024-0002',
      location: 'أبوظبي، الإمارات',
      status: 'active',
      contractValue: 8500000,
      clientId: 'demo-client-002',
      client: 'مؤسسة البناء الحديث',
      progressPercentage: 72,
      createdAt: new Date('2024-02-20')
    },
    {
      id: 'demo-project-003',
      name: 'مركز التسوق',
      projectNumber: 'PRJ-2024-0003',
      location: 'الشارقة، الإمارات',
      status: 'completed',
      contractValue: 25000000,
      clientId: 'demo-client-001',
      client: 'شركة التطوير العقاري',
      progressPercentage: 100,
      createdAt: new Date('2023-06-10')
    }
  ],
  clients: [
    { id: 'demo-client-001', name: 'شركة التطوير العقاري', email: 'info@realestate.ae', phone: '+971-4-1234567', isActive: true },
    { id: 'demo-client-002', name: 'مؤسسة البناء الحديث', email: 'contact@modernbuild.ae', phone: '+971-2-7654321', isActive: true },
    { id: 'demo-client-003', name: 'مجموعة الإنشاءات', email: 'projects@construction.ae', phone: '+971-6-1112222', isActive: true }
  ],
  tasks: [
    { id: 'demo-task-001', title: 'مراجعة المخططات المعمارية', status: 'done', priority: 'high', projectId: 'demo-project-001' },
    { id: 'demo-task-002', title: 'الحصول على تراخيص البناء', status: 'in_progress', priority: 'high', projectId: 'demo-project-001' },
    { id: 'demo-task-003', title: 'توريد مواد الأساسات', status: 'todo', priority: 'medium', projectId: 'demo-project-002' },
    { id: 'demo-task-004', title: 'فحص جودة الخرسانة', status: 'in_progress', priority: 'high', projectId: 'demo-project-002' }
  ],
  defects: [
    { id: 'demo-defect-001', title: 'تشقق في الجدران', description: 'تم اكتشاف تشققات في الجدار الشرقي', status: 'Open', severity: 'medium', projectId: 'demo-project-001' },
    { id: 'demo-defect-002', title: 'تسرب مياه في السقف', description: 'تسرب من مواسير الصرف', status: 'Open', severity: 'critical', projectId: 'demo-project-001' },
    { id: 'demo-defect-003', title: 'عيب في الطلاء', description: 'تقشر في الطلاء', status: 'Closed', severity: 'low', projectId: 'demo-project-002' }
  ],
  meetings: [
    { id: 'demo-meeting-001', title: 'اجتماع متابعة مشروع الواحة', date: '2026-03-31', time: '10:00', duration: 60, location: 'قاعة الاجتماعات الرئيسية', type: 'ONSITE', status: 'CONFIRMED', attendees: '["أحمد المدير", "خالد الإنشائي", "محمد الكهربائي"]', agenda: 'مراجعة تقدم الأعمال - مناقشة التعديلات المعمارية - متابعة المخالفات', notes: '', projectId: 'demo-project-001', projectName: 'برج الأعمال التجاري', createdAt: new Date('2026-03-25') },
    { id: 'demo-meeting-002', title: 'متابعة المراسلات البلدية', date: '2026-04-01', time: '09:00', duration: 30, location: 'Zoom', type: 'ONLINE', status: 'CONFIRMED', attendees: '["أحمد المدير", "نورا السكرتيرة"]', agenda: 'متابعة طلبات التصاريح - الرد على ملاحظات البلدية', notes: '', createdAt: new Date('2026-03-26') },
    { id: 'demo-meeting-003', title: 'اجتماع مع العميل - مراجعة المخططات', date: '2026-04-02', time: '14:00', duration: 90, location: 'مكتب العميل - دبي', type: 'ONSITE', status: 'PENDING', attendees: '["أحمد المدير", "المهندس المعماري", "العميل خالد"]', agenda: 'عرض المخططات النهائية - أخذ موافقة العميل على التعديلات', notes: 'مطلوب تجهيز نسخة طباعة من المخططات', projectId: 'demo-project-002', projectName: 'مجمع الفلل السكني', createdAt: new Date('2026-03-27') },
    { id: 'demo-meeting-004', title: 'اجتماع الفريق الأسبوعي', date: '2026-04-03', time: '08:30', duration: 45, location: 'Teams', type: 'ONLINE', status: 'CONFIRMED', attendees: '["أحمد المدير", "المهندس المعماري", "خالد الإنشائي", "محمد الكهربائي", "نورا السكرتيرة"]', agenda: 'متابعة المهام الأسبوعية - توزيع مهام جديدة - مناقشة المعوقات', notes: '', createdAt: new Date('2026-03-28') },
    { id: 'demo-meeting-005', title: 'فحص الموقع - مشروع برج', date: '2026-04-05', time: '07:00', duration: 120, location: 'الموقع - منطقة الشارقة', type: 'ONSITE', status: 'PENDING', attendees: '["مهندس الموقع", "خالد الإنشائي", "أحمد المدير"]', agenda: 'فحص أعمال الصب - مراجعة حديد التسليح - متابعة المقاول', notes: 'يجب ارتداء خوذة الأمان', projectId: 'demo-project-001', projectName: 'برج الأعمال التجاري', createdAt: new Date('2026-03-29') }
  ],
  dashboard: {
    projects: { total: 3, active: 2, completed: 1, pending: 0 },
    clients: { total: 3 },
    financial: { totalInvoiced: 48500000, totalPaid: 32000000, totalPending: 16500000, overdueAmount: 2500000 },
    tasks: { total: 4, pending: 1, inProgress: 2, completed: 1, overdue: 0 },
    defects: { open: 2, resolved: 1, critical: 1 },
    employees: { total: 25, presentToday: 20, onLeave: 5 }
  }
};

/**
 * Check if running in demo mode (no database)
 */
export async function isDemoMode(): Promise<boolean> {
  // Demo mode requires explicit enable
  if (!isDemoModeAllowed()) {
    return false;
  }
  
  try {
    const { db } = await import('@/lib/db');
    // Try a simple query to check if database is available
    await db.user.count();
    return false;
  } catch {
    return true;
  }
}

// Initialize demo users on module load (async)
if (isDemoModeAllowed()) {
  initializeDemoUsers().then(users => {
    _demoUsers = users;
  }).catch(err => {
    console.error('Failed to initialize demo users:', err);
  });
}
