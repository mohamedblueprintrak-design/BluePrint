import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response';
import { getUserFromToken } from '../utils/auth';
import { DEMO_USERS } from '../handlers/auth.handler';

// Accepted file types
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv'
];

// Max file size: 10MB
const MAX_SIZE = 10 * 1024 * 1024;

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'upload');

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const uniqueId = randomUUID();
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}${ext}`;
}

// Get file type category
function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
  if (mimeType === 'text/plain') return 'text';
  if (mimeType === 'text/csv') return 'csv';
  return 'other';
}

// Arabic error messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'غير مصرح بالرفع. يرجى تسجيل الدخول',
  NO_FILE: 'لم يتم اختيار ملف',
  INVALID_TYPE: 'نوع الملف غير مسموح به. الأنواع المسموحة: صور، PDF، مستندات Word، Excel، ملفات نصية',
  FILE_TOO_LARGE: 'حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت',
  UPLOAD_FAILED: 'فشل في رفع الملف. يرجى المحاولة مرة أخرى'
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUserFromToken(request, DEMO_USERS);
    if (!user) {
      return unauthorizedResponse(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse(ERROR_MESSAGES.NO_FILE, 'NO_FILE', 400);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(ERROR_MESSAGES.INVALID_TYPE, 'INVALID_FILE_TYPE', 400);
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return errorResponse(ERROR_MESSAGES.FILE_TOO_LARGE, 'FILE_TOO_LARGE', 400);
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Build public URL
    const fileUrl = `/upload/${uniqueFilename}`;
    const fileCategory = getFileCategory(file.type);

    // Return success response with file metadata
    return successResponse({
      url: fileUrl,
      name: file.name,
      filename: uniqueFilename,
      type: file.type,
      category: fileCategory,
      size: file.size,
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse(ERROR_MESSAGES.UPLOAD_FAILED, 'UPLOAD_FAILED', 500);
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
