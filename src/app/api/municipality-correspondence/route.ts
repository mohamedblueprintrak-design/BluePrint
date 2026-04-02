import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest, isDemoUser } from '../utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from '../utils/response';

// المراسلات البلدية - Municipality Correspondence
// تتبع التفاعلات مع البلديات على مدار الوقت

// Valid correspondence types
const VALID_CORRESPONDENCE_TYPES = [
  'SUBMISSION',   // تقديم / Submission to municipality
  'RESPONSE',     // رد / Response from municipality
  'REJECTION',    // رفض / Rejection from municipality
  'APPROVAL',     // موافقة / Approval from municipality
  'INQUIRY',      // استفسار / Inquiry
  'AMENDMENT',    // تعديل / Amendment
];

// Valid status values
const VALID_STATUSES = [
  'PENDING',             // قيد الانتظار
  'UNDER_REVIEW',        // قيد المراجعة
  'APPROVED',            // تمت الموافقة
  'REJECTED',            // مرفوض
  'AMENDMENT_REQUIRED',  // يتطلب تعديل
];

// ============================================
// GET /api/municipality-correspondence?projectId=xxx
// List municipality correspondence records for a project
// ============================================

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: Record<string, unknown> = {
      project: { organizationId: user.organizationId },
    };

    if (projectId) where.projectId = projectId;
    if (status && VALID_STATUSES.includes(status)) where.status = status;
    if (type && VALID_CORRESPONDENCE_TYPES.includes(type)) where.correspondenceType = type;
    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.submissionDate = dateFilter;
    }

    const records = await db.municipalityCorrespondence.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, fullName: true, avatar: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { submissionDate: 'desc' },
    });

    return successResponse({ correspondence: records });
  } catch (error) {
    console.error('MunicipalityCorrespondence GET error:', error);
    return serverErrorResponse();
  }
}

// ============================================
// POST /api/municipality-correspondence
// Create a new municipality correspondence record
// ============================================

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    // Demo mode - cannot create records
    if (isDemoUser(user.id)) {
      return errorResponse('لا يمكن إنشاء مراسلات في الوضع التجريبي', 'DEMO_MODE', 403);
    }

    const body = await request.json();
    const {
      projectId,
      correspondenceType,
      referenceNumber,
      submissionDate,
      responseDate,
      subject,
      content,
      notes,
      status,
      attachments,
      responseNotes,
    } = body;

    // Validate required fields
    if (!projectId) {
      return errorResponse('projectId is required / projectId مطلوب');
    }

    if (!correspondenceType || !VALID_CORRESPONDENCE_TYPES.includes(correspondenceType)) {
      return errorResponse(
        `Invalid correspondenceType. Must be one of: ${VALID_CORRESPONDENCE_TYPES.join(', ')}`
      );
    }

    // Verify project belongs to user's organization
    const project = await db.project.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
      select: { id: true },
    });

    if (!project) {
      return notFoundResponse('المشروع غير موجود / Project not found');
    }

    const record = await db.municipalityCorrespondence.create({
      data: {
        projectId,
        correspondenceType,
        referenceNumber: referenceNumber || null,
        submissionDate: submissionDate ? new Date(submissionDate) : new Date(),
        responseDate: responseDate ? new Date(responseDate) : null,
        subject: subject || null,
        content: content || null,
        notes: notes || null,
        status: status && VALID_STATUSES.includes(status) ? status : 'PENDING',
        attachments: attachments || null,
        responseNotes: responseNotes || null,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, avatar: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return successResponse({ correspondence: record }, undefined);
  } catch (error) {
    console.error('MunicipalityCorrespondence POST error:', error);
    return serverErrorResponse();
  }
}

// ============================================
// PUT /api/municipality-correspondence
// Update a municipality correspondence record
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    // Demo mode - cannot update records
    if (isDemoUser(user.id)) {
      return errorResponse('لا يمكن تحديث المراسلات في الوضع التجريبي', 'DEMO_MODE', 403);
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return errorResponse('id is required / id مطلوب');
    }

    // Verify correspondence belongs to user's organization
    const existingRecord = await db.municipalityCorrespondence.findUnique({
      where: { id },
      include: {
        project: { select: { organizationId: true } },
      },
    });

    if (!existingRecord || existingRecord.project.organizationId !== user.organizationId) {
      return notFoundResponse('المراسلة غير موجودة / Correspondence not found');
    }

    // Build update data with validation
    const updateData: Record<string, unknown> = {};

    if (updateFields.correspondenceType !== undefined) {
      if (!VALID_CORRESPONDENCE_TYPES.includes(updateFields.correspondenceType)) {
        return errorResponse(
          `Invalid correspondenceType. Must be one of: ${VALID_CORRESPONDENCE_TYPES.join(', ')}`
        );
      }
      updateData.correspondenceType = updateFields.correspondenceType;
    }

    if (updateFields.referenceNumber !== undefined) {
      updateData.referenceNumber = updateFields.referenceNumber;
    }

    if (updateFields.submissionDate !== undefined) {
      updateData.submissionDate = updateFields.submissionDate ? new Date(updateFields.submissionDate) : null;
    }

    if (updateFields.responseDate !== undefined) {
      updateData.responseDate = updateFields.responseDate ? new Date(updateFields.responseDate) : null;
    }

    if (updateFields.subject !== undefined) {
      updateData.subject = updateFields.subject;
    }

    if (updateFields.content !== undefined) {
      updateData.content = updateFields.content;
    }

    if (updateFields.notes !== undefined) {
      updateData.notes = updateFields.notes;
    }

    if (updateFields.status !== undefined) {
      if (!VALID_STATUSES.includes(updateFields.status)) {
        return errorResponse(
          `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        );
      }
      updateData.status = updateFields.status;
    }

    if (updateFields.attachments !== undefined) {
      updateData.attachments = updateFields.attachments;
    }

    if (updateFields.responseNotes !== undefined) {
      updateData.responseNotes = updateFields.responseNotes;
    }

    const updatedRecord = await db.municipalityCorrespondence.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, fullName: true, avatar: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return successResponse({ correspondence: updatedRecord });
  } catch (error) {
    console.error('MunicipalityCorrespondence PUT error:', error);
    return serverErrorResponse();
  }
}

// ============================================
// DELETE /api/municipality-correspondence?id=xxx
// Delete a municipality correspondence record
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.organizationId) {
      return unauthorizedResponse();
    }

    // Demo mode - cannot delete records
    if (isDemoUser(user.id)) {
      return errorResponse('لا يمكن حذف المراسلات في الوضع التجريبي', 'DEMO_MODE', 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('id is required / id مطلوب');
    }

    // Verify correspondence belongs to user's organization
    const existingRecord = await db.municipalityCorrespondence.findUnique({
      where: { id },
      include: {
        project: { select: { organizationId: true } },
      },
    });

    if (!existingRecord || existingRecord.project.organizationId !== user.organizationId) {
      return notFoundResponse('المراسلة غير موجودة / Correspondence not found');
    }

    await db.municipalityCorrespondence.delete({
      where: { id },
    });

    return successResponse({ message: 'تم الحذف بنجاح / Deleted successfully' });
  } catch (error) {
    console.error('MunicipalityCorrespondence DELETE error:', error);
    return serverErrorResponse();
  }
}
