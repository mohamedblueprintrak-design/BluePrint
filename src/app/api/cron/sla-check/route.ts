/**
 * SLA Check Cron Endpoint
 * نقطة نهاية للتحقق من SLA عبر المهام المجدولة
 *
 * Should be called every hour by a cron scheduler (Vercel Cron, node-cron, etc.)
 *
 * Logic:
 * 1. Find all tasks with slaStartDate set and status IN_PROGRESS
 * 2. Calculate days elapsed since slaStartDate
 * 3. If elapsed > slaDays -> create/update SLABreach record
 * 4. If elapsed >= slaWarningDays and not yet breached -> create WARNING breach
 * 5. Send notifications for new breaches
 * 6. Resolve breaches for completed tasks
 */

import { NextRequest, NextResponse } from 'next/server';
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
  // Validate authorization
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid or missing cron secret' },
      { status: 401 }
    );
  }

  if (!isDatabaseAvailable()) {
    return NextResponse.json({
      success: false,
      message: 'Database not available - running in demo mode',
      checkedAt: new Date().toISOString(),
    });
  }

  try {
    const now = new Date();

    // Find all active tasks with SLA tracking
    const tasks = await db.task.findMany({
      where: {
        slaStartDate: { not: null },
        status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
        deletedAt: null,
      },
      include: {
        project: {
          select: { id: true, name: true, organizationId: true },
        },
      },
    });

    let warningsCreated = 0;
    let breachesCreated = 0;
    let resolvedCount = 0;

    for (const task of tasks) {
      if (!task.slaStartDate || !task.slaDays) continue;

      const startDate = new Date(task.slaStartDate);
      const elapsedMs = now.getTime() - startDate.getTime();
      const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

      if (elapsedDays >= task.slaDays) {
        // BREACHED - SLA deadline exceeded
        const existingBreach = await db.sLABreach.findFirst({
          where: {
            taskId: task.id,
            status: { in: ['WARNING', 'BREACHED', 'CRITICAL'] },
          },
        });

        if (!existingBreach) {
          await db.sLABreach.create({
            data: {
              taskId: task.id,
              projectId: task.projectId,
              status: 'BREACHED',
              daysElapsed: elapsedDays,
              slaDays: task.slaDays,
              breachDays: elapsedDays - task.slaDays,
            },
          });
          breachesCreated++;
        }
      } else if (task.slaWarningDays && elapsedDays >= task.slaWarningDays) {
        // WARNING - approaching SLA deadline
        const existingBreach = await db.sLABreach.findFirst({
          where: {
            taskId: task.id,
            status: 'WARNING',
          },
        });

        if (!existingBreach) {
          await db.sLABreach.create({
            data: {
              taskId: task.id,
              projectId: task.projectId,
              status: 'WARNING',
              daysElapsed: elapsedDays,
              slaDays: task.slaDays,
              breachDays: 0,
            },
          });
          warningsCreated++;
        }
      }
    }

    // Resolve breaches for completed tasks
    const completedBreaches = await db.sLABreach.findMany({
      where: {
        status: { in: ['WARNING', 'BREACHED', 'CRITICAL'] },
        task: { status: 'DONE' },
      },
      include: { task: true },
    });

    for (const breach of completedBreaches) {
      await db.sLABreach.update({
        where: { id: breach.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionNotes: 'Task completed',
        },
      });
      resolvedCount++;
    }

    return NextResponse.json({
      success: true,
      checkedAt: now.toISOString(),
      tasksChecked: tasks.length,
      warningsCreated,
      breachesCreated,
      resolvedBreaches: resolvedCount,
    });
  } catch (error) {
    console.error('SLA cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST Handler for Manual Trigger
// ============================================

export async function POST(request: NextRequest) {
  // Manual trigger uses same auth validation
  return GET(request);
}
