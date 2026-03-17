/**
 * Tests for Gantt Chart Utility Functions
 * اختبارات دوال مخطط جانت المساعدة
 */

// Utility functions for Gantt chart calculations
export function calculateTaskPosition(
  startDate: Date,
  endDate: Date,
  viewStart: Date,
  viewEnd: Date
): { left: number; width: number } | null {
  const totalDays = Math.ceil(
    (viewEnd.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const startOffset = Math.ceil(
    (startDate.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const endOffset = Math.ceil(
    (endDate.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Task is outside view range
  if (endOffset < 0 || startOffset > totalDays) {
    return null;
  }
  
  const left = Math.max(0, (startOffset / totalDays) * 100);
  const width = Math.min(
    100 - left,
    ((endOffset - Math.max(0, startOffset)) / totalDays) * 100
  );
  
  return { left, width: Math.max(2, width) };
}

export function getTasksByStatus(tasks: any[], status: string): any[] {
  return tasks.filter(task => task.status === status);
}

export function getOverdueTasks(tasks: any[]): any[] {
  const now = new Date();
  return tasks.filter(task => 
    task.endDate && 
    new Date(task.endDate) < now && 
    task.status !== 'done'
  );
}

export function calculateProgress(tasks: any[]): number {
  if (tasks.length === 0) return 0;
  
  const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
  return Math.round(totalProgress / tasks.length);
}

export function formatGanttDate(date: Date, lang: 'ar' | 'en'): string {
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

describe('Gantt Chart Utilities', () => {
  describe('calculateTaskPosition', () => {
    const viewStart = new Date('2024-01-01');
    const viewEnd = new Date('2024-01-31');
    
    it('should calculate correct position for task in view', () => {
      const startDate = new Date('2024-01-10');
      const endDate = new Date('2024-01-20');
      
      const position = calculateTaskPosition(startDate, endDate, viewStart, viewEnd);
      
      expect(position).not.toBeNull();
      expect(position!.left).toBeGreaterThan(0);
      expect(position!.width).toBeGreaterThan(0);
    });

    it('should return null for task before view range', () => {
      const startDate = new Date('2023-12-01');
      const endDate = new Date('2023-12-31');
      
      const position = calculateTaskPosition(startDate, endDate, viewStart, viewEnd);
      
      expect(position).toBeNull();
    });

    it('should return null for task after view range', () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-28');
      
      const position = calculateTaskPosition(startDate, endDate, viewStart, viewEnd);
      
      expect(position).toBeNull();
    });

    it('should handle task spanning entire view', () => {
      const position = calculateTaskPosition(viewStart, viewEnd, viewStart, viewEnd);
      
      expect(position).not.toBeNull();
      expect(position!.left).toBe(0);
      expect(position!.width).toBeGreaterThan(0);
    });

    it('should return minimum width of 2', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-15'); // Same day
      
      const position = calculateTaskPosition(startDate, endDate, viewStart, viewEnd);
      
      expect(position).not.toBeNull();
      expect(position!.width).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getTasksByStatus', () => {
    const tasks = [
      { id: '1', status: 'todo' },
      { id: '2', status: 'in_progress' },
      { id: '3', status: 'done' },
      { id: '4', status: 'todo' },
    ];

    it('should filter tasks by todo status', () => {
      const result = getTasksByStatus(tasks, 'todo');
      expect(result).toHaveLength(2);
    });

    it('should filter tasks by in_progress status', () => {
      const result = getTasksByStatus(tasks, 'in_progress');
      expect(result).toHaveLength(1);
    });

    it('should return empty array for non-existent status', () => {
      const result = getTasksByStatus(tasks, 'cancelled');
      expect(result).toHaveLength(0);
    });
  });

  describe('getOverdueTasks', () => {
    it('should identify overdue tasks', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const tasks = [
        { id: '1', endDate: pastDate.toISOString(), status: 'todo' },
        { id: '2', endDate: pastDate.toISOString(), status: 'done' },
      ];
      
      const overdue = getOverdueTasks(tasks);
      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe('1');
    });

    it('should not include completed tasks', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const tasks = [
        { id: '1', endDate: pastDate.toISOString(), status: 'done' },
      ];
      
      const overdue = getOverdueTasks(tasks);
      expect(overdue).toHaveLength(0);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate average progress', () => {
      const tasks = [
        { progress: 50 },
        { progress: 75 },
        { progress: 25 },
      ];
      
      expect(calculateProgress(tasks)).toBe(50);
    });

    it('should return 0 for empty array', () => {
      expect(calculateProgress([])).toBe(0);
    });

    it('should handle tasks without progress', () => {
      const tasks = [
        { progress: 100 },
        {}, // no progress
        { progress: 50 },
      ];
      
      expect(calculateProgress(tasks)).toBe(50);
    });
  });

  describe('formatGanttDate', () => {
    it('should format date in English', () => {
      const date = new Date('2024-01-15');
      const result = formatGanttDate(date, 'en');
      
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });

    it('should format date in Arabic', () => {
      const date = new Date('2024-01-15');
      const result = formatGanttDate(date, 'ar');
      
      // Arabic date format
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getWorkingDays', () => {
    it('should count working days correctly', () => {
      const start = new Date('2024-01-08'); // Monday
      const end = new Date('2024-01-12'); // Friday
      
      expect(getWorkingDays(start, end)).toBe(5);
    });

    it('should exclude weekends', () => {
      const start = new Date('2024-01-08'); // Monday
      const end = new Date('2024-01-14'); // Sunday
      
      expect(getWorkingDays(start, end)).toBe(5);
    });

    it('should handle single day', () => {
      const date = new Date('2024-01-08'); // Monday
      
      expect(getWorkingDays(date, date)).toBe(1);
    });

    it('should return 0 for weekend only', () => {
      const start = new Date('2024-01-13'); // Saturday
      const end = new Date('2024-01-14'); // Sunday
      
      expect(getWorkingDays(start, end)).toBe(0);
    });
  });
});
