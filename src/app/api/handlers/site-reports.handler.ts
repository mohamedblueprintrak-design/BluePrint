import { NextResponse } from 'next/server';
import { HandlerContext, ApiSuccessResponse, ApiErrorResponse } from '../types';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response';
import { getDb } from '../utils/db';

/** Site report row from database with project relation */
interface SiteReportRow {
  id: string;
  projectId: string;
  project?: { name?: string } | null;
  reportDate: unknown;
  reportNumber?: unknown;
  weather?: unknown;
  temperature?: unknown;
  workersCount?: unknown;
  workDescription?: unknown;
  workArea?: unknown;
  issues?: unknown;
  safetyIssues?: unknown;
  nextSteps?: unknown;
  summary?: unknown;
  status: string;
}

/**
 * GET handlers for site-reports actions
 */
export const getHandlers = {
  /**
   * Get site reports
   */
  'site-reports': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const database = await getDb();
    if (!database) return successResponse([]);
    
    const siteReports = await database.siteReport.findMany({
      where: { project: { organizationId: context.user.organizationId } },
      include: { project: true },
      orderBy: { reportDate: 'desc' },
      take: 50
    });
    
    return successResponse(siteReports.map((r: SiteReportRow) => ({
      id: r.id,
      projectId: r.projectId,
      project: r.project?.name,
      reportDate: r.reportDate,
      reportNumber: r.reportNumber,
      weather: r.weather,
      temperature: r.temperature,
      workersCount: r.workersCount,
      workDescription: r.workDescription,
      workArea: r.workArea,
      issues: r.issues,
      safetyIssues: r.safetyIssues,
      nextSteps: r.nextSteps,
      summary: r.summary,
      status: r.status
    })));
  }
};

/**
 * POST handlers for site-reports actions
 */
export const postHandlers = {
  /**
   * Create new site report
   */
  'site-report': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const { projectId, weather, temperature, workersCount, summary, issues, workDescription, nextSteps, workArea, safetyIssues, equipmentUsed, materialsReceived } = (context.body || {}) as Record<string, unknown>;
    if (!projectId) return errorResponse('المشروع مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');

    // Verify project belongs to user's organization
    const siteProject = await database.project.findFirst({
      where: { id: projectId as string, organizationId: context.user.organizationId }
    });
    if (!siteProject) return notFoundResponse('المشروع غير موجود');

    const count = await database.siteReport.count({ where: { projectId: projectId as string } });
    const reportNumber = `SR-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    const report = await database.siteReport.create({
      data: {
        projectId: projectId as string,
        reportDate: new Date(),
        reportNumber,
        weather: weather as string,
        temperature: temperature as number,
        workersCount: workersCount as number,
        summary: summary as string,
        issues: issues as string,
        workDescription: workDescription as string,
        nextSteps: nextSteps as string,
        workArea: workArea as string,
        safetyIssues: safetyIssues as string,
        equipmentUsed: equipmentUsed as string,
        materialsReceived: materialsReceived as string,
        preparedById: context.user.id
      }
    });

    return successResponse({ id: report.id, reportNumber });
  }
};

/**
 * DELETE handlers for site-reports actions
 */
export const deleteHandlers = {
  /**
   * Delete site report
   */
  'site-report': async (context: HandlerContext): Promise<NextResponse<ApiSuccessResponse<unknown> | ApiErrorResponse>> => {
    if (!context.user) return unauthorizedResponse();
    
    const id = context.searchParams.get('id');
    if (!id) return errorResponse('معرف تقرير الموقع مطلوب');

    const database = await getDb();
    if (!database) return errorResponse('قاعدة البيانات غير متاحة');
    
    // Verify site report belongs to user's organization
    const siteReport = await database.siteReport.findFirst({
      where: { id, project: { organizationId: context.user.organizationId } }
    });
    if (!siteReport) return notFoundResponse('تقرير الموقع غير موجود');
    
    await database.siteReport.delete({ where: { id } });
    return successResponse(true);
  }
};
