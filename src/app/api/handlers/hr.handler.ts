import { NextResponse } from 'next/server';
import { HandlerContext, ApiSuccessResponse, ApiErrorResponse } from '../types';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '../utils/response';
import { getDb } from '../utils/db';
import { canApproveLeave } from '../utils/auth';

/**
 * GET handlers for HR actions
 */
export const getHandlers = {
  /**
   * Get leave requests
   */
  'leave-requests': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const leaveStatus = context.searchParams.get('status');
    const database = await getDb();
    if (!database) return successResponse([]);
    
    const leaveRequests: any[] = await database.leaveRequest.findMany({
      where: { 
        ...(leaveStatus && { status: leaveStatus }),
        user: { organizationId: context.user.organizationId }
      },
      include: { 
        user: { select: { id: true, fullName: true, username: true } },
        approver: { select: { id: true, fullName: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return successResponse(leaveRequests.map((l: any) => ({
      id: l.id,
      userId: l.userId,
      userName: l.user?.fullName || l.user?.username,
      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      daysCount: l.daysCount,
      reason: l.reason,
      status: l.status,
      approver: l.approver?.fullName || l.approver?.username,
      approvedAt: l.approvedAt,
      rejectionReason: l.rejectionReason,
      createdAt: l.createdAt
    })));
  },

  /**
   * Get attendance records
   */
  attendance: async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const attUserId = context.searchParams.get('userId');
    const startDate = context.searchParams.get('startDate');
    const endDate = context.searchParams.get('endDate');
    
    const attendanceWhere: Record<string, unknown> = {
      user: { organizationId: context.user.organizationId }
    };
    if (attUserId) attendanceWhere.userId = attUserId;
    if (startDate && endDate) {
      attendanceWhere.date = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      attendanceWhere.date = { gte: new Date(startDate) };
    } else if (endDate) {
      attendanceWhere.date = { lte: new Date(endDate) };
    }
    
    const database = await getDb();
    if (!database) return successResponse([]);
    
    const attendance: any[] = await database.attendance.findMany({
      where: attendanceWhere,
      include: { user: true },
      orderBy: { date: 'desc' }
    });
    
    return successResponse(attendance.map((a: any) => ({
      id: a.id,
      userId: a.userId,
      userName: a.user?.fullName || a.user?.username,
      date: a.date,
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      status: a.status,
      workHours: a.workHours,
      overtimeHours: a.overtimeHours
    })));
  }
};

/**
 * POST handlers for HR actions
 */
export const postHandlers = {
  /**
   * Create leave request
   */
  'leave-request': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { leaveType, startDate, endDate, reason } = (context.body || {}) as Record<string, unknown>;
    if (!leaveType || !startDate || !endDate) {
      return errorResponse('نوع الإجازة والتواريخ مطلوبة');
    }

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    const daysCount = Math.ceil((new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest: any = await database.leaveRequest.create({
      data: {
        userId: context.user.id,
        leaveType: leaveType as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        daysCount,
        reason: reason as string
      }
    });

    // Notify admins in the same organization
    const admins: any[] = await database.user.findMany({ 
      where: { role: 'admin', organizationId: context.user.organizationId } 
    });
    for (const admin of admins) {
      await database.notification.create({
        data: {
          userId: admin.id,
          title: 'طلب إجازة جديد',
          message: `طلب إجازة ${leaveType} من ${context.user.fullName || context.user.username}`,
          notificationType: 'approval',
          referenceType: 'leave',
          referenceId: leaveRequest.id
        }
      });
    }

    return successResponse({ id: leaveRequest.id });
  }
};

/**
 * PUT handlers for HR actions
 */
export const putHandlers = {
  /**
   * Approve/reject leave request
   */
  'leave-approve': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    if (!canApproveLeave(context.user)) return forbiddenResponse();
    
    const { id, approve, rejectionReason } = (context.body || {}) as Record<string, unknown>;
    if (!id) return errorResponse('معرف الطلب مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify leave request belongs to user's organization
    const leaveRequest = await database.leaveRequest.findFirst({
      where: { id: id as string, user: { organizationId: context.user.organizationId } }
    });
    if (!leaveRequest) return notFoundResponse('طلب الإجازة غير موجود');

    await database.leaveRequest.update({
      where: { id: id as string },
      data: {
        status: approve ? 'approved' : 'rejected',
        approvedById: approve ? context.user.id : null,
        approvedAt: approve ? new Date() : null,
        rejectionReason: approve ? null : (rejectionReason as string)
      }
    });
    return successResponse(true);
  }
};
