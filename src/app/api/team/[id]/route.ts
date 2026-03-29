import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';

function successResponse(data: unknown) { return NextResponse.json({ success: true, data }); }
function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// GET - Fetch single team member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const { id } = await params;
    const member = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        phone: true,
        jobTitle: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!member) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    return successResponse(member);
  } catch (error) {
    console.error('Error fetching user:', error);
    return errorResponse('Failed to fetch user', 'SERVER_ERROR', 500);
  }
}

// PUT - Update team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    // SECURITY: Only admins and managers can update team members
    if (!['admin', 'manager'].includes(user.role)) {
      return errorResponse('ليس لديك صلاحية تحديث أعضاء الفريق', 'FORBIDDEN', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const { fullName, email, role, department, phone, jobTitle } = body;

    // SECURITY: Only allow updating specific fields (prevent mass assignment)
    const updateData: Record<string, unknown> = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (phone !== undefined) updateData.phone = phone;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });

    return successResponse(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse('Failed to update user', 'SERVER_ERROR', 500);
  }
}

// DELETE - Soft delete team member (set isActive to false instead of hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    // SECURITY: Only admins can delete team members
    if (user.role !== 'admin') {
      return errorResponse('ليس لديك صلاحية حذف أعضاء الفريق', 'FORBIDDEN', 403);
    }

    // SECURITY: Prevent self-deletion
    const { id } = await params;
    if (id === user.id) {
      return errorResponse('لا يمكنك حذف حسابك الخاص', 'SELF_DELETE', 400);
    }

    // SECURITY: Use soft delete (isActive = false) instead of hard delete
    await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse({ message: 'تم حذف عضو الفريق' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return errorResponse('Failed to delete user', 'SERVER_ERROR', 500);
  }
}
