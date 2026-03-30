import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';

function successResponse(data: unknown) { return NextResponse.json({ success: true, data }); }
function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// GET - Fetch team members (scoped to user's organization)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    // SECURITY: Only fetch users from the same organization
    const where: Record<string, unknown> = { isActive: true };

    if (user.organizationId) {
      where.organizationId = user.organizationId;
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        phone: true,
        jobTitle: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no users in database, return mock data for demo
    if (users.length === 0) {
      const mockUsers = [
        {
          id: '1',
          email: 'ahmed@blueprint.com',
          fullName: 'أحمد محمد',
          role: 'ADMIN',
          department: 'الإدارة',
          phone: '+966 50 123 4567',
          jobTitle: 'مدير النظام',
          avatar: null,
          createdAt: new Date('2023-01-15'),
        },
        {
          id: '2',
          email: 'sara@blueprint.com',
          fullName: 'سارة أحمد',
          role: 'MANAGER',
          department: 'إدارة المشاريع',
          phone: '+966 55 987 6543',
          jobTitle: 'مديرة المشاريع',
          avatar: null,
          createdAt: new Date('2023-03-20'),
        },
        {
          id: '3',
          email: 'mohammed@blueprint.com',
          fullName: 'محمد علي',
          role: 'ENGINEER',
          department: 'الهندسة المدنية',
          phone: '+966 56 111 2222',
          jobTitle: 'مهندس مدني',
          avatar: null,
          createdAt: new Date('2023-06-10'),
        },
        {
          id: '4',
          email: 'fatima@blueprint.com',
          fullName: 'فاطمة حسن',
          role: 'ENGINEER',
          department: 'الهندسة المعمارية',
          phone: '+966 57 333 4444',
          jobTitle: 'مهندسة معمارية',
          avatar: null,
          createdAt: new Date('2023-08-05'),
        },
        {
          id: '5',
          email: 'khalid@blueprint.com',
          fullName: 'خالد سعود',
          role: 'PROJECT_MANAGER',
          department: 'إدارة المشاريع',
          phone: '+966 58 555 6666',
          jobTitle: 'مدير مشروع أول',
          avatar: null,
          createdAt: new Date('2023-02-28'),
        },
        {
          id: '6',
          email: 'noura@blueprint.com',
          fullName: 'نورة عبدالله',
          role: 'ACCOUNTANT',
          department: 'المالية',
          phone: '+966 59 777 8888',
          jobTitle: 'محاسبة',
          avatar: null,
          createdAt: new Date('2023-09-12'),
        },
        {
          id: '7',
          email: 'omar@blueprint.com',
          fullName: 'عمر فهد',
          role: 'ENGINEER',
          department: 'الهندسة الكهربائية',
          phone: '+966 54 999 0000',
          jobTitle: 'مهندس كهربائي',
          avatar: null,
          createdAt: new Date('2023-11-01'),
        },
      ];

      return NextResponse.json({ data: mockUsers });
    }

    return successResponse(users);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return errorResponse('Failed to fetch team members', 'SERVER_ERROR', 500);
  }
}

// POST - Create new team member (restricted to admins/managers)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    // SECURITY: Only admins and managers can create team members
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return errorResponse('ليس لديك صلاحية إنشاء أعضاء فريق', 'FORBIDDEN', 403);
    }

    const body = await request.json();
    const { fullName, email, role, department, phone, jobTitle } = body;

    if (!email || !fullName) {
      return errorResponse('البريد الإلكتروني والاسم مطلوبان', 'VALIDATION_ERROR');
    }

    try {
      const newMember = await db.user.create({
        data: {
          email,
          username: email.split('@')[0],
          fullName,
          role: role || 'ENGINEER',
          department,
          phone,
          jobTitle,
          isActive: true,
          language: 'ar',
          theme: 'system',
          // SECURITY: Always assign to the same organization as the creator
          organizationId: user.organizationId || undefined,
        },
      });

      return successResponse({ id: newMember.id, email: newMember.email });
    } catch {
      return errorResponse('فشل في إنشاء عضو الفريق', 'DB_ERROR', 500);
    }
  } catch (error) {
    console.error('Error creating team member:', error);
    return errorResponse('Failed to create team member', 'SERVER_ERROR', 500);
  }
}
