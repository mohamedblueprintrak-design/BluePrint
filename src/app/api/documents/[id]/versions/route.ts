import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/app/api/utils/demo-config';
import { successResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '@/app/api/utils/response';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, title: true, version: true, revision: true, projectId: true, organizationId: true },
    });

    if (!document) return notFoundResponse('Document not found');

    // Find all documents with the same title in the same project (version history)
    const versions = await prisma.document.findMany({
      where: {
        projectId: document.projectId,
        title: document.title,
        organizationId: document.organizationId,
      },
      select: {
        id: true,
        title: true,
        version: true,
        revision: true,
        fileSize: true,
        mimeType: true,
        uploadedBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({
      current: {
        id: document.id,
        version: document.version,
        revision: document.revision,
      },
      versions: versions.map(v => ({
        id: v.id,
        version: v.version,
        revision: v.revision,
        fileSize: v.fileSize,
        mimeType: v.mimeType,
        uploadedBy: v.uploadedBy,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return unauthorizedResponse();

  try {
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) return notFoundResponse('Document not found');

    // Increment version: V1.0 → V2.0 (major) or based on body param
    const body = await request.json().catch(() => ({}));
    const versionType = body.versionType || 'minor'; // 'major' or 'minor'

    let newVersion = document.version || '1.0';
    let newRevision = document.revision || 'A';

    if (versionType === 'major') {
      const currentMajor = parseInt((document.version || '1').replace('V', '')) || 1;
      newVersion = `V${currentMajor + 1}.0`;
      newRevision = 'A';
    } else {
      // Increment revision: A → B → C ... → Z
      const currentCharCode = (document.revision || 'A').charCodeAt(0);
      newRevision = String.fromCharCode(currentCharCode + 1);
      // If we went past Z, bump minor version
      if (newRevision === '[') {
        const parts = (document.version || '1.0').split('.');
        const minor = parseInt(parts[1]) || 0;
        newVersion = `V${parts[0].replace('V', '')}.${minor + 1}`;
        newRevision = 'A';
      }
    }

    // Mark current version with updated metadata
    const updated = await prisma.document.update({
      where: { id },
      data: {
        version: newVersion,
        revision: newRevision,
        uploadedBy: user.id,
      },
    });

    return successResponse({
      id: updated.id,
      version: newVersion,
      revision: newRevision,
      message: `Document version updated to ${newVersion} (${newRevision})`,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
