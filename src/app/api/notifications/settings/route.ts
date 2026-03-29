import { NextRequest, NextResponse } from 'next/server';
import { getJWTSecret } from '@/app/api/utils/auth';
import * as jose from 'jose';

// Type for notification settings
interface NotificationSettingsData {
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
}

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const tokenCookie = request.cookies.get('bp_token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : tokenCookie;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret());
    // Verify user exists without importing db (NotificationSettings is not in Prisma schema)
    return { id: payload.userId as string };
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
const DEFAULT_SETTINGS: NotificationSettingsData = {
  userId: '',
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

// In-memory settings store (per-user)
// NOTE: This is a temporary solution. For production, add a NotificationSettings
// model to the Prisma schema and persist settings in the database.
const userSettings = new Map<string, NotificationSettingsData>();

function getUserSettings(userId: string): NotificationSettingsData {
  return userSettings.get(userId) || { ...DEFAULT_SETTINGS, userId };
}

function setUserSettings(userId: string, settings: NotificationSettingsData): void {
  userSettings.set(userId, settings);
}

// GET - Get user notification settings
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const settings = getUserSettings(user.id);

    return successResponse({
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
      isNew: !userSettings.has(user.id),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// PUT - Update notification settings
export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const current = getUserSettings(user.id);

    const updated: NotificationSettingsData = {
      userId: user.id,
      emailInvoices: typeof body.emailInvoices === 'boolean' ? body.emailInvoices : current.emailInvoices,
      emailTasks: typeof body.emailTasks === 'boolean' ? body.emailTasks : current.emailTasks,
      emailLeaves: typeof body.emailLeaves === 'boolean' ? body.emailLeaves : current.emailLeaves,
      emailProjects: typeof body.emailProjects === 'boolean' ? body.emailProjects : current.emailProjects,
      emailPayments: typeof body.emailPayments === 'boolean' ? body.emailPayments : current.emailPayments,
      pushEnabled: typeof body.pushEnabled === 'boolean' ? body.pushEnabled : current.pushEnabled,
      pushTasks: typeof body.pushTasks === 'boolean' ? body.pushTasks : current.pushTasks,
      pushLeaves: typeof body.pushLeaves === 'boolean' ? body.pushLeaves : current.pushLeaves,
      pushProjects: typeof body.pushProjects === 'boolean' ? body.pushProjects : current.pushProjects,
      digestEmail: typeof body.digestEmail === 'boolean' ? body.digestEmail : current.digestEmail,
    };

    setUserSettings(user.id, updated);

    return successResponse({
      ...updated,
      message: 'تم تحديث إعدادات الإشعارات',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}

// POST - Reset to default settings
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const resetSettings: NotificationSettingsData = { ...DEFAULT_SETTINGS, userId: user.id };
    setUserSettings(user.id, resetSettings);

    return successResponse({
      ...resetSettings,
      message: 'تم إعادة تعيين إعدادات الإشعارات إلى الوضع الافتراضي',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(errMsg, 'SERVER_ERROR', 500);
  }
}
