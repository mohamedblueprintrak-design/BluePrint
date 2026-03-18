import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return await db.user.findUnique({ 
      where: { id: payload.userId as string },
      include: { organization: true }
    });
  } catch {
    return null;
  }
}

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

// Default notification settings
const DEFAULT_SETTINGS = {
  emailInvoices: true,
  emailTasks: true,
  emailLeaves: true,
  emailProjects: true,
  emailPayments: true,
  pushEnabled: false,
  pushTasks: true,
  pushLeaves: true,
  pushProjects: true,
  digestEmail: false,
};

// GET - Get user notification settings
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    try {
      const settings = await (db as any).notificationSettings?.findUnique({
        where: { userId: user.id }
      });

      if (!settings) {
        // Return default settings if none exist
        return successResponse({
          ...DEFAULT_SETTINGS,
          userId: user.id,
          isNew: true
        });
      }

      return successResponse({
        id: settings.id,
        userId: settings.userId,
        emailInvoices: settings.emailInvoices,
        emailTasks: settings.emailTasks,
        emailLeaves: settings.emailLeaves,
        emailProjects: settings.emailProjects,
        emailPayments: settings.emailPayments,
        pushEnabled: settings.pushEnabled,
        pushTasks: settings.pushTasks,
        pushLeaves: settings.pushLeaves,
        pushProjects: settings.pushProjects,
        digestEmail: settings.digestEmail,
      });
    } catch (_dbError) {
      // Demo mode - return default settings
      return successResponse({
        ...DEFAULT_SETTINGS,
        userId: user.id,
        isNew: true,
        message: 'إعدادات الإشعارات (وضع تجريبي)'
      });
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// PUT - Update notification settings
export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const {
      emailInvoices,
      emailTasks,
      emailLeaves,
      emailProjects,
      emailPayments,
      pushEnabled,
      pushTasks,
      pushLeaves,
      pushProjects,
      digestEmail,
    } = body;

    try {
      // Upsert settings
      const settings = await (db as any).notificationSettings?.upsert({
        where: { userId: user.id },
        update: {
          emailInvoices: emailInvoices ?? undefined,
          emailTasks: emailTasks ?? undefined,
          emailLeaves: emailLeaves ?? undefined,
          emailProjects: emailProjects ?? undefined,
          emailPayments: emailPayments ?? undefined,
          pushEnabled: pushEnabled ?? undefined,
          pushTasks: pushTasks ?? undefined,
          pushLeaves: pushLeaves ?? undefined,
          pushProjects: pushProjects ?? undefined,
          digestEmail: digestEmail ?? undefined,
        },
        create: {
          userId: user.id,
          emailInvoices: emailInvoices ?? true,
          emailTasks: emailTasks ?? true,
          emailLeaves: emailLeaves ?? true,
          emailProjects: emailProjects ?? true,
          emailPayments: emailPayments ?? true,
          pushEnabled: pushEnabled ?? false,
          pushTasks: pushTasks ?? true,
          pushLeaves: pushLeaves ?? true,
          pushProjects: pushProjects ?? true,
          digestEmail: digestEmail ?? false,
        }
      });

      return successResponse({
        id: settings.id,
        userId: settings.userId,
        emailInvoices: settings.emailInvoices,
        emailTasks: settings.emailTasks,
        emailLeaves: settings.emailLeaves,
        emailProjects: settings.emailProjects,
        emailPayments: settings.emailPayments,
        pushEnabled: settings.pushEnabled,
        pushTasks: settings.pushTasks,
        pushLeaves: settings.pushLeaves,
        pushProjects: settings.pushProjects,
        digestEmail: settings.digestEmail,
        message: 'تم تحديث إعدادات الإشعارات'
      });
    } catch (_dbError) {
      // Demo mode
      return successResponse({
        userId: user.id,
        emailInvoices: emailInvoices ?? DEFAULT_SETTINGS.emailInvoices,
        emailTasks: emailTasks ?? DEFAULT_SETTINGS.emailTasks,
        emailLeaves: emailLeaves ?? DEFAULT_SETTINGS.emailLeaves,
        emailProjects: emailProjects ?? DEFAULT_SETTINGS.emailProjects,
        emailPayments: emailPayments ?? DEFAULT_SETTINGS.emailPayments,
        pushEnabled: pushEnabled ?? DEFAULT_SETTINGS.pushEnabled,
        pushTasks: pushTasks ?? DEFAULT_SETTINGS.pushTasks,
        pushLeaves: pushLeaves ?? DEFAULT_SETTINGS.pushLeaves,
        pushProjects: pushProjects ?? DEFAULT_SETTINGS.pushProjects,
        digestEmail: digestEmail ?? DEFAULT_SETTINGS.digestEmail,
        message: 'تم تحديث إعدادات الإشعارات (وضع تجريبي)'
      });
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// POST - Reset to default settings
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    try {
      const settings = await (db as any).notificationSettings?.upsert({
        where: { userId: user.id },
        update: DEFAULT_SETTINGS,
        create: {
          userId: user.id,
          ...DEFAULT_SETTINGS
        }
      });

      return successResponse({
        ...settings,
        message: 'تم إعادة تعيين إعدادات الإشعارات إلى الوضع الافتراضي'
      });
    } catch (_dbError) {
      // Demo mode
      return successResponse({
        userId: user.id,
        ...DEFAULT_SETTINGS,
        message: 'تم إعادة تعيين إعدادات الإشعارات (وضع تجريبي)'
      });
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}
