import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserFromToken } from '../utils/auth';
import { getDb, DEMO_USERS } from '../utils/db';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response';
import { ApiSuccessResponse, ApiErrorResponse } from '../types';

// Validation schemas
const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  nationality: z.string().max(100).optional(),
  language: z.enum(['ar', 'en']).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean()
  }).optional()
});

// Type for profile update
type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/**
 * GET /api/profile - Get current user profile
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiSuccessResponse<any> | ApiErrorResponse>> {
  const user = await getUserFromToken(request, DEMO_USERS);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const database = await getDb();
    
    if (database) {
      const fullUser = await database.user.findUnique({
        where: { id: user.id },
        include: { organization: true }
      });
      
      if (!fullUser) {
        return errorResponse('User not found', 'NOT_FOUND', 404);
      }
      
      // Parse preferences if it's a JSON string
      let preferences = null;
      if (fullUser.preferences) {
        try {
          preferences = JSON.parse(fullUser.preferences);
        } catch {
          preferences = null;
        }
      }
      
      return successResponse({
        ...fullUser,
        preferences
      });
    }
    
    // Return demo user data
    const demoUser = DEMO_USERS.find(u => u.id === user.id);
    if (!demoUser) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }
    
    return successResponse({
      ...demoUser,
      password: undefined
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return errorResponse('Failed to fetch profile', 'SERVER_ERROR', 500);
  }
}

/**
 * PUT /api/profile - Update user profile
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiSuccessResponse<any> | ApiErrorResponse>> {
  const user = await getUserFromToken(request, DEMO_USERS);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || 'Invalid input',
        'VALIDATION_ERROR',
        400
      );
    }
    
    const updateData: ProfileUpdate = validationResult.data;
    const database = await getDb();
    
    if (database) {
      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await database.user.findFirst({
          where: { 
            email: updateData.email,
            id: { not: user.id }
          }
        });
        
        if (existingUser) {
          return errorResponse('Email already in use', 'EMAIL_EXISTS', 400);
        }
      }
      
      // Prepare update object
      const dbUpdateData: Record<string, any> = {};
      
      if (updateData.fullName !== undefined) dbUpdateData.fullName = updateData.fullName;
      if (updateData.email !== undefined) dbUpdateData.email = updateData.email;
      if (updateData.phone !== undefined) dbUpdateData.phone = updateData.phone;
      if (updateData.jobTitle !== undefined) dbUpdateData.jobTitle = updateData.jobTitle;
      if (updateData.department !== undefined) dbUpdateData.department = updateData.department;
      if (updateData.nationality !== undefined) dbUpdateData.nationality = updateData.nationality;
      if (updateData.language !== undefined) dbUpdateData.language = updateData.language;
      if (updateData.theme !== undefined) dbUpdateData.theme = updateData.theme;
      
      // Store notifications preference as JSON
      if (updateData.notifications !== undefined) {
        dbUpdateData.preferences = JSON.stringify({
          notifications: updateData.notifications
        });
      }
      
      const updatedUser = await database.user.update({
        where: { id: user.id },
        data: dbUpdateData,
        include: { organization: true }
      });
      
      return successResponse({
        ...updatedUser,
        password: undefined
      });
    }
    
    // Demo mode - return mock updated user
    const demoUser = DEMO_USERS.find(u => u.id === user.id);
    if (!demoUser) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }
    
    const updatedDemoUser = {
      ...demoUser,
      ...updateData,
      password: undefined
    };
    
    return successResponse(updatedDemoUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return errorResponse('Failed to update profile', 'SERVER_ERROR', 500);
  }
}

// Import NextResponse for return type
import { NextResponse } from 'next/server';
