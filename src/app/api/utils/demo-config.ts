import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { DemoUser, AuthenticatedUser } from '../types';

// JWT secret - must match across all routes
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

// Demo users for testing without database
// These users exist only in memory and can be used to test the application
export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-admin-001',
    username: 'admin',
    email: 'admin@blueprint.ae',
    password: '$2b$10$.ELmlEHTPMDITIuJQzJ2IOGo87dOUXo3zE515Lq.WQMyHvDWzAX6.', // admin123
    fullName: 'مدير النظام',
    role: 'admin',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: {
      id: 'demo-org-001',
      name: 'BluePrint Engineering',
      currency: 'AED'
    }
  },
  {
    id: 'demo-user-001',
    username: 'user',
    email: 'user@blueprint.ae',
    password: '$2b$10$.ELmlEHTPMDITIuJQzJ2IOGo87dOUXo3zE515Lq.WQMyHvDWzAX6.', // admin123
    fullName: 'مستخدم تجريبي',
    role: 'viewer',
    isActive: true,
    avatar: null,
    language: 'ar',
    theme: 'dark',
    organizationId: 'demo-org-001',
    organization: {
      id: 'demo-org-001',
      name: 'BluePrint Engineering',
      currency: 'AED'
    }
  }
];

/**
 * Find a demo user by ID
 */
export function findDemoUser(userId: string): DemoUser | undefined {
  return DEMO_USERS.find(u => u.id === userId);
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
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    
    // Check demo users first (fast path for demo mode)
    const demoUser = findDemoUser(userId);
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
    } catch (dbError) {
      console.log('Database not available for user lookup');
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
  try {
    const { db } = await import('@/lib/db');
    // Try a simple query to check if database is available
    await db.user.count();
    return false;
  } catch {
    return true;
  }
}
