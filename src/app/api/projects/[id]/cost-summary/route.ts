/**
 * Project Cost Summary API
 * GET /api/projects/[id]/cost-summary
 *
 * Returns project-level cost summary and BOQ variance analysis
 * by wiring up the site-log-cost service.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/app/api/utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/app/api/utils/response';
import { getProjectCostSummary, getBOQVariance } from '@/lib/services/site-log-cost.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return unauthorizedResponse();

  try {
    if (!projectId) {
      return errorResponse('Project ID is required');
    }

    // Verify project belongs to user's organization
    const project = await db.project.findUnique({ where: { id: projectId, organizationId: user.organizationId }, select: { id: true } });
    if (!project) return notFoundResponse('Project not found');

    // Fetch both cost summary and BOQ variance in parallel
    const [costSummary, boqVariance] = await Promise.all([
      getProjectCostSummary(projectId).catch(() => null),
      getBOQVariance(projectId).catch(() => null),
    ]);

    return successResponse({
      costSummary,
      boqVariance,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
