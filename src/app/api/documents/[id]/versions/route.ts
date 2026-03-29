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

    const { searchParams } = new URL(request.url);
    const compareParam = searchParams.get('compare');

    // Version comparison mode: ?compare=v1,v2
    if (compareParam) {
      const [v1Id, v2Id] = compareParam.split(',').map(v => v.trim());

      if (!v1Id || !v2Id) {
        return validationErrorResponse('compare parameter requires two version IDs separated by comma (e.g., ?compare=v1,v2)');
      }

      return await handleVersionComparison(document, v1Id, v2Id);
    }

    // Default: list all versions
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
        metadata: true,
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
        isLocked: (v.metadata as any)?.locked === true,
        lockReason: (v.metadata as any)?.lockReason || null,
      })),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * Handle side-by-side version comparison
 */
async function handleVersionComparison(
  document: { id: string; title: string; projectId: string | null; organizationId: string | null },
  v1Id: string,
  v2Id: string
) {
  const [version1, version2] = await Promise.all([
    prisma.document.findUnique({
      where: { id: v1Id },
      select: {
        id: true,
        title: true,
        description: true,
        version: true,
        revision: true,
        fileSize: true,
        mimeType: true,
        status: true,
        uploadedBy: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
      },
    }),
    prisma.document.findUnique({
      where: { id: v2Id },
      select: {
        id: true,
        title: true,
        description: true,
        version: true,
        revision: true,
        fileSize: true,
        mimeType: true,
        status: true,
        uploadedBy: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
      },
    }),
  ]);

  if (!version1) return notFoundResponse(`Version 1 not found: ${v1Id}`);
  if (!version2) return notFoundResponse(`Version 2 not found: ${v2Id}`);

  // Build comparison diffs
  const titleChanged = version1.title !== version2.title;
  const descriptionChanged = version1.description !== version2.description;
  const statusChanged = version1.status !== version2.status;
  const mimeTypeChanged = version1.mimeType !== version2.mimeType;

  const sizeDiff = (version2.fileSize || 0) - (version1.fileSize || 0);
  const sizeDiffPercent = version1.fileSize && version1.fileSize > 0
    ? Math.round((sizeDiff / version1.fileSize) * 100)
    : 0;

  const daysBetween = Math.floor(
    ((version2.createdAt as any).getTime() - (version1.createdAt as any).getTime()) / (1000 * 60 * 60 * 24)
  );

  return successResponse({
    comparison: {
      version1: {
        id: version1.id,
        version: version1.version,
        revision: version1.revision,
        title: version1.title,
        description: version1.description,
        status: version1.status,
        fileSize: version1.fileSize,
        mimeType: version1.mimeType,
        uploadedBy: version1.uploadedBy,
        createdAt: version1.createdAt,
        updatedAt: version1.updatedAt,
        metadata: version1.metadata,
      },
      version2: {
        id: version2.id,
        version: version2.version,
        revision: version2.revision,
        title: version2.title,
        description: version2.description,
        status: version2.status,
        fileSize: version2.fileSize,
        mimeType: version2.mimeType,
        uploadedBy: version2.uploadedBy,
        createdAt: version2.createdAt,
        updatedAt: version2.updatedAt,
        metadata: version2.metadata,
      },
    },
    changes: {
      titleChanged,
      descriptionChanged,
      statusChanged,
      mimeTypeChanged,
      sizeDiff,
      sizeDiffBytes: Math.abs(sizeDiff),
      sizeDiffPercent,
      sizeIncreased: sizeDiff > 0,
      daysBetween,
    },
  });
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

    const body = await request.json().catch(() => ({}));
    const action = body.action;

    // Handle different POST actions
    switch (action) {
      case 'rollback':
        return await handleRollback(document, body, user);
      case 'lock':
        return await handleLock(document, body, user);
      case 'unlock':
        return await handleUnlock(document, user);
      default:
        // Default: version increment
        return await handleVersionIncrement(document, body, user);
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}

/**
 * Handle version increment (default POST behavior)
 */
async function handleVersionIncrement(
  document: any,
  body: any,
  user: any
) {
  const versionType = body.versionType || 'minor';

  // Check if document is locked
  const metadata = (document.metadata as any) || {};
  if (metadata.locked === true) {
    return validationErrorResponse('Document is locked and cannot be modified. Unlock it first.');
  }

  let newVersion = document.version || '1.0';
  let newRevision = document.revision || 'A';

  if (versionType === 'major') {
    const currentMajor = parseInt((document.version || '1').replace('V', '')) || 1;
    newVersion = `V${currentMajor + 1}.0`;
    newRevision = 'A';
  } else {
    const currentCharCode = (document.revision || 'A').charCodeAt(0);
    newRevision = String.fromCharCode(currentCharCode + 1);
    if (newRevision === '[') {
      const parts = (document.version || '1.0').split('.');
      const minor = parseInt(parts[1]) || 0;
      newVersion = `V${parts[0].replace('V', '')}.${minor + 1}`;
      newRevision = 'A';
    }
  }

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
}

/**
 * Handle version rollback: creates a new version from old content
 */
async function handleRollback(
  document: any,
  body: any,
  user: any
) {
  const { versionId } = body;

  if (!versionId) {
    return validationErrorResponse('versionId is required for rollback action');
  }

  // Check if document is locked
  const metadata = (document.metadata as any) || {};
  if (metadata.locked === true) {
    return validationErrorResponse('Document is locked and cannot be rolled back. Unlock it first.');
  }

  // Fetch the target version
  const targetVersion = await prisma.document.findUnique({
    where: { id: versionId },
    select: {
      id: true,
      title: true,
      description: true,
      version: true,
      revision: true,
      fileName: true,
      filePath: true,
      fileSize: true,
      mimeType: true,
      status: true,
      metadata: true,
    },
  });

  if (!targetVersion) {
    return notFoundResponse(`Target version not found: ${versionId}`);
  }

  // Generate a new version number (major increment for rollback)
  const currentMajor = parseInt((document.version || '1').replace('V', '')) || 1;
  const rollbackVersion = `V${currentMajor + 1}.0`;
  const rollbackRevision = 'A';

  // Create new document record with rolled-back content
  const rolledBack = await prisma.document.update({
    where: { id: document.id },
    data: {
      title: targetVersion.title,
      description: targetVersion.description,
      fileName: targetVersion.fileName,
      filePath: targetVersion.filePath,
      fileSize: targetVersion.fileSize,
      mimeType: targetVersion.mimeType,
      status: 'DRAFT' as any,
      version: rollbackVersion,
      revision: rollbackRevision,
      uploadedBy: user.id,
      metadata: {
        ...(document.metadata as any || {}),
        rollbackFrom: {
          versionId: targetVersion.id,
          version: targetVersion.version,
          revision: targetVersion.revision,
          rolledBackBy: user.id,
          rolledBackAt: new Date().toISOString(),
        },
      },
    },
  });

  return successResponse({
    id: rolledBack.id,
    version: rollbackVersion,
    revision: rollbackRevision,
    message: `Document rolled back to version ${targetVersion.version} (${targetVersion.revision}). New version created: ${rollbackVersion} (${rollbackRevision})`,
    rollbackFrom: {
      versionId: targetVersion.id,
      version: targetVersion.version,
      revision: targetVersion.revision,
    },
  });
}

/**
 * Handle document lock: prevents edits
 */
async function handleLock(
  document: any,
  body: any,
  user: any
) {
  const { reason } = body;

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    return validationErrorResponse('A reason is required to lock a document');
  }

  const currentMetadata = (document.metadata as any) || {};
  if (currentMetadata.locked === true) {
    return validationErrorResponse('Document is already locked');
  }

  const updated = await prisma.document.update({
    where: { id: document.id },
    data: {
      metadata: {
        ...currentMetadata,
        locked: true,
        lockReason: reason.trim(),
        lockedBy: user.id,
        lockedAt: new Date().toISOString(),
      },
    },
  });

  return successResponse({
    id: updated.id,
    locked: true,
    lockReason: reason.trim(),
    lockedBy: user.id,
    lockedAt: new Date().toISOString(),
    message: 'Document has been locked. No further modifications allowed until unlocked.',
  });
}

/**
 * Handle document unlock: allows edits
 */
async function handleUnlock(
  document: any,
  user: any
) {
  const currentMetadata = (document.metadata as any) || {};
  if (currentMetadata.locked !== true) {
    return validationErrorResponse('Document is not currently locked');
  }

  const updated = await prisma.document.update({
    where: { id: document.id },
    data: {
      metadata: {
        ...currentMetadata,
        locked: false,
        lockReason: null,
        unlockedBy: user.id,
        unlockedAt: new Date().toISOString(),
      },
    },
  });

  return successResponse({
    id: updated.id,
    locked: false,
    unlockedBy: user.id,
    unlockedAt: new Date().toISOString(),
    message: 'Document has been unlocked. Modifications are now allowed.',
  });
}
