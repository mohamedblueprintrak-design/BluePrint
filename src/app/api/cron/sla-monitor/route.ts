/**
 * Cron Job API Endpoint for SLA Monitoring
 * نقطة نهاية API للمهام المجدولة لمراقبة SLA
 * 
 * This endpoint is called by Vercel Cron or external scheduler to check SLA breaches.
 * Called every hour by default.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSLABreaches } from '@/lib/services/sla-monitor.service';
import { db, isDatabaseAvailable } from '@/lib/db';

// ============================================
// Cron Job Secret Validation
// ============================================

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // In development, allow without secret
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // In production, require valid secret
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

// ============================================
// Main Handler
// ============================================

export async function GET(request: NextRequest) {
  const startTime = new Date();
  
  // Validate authorization
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unauthorized - Invalid or missing cron secret' 
      },
      { status: 401 }
    );
  }

  if (!isDatabaseAvailable()) {
    return NextResponse.json({
      success: false,
      message: 'Database not available - running in demo mode',
      timestamp: startTime.toISOString(),
    });
  }

  // Create log entry
  const logEntry = await createCronLog('sla-monitor', startTime);

  try {
    // Run SLA check
    const report = await checkSLABreaches();

    // Update log with success
    await updateCronLog(logEntry.id, {
      status: 'completed',
      completedAt: new Date(),
      recordsProcessed: report.tasksChecked,
      breachesFound: report.warningsFound + report.breachesFound + report.criticalFound,
      notificationsSent: report.results.length,
    });

    return NextResponse.json({
      success: true,
      message: 'SLA monitoring completed successfully',
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime.getTime()}ms`,
      report: {
        tasksChecked: report.tasksChecked,
        warningsFound: report.warningsFound,
        breachesFound: report.breachesFound,
        criticalFound: report.criticalFound,
        totalIssues: report.results.length,
      },
    });
  } catch (error) {
    // Update log with error
    await updateCronLog(logEntry.id, {
      status: 'failed',
      completedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    console.error('SLA Monitor Cron Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'SLA monitoring failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

async function createCronLog(jobName: string, startedAt: Date) {
  try {
    return await db.cronJobLog.create({
      data: {
        jobName,
        startedAt,
        status: 'running',
      },
    });
  } catch (error) {
    console.error('Failed to create cron log:', error);
    return { id: 'temp-' + Date.now() };
  }
}

async function updateCronLog(
  logId: string,
  data: {
    status: string;
    completedAt: Date;
    recordsProcessed?: number;
    breachesFound?: number;
    notificationsSent?: number;
    error?: string;
  }
) {
  try {
    // Skip if temporary ID
    if (logId.startsWith('temp-')) return;
    
    await db.cronJobLog.update({
      where: { id: logId },
      data: {
        status: data.status,
        completedAt: data.completedAt,
        recordsProcessed: data.recordsProcessed || 0,
        breachesFound: data.breachesFound || 0,
        notificationsSent: data.notificationsSent || 0,
        error: data.error,
      },
    });
  } catch (error) {
    console.error('Failed to update cron log:', error);
  }
}

// ============================================
// POST Handler for Manual Trigger
// ============================================

export async function POST(request: NextRequest) {
  // Manual trigger uses same auth validation
  return GET(request);
}
