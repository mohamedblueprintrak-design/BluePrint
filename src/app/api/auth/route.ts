import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { db, isDatabaseAvailable } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

// Demo users for testing without database
const DEMO_USERS: Array<{
  id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
  isActive: boolean;
  avatar: string | null;
  language: string;
  theme: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    timezone: string;
    locale: string;
  };
}> = [
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
      slug: 'blueprint-eng',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      locale: 'ar'
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
      slug: 'blueprint-eng',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      locale: 'ar'
    }
  }
];

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, email, password, fullName, role = 'viewer', organizationId } = body;

    // Login
    if (action === 'login') {
      if (!username || !password) {
        return errorResponse('اسم المستخدم وكلمة المرور مطلوبان');
      }

      // Try database first, fall back to demo users
      let foundUser: any = null;
      
      // Check if database is available before querying
      if (isDatabaseAvailable()) {
        try {
          foundUser = await db.user.findFirst({
            where: {
              OR: [{ username }, { email: username }]
            },
            include: { organization: true }
          });
        } catch (dbError) {
          console.log('Database query error:', dbError);
        }
      }

      // If no database user, check demo users
      if (!foundUser) {
        foundUser = DEMO_USERS.find(u => 
          u.username === username || u.email === username
        );
      }

      if (!foundUser) {
        return errorResponse('بيانات الدخول غير صحيحة');
      }

      // Verify password
      let isValid = false;
      if (foundUser.password) {
        isValid = await bcrypt.compare(password, foundUser.password);
      }

      if (!isValid) {
        return errorResponse('بيانات الدخول غير صحيحة');
      }

      if (!foundUser.isActive) {
        return errorResponse('الحساب غير مفعل');
      }

      const token = await new jose.SignJWT({ 
        userId: foundUser.id,
        authProvider: 'credentials'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('8h')
        .setIssuedAt()
        .sign(JWT_SECRET);

      return successResponse({ accessToken: token, tokenType: 'bearer' });
    }

    // Register - creates user in database if available
    if (action === 'register') {
      if (!username || !email || !password) {
        return errorResponse('جميع الحقول مطلوبة');
      }

      if (password.length < 6) {
        return errorResponse('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      }

      // Check if user exists in demo users
      const existingDemo = DEMO_USERS.find(u => u.username === username || u.email === email);
      if (existingDemo) {
        return errorResponse('المستخدم موجود بالفعل');
      }

      // Try database if available
      if (isDatabaseAvailable()) {
        try {
          const existing = await db.user.findFirst({
            where: { OR: [{ username }, { email }] }
          });
          if (existing) {
            return errorResponse('المستخدم موجود بالفعل');
          }

          const hashedPassword = await bcrypt.hash(password, 10);
          const newUser = await db.user.create({
            data: {
              username,
              email,
              password: hashedPassword,
              fullName: fullName || username,
              role,
              organizationId: organizationId || null
            }
          });

          console.log('User created successfully:', newUser.username);
          return successResponse({ id: newUser.id, username: newUser.username, message: 'تم إنشاء الحساب بنجاح' });
        } catch (dbError: any) {
          console.error('Database error during registration:', dbError);
          return errorResponse(dbError.message || 'خطأ في قاعدة البيانات', 'DB_ERROR', 500);
        }
      }
      
      // Demo mode - return error because demo users can't login after registration
      return errorResponse('قاعدة البيانات غير متاحة حالياً. يرجى المحاولة لاحقاً أو استخدام حساب تجريبي: admin / admin123');
    }

    return errorResponse('إجراء غير معروف');
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return errorResponse(error.message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

// GET - Get current user
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
  }
  
  const token = authHeader.substring(7);
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    // Check demo users first
    let user = DEMO_USERS.find(u => u.id === userId);

    // Try database if available and user not found in demo
    if (!user && isDatabaseAvailable()) {
      try {
        const dbUser = await db.user.findUnique({ 
          where: { id: userId },
          include: { organization: true }
        });

        if (dbUser) {
          user = {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            password: dbUser.password || '',
            fullName: dbUser.fullName || dbUser.username,
            role: dbUser.role,
            isActive: dbUser.isActive,
            avatar: dbUser.avatar,
            language: dbUser.language || 'ar',
            theme: dbUser.theme || 'dark',
            organizationId: dbUser.organizationId || '',
            organization: dbUser.organization || {
              id: '',
              name: '',
              slug: '',
              currency: 'AED',
              timezone: 'Asia/Dubai',
              locale: 'ar'
            }
          };
        }
      } catch (dbError) {
        console.log('Database query error:', dbError);
      }
    }

    if (!user) {
      return errorResponse('المستخدم غير موجود', 'NOT_FOUND', 404);
    }

    return successResponse({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar,
      language: user.language || 'ar',
      theme: user.theme || 'dark',
      organization: user.organization,
      organizationId: user.organizationId
    });
  } catch {
    return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
  }
}
