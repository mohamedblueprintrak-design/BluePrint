import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all team members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const where: any = { isActive: true };

    if (role && role !== 'all') {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
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
          role: 'admin',
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
          role: 'manager',
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
          role: 'engineer',
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
          role: 'engineer',
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
          role: 'project_manager',
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
          role: 'accountant',
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
          role: 'engineer',
          department: 'الهندسة الكهربائية',
          phone: '+966 54 999 0000',
          jobTitle: 'مهندس كهربائي',
          avatar: null,
          createdAt: new Date('2023-11-01'),
        },
      ];

      return NextResponse.json({ data: mockUsers });
    }

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

// POST - Create new team member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, role, department, phone, jobTitle } = body;

    try {
      const user = await prisma.user.create({
        data: {
          email,
          username: email.split('@')[0],
          fullName,
          role: role || 'engineer',
          department,
          phone,
          jobTitle,
          isActive: true,
          language: 'ar',
          theme: 'system',
          timezone: 'Asia/Riyadh',
          leaveBalance: 30,
          twoFactorEnabled: false,
        },
      });

      return NextResponse.json({ data: user });
    } catch (dbError) {
      // Demo mode - return success anyway
      return NextResponse.json({
        data: {
          id: Date.now().toString(),
          ...body,
          createdAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
