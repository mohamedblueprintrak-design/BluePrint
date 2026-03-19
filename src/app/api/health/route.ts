/**
 * Health Check API Route
 * نقطة نهاية فحص صحة التطبيق
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    environment: {
      status: 'ok' | 'warning';
      missing?: string[];
    };
  };
}

// Track start time for uptime calculation
const startTime = Date.now();

export async function GET() {
  const health: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: { status: 'ok' },
      environment: { status: 'ok' },
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database.latency = Date.now() - dbStart;
    health.checks.database.status = 'ok';
  } catch (error) {
    health.checks.database.status = 'error';
    health.checks.database.error = error instanceof Error ? error.message : 'Unknown error';
    health.status = 'unhealthy';
  }

  // Check required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    health.checks.environment.status = 'warning';
    health.checks.environment.missing = missingVars;
    health.status = 'degraded';
  }

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
