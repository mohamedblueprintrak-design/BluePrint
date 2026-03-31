import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../utils/demo-config';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '../utils/response';
import { db } from '@/lib/db';

/**
 * Format a date for CSV output
 */
function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Escape CSV field value
 */
function escapeCsvField(value: string): string {
  if (!value) return '""';
  // Wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * Build CSV content from activities
 */
function buildCsvContent(activities: Array<Record<string, unknown>>): string {
  const headers = ['Date', 'User', 'Entity Type', 'Action', 'Description'];
  const rows = activities.map(a => [
    formatDate(a.createdAt as Date),
    escapeCsvField(a.userName as string),
    escapeCsvField((a.entityType as string) || ''),
    escapeCsvField((a.action as string) || ''),
    escapeCsvField((a.description as string) || ''),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const entityType = searchParams.get('entityType') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const exportFormat = searchParams.get('export') || undefined;

  // Date range filtering
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  try {
    // Build where clause
    const where: Record<string, unknown> = {};

    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;

    // Add date range filters
    if (startDateStr || endDateStr) {
      const dateFilter: Record<string, unknown> = {};
      if (startDateStr) {
        dateFilter.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        // Set end date to end of day
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.lte = endDate;
      }
      where.createdAt = dateFilter;
    }

    const [activities, total] = await Promise.all([
      db.activity.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, username: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.activity.count({ where })
    ]);

    const mappedActivities = activities.map(a => ({
      id: a.id,
      userId: a.userId,
      userName: a.user?.fullName || a.user?.username || 'System',
      userAvatar: a.user?.avatar,
      entityType: a.entityType,
      entityId: a.entityId,
      action: a.action,
      description: a.description,
      oldValue: a.oldValue,
      newValue: a.newValue,
      ipAddress: a.ipAddress,
      createdAt: a.createdAt,
    }));

    // CSV Export
    if (exportFormat === 'csv') {
      // For CSV export, fetch all matching records (up to 10000) without pagination
      const allActivities = await db.activity.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, username: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10000, // Safety limit for CSV export
      });

      const allMapped = allActivities.map(a => ({
        userName: a.user?.fullName || a.user?.username || 'System',
        entityType: a.entityType,
        action: a.action,
        description: a.description,
        createdAt: a.createdAt,
      }));

      const csvContent = buildCsvContent(allMapped);
      const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Normal JSON response with pagination metadata
    return successResponse(mappedActivities, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      filters: {
        entityType: entityType || null,
        userId: userId || null,
        startDate: startDateStr || null,
        endDate: endDateStr || null,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return serverErrorResponse(errMsg);
  }
}
