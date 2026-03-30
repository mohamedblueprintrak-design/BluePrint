import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';

function successResponse(data: unknown) { return NextResponse.json({ success: true, data }); }
function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// GET - Fetch all automations
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
    // @ts-expect-error automation model not in schema
    const automations = await db.automation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // If no automations in database, return mock data for demo
    if (automations.length === 0) {
      const mockAutomations = [
        {
          id: '1',
          name: 'تنبيه تجاوز الميزانية',
          description: 'إرسال تنبيه عند تجاوز ميزانية المشروع 80%',
          triggerType: 'threshold',
          triggerConfig: { threshold: 80, metric: 'budget' },
          actionType: 'notification',
          actionConfig: { recipients: ['manager', 'admin'], template: 'budget_alert' },
          status: 'active',
          lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          runCount: 12,
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'تذكير المهام المتأخرة',
          description: 'إرسال تذكير يومي للمهام التي تجاوزت موعد التسليم',
          triggerType: 'schedule',
          triggerConfig: { cron: '0 9 * * *', timezone: 'Asia/Riyadh' },
          actionType: 'email',
          actionConfig: { template: 'task_reminder', includeOverdue: true },
          status: 'active',
          lastRunAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          runCount: 45,
          createdAt: new Date(),
        },
        {
          id: '3',
          name: 'إنشاء تقرير أسبوعي',
          description: 'إنشاء وإرسال تقرير تقدم المشروع أسبوعياً',
          triggerType: 'schedule',
          triggerConfig: { cron: '0 17 * * 5', timezone: 'Asia/Riyadh' },
          actionType: 'email',
          actionConfig: { template: 'weekly_report', format: 'pdf' },
          status: 'active',
          lastRunAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          runCount: 8,
          createdAt: new Date(),
        },
      ];

      return successResponse(mockAutomations);
    }

    return successResponse(automations);
  } catch (error) {
    console.error('Error fetching automations:', error);
    return errorResponse('Failed to fetch automations', 'SERVER_ERROR', 500);
  }
}

// POST - Create new automation
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const body = await request.json();
    if (!body.name || !body.triggerType || !body.actionType) {
      return errorResponse('الاسم ونوع المشغل ونوع الإجراء مطلوبون', 'VALIDATION_ERROR');
    }

    // SECURITY: Only allow specific fields (prevent mass assignment)
    const automationData: Record<string, unknown> = {
      name: body.name,
      description: body.description || null,
      triggerType: body.triggerType,
      triggerConfig: body.triggerConfig || {},
      actionType: body.actionType,
      actionConfig: body.actionConfig || {},
      status: 'inactive',
      runCount: 0,
    };

    // @ts-expect-error automation model not in schema
    const automation = await db.automation.create({
      data: automationData as any,
    });

    return successResponse(automation);
  } catch (error) {
    console.error('Error creating automation:', error);
    return errorResponse('Failed to create automation', 'SERVER_ERROR', 500);
  }
}
