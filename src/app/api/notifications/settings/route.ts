import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getJWTSecret } from '@/app/api/utils/auth';
import * as jose from 'jose';

// Type for notification settings
interface NotificationSettingsData {
  id?: string;
  userId: string;
  emailInvoices: boolean;
  emailTasks: boolean;
  emailLeaves: boolean;
  emailProjects: boolean;
  emailPayments: boolean;
  pushEnabled: boolean;
  pushTasks: boolean;
  pushLeaves: boolean;
  pushProjects: boolean;
  digestEmail: boolean;
  [key: string]: unknown;
}

// Whitelist of allowed notification setting column names (prevent SQL column injection)
const ALLOWED_COLUMNS = new Set([
  'emailInvoices', 'emailTasks', 'emailLeaves', 'emailProjects',
  'emailPayments', 'pushEnabled', 'pushTasks', 'pushLeaves',
  'pushProjects', 'digestEmail'
]);

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const tokenCookie = request.cookies.get('bp_token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : tokenCookie;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret());
    return await db.user.findUnique({ 
      where: { id: payload.userId as string },
    });
  } catch {
    return null;
  }
}

function successResponse(data: unknown) {
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

// Helper to safely query NotificationSettings model
async function findNotificationSettings(userId: string): Promise<NotificationSettingsData | null> {
  try {
    const result = await db.$queryRawUnsafe(
      'SELECT * FROM NotificationSettings WHERE userId = ? LIMIT 1',
      [userId]
    ) as NotificationSettingsData[];
    return result?.[0] ?? null;
  } catch {
    return null;
  }
}

// Helper to safely upsert NotificationSettings
async function upsertNotificationSettings(
  userId: string,
  updateData: Record<string, unknown>,
  createData: Record<string, unknown>
): Promise<NotificationSettingsData | null> {
  try {
    const existing = await findNotificationSettings(userId);
    
    // SECURITY: Filter to only allowed columns to prevent SQL injection
    const safeUpdate = Object.fromEntries(
      Object.entries(updateData).filter(([k]) => ALLOWED_COLUMNS.has(k))
    );
    const safeCreate = Object.fromEntries(
      Object.entries(createData).filter(([k]) => ALLOWED_COLUMNS.has(k))
    );
    
    if (existing) {
      const entries = Object.entries(safeUpdate);
      if (entries.length > 0) {
        const fields = entries.map(([k]) => `"${k}" = ?`).join(', ');
        await db.$executeRawUnsafe(
          `UPDATE NotificationSettings SET ${fields} WHERE userId = ?`,
          [...entries.map(([, v]) => v), userId]
        );
        return { ...existing, ...safeUpdate } as NotificationSettingsData;
      }
      return existing;
    } else {
      const entries = Object.entries(safeCreate);
      if (entries.length > 0) {
        const cols = entries.map(([k]) => `"${k}"`).join(', ');
        const placeholders = entries.map(() => '?').join(', ');
        await db.$executeRawUnsafe(
          `INSERT INTO NotificationSettings ("userId", ${cols}) VALUES (?, ${placeholders})`,
          [userId, ...entries.map(([, v]) => v)]
        );
      }
      return { userId, ...safeCreate } as NotificationSettingsData;
    }
  } catch {
    return null;
  }
}

// GET - Get user notification settings
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const settings = await findNotificationSettings(user.id);

    if (!settings) {
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

    const updateData: Record<string, unknown> = {
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
    };

    const createData: Record<string, unknown> = {
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
    };

    const settings = await upsertNotificationSettings(user.id, updateData, createData);

    if (!settings) {
      return successResponse({
        userId: user.id,
        ...createData,
        message: 'تم تحديث إعدادات الإشعارات (وضع تجريبي)'
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
      message: 'تم تحديث إعدادات الإشعارات'
    });
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
    const settings = await upsertNotificationSettings(
      user.id,
      DEFAULT_SETTINGS,
      { userId: user.id, ...DEFAULT_SETTINGS }
    );

    if (!settings) {
      return successResponse({
        userId: user.id,
        ...DEFAULT_SETTINGS,
        message: 'تم إعادة تعيين الإعدادات (وضع تجريبي)'
      });
    }

    return successResponse({
      ...settings,
      message: 'تم إعادة تعيين إعدادات الإشعارات إلى الوضع الافتراضي'
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}
