import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

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

      const foundUser = await db.user.findFirst({
        where: {
          OR: [{ username }, { email: username }]
        }
      });

      if (!foundUser || !foundUser.password) {
        return errorResponse('بيانات الدخول غير صحيحة');
      }

      const isValid = await bcrypt.compare(password, foundUser.password);
      if (!isValid) {
        return errorResponse('بيانات الدخول غير صحيحة');
      }

      if (!foundUser.isActive) {
        return errorResponse('الحساب غير مفعل');
      }

      await db.user.update({
        where: { id: foundUser.id },
        data: { lastLoginAt: new Date() }
      });

      const token = await new jose.SignJWT({ userId: foundUser.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('8h')
        .setIssuedAt()
        .sign(JWT_SECRET);

      return successResponse({ accessToken: token, tokenType: 'bearer' });
    }

    // Register
    if (action === 'register') {
      if (!username || !email || !password) {
        return errorResponse('جميع الحقول مطلوبة');
      }

      if (password.length < 6) {
        return errorResponse('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      }

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

      return successResponse({ id: newUser.id, username: newUser.username });
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
    const user = await db.user.findUnique({ 
      where: { id: payload.userId as string },
      include: { organization: true }
    });

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
      language: user.language,
      theme: user.theme,
      organization: user.organization,
      organizationId: user.organizationId
    });
  } catch {
    return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
  }
}
