import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { HandlerContext, ApiSuccessResponse, ApiErrorResponse } from '../types';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '../utils/response';
import { getDb, DEMO_USERS } from '../utils/db';
import { generateToken, isAdmin } from '../utils/auth';

/**
 * GET handlers for auth actions
 */
export const getHandlers = {
  /**
   * Get current user info (me action)
   */
  me: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    return successResponse({
      id: context.user.id,
      username: context.user.username,
      email: context.user.email,
      fullName: context.user.fullName,
      role: context.user.role,
      avatar: context.user.avatar,
      language: context.user.language || 'ar',
      theme: context.user.theme || 'dark',
      organization: context.user.organization,
      organizationId: context.user.organizationId
    });
  },

  /**
   * Get all users (admin only)
   */
  users: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    if (!isAdmin(context.user)) return forbiddenResponse();
    
    const database = await getDb();
    if (!database) return successResponse([]);
    
    const users = await database.user.findMany({
      where: { organizationId: context.user.organizationId },
      select: { 
        id: true, 
        username: true, 
        email: true, 
        fullName: true, 
        role: true, 
        isActive: true, 
        createdAt: true 
      }
    });
    
    return successResponse(users);
  }
};

/**
 * POST handlers for auth actions
 */
export const postHandlers = {
  /**
   * Login handler
   */
  login: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    const { username, password } = (context.body || {}) as { username?: string; password?: string };
    
    if (!username || !password) {
      return errorResponse('اسم المستخدم وكلمة المرور مطلوبان');
    }

    // Try demo users first
    let foundUser: any = DEMO_USERS.find(u => 
      u.username === username || u.email === username
    ) || null;
    
    // If not in demo users, try database
    if (!foundUser) {
      try {
        const database = await getDb();
        if (database) {
          foundUser = await database.user.findFirst({
            where: {
              OR: [
                { username },
                { email: username }
              ]
            }
          });
        }
      } catch (_dbError) {
        console.log('Database not available, using demo mode');
      }
    }

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

    // Update last login (only for database users)
    if (!foundUser.id.startsWith('demo-')) {
      try {
        const database = await getDb();
        if (database) {
          await database.user.update({
            where: { id: foundUser.id },
            data: { lastLoginAt: new Date() }
          });
        }
      } catch (_dbError) {
        console.log('Could not update last login');
      }
    }

    const token = await generateToken(foundUser.id);
    return successResponse({ accessToken: token, tokenType: 'bearer' });
  },

  /**
   * Register handler
   */
  register: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    const { username, email, password, fullName, role = 'viewer', organizationId } = (context.body || {}) as Record<string, unknown>;
    
    if (!username || !email || !password) {
      return errorResponse('جميع الحقول مطلوبة');
    }

    if (typeof password === 'string' && password.length < 8) {
      return errorResponse('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }

    const database = await getDb();
    if (!database) {
      return errorResponse('قاعدة البيانات غير متاحة');
    }

    const existing = await database.user.findFirst({
      where: { OR: [{ username: username as string }, { email: email as string }] }
    });

    if (existing) {
      return errorResponse('المستخدم موجود بالفعل');
    }

    const hashedPassword = await bcrypt.hash(password as string, 10);
    const newUser = await database.user.create({
      data: {
        username: username as string,
        email: email as string,
        password: hashedPassword,
        fullName: (fullName as string) || (username as string),
        role: role as string,
        organizationId: (organizationId as string) || context.user?.organizationId
      }
    });

    return successResponse({ id: newUser.id, username: newUser.username });
  },

  /**
   * Update user (admin only)
   */
  user: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    if (!isAdmin(context.user)) return forbiddenResponse();
    
    const { id, ...data } = (context.body || {}) as Record<string, unknown>;
    if (!id) return errorResponse('معرف المستخدم مطلوب');

    const database = await getDb();
    if (!database) {
      return errorResponse('قاعدة البيانات غير متاحة');
    }

    // Verify user belongs to same organization
    const targetUser = await database.user.findFirst({
      where: { id, organizationId: context.user.organizationId }
    });
    if (!targetUser) return errorResponse('المستخدم غير موجود', 'NOT_FOUND', 404);

    // SECURITY: Prevent mass assignment - whitelist allowed fields
    const ALLOWED_FIELDS = ['username', 'email', 'fullName', 'password', 'isActive', 'avatar', 'language', 'theme', 'role'];
    const sanitizedData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in data && data[key] !== undefined) {
        sanitizedData[key] = data[key];
      }
    }

    // SECURITY: Block role escalation to admin from this endpoint
    if (sanitizedData.role && sanitizedData.role === 'admin') {
      return errorResponse('لا يمكن تعيين دور المدير من هذا المسار', 'FORBIDDEN_ROLE_CHANGE', 403);
    }

    // Hash password if provided
    if (sanitizedData.password) {
      sanitizedData.password = await bcrypt.hash(sanitizedData.password as string, 10);
    }

    await database.user.update({ where: { id }, data: sanitizedData });
    return successResponse(true);
  }
};
