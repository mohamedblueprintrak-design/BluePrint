/**
 * Site Report Cost API
 * GET /api/site-reports/[id]/cost
 *
 * Returns the cost calculation for a specific site report
 * by wiring up the site-log-cost service.
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/app/api/utils/demo-config';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from '@/app/api/utils/response';
import { calculateSiteLogCost } from '@/lib/services/site-log-cost.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: siteReportId } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return unauthorizedResponse();

  try {
    if (!siteReportId) {
      return errorResponse('Site Report ID is required');
    }

    const costResult = await calculateSiteLogCost(siteReportId);

    return successResponse({
      siteReportId: costResult.siteReportId,
      totalCost: costResult.totalCost,
      itemsCount: costResult.itemsCount,
      byCategory: costResult.byCategory,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    // If site report not found, return 404
    if (errMsg.includes('not found')) {
      return notFoundResponse(errMsg);
    }
    return serverErrorResponse(errMsg);
  }
}
