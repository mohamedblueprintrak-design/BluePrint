/**
 * Formatting & Utility Tests
 * اختبارات التنسيق والأدوات
 *
 * Tests utility functions:
 * - Currency formatting
 * - Date formatting
 * - Number formatting
 * - Duration utilities (breakdownMinutes, formatDuration, parseDurationToMinutes, etc.)
 * - SLA status calculation
 * - cn() classname merge utility
 */

import {
  breakdownMinutes,
  formatDuration,
  formatDurationFull,
  parseDurationToMinutes,
  convertDuration,
  calculateSLAStatus,
  getDurationColor,
  getDurationBgColor,
  hoursToMinutes,
  minutesToHours,
  MINUTES_PER_HOUR,
  HOURS_PER_WORK_DAY,
  MINUTES_PER_WORK_DAY,
} from '@/lib/utils/duration';
import { cn } from '@/lib/utils';

// ============================================
// cn() Classname Utility
// ============================================

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active');
  });

  it('should deduplicate tailwind classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle undefined inputs', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });
});

// ============================================
// Duration Breakdown
// ============================================

describe('breakdownMinutes', () => {
  it('should break down 0 minutes', () => {
    const result = breakdownMinutes(0);
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.totalMinutes).toBe(0);
    expect(result.totalHours).toBe(0);
    expect(result.totalDays).toBe(0);
  });

  it('should break down 30 minutes', () => {
    const result = breakdownMinutes(30);
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(30);
    expect(result.totalMinutes).toBe(30);
    expect(result.totalHours).toBe(0.5);
  });

  it('should break down 1 work day (480 minutes)', () => {
    const result = breakdownMinutes(MINUTES_PER_WORK_DAY);
    expect(result.days).toBe(1);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
  });

  it('should break down 2 work days and 4 hours', () => {
    const minutes = 2 * MINUTES_PER_WORK_DAY + 4 * MINUTES_PER_HOUR;
    const result = breakdownMinutes(minutes);
    expect(result.days).toBe(2);
    expect(result.hours).toBe(4);
    expect(result.minutes).toBe(0);
  });

  it('should break down complex duration (1d 3h 45m)', () => {
    const minutes = MINUTES_PER_WORK_DAY + 3 * MINUTES_PER_HOUR + 45;
    const result = breakdownMinutes(minutes);
    expect(result.days).toBe(1);
    expect(result.hours).toBe(3);
    expect(result.minutes).toBe(45);
  });

  it('should handle negative values as absolute', () => {
    const result = breakdownMinutes(-120);
    expect(result.totalMinutes).toBe(120);
    expect(result.hours).toBe(2);
  });
});

// ============================================
// Duration Formatting
// ============================================

describe('formatDuration', () => {
  it('should return empty string for null', () => {
    expect(formatDuration(null, 'ar')).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatDuration(undefined, 'en')).toBe('');
  });

  it('should format 0 minutes in Arabic', () => {
    expect(formatDuration(0, 'ar')).toBe('0 دقيقة');
  });

  it('should format 0 minutes in English', () => {
    expect(formatDuration(0, 'en')).toBe('0m');
  });

  it('should format minutes only in Arabic', () => {
    expect(formatDuration(45, 'ar')).toBe('45 دقيقة');
  });

  it('should format hours only in Arabic', () => {
    expect(formatDuration(120, 'ar')).toBe('2 ساعة');
  });

  it('should format days only in Arabic', () => {
    expect(formatDuration(MINUTES_PER_WORK_DAY * 3, 'ar')).toBe('3 يوم');
  });

  it('should format mixed duration in Arabic', () => {
    const minutes = MINUTES_PER_WORK_DAY + 2 * MINUTES_PER_HOUR + 30;
    const result = formatDuration(minutes, 'ar');
    expect(result).toContain('1 يوم');
    expect(result).toContain('2 ساعة');
    expect(result).toContain('30 دقيقة');
  });

  it('should format in English compact mode', () => {
    expect(formatDuration(MINUTES_PER_WORK_DAY + MINUTES_PER_HOUR, 'en', { compact: true })).toBe('1d 1h');
  });

  it('should respect showDays/showHours/showMinutes options', () => {
    const minutes = MINUTES_PER_WORK_DAY + MINUTES_PER_HOUR + 30;
    expect(formatDuration(minutes, 'ar', { showDays: false })).not.toContain('يوم');
    expect(formatDuration(minutes, 'ar', { showHours: false })).not.toContain('ساعة');
    expect(formatDuration(minutes, 'ar', { showMinutes: false })).not.toContain('دقيقة');
  });

  it('should format hours only in English', () => {
    expect(formatDuration(180, 'en')).toBe('3h');
  });

  it('should format minutes only in English', () => {
    expect(formatDuration(30, 'en')).toBe('30m');
  });
});

// ============================================
// Full Duration Formatting
// ============================================

describe('formatDurationFull', () => {
  it('should return empty string for null', () => {
    expect(formatDurationFull(null, 'ar')).toBe('');
  });

  it('should format less than a minute in Arabic', () => {
    expect(formatDurationFull(0, 'ar')).toBe('أقل من دقيقة');
  });

  it('should format less than a minute in English', () => {
    expect(formatDurationFull(0, 'en')).toBe('less than a minute');
  });

  it('should use singular forms in Arabic for 1 unit', () => {
    expect(formatDurationFull(MINUTES_PER_WORK_DAY, 'ar')).toContain('يوم');
    expect(formatDurationFull(MINUTES_PER_HOUR, 'ar')).toContain('ساعة');
    expect(formatDurationFull(1, 'ar')).toContain('دقيقة');
  });

  it('should use plural forms in Arabic for multiple units', () => {
    expect(formatDurationFull(MINUTES_PER_WORK_DAY * 3, 'ar')).toContain('أيام');
    expect(formatDurationFull(MINUTES_PER_HOUR * 2, 'ar')).toContain('ساعات');
    expect(formatDurationFull(5, 'ar')).toContain('دقائق');
  });

  it('should use singular/plural forms in English', () => {
    expect(formatDurationFull(MINUTES_PER_HOUR, 'en')).toContain('1 hour');
    expect(formatDurationFull(MINUTES_PER_HOUR * 3, 'en')).toContain('3 hours');
  });

  it('should join parts with "و" in Arabic', () => {
    const minutes = MINUTES_PER_WORK_DAY + MINUTES_PER_HOUR;
    expect(formatDurationFull(minutes, 'ar')).toContain('و');
  });

  it('should join parts with "and" in English', () => {
    const minutes = MINUTES_PER_WORK_DAY + MINUTES_PER_HOUR;
    expect(formatDurationFull(minutes, 'en')).toContain('and');
  });
});

// ============================================
// Parse Duration To Minutes
// ============================================

describe('parseDurationToMinutes', () => {
  it('should return null for empty string', () => {
    expect(parseDurationToMinutes('')).toBeNull();
  });

  it('should parse plain number as minutes', () => {
    expect(parseDurationToMinutes('45')).toBe(45);
  });

  it('should parse "3d" as 3 work days', () => {
    expect(parseDurationToMinutes('3d')).toBe(3 * MINUTES_PER_WORK_DAY);
  });

  it('should parse "2 hours" as 120 minutes', () => {
    expect(parseDurationToMinutes('2 hours')).toBe(120);
  });

  it('should parse "1h 30m" combined format', () => {
    const result = parseDurationToMinutes('1h 30m');
    expect(result).toBe(90);
  });

  it('should parse "2 days 3 hours 15 minutes"', () => {
    const result = parseDurationToMinutes('2 days 3 hours 15 minutes');
    expect(result).toBe(2 * MINUTES_PER_WORK_DAY + 3 * MINUTES_PER_HOUR + 15);
  });

  it('should parse Arabic format "3 أيام"', () => {
    expect(parseDurationToMinutes('3 أيام')).toBe(3 * MINUTES_PER_WORK_DAY);
  });

  it('should parse Arabic format "ساعة"', () => {
    expect(parseDurationToMinutes('1 ساعة')).toBe(MINUTES_PER_HOUR);
  });

  it('should parse Arabic format "دقيقة"', () => {
    expect(parseDurationToMinutes('30 دقيقة')).toBe(30);
  });

  it('should be case insensitive', () => {
    expect(parseDurationToMinutes('2H')).toBe(120);
    expect(parseDurationToMinutes('1HOUR')).toBe(60);
  });

  it('should return null for non-numeric string', () => {
    expect(parseDurationToMinutes('not a number')).toBeNull();
  });
});

// ============================================
// Convert Duration
// ============================================

describe('convertDuration', () => {
  it('should convert hours to minutes', () => {
    expect(convertDuration(3, 'hours', 'minutes')).toBe(180);
  });

  it('should convert minutes to hours', () => {
    expect(convertDuration(120, 'minutes', 'hours')).toBe(2);
  });

  it('should convert days to hours', () => {
    expect(convertDuration(2, 'days', 'hours')).toBe(HOURS_PER_WORK_DAY * 2);
  });

  it('should convert days to minutes', () => {
    expect(convertDuration(1, 'days', 'minutes')).toBe(MINUTES_PER_WORK_DAY);
  });

  it('should convert hours to days', () => {
    expect(convertDuration(HOURS_PER_WORK_DAY, 'hours', 'days')).toBe(1);
  });

  it('should keep same unit unchanged', () => {
    expect(convertDuration(60, 'minutes', 'minutes')).toBe(60);
  });

  it('should handle fractional conversions', () => {
    expect(convertDuration(1, 'days', 'hours')).toBe(HOURS_PER_WORK_DAY);
  });
});

// ============================================
// Legacy Compatibility
// ============================================

describe('Legacy Duration Functions', () => {
  it('hoursToMinutes should round result', () => {
    expect(hoursToMinutes(2.5)).toBe(150);
  });

  it('minutesToHours should not round', () => {
    expect(minutesToHours(90)).toBe(1.5);
  });

  it('constants should be correct', () => {
    expect(MINUTES_PER_HOUR).toBe(60);
    expect(HOURS_PER_WORK_DAY).toBe(8);
    expect(MINUTES_PER_WORK_DAY).toBe(480);
  });
});

// ============================================
// SLA Status Calculation
// ============================================

describe('calculateSLAStatus', () => {
  it('should calculate on-track SLA', () => {
    const start = new Date();
    start.setDate(start.getDate() - 3);
    const result = calculateSLAStatus(start, 14);
    expect(result.status).toBe('on-track');
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it('should calculate warning SLA (1 day remaining)', () => {
    const start = new Date();
    start.setDate(start.getDate() - 4);
    const result = calculateSLAStatus(start, 5);
    expect(result.status).toBe('warning');
    expect(result.daysRemaining).toBeLessThanOrEqual(1);
  });

  it('should calculate breached SLA', () => {
    const start = new Date();
    start.setDate(start.getDate() - 20);
    const result = calculateSLAStatus(start, 14);
    expect(result.status).toBe('breached');
    expect(result.daysRemaining).toBeLessThan(0);
  });

  it('should calculate critical SLA (2x SLA days exceeded)', () => {
    const start = new Date();
    start.setDate(start.getDate() - 35);
    const result = calculateSLAStatus(start, 14);
    expect(result.status).toBe('critical');
  });

  it('should calculate correct days elapsed', () => {
    const start = new Date();
    start.setDate(start.getDate() - 5);
    const result = calculateSLAStatus(start, 10);
    expect(result.daysElapsed).toBe(5);
    expect(result.daysRemaining).toBe(5);
  });

  it('should cap percentage at 100', () => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const result = calculateSLAStatus(start, 10);
    expect(result.percentage).toBeLessThanOrEqual(100);
  });
});

// ============================================
// Duration Color Utilities
// ============================================

describe('getDurationColor', () => {
  it('should return green for on-track', () => {
    expect(getDurationColor('on-track')).toBe('#10B981');
  });

  it('should return amber for warning', () => {
    expect(getDurationColor('warning')).toBe('#F59E0B');
  });

  it('should return red for breached', () => {
    expect(getDurationColor('breached')).toBe('#EF4444');
  });

  it('should return dark red for critical', () => {
    expect(getDurationColor('critical')).toBe('#991B1B');
  });
});

describe('getDurationBgColor', () => {
  it('should return light green for on-track', () => {
    expect(getDurationBgColor('on-track')).toBe('#D1FAE5');
  });

  it('should return light yellow for warning', () => {
    expect(getDurationBgColor('warning')).toBe('#FEF3C7');
  });

  it('should return light red for breached', () => {
    expect(getDurationBgColor('breached')).toBe('#FEE2E2');
  });

  it('should return light red for critical', () => {
    expect(getDurationBgColor('critical')).toBe('#FEE2E2');
  });
});

// ============================================
// Number / Currency Formatting (shared helpers)
// ============================================

describe('Number Formatting', () => {
  it('should format currency with Intl.NumberFormat', () => {
    const formatter = new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const result = formatter.format(500000);
    expect(result).toContain('500');
  });

  it('should format currency in English with USD', () => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    const result = formatter.format(1234.5);
    expect(result).toContain('1,234.50');
  });

  it('should format large numbers with commas', () => {
    const formatter = new Intl.NumberFormat('en-US');
    expect(formatter.format(1000000)).toBe('1,000,000');
  });

  it('should format percentages', () => {
    const pct = (75.5).toFixed(1);
    expect(pct).toBe('75.5');
  });
});

// ============================================
// Date Formatting
// ============================================

describe('Date Formatting', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2025-01-15');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    expect(`${year}-${month}-${day}`).toBe('2025-01-15');
  });

  it('should format date with Intl.DateTimeFormat (Arabic)', () => {
    const formatter = new Intl.DateTimeFormat('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const result = formatter.format(new Date('2025-01-15'));
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should format date with Intl.DateTimeFormat (English)', () => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const result = formatter.format(new Date('2025-06-10'));
    expect(result).toBeDefined();
    expect(result).toContain('2025');
  });

  it('should calculate relative time (days ago)', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const diffMs = Date.now() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(5);
  });

  it('should parse ISO date string', () => {
    const date = new Date('2025-03-20T10:30:00.000Z');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(2); // March is 0-indexed
    expect(date.getDate()).toBe(20);
  });
});
