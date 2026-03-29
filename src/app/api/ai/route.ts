import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, errorResponse, serverErrorResponse } from '../utils/response';

const BASE_SYSTEM_PROMPT = `أنت "بلو"، المساعد الذكي لمنصة بلو برنت لإدارة الاستشارات الهندسية. أنت متخصص في:
- إدارة المشاريع الهندسية (تخطيط، تنفيذ، إشراف)
- الاستشارات الإنشائية والمعمارية
- إدارة العقود والفواتير
- تحليل البيانات المالية للمشاريع
- تقديم نصائح حول أفضل الممارسات الهندسية
- مساعدة في إعداد التقارير والمستندات

أجب بلغة المستخدم. كن محترفاً وموجزاً في إجاباتك. إذا كان السؤال خارج نطاق خبرتك، وضح ذلك بلباقة.`;

async function getProjectContext(orgId: string | undefined): Promise<string> {
  if (!orgId) return '';

  try {
    const projects = await db.project.findMany({
      where: { organizationId: orgId, status: { in: ['PLANNING', 'ACTIVE', 'ON_HOLD'] } },
      select: {
        name: true,
        code: true,
        status: true,
        progress: true,
        budget: true,
        spent: true,
        startDate: true,
        endDate: true,
        client: { select: { name: true } },
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    if (projects.length === 0) return '\n\nلا توجد مشاريع نشطة حالياً.';

    let ctx = '\n\n===== بيانات المشاريع الحالية =====\n';
    for (const p of projects) {
      ctx += `\n- مشروع: ${p.name} (${p.code}) | الحالة: ${p.status} | التقدم: ${p.progress}% | الميزانية: ${p.budget} | المصروف: ${p.spent} | العميل: ${p.client?.name || 'N/A'} | تاريخ البدء: ${p.startDate?.toISOString().split('T')[0]} | تاريخ الانتهاء: ${p.endDate?.toISOString().split('T')[0] || 'غير محدد'}`;
    }
    return ctx;
  } catch {
    return '';
  }
}

async function getMunContext(orgId: string | undefined): Promise<string> {
  if (!orgId) return '';

  try {
    const munPhases = await db.workflowPhase.findMany({
      where: {
        project: { organizationId: orgId },
        phaseType: { in: ['MUN_SUBMISSION', 'MUN_APPROVAL'] },
      },
      include: {
        project: { select: { name: true, code: true } },
        assignedTo: { select: { name: true } },
        interactions: {
          select: {
            interactionType: true,
            content: true,
            responseContent: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 15,
    });

    if (munPhases.length === 0) return '\n\nلا توجد بيانات متعلقة بالبلدية حالياً.';

    let ctx = '\n\n===== بيانات ملاحظات البلدية (MUN Notes) =====\n';
    for (const phase of munPhases) {
      ctx += `\n- مشروع: ${phase.project.name} (${phase.project.code}) | المرحلة: ${phase.phaseType} | الحالة: ${phase.status} | المكلف: ${phase.assignedTo?.name || 'غير محدد'} | تاريخ البدء: ${phase.startDate?.toISOString().split('T')[0] || 'N/A'} | عدد المرات المرفوضة: ${phase.rejectionCount}`;
      if (phase.notes) {
        ctx += ` | ملاحظات: ${phase.notes}`;
      }
      if (phase.interactions.length > 0) {
        ctx += '\n  التفاعلات:';
        for (const inter of phase.interactions) {
          ctx += `\n  - [${inter.interactionType}] ${inter.content}`;
          if (inter.responseContent) {
            ctx += ` → الرد: ${inter.responseContent}`;
          }
        }
      }
    }
    ctx += '\n\nبناءً على هذه البيانات، قدم تحليلاً للملاحظات البلدية واقتراح تحسينات للتعامل معها.';
    return ctx;
  } catch {
    return '';
  }
}

async function getFinancialContext(orgId: string | undefined): Promise<string> {
  if (!orgId) return '';

  try {
    const [projects, invoices, boqItems] = await Promise.all([
      db.project.findMany({
        where: { organizationId: orgId, status: { not: 'CANCELLED' } },
        select: { name: true, code: true, budget: true, spent: true, status: true },
        take: 15,
        orderBy: { updatedAt: 'desc' },
      }),
      db.invoice.findMany({
        where: { organizationId: orgId, status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] } },
        select: { number: true, total: true, paidAmount: true, status: true, dueDate: true, client: { select: { name: true } } },
        take: 10,
        orderBy: { dueDate: 'asc' },
      }),
      db.bOQItem.findMany({
        where: { organizationId: orgId },
        select: { project: { select: { name: true } }, code: true, description: true, unit: true, quantity: true, unitPrice: true, totalPrice: true, category: true },
        take: 20,
        orderBy: { totalPrice: 'desc' },
      }),
    ]);

    const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
    const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);
    const outstandingInvoices = invoices.reduce((s, i) => s + ((i.total || 0) - (i.paidAmount || 0)), 0);
    const totalBoq = boqItems.reduce((s, b) => s + (b.totalPrice || 0), 0);

    let ctx = '\n\n===== الملخص المالي =====\n';
    ctx += `\nإجمالي ميزانية المشاريع: ${totalBudget.toLocaleString()}`;
    ctx += `\nإجمالي المصروفات: ${totalSpent.toLocaleString()}`;
    ctx += `\nنسبة الصرف: ${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%`;
    ctx += `\nإجمالي الفواتير المستحقة: ${outstandingInvoices.toLocaleString()}`;

    if (invoices.length > 0) {
      ctx += '\n\nالفواتير المعلقة:';
      for (const inv of invoices) {
        ctx += `\n- فاتورة ${inv.number} | ${inv.client?.name || 'N/A'} | الإجمالي: ${inv.total} | المدفوع: ${inv.paidAmount} | الحالة: ${inv.status} | الاستحقاق: ${inv.dueDate?.toISOString().split('T')[0]}`;
      }
    }

    if (boqItems.length > 0) {
      ctx += '\n\nأعلى بنود كشف الكميات (BOQ):';
      for (const boq of boqItems.slice(0, 10)) {
        ctx += `\n- [${boq.code}] ${boq.description} | الكمية: ${boq.quantity} ${boq.unit} | سعر الوحدة: ${boq.unitPrice} | الإجمالي: ${boq.totalPrice}`;
      }
    }
    ctx += `\nإجمالي BOQ: ${totalBoq.toLocaleString()}`;

    return ctx;
  } catch {
    return '';
  }
}

async function getOverdueContext(orgId: string | undefined): Promise<string> {
  if (!orgId) return '';

  try {
    const now = new Date();
    const overdueTasks = await db.task.findMany({
      where: {
        organizationId: orgId,
        status: { not: 'DONE' },
        dueDate: { lt: now },
      },
      include: {
        project: { select: { name: true, code: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    if (overdueTasks.length === 0) return '\n\nلا توجد مهام متأخرة حالياً. جميع المهام في وقتها! 👍';

    let ctx = '\n\n===== المهام المتأخرة =====\n';
    ctx += `عدد المهام المتأخرة: ${overdueTasks.length}\n\n`;
    for (const task of overdueTasks) {
      const daysOverdue = Math.ceil((now.getTime() - (task.dueDate?.getTime() || 0)) / (1000 * 60 * 60 * 24));
      ctx += `- [${task.priority}] "${task.title}" | المشروع: ${task.project.name} | المكلف: ${task.assignee?.name || 'غير محدد'} | الحالة: ${task.status} | تاريخ الاستحقاق: ${task.dueDate?.toISOString().split('T')[0]} (${daysOverdue} يوم متأخر)\n`;
    }
    ctx += '\nقدم توصيات لمعالجة هذه المهام المتأخرة.';
    return ctx;
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse('Messages array is required');
    }

    // Try to get orgId from authenticated user for contextual data (auth is optional for AI)
    const user = await getUserFromRequest(request);
    const orgId = user?.organizationId;

    // Build context-specific data if requested
    let contextData = '';
    if (context === 'project') {
      contextData = await getProjectContext(orgId);
    } else if (context === 'mun') {
      contextData = await getMunContext(orgId);
    } else if (context === 'financial') {
      contextData = await getFinancialContext(orgId);
    } else if (context === 'overdue') {
      contextData = await getOverdueContext(orgId);
    }

    // Build the system message
    const existingSystemMsg = messages.find((m: { role: string }) => m.role === 'system');
    let systemContent = existingSystemMsg?.content || BASE_SYSTEM_PROMPT;

    if (contextData) {
      systemContent += contextData;
    }

    const formattedMessages = [
      { role: 'system' as const, content: systemContent },
      ...messages
        .filter((m: { role: string }) => m.role !== 'system')
        .map((msg: { role: string; content: string }) => ({
          role: msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'system',
          content: msg.content,
        })),
    ];

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    const messageContent = completion.choices[0]?.message?.content || '';

    return successResponse({ message: messageContent });
  } catch (error) {
    console.error('AI Chat error:', error);
    return serverErrorResponse('Failed to generate response');
  }
}
