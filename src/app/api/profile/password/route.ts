import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getUserFromToken } from '../../utils/auth';
import { getDb, DEMO_USERS } from '../../utils/db';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response';
import { ApiSuccessResponse, ApiErrorResponse } from '../../types';

// Validation schema for password change
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type PasswordChange = z.infer<typeof passwordChangeSchema>;

/**
 * PUT /api/profile/password - Change password
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiSuccessResponse<{ success: boolean }> | ApiErrorResponse>> {
  const user = await getUserFromToken(request, DEMO_USERS);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = passwordChangeSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || 'Invalid input',
        'VALIDATION_ERROR',
        400
      );
    }
    
    const { currentPassword, newPassword }: PasswordChange = validationResult.data;
    const database = await getDb();
    
    if (database) {
      // Get current user with password
      const userData = await database.user.findUnique({
        where: { id: user.id }
      });
      
      if (!userData || !userData.password) {
        return errorResponse('User not found or no password set', 'NOT_FOUND', 404);
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, userData.password);
      if (!isPasswordValid) {
        return errorResponse('Current password is incorrect', 'INVALID_PASSWORD', 400);
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await database.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      return successResponse({ success: true });
    }
    
    // Demo mode - validate against demo user
    const demoUser = DEMO_USERS.find(u => u.id === user.id);
    if (!demoUser) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }
    
    // For demo, we'll accept "admin123" as the demo password
    const isPasswordValid = await bcrypt.compare(currentPassword, demoUser.password);
    if (!isPasswordValid) {
      return errorResponse('Current password is incorrect', 'INVALID_PASSWORD', 400);
    }
    
    // In demo mode, we don't actually save the password
    return successResponse({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return errorResponse('Failed to change password', 'SERVER_ERROR', 500);
  }
}
