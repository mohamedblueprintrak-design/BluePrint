import { NextResponse } from 'next/server';
import { HandlerContext, ApiSuccessResponse, ApiErrorResponse } from '../types';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response';
import { getDb } from '../utils/db';

/** BOQ item row from database */
interface BOQItemRow {
  id: string;
  projectId: string;
  itemNumber?: unknown;
  description?: unknown;
  unit?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
  totalPrice?: unknown;
  category?: unknown;
  notes?: unknown;
  createdAt: unknown;
}

/** Purchase order row with supplier relation */
interface PurchaseOrderRow {
  id: string;
  poNumber: string;
  supplierId?: unknown;
  supplier?: { name?: string } | null;
  projectId?: unknown;
  orderDate?: unknown;
  expectedDate?: unknown;
  items?: string | null;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  status?: string;
  notes?: unknown;
  createdAt: unknown;
}

/** Budget row from database */
interface BudgetRow {
  id: string;
  projectId: string;
  category?: unknown;
  description?: unknown;
  budgetAmount?: number;
  actualAmount?: number;
  variance?: number;
  createdAt: unknown;
}

/** Defect row from database */
interface DefectRow {
  id: string;
  projectId: string;
  title?: unknown;
  description?: unknown;
  severity?: unknown;
  status?: string;
  location?: unknown;
  imageId?: unknown;
  assignedTo?: unknown;
  resolvedAt?: unknown;
  resolutionNotes?: unknown;
  createdAt: unknown;
}

/**
 * GET handlers for inventory actions
 */
export const getHandlers = {
  /**
   * Get BOQ items for a project
   */
  'boq-items': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const projectId = context.searchParams.get('projectId');
    if (!projectId) return errorResponse('معرف المشروع مطلوب');
    
    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify project belongs to user's organization
    const boqProject = await database.project.findFirst({
      where: { id: projectId, organizationId: context.user.organizationId }
    });
    if (!boqProject) return notFoundResponse('المشروع غير موجود');
    
    const boqItems = await database.bOQItem.findMany({
      where: { projectId },
      orderBy: { itemNumber: 'asc' }
    });
    
    return successResponse(boqItems.map((item: BOQItemRow) => ({
      id: item.id,
      projectId: item.projectId,
      itemNumber: item.itemNumber,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      category: item.category,
      notes: item.notes,
      createdAt: item.createdAt
    })));
  },

  /**
   * Get purchase orders
   */
  'purchase-orders': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const database = await getDb();
    if (!database) return successResponse([]);
    
    const purchaseOrders = await database.purchaseOrder.findMany({
      where: { 
        supplier: { organizationId: context.user.organizationId } 
      },
      include: { supplier: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return successResponse(purchaseOrders.map((po: PurchaseOrderRow) => ({
      id: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplier: po.supplier?.name,
      projectId: po.projectId,
      orderDate: po.orderDate,
      expectedDate: po.expectedDate,
      items: po.items ? JSON.parse(po.items) : [],
      subtotal: po.subtotal,
      taxAmount: po.taxAmount,
      total: po.total,
      status: po.status,
      notes: po.notes,
      createdAt: po.createdAt
    })));
  },

  /**
   * Get budgets for a project
   */
  budgets: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const projectId = context.searchParams.get('projectId');
    if (!projectId) return errorResponse('معرف المشروع مطلوب');
    
    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify project belongs to user's organization
    const budgetProject = await database.project.findFirst({
      where: { id: projectId, organizationId: context.user.organizationId }
    });
    if (!budgetProject) return notFoundResponse('المشروع غير موجود');
    
    const budgets = await database.budget.findMany({
      where: { projectId },
      orderBy: { category: 'asc' }
    });
    
    return successResponse(budgets.map((b: BudgetRow) => ({
      id: b.id,
      projectId: b.projectId,
      category: b.category,
      description: b.description,
      budgetAmount: b.budgetAmount,
      actualAmount: b.actualAmount,
      variance: b.variance,
      createdAt: b.createdAt
    })));
  },

  /**
   * Get defects for a project
   */
  defects: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const projectId = context.searchParams.get('projectId');
    if (!projectId) return errorResponse('معرف المشروع مطلوب');
    
    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify project belongs to user's organization
    const defectProject = await database.project.findFirst({
      where: { id: projectId, organizationId: context.user.organizationId }
    });
    if (!defectProject) return notFoundResponse('المشروع غير موجود');
    
    const defects = await database.defect.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
    
    return successResponse(defects.map((d: DefectRow) => ({
      id: d.id,
      projectId: d.projectId,
      title: d.title,
      description: d.description,
      severity: d.severity,
      status: d.status,
      location: d.location,
      imageId: d.imageId,
      assignedTo: d.assignedTo,
      resolvedAt: d.resolvedAt,
      resolutionNotes: d.resolutionNotes,
      createdAt: d.createdAt
    })));
  }
};

/**
 * POST handlers for inventory actions
 */
export const postHandlers = {
  /**
   * Create BOQ item
   */
  'boq-item': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { projectId, itemNumber, description, unit, quantity, unitPrice, totalPrice, category, notes } = (context.body || {}) as Record<string, unknown>;
    if (!projectId || !description) {
      return errorResponse('المشروع والوصف مطلوبان');
    }

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify project belongs to user's organization
    const boqProject = await database.project.findFirst({
      where: { id: projectId as string, organizationId: context.user.organizationId }
    });
    if (!boqProject) return notFoundResponse('المشروع غير موجود');

    const boqItem = await database.bOQItem.create({
      data: {
        projectId: projectId as string,
        itemNumber: itemNumber as string,
        description: description as string,
        unit: unit as string,
        quantity: quantity ? parseFloat(quantity as string) : 0,
        unitPrice: unitPrice ? parseFloat(unitPrice as string) : 0,
        totalPrice: totalPrice ? parseFloat(totalPrice as string) : 0,
        category: category as string,
        notes: notes as string
      }
    });

    return successResponse({ id: boqItem.id, itemNumber: boqItem.itemNumber });
  },

  /**
   * Create purchase order
   */
  'purchase-order': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { supplierId, projectId, orderDate, expectedDate, items, subtotal, taxAmount, total, notes } = (context.body || {}) as Record<string, unknown>;
    
    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify supplier belongs to user's organization
    if (supplierId) {
      const poSupplier = await database.supplier.findFirst({
        where: { id: supplierId as string, organizationId: context.user.organizationId }
      });
      if (!poSupplier) return notFoundResponse('المورد غير موجود');
    }

    // Generate PO number
    const count = await database.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const purchaseOrder = await database.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: supplierId as string,
        projectId: projectId as string,
        orderDate: orderDate ? new Date(orderDate as string) : new Date(),
        expectedDate: expectedDate ? new Date(expectedDate as string) : null,
        items: items ? JSON.stringify(items) : null,
        subtotal: (subtotal as number) || 0,
        taxAmount: (taxAmount as number) || 0,
        total: (total as number) || 0,
        notes: notes as string,
        createdById: context.user.id
      }
    });

    return successResponse({ id: purchaseOrder.id, poNumber });
  },

  /**
   * Create budget
   */
  budget: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { projectId, category, description, budgetAmount, actualAmount } = (context.body || {}) as Record<string, unknown>;
    if (!projectId || !category) {
      return errorResponse('المشروع والفئة مطلوبان');
    }

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify project belongs to user's organization
    const budgetProject = await database.project.findFirst({
      where: { id: projectId as string, organizationId: context.user.organizationId }
    });
    if (!budgetProject) return notFoundResponse('المشروع غير موجود');

    const budget = await database.budget.create({
      data: {
        projectId: projectId as string,
        category: category as string,
        description: description as string,
        budgetAmount: budgetAmount ? parseFloat(budgetAmount as string) : 0,
        actualAmount: actualAmount ? parseFloat(actualAmount as string) : 0,
        variance: ((budgetAmount as number) || 0) - ((actualAmount as number) || 0)
      }
    });

    return successResponse({ id: budget.id, category: budget.category });
  },

  /**
   * Create defect
   */
  defect: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { projectId, title, description, severity, status, location, assignedTo } = (context.body || {}) as Record<string, unknown>;
    if (!projectId || !title) {
      return errorResponse('المشروع والعنوان مطلوبان');
    }

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify project belongs to user's organization
    const defectProject = await database.project.findFirst({
      where: { id: projectId as string, organizationId: context.user.organizationId }
    });
    if (!defectProject) return notFoundResponse('المشروع غير موجود');

    const defect = await database.defect.create({
      data: {
        projectId: projectId as string,
        title: title as string,
        description: description as string,
        severity: (severity as string) || 'medium',
        status: (status as string) || 'Open',
        location: location as string,
        assignedTo: assignedTo as string
      }
    });

    // Notify assigned user if any
    if (assignedTo) {
      await database.notification.create({
        data: {
          userId: assignedTo as string,
          title: 'عيب جديد تم تعيينه',
          message: `تم تعيين عيب: ${title}`,
          notificationType: 'defect',
          referenceType: 'defect',
          referenceId: defect.id
        }
      });
    }

    return successResponse({ id: defect.id, title: defect.title });
  }
};

/**
 * PUT handlers for inventory actions
 */
export const putHandlers = {
  /**
   * Update BOQ item
   */
  'boq-item': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const body = (context.body || {}) as Record<string, unknown>;
    const { id, ...data } = body;
    if (!id) return errorResponse('معرف بند جدول الكميات مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify BOQItem belongs to user's organization through project
    const boqItem = await database.bOQItem.findFirst({
      where: { id: id as string, project: { organizationId: context.user.organizationId } }
    });
    if (!boqItem) return notFoundResponse('البند غير موجود');

    // Calculate total price if quantity and unit price are provided
    if (data.quantity !== undefined && data.unitPrice !== undefined) {
      data.totalPrice = parseFloat(data.quantity as string) * parseFloat(data.unitPrice as string);
    }

    await database.bOQItem.update({ where: { id: id as string }, data });
    return successResponse(true);
  },

  /**
   * Update purchase order
   */
  'purchase-order': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const body = (context.body || {}) as Record<string, unknown>;
    const { id, ...data } = body;
    if (!id) return errorResponse('معرف أمر الشراء مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify PurchaseOrder belongs to user's organization through supplier
    const purchaseOrder = await database.purchaseOrder.findFirst({
      where: { id: id as string, supplier: { organizationId: context.user.organizationId } }
    });
    if (!purchaseOrder) return notFoundResponse('أمر الشراء غير موجود');

    if (data.items) {
      data.items = JSON.stringify(data.items);
    }

    await database.purchaseOrder.update({ where: { id: id as string }, data });
    return successResponse(true);
  },

  /**
   * Update purchase order status
   */
  'purchase-order-status': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { id, status } = (context.body || {}) as Record<string, unknown>;
    if (!id || !status) return errorResponse('المعرف والحالة مطلوبان');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify PurchaseOrder belongs to user's organization
    const purchaseOrder = await database.purchaseOrder.findFirst({
      where: { id: id as string, supplier: { organizationId: context.user.organizationId } }
    });
    if (!purchaseOrder) return notFoundResponse('أمر الشراء غير موجود');

    await database.purchaseOrder.update({ where: { id: id as string }, data: { status: status as string } });
    return successResponse(true);
  },

  /**
   * Update budget
   */
  budget: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const body = (context.body || {}) as Record<string, unknown>;
    const { id, ...data } = body;
    if (!id) return errorResponse('معرف الميزانية مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify budget belongs to user's organization through project
    const budget: BudgetRow | null = await database.budget.findFirst({
      where: { id: id as string, project: { organizationId: context.user.organizationId } }
    });
    if (!budget) return notFoundResponse('الميزانية غير موجودة');

    // Calculate variance if amounts are provided
    if (data.budgetAmount !== undefined || data.actualAmount !== undefined) {
      const budgetAmount = data.budgetAmount !== undefined ? parseFloat(data.budgetAmount as string) : budget.budgetAmount;
      const actualAmount = data.actualAmount !== undefined ? parseFloat(data.actualAmount as string) : budget.actualAmount;
      data.variance = (budgetAmount || 0) - (actualAmount || 0);
    }

    await database.budget.update({ where: { id: id as string }, data });
    return successResponse(true);
  },

  /**
   * Update defect
   */
  defect: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const body = (context.body || {}) as Record<string, unknown>;
    const { id, ...data } = body;
    if (!id) return errorResponse('معرف العيب مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify defect belongs to user's organization through project
    const defect = await database.defect.findFirst({
      where: { id: id as string, project: { organizationId: context.user.organizationId } }
    });
    if (!defect) return notFoundResponse('العيب غير موجود');

    await database.defect.update({ where: { id: id as string }, data });
    return successResponse(true);
  },

  /**
   * Resolve defect
   */
  'defect-resolve': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { id, resolutionNotes } = (context.body || {}) as Record<string, unknown>;
    if (!id) return errorResponse('معرف العيب مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify defect belongs to user's organization
    const defect = await database.defect.findFirst({
      where: { id: id as string, project: { organizationId: context.user.organizationId } }
    });
    if (!defect) return notFoundResponse('العيب غير موجود');

    await database.defect.update({
      where: { id: id as string },
      data: {
        status: 'Closed',
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes as string
      }
    });
    return successResponse(true);
  }
};

/**
 * DELETE handlers for inventory actions
 */
export const deleteHandlers = {
  /**
   * Delete BOQ item
   */
  'boq-item': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف بند جدول الكميات مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify BOQItem belongs to user's organization
    const boqItem = await database.bOQItem.findFirst({
      where: { id, project: { organizationId: context.user.organizationId } }
    });
    if (!boqItem) return notFoundResponse('البند غير موجود');
    
    await database.bOQItem.delete({ where: { id } });
    return successResponse(true);
  },

  /**
   * Delete purchase order
   */
  'purchase-order': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف أمر الشراء مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify PurchaseOrder belongs to user's organization
    const purchaseOrder = await database.purchaseOrder.findFirst({
      where: { id, supplier: { organizationId: context.user.organizationId } }
    });
    if (!purchaseOrder) return notFoundResponse('أمر الشراء غير موجود');
    
    await database.purchaseOrder.delete({ where: { id } });
    return successResponse(true);
  },

  /**
   * Delete budget
   */
  budget: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف الميزانية مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify budget belongs to user's organization
    const budget = await database.budget.findFirst({
      where: { id, project: { organizationId: context.user.organizationId } }
    });
    if (!budget) return notFoundResponse('الميزانية غير موجودة');
    
    await database.budget.delete({ where: { id } });
    return successResponse(true);
  },

  /**
   * Delete defect
   */
  defect: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف العيب مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify defect belongs to user's organization
    const defect = await database.defect.findFirst({
      where: { id, project: { organizationId: context.user.organizationId } }
    });
    if (!defect) return notFoundResponse('العيب غير موجود');
    
    await database.defect.delete({ where: { id } });
    return successResponse(true);
  }
};
