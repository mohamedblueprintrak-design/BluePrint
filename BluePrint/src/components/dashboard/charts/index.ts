export {
  RevenueChart,
  RevenueLineChart,
  type RevenueData,
} from './revenue-chart';

export {
  ProjectStatusChart,
  ProjectDonutChart,
  type ProjectStatusData,
} from './project-status-chart';

export {
  TaskCompletionChart,
  TaskCompletionHorizontalChart,
  generateWeeklyTaskData,
  generateMonthlyTaskData,
  type TaskCompletionData,
} from './task-completion-chart';

export {
  ExpenseChart,
  ExpenseDonutChart,
  generateExpenseData,
  type ExpenseData,
} from './expense-chart';

// Shared color palette for charts
export const CHART_COLORS = {
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  pink: '#ec4899',
  lime: '#84cc16',
  orange: '#f97316',
  teal: '#14b8a6',
};

// Default color array for chart series
export const CHART_COLOR_PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];
