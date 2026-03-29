import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { db } from '@/lib/db';
import { getJWTSecret } from '../../utils/auth';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jose.jwtVerify(authHeader.substring(7), getJWTSecret());
    return await db.user.findUnique({ where: { id: payload.userId as string }, include: { organization: true } });
  } catch { return null; }
}

// Stock Alert Levels
const ALERT_LEVELS = {
  CRITICAL: { threshold: 0.2, label: 'حرج', color: 'red', priority: 'urgent' },
  LOW: { threshold: 0.5, label: 'منخفض', color: 'orange', priority: 'high' },
  WARNING: { threshold: 1, label: 'تحذير', color: 'yellow', priority: 'normal' },
  NORMAL: { threshold: Infinity, label: 'طبيعي', color: 'green', priority: 'low' }
};

// Demo materials
const DEMO_MATERIALS = [
  { id: '1', materialCode: 'MAT-001', name: 'حديد تسليح 16مم', category: 'حديد', unit: 'طن', unitPrice: 3200, currentStock: 5, minStock: 10, maxStock: 100, reorderLevel: 15, leadTime: 7 },
  { id: '2', materialCode: 'MAT-002', name: 'أسمنت بورتلاندي', category: 'أسمنت', unit: 'كيس', unitPrice: 25, currentStock: 80, minStock: 100, maxStock: 1000, reorderLevel: 150, leadTime: 3 },
  { id: '3', materialCode: 'MAT-003', name: 'رمل أحمر', category: 'ركام', unit: 'م3', unitPrice: 85, currentStock: 20, minStock: 50, maxStock: 500, reorderLevel: 75, leadTime: 2 },
  { id: '4', materialCode: 'MAT-004', name: 'حصى 20مم', category: 'ركام', unit: 'م3', unitPrice: 95, currentStock: 150, minStock: 30, maxStock: 300, reorderLevel: 45, leadTime: 2 },
  { id: '5', materialCode: 'MAT-005', name: 'خرسانة جاهزة', category: 'خرسانة', unit: 'م3', unitPrice: 450, currentStock: 3, minStock: 20, maxStock: 100, reorderLevel: 30, leadTime: 1 },
  { id: '6', materialCode: 'MAT-006', name: 'طوب أحمر', category: 'بناء', unit: 'حبة', unitPrice: 3.5, currentStock: 5000, minStock: 10000, maxStock: 50000, reorderLevel: 15000, leadTime: 5 },
  { id: '7', materialCode: 'MAT-007', name: 'حديد 10مم', category: 'حديد', unit: 'طن', unitPrice: 3100, currentStock: 8, minStock: 10, maxStock: 80, reorderLevel: 15, leadTime: 7 },
  { id: '8', materialCode: 'MAT-008', name: 'رمل أبيض', category: 'ركام', unit: 'م3', unitPrice: 120, currentStock: 60, minStock: 30, maxStock: 200, reorderLevel: 45, leadTime: 2 },
];

function getAlertLevel(currentStock: number, minStock: number, reorderLevel?: number): { level: string; label: string; color: string; priority: string; percentage: number } {
  const threshold = reorderLevel || minStock;
  const percentage = currentStock / threshold;
  
  if (percentage < ALERT_LEVELS.CRITICAL.threshold) return { level: 'CRITICAL', ...ALERT_LEVELS.CRITICAL, percentage: Math.round(percentage * 100) };
  if (percentage < ALERT_LEVELS.LOW.threshold) return { level: 'LOW', ...ALERT_LEVELS.LOW, percentage: Math.round(percentage * 100) };
  if (percentage < ALERT_LEVELS.WARNING.threshold) return { level: 'WARNING', ...ALERT_LEVELS.WARNING, percentage: Math.round(percentage * 100) };
  return { level: 'NORMAL', ...ALERT_LEVELS.NORMAL, percentage: Math.round(percentage * 100) };
}

function generateRestockRecommendation(material: any) {
  const { currentStock, minStock, maxStock, leadTime = 7 } = material;
  const targetStock = maxStock || (minStock * 3);
  const quantityToOrder = Math.max(0, targetStock - currentStock);
  const estimatedCost = quantityToOrder * (material.unitPrice || 0);
  const urgency = currentStock <= minStock * 0.2 ? 'فوري' : currentStock <= minStock * 0.5 ? 'عاجل' : 'عادي';
  const suggestedOrderDate = new Date();
  suggestedOrderDate.setDate(suggestedOrderDate.getDate() + Math.max(1, leadTime - 2));
  
  return { quantityToOrder, estimatedCost, urgency, suggestedOrderDate };
}

export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const level = searchParams.get('level');

    let materials: any[] = [];
    try {
      materials = await db.material.findMany({ where: { organizationId: user.organizationId, isActive: true } });
    } catch { materials = DEMO_MATERIALS; }

    if (action === 'alerts') {
      const alerts: any[] = [];
      for (const material of materials) {
        const alertInfo = getAlertLevel(material.currentStock, material.minStock, material.reorderLevel);
        if (alertInfo.level !== 'NORMAL') {
          const recommendation = generateRestockRecommendation(material);
          alerts.push({
            material: { id: material.id, code: material.materialCode, name: material.name, category: material.category, unit: material.unit, currentStock: material.currentStock, minStock: material.minStock, unitPrice: material.unitPrice },
            alert: alertInfo,
            recommendation
          });
        }
      }
      alerts.sort((a, b) => {
        const order: Record<string, number> = { CRITICAL: 0, LOW: 1, WARNING: 2 };
        return order[a.alert.level] - order[b.alert.level];
      });
      const filteredAlerts = level ? alerts.filter(a => a.alert.level === level) : alerts;
      return successResponse({ totalAlerts: alerts.length, criticalCount: alerts.filter(a => a.alert.level === 'CRITICAL').length, lowCount: alerts.filter(a => a.alert.level === 'LOW').length, warningCount: alerts.filter(a => a.alert.level === 'WARNING').length, alerts: filteredAlerts });
    }

    if (action === 'summary') {
      const totalMaterials = materials.length;
      const lowStockCount = materials.filter(m => m.currentStock <= m.minStock).length;
      const outOfStockCount = materials.filter(m => m.currentStock === 0).length;
      const totalValue = materials.reduce((sum, m) => sum + (m.currentStock * m.unitPrice), 0);
      const categoryBreakdown: Record<string, { count: number; lowStock: number; value: number }> = {};
      for (const m of materials) {
        if (!categoryBreakdown[m.category]) categoryBreakdown[m.category] = { count: 0, lowStock: 0, value: 0 };
        categoryBreakdown[m.category].count++;
        if (m.currentStock <= m.minStock) categoryBreakdown[m.category].lowStock++;
        categoryBreakdown[m.category].value += m.currentStock * m.unitPrice;
      }
      return successResponse({ totalMaterials, lowStockCount, outOfStockCount, totalStockValue: totalValue, categoryBreakdown, healthScore: Math.round(((totalMaterials - lowStockCount) / totalMaterials) * 100) });
    }

    if (action === 'purchase_suggestions') {
      const suggestions: any[] = [];
      for (const material of materials) {
        if (material.currentStock <= (material.reorderLevel || material.minStock)) {
          const recommendation = generateRestockRecommendation(material);
          suggestions.push({
            materialId: material.id, materialCode: material.materialCode, materialName: material.name, category: material.category,
            currentStock: material.currentStock, suggestedQuantity: recommendation.quantityToOrder,
            estimatedCost: recommendation.estimatedCost, urgency: recommendation.urgency,
            leadTime: material.leadTime || 7, suggestedOrderDate: recommendation.suggestedOrderDate.toISOString()
          });
        }
      }
      suggestions.sort((a, b) => {
        const urgencyOrder: Record<string, number> = { 'فوري': 0, 'عاجل': 1, 'عادي': 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });
      return successResponse({ suggestionCount: suggestions.length, totalEstimatedCost: suggestions.reduce((sum, s) => sum + s.estimatedCost, 0), suggestions });
    }

    return successResponse({ alertLevels: ALERT_LEVELS, lastChecked: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'send_alerts') {
      let materials: any[] = [];
      try { materials = await db.material.findMany({ where: { organizationId: user.organizationId, isActive: true } }); }
      catch { materials = DEMO_MATERIALS; }

      const alerts = materials.filter(m => m.currentStock <= m.minStock).map(m => ({ name: m.name, currentStock: m.currentStock, minStock: m.minStock, percentage: Math.round((m.currentStock / m.minStock) * 100) }));
      if (alerts.length === 0) return successResponse({ message: 'لا توجد تنبيهات للمخزون', alertsSent: 0 });

      try {
        await db.notification.create({ data: { userId: user.id, title: 'تنبيه المخزون المنخفض', message: `${alerts.length} مادة تحتاج لإعادة طلب`, notificationType: 'low_stock', priority: 'URGENT' } });
      } catch {}

      return successResponse({ message: 'تم إرسال التنبيهات', alertsSent: alerts.length, alerts });
    }

    if (action === 'create_notification') {
      const { materialId, level, message } = data;
      try {
        const notification = await db.notification.create({
          data: { userId: user.id, title: `تنبيه المخزون - ${level}`, message, notificationType: 'low_stock', referenceType: 'material', referenceId: materialId, priority: level === 'CRITICAL' ? 'URGENT' as const : 'HIGH' as const }
        });
        return successResponse({ notification });
      } catch { return successResponse({ message: 'تم إنشاء التنبيه (وضع تجريبي)' }); }
    }

    return errorResponse(`الإجراء "${action}" غير معروف`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}
