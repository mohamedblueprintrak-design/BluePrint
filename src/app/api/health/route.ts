/**
 * Health Check API Route (Enhanced)
 * نقطة نهاية فحص صحة التطبيق المحسنة
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRedisHealth, isRedisAvailable } from '@/lib/cache/redis';
import { getPerformanceStats, getRouteStats } from '@/lib/monitoring/performance';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  checks: {
    database: {
      status: 'ok' | 'error' | 'degraded';
      latency?: number;
      error?: string;
      connections?: number;
    };
    redis: {
      status: 'ok' | 'error' | 'not_configured';
      latency?: number;
      error?: string;
    };
    environment: {
      status: 'ok' | 'warning';
      missing?: string[];
    };
  };
  performance?: {
    totalRequests: number;
    averageDuration: number;
    slowRequests: number;
    errorRate: string;
  };
}

// Track start time for uptime calculation
const startTime = Date.now();

export async function GET(request: NextRequest) {
  const includeDetails = request.nextUrl.searchParams.get('details') === 'true';
  
  const health: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: { status: 'ok' },
      redis: { status: 'not_configured' },
      environment: { status: 'ok' },
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    
    health.checks.database = {
      status: dbLatency < 100 ? 'ok' : 'degraded',
      latency: dbLatency,
    };
    
    // Get connection count if possible
    try {
      const connections = await db.$queryRaw`SELECT count(*) FROM pg_stat_activity` as Array<{ count: bigint }>;
      health.checks.database.connections = Number(connections[0]?.count || 0);
    } catch {
      // Ignore connection count errors
    }
  } catch (error) {
    health.checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    health.status = 'unhealthy';
  }

  // Check Redis connection
  try {
    if (process.env.REDIS_URL) {
      const redisHealth = await checkRedisHealth();
      const redisStatus = redisHealth.status === 'healthy' ? 'ok' : redisHealth.status === 'degraded' ? 'ok' : 'error';
      health.checks.redis = {
        status: redisStatus,
        latency: redisHealth.latency,
        error: redisHealth.error,
      };
      
      if (redisHealth.status !== 'healthy') {
        health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
      }
    } else {
      health.checks.redis = { status: 'not_configured' };
    }
  } catch (error) {
    health.checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ];
  
  const recommendedEnvVars = [
    'REDIS_URL',
    'SMTP_HOST',
    'NEXT_PUBLIC_SENTRY_DSN',
  ];
  
  const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);
  const missingRecommended = recommendedEnvVars.filter(varName => !process.env[varName]);
  
  if (missingRequired.length > 0) {
    health.checks.environment = {
      status: 'warning',
      missing: missingRequired,
    };
    health.status = 'degraded';
  } else if (missingRecommended.length > 0) {
    health.checks.environment = {
      status: 'warning',
      missing: missingRecommended,
    };
  }

  // Include performance stats if requested
  if (includeDetails) {
    const perfStats = getPerformanceStats();
    health.performance = {
      totalRequests: perfStats.totalRequests,
      averageDuration: perfStats.averageDuration,
      slowRequests: perfStats.slowRequests,
      errorRate: perfStats.errorRate as string,
    };
  }

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Status': health.status,
    },
  });
}

/**
 * Detailed health check with route statistics
 */
export async function POST(request: NextRequest) {
  // Verify admin access for detailed stats
  const authHeader = request.headers.get('authorization');
  
  // Simple token check (use proper auth in production)
  if (authHeader !== `Bearer ${process.env.HEALTH_CHECK_TOKEN}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const health = {
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    performance: getPerformanceStats(),
    routes: getRouteStats(),
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    },
  };
  
  return NextResponse.json(health);
}
