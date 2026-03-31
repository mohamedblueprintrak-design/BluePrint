/**
 * Client-Side Logger for BluePrint SaaS
 * نظام تسجيل الأخطاء للواجهة الأمامية
 *
 * Lightweight browser-compatible logging utility.
 * This is the client-side counterpart to the server-side Winston logger (@/lib/logger).
 * Use this in 'use client' components instead of importing Winston directly.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  process.env.NODE_ENV === 'development' ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
}

function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { error };
}

export const clientLog = {
  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    if (!shouldLog('error')) return;
    const entry = formatEntry('error', message, { ...serializeError(error), ...meta });
    console.error(`[${entry.timestamp}] ERROR: ${entry.message}`, entry.meta);
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog('warn')) return;
    const entry = formatEntry('warn', message, meta);
    console.warn(`[${entry.timestamp}] WARN: ${entry.message}`, entry.meta);
  },

  info: (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog('info')) return;
    const entry = formatEntry('info', message, meta);
    console.info(`[${entry.timestamp}] INFO: ${entry.message}`, entry.meta);
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog('debug')) return;
    const entry = formatEntry('debug', message, meta);
    console.debug(`[${entry.timestamp}] DEBUG: ${entry.message}`, entry.meta);
  },
};

export default clientLog;
