import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '../../utils/auth';
import { getDb, DEMO_USERS } from '../../utils/db';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response';
import { ApiSuccessResponse, ApiErrorResponse } from '../../types';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const AVATAR_DIR = path.join(process.cwd(), 'public', 'upload', 'avatars');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * POST /api/profile/avatar - Upload avatar image
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiSuccessResponse<{ avatar: string }> | ApiErrorResponse>> {
  const user = await getUserFromToken(request, DEMO_USERS);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return errorResponse('No file provided', 'NO_FILE', 400);
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        'Invalid file type. Allowed: JPEG, PNG, GIF, WebP',
        'INVALID_FILE_TYPE',
        400
      );
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        'File too large. Maximum size is 5MB',
        'FILE_TOO_LARGE',
        400
      );
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${user.id}-${timestamp}.${extension}`;
    const filepath = path.join(AVATAR_DIR, filename);
    
    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Ensure directory exists
    if (!existsSync(AVATAR_DIR)) {
      await mkdir(AVATAR_DIR, { recursive: true });
    }
    
    // Write file to disk
    await writeFile(filepath, buffer);
    
    // Generate avatar URL
    const avatarUrl = `/upload/avatars/${filename}`;
    
    // Update user in database
    const database = await getDb();
    if (database) {
      await database.user.update({
        where: { id: user.id },
        data: { avatar: avatarUrl }
      });
    }
    
    return successResponse({ avatar: avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return errorResponse('Failed to upload avatar', 'SERVER_ERROR', 500);
  }
}

/**
 * DELETE /api/profile/avatar - Remove avatar
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiSuccessResponse<{ success: boolean }> | ApiErrorResponse>> {
  const user = await getUserFromToken(request, DEMO_USERS);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const database = await getDb();
    
    // Get current avatar URL
    let currentAvatar: string | null = null;
    
    if (database) {
      const userData = await database.user.findUnique({
        where: { id: user.id }
      });
      currentAvatar = userData?.avatar || null;
      
      // Remove from database
      await database.user.update({
        where: { id: user.id },
        data: { avatar: null }
      });
    }
    
    // Delete file from disk if exists
    if (currentAvatar && currentAvatar.startsWith('/upload/avatars/')) {
      const filepath = path.join(process.cwd(), 'public', currentAvatar);
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    }
    
    return successResponse({ success: true });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return errorResponse('Failed to delete avatar', 'SERVER_ERROR', 500);
  }
}
