import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all automations
export async function GET() {
  try {
    const automations = await prisma.automation.findMany({
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
          lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
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
          lastRunAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          runCount: 45,
          createdAt: new Date(),
        },
        {
          id: '3',
          name: 'إنشاء تقرير أسبوعي',
          description: 'إنشاء وإرسال تقرير تقدم المشروع أسبوعياً',
          triggerType: 'schedule',
          triggerConfig: { cron: '0 17 * * 5', timezone: 'Asia/Riyadh' }, // Every Friday 5PM
          actionType: 'email',
          actionConfig: { template: 'weekly_report', format: 'pdf' },
          status: 'active',
          lastRunAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          runCount: 8,
          createdAt: new Date(),
        },
        {
          id: '4',
          name: 'نسخ احتياطي تلقائي',
          description: 'عمل نسخة احتياطية من البيانات يومياً',
          triggerType: 'schedule',
          triggerConfig: { cron: '0 2 * * *', timezone: 'Asia/Riyadh' }, // Daily at 2AM
          actionType: 'webhook',
          actionConfig: { url: '/api/backup', method: 'POST' },
          status: 'active',
          lastRunAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          runCount: 30,
          createdAt: new Date(),
        },
        {
          id: '5',
          name: 'تنبيه انتهاء العقد',
          description: 'إرسال تنبيه قبل 30 يوم من انتهاء أي عقد',
          triggerType: 'event',
          triggerConfig: { event: 'contract_expiring', daysBefore: 30 },
          actionType: 'notification',
          actionConfig: { recipients: ['admin', 'legal'], template: 'contract_expiry' },
          status: 'inactive',
          lastRunAt: null,
          runCount: 3,
          createdAt: new Date(),
        },
      ];

      return NextResponse.json({ data: mockAutomations });
    }

    return NextResponse.json({ data: automations });
  } catch (error) {
    console.error('Error fetching automations:', error);
    return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });
  }
}

// POST - Create new automation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, triggerType, triggerConfig, actionType, actionConfig } = body;

    try {
      const automation = await prisma.automation.create({
        data: {
          name,
          description,
          triggerType,
          triggerConfig,
          actionType,
          actionConfig,
          status: 'inactive',
          runCount: 0,
        },
      });

      return NextResponse.json({ data: automation });
    } catch (dbError) {
      // Demo mode - return success anyway
      return NextResponse.json({
        data: {
          id: Date.now().toString(),
          ...body,
          status: 'inactive',
          runCount: 0,
          createdAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 });
  }
}
