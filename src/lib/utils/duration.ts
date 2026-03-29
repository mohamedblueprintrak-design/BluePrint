/**
 * Duration Formatting Utilities
// أدوات تنسيق المدة
 * 
 * Unified time duration handling with minutes as base unit.
 * الدالة الموحدة للتعامل مع الوقت مع الدقائق كوحدة أساسية.
 */

// ============================================
// Types
// ============================================

export interface DurationBreakdown {
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
}

export type Locale = 'ar' | 'en';

// ============================================
// Conversion Constants
// ============================================

export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_WORK_DAY = 8; // Standard work day
export const MINUTES_PER_WORK_DAY = MINUTES_PER_HOUR * HOURS_PER_WORK_DAY;

// ============================================
// Duration Functions
// ============================================

/**
 * Convert minutes to detailed breakdown
 * تحويل الدقائق إلى تفصيل كامل
 */
export function breakdownMinutes(minutes: number): DurationBreakdown {
  const totalMinutes = Math.abs(minutes);
  
  const days = Math.floor(totalMinutes / MINUTES_PER_WORK_DAY);
  const remainingAfterDays = totalMinutes % MINUTES_PER_WORK_DAY;
  
  const hours = Math.floor(remainingAfterDays / MINUTES_PER_HOUR);
  const mins = remainingAfterDays % MINUTES_PER_HOUR;
  
  return {
    days,
    hours,
    minutes: mins,
    totalMinutes,
    totalHours: totalMinutes / MINUTES_PER_HOUR,
    totalDays: totalMinutes / MINUTES_PER_WORK_DAY,
  };
}

/**
 * Format duration for display
 * تنسيق المدة للعرض
 */
export function formatDuration(
  minutes: number | null | undefined,
  locale: Locale = 'ar',
  options: {
    showDays?: boolean;
    showHours?: boolean;
    showMinutes?: boolean;
    compact?: boolean;
  } = {}
): string {
  if (minutes === null || minutes === undefined) return '';
  
  const {
    showDays = true,
    showHours = true,
    showMinutes = true,
    compact = false,
  } = options;

  const breakdown = breakdownMinutes(minutes);
  const parts: string[] = [];

  if (locale === 'ar') {
    if (showDays && breakdown.days > 0) {
      parts.push(`${breakdown.days} يوم`);
    }
    if (showHours && breakdown.hours > 0) {
      parts.push(`${breakdown.hours} ساعة`);
    }
    if (showMinutes && breakdown.minutes > 0) {
      parts.push(`${breakdown.minutes} دقيقة`);
    }
    
    if (parts.length === 0) {
      return showMinutes ? '0 دقيقة' : '0';
    }
    
    return compact ? parts.join(' ') : parts.join(' و ');
  } else {
    // English
    if (showDays && breakdown.days > 0) {
      parts.push(`${breakdown.days}d`);
    }
    if (showHours && breakdown.hours > 0) {
      parts.push(`${breakdown.hours}h`);
    }
    if (showMinutes && breakdown.minutes > 0) {
      parts.push(`${breakdown.minutes}m`);
    }
    
    if (parts.length === 0) {
      return showMinutes ? '0m' : '0';
    }
    
    return parts.join(' ');
  }
}

/**
 * Format duration in full text
 * تنسيق المدة بنص كامل
 */
export function formatDurationFull(
  minutes: number | null | undefined,
  locale: Locale = 'ar'
): string {
  if (minutes === null || minutes === undefined) return '';

  const breakdown = breakdownMinutes(minutes);
  const parts: string[] = [];

  if (locale === 'ar') {
    if (breakdown.days > 0) {
      parts.push(`${breakdown.days} ${breakdown.days === 1 ? 'يوم' : 'أيام'}`);
    }
    if (breakdown.hours > 0) {
      parts.push(`${breakdown.hours} ${breakdown.hours === 1 ? 'ساعة' : 'ساعات'}`);
    }
    if (breakdown.minutes > 0) {
      parts.push(`${breakdown.minutes} ${breakdown.minutes === 1 ? 'دقيقة' : 'دقائق'}`);
    }
    
    return parts.length > 0 ? parts.join(' و ') : 'أقل من دقيقة';
  } else {
    if (breakdown.days > 0) {
      parts.push(`${breakdown.days} ${breakdown.days === 1 ? 'day' : 'days'}`);
    }
    if (breakdown.hours > 0) {
      parts.push(`${breakdown.hours} ${breakdown.hours === 1 ? 'hour' : 'hours'}`);
    }
    if (breakdown.minutes > 0) {
      parts.push(`${breakdown.minutes} ${breakdown.minutes === 1 ? 'minute' : 'minutes'}`);
    }
    
    return parts.length > 0 ? parts.join(' and ') : 'less than a minute';
  }
}

/**
 * Parse duration string to minutes
 * تحويل نص المدة إلى دقائق
 */
export function parseDurationToMinutes(input: string): number | null {
  if (!input) return null;
  
  const normalized = input.toLowerCase().trim();
  let totalMinutes = 0;
  
  // Match patterns like "5 days", "3d", "2 hours", "1h 30m"
  const dayMatch = normalized.match(/(\d+)\s*(?:days?|d|أيام?|يوم)/);
  const hourMatch = normalized.match(/(\d+)\s*(?:hours?|h|ساعات?|ساعة)/);
  const minMatch = normalized.match(/(\d+)\s*(?:minutes?|m|min|دقائق?|دقيقة)/);
  
  if (dayMatch) {
    totalMinutes += parseInt(dayMatch[1]) * MINUTES_PER_WORK_DAY;
  }
  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1]) * MINUTES_PER_HOUR;
  }
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1]);
  }
  
  // If no pattern matched, try to parse as plain number (assume minutes)
  if (totalMinutes === 0) {
    const num = parseInt(normalized);
    if (!isNaN(num)) {
      return num;
    }
    return null;
  }
  
  return totalMinutes;
}

/**
 * Convert between units
 * التحويل بين الوحدات
 */
export function convertDuration(
  value: number,
  fromUnit: 'minutes' | 'hours' | 'days',
  toUnit: 'minutes' | 'hours' | 'days'
): number {
  // First convert to minutes
  let minutes: number;
  
  switch (fromUnit) {
    case 'days':
      minutes = value * MINUTES_PER_WORK_DAY;
      break;
    case 'hours':
      minutes = value * MINUTES_PER_HOUR;
      break;
    case 'minutes':
    default:
      minutes = value;
  }
  
  // Then convert to target unit
  switch (toUnit) {
    case 'days':
      return minutes / MINUTES_PER_WORK_DAY;
    case 'hours':
      return minutes / MINUTES_PER_HOUR;
    case 'minutes':
    default:
      return minutes;
  }
}

/**
 * Calculate SLA status
 * حساب حالة SLA
 */
export function calculateSLAStatus(
  slaStartDate: Date,
  slaDays: number,
  currentDate: Date = new Date()
): {
  daysElapsed: number;
  daysRemaining: number;
  percentage: number;
  status: 'on-track' | 'warning' | 'breached' | 'critical';
} {
  const now = currentDate.getTime();
  const start = slaStartDate.getTime();
  const daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const daysRemaining = slaDays - daysElapsed;
  const percentage = Math.min(100, (daysElapsed / slaDays) * 100);
  
  let status: 'on-track' | 'warning' | 'breached' | 'critical';
  
  if (daysRemaining < 0) {
    status = daysRemaining < -slaDays * 0.5 ? 'critical' : 'breached';
  } else if (daysRemaining <= 1) {
    status = 'warning';
  } else {
    status = 'on-track';
  }
  
  return {
    daysElapsed,
    daysRemaining,
    percentage,
    status,
  };
}

/**
 * Get duration color based on status
 * الحصول على لون المدة بناءً على الحالة
 */
export function getDurationColor(
  status: 'on-track' | 'warning' | 'breached' | 'critical'
): string {
  const colors = {
    'on-track': '#10B981', // Green
    'warning': '#F59E0B',  // Yellow/Orange
    'breached': '#EF4444', // Red
    'critical': '#991B1B', // Dark Red
  };
  
  return colors[status];
}

/**
 * Get duration background color (lighter version)
 */
export function getDurationBgColor(
  status: 'on-track' | 'warning' | 'breached' | 'critical'
): string {
  const colors = {
    'on-track': '#D1FAE5', // Light Green
    'warning': '#FEF3C7',  // Light Yellow
    'breached': '#FEE2E2', // Light Red
    'critical': '#FEE2E2', // Light Red
  };
  
  return colors[status];
}

// ============================================
// Legacy Compatibility Functions
// ============================================

/**
 * Convert hours to minutes (for backward compatibility)
 */
export function hoursToMinutes(hours: number): number {
  return Math.round(hours * MINUTES_PER_HOUR);
}

/**
 * Convert minutes to hours (for backward compatibility)
 */
export function minutesToHours(minutes: number): number {
  return minutes / MINUTES_PER_HOUR;
}

export default {
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
};
