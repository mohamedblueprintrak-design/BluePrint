'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

export interface TaskCompletionData {
  day: string;
  completed: number;
  pending: number;
  total?: number;
}

interface TaskCompletionChartProps {
  data: TaskCompletionData[];
  language?: 'ar' | 'en';
}

const COLORS = {
  completed: '#10b981',
  pending: '#f59e0b',
  total: '#3b82f6',
};

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TaskCompletionChart({ data, language = 'ar' }: TaskCompletionChartProps) {
  const localizedConfig = {
    completed: {
      label: language === 'ar' ? 'مكتمل' : 'Completed',
      color: COLORS.completed,
    },
    pending: {
      label: language === 'ar' ? 'معلق' : 'Pending',
      color: COLORS.pending,
    },
    total: {
      label: language === 'ar' ? 'المجموع' : 'Total',
      color: COLORS.total,
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={localizedConfig} className="h-[300px] w-full">
      <BarChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis
          dataKey="day"
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          tickLine={{ stroke: '#374151' }}
          axisLine={{ stroke: '#374151' }}
        />
        <YAxis
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          tickLine={{ stroke: '#374151' }}
          axisLine={{ stroke: '#374151' }}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="completed"
          fill={COLORS.completed}
          radius={[4, 4, 0, 0]}
          animationDuration={800}
          animationBegin={0}
        />
        <Bar
          dataKey="pending"
          fill={COLORS.pending}
          radius={[4, 4, 0, 0]}
          animationDuration={1000}
          animationBegin={200}
        />
      </BarChart>
    </ChartContainer>
  );
}

// Horizontal bar chart variant
export function TaskCompletionHorizontalChart({ data, language = 'ar' }: TaskCompletionChartProps) {
  const localizedConfig = {
    completed: {
      label: language === 'ar' ? 'مكتمل' : 'Completed',
      color: COLORS.completed,
    },
    pending: {
      label: language === 'ar' ? 'معلق' : 'Pending',
      color: COLORS.pending,
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={localizedConfig} className="h-[300px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
        <XAxis
          type="number"
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="day"
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          width={80}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="completed"
          fill={COLORS.completed}
          radius={[0, 4, 4, 0]}
          animationDuration={800}
        />
        <Bar
          dataKey="pending"
          fill={COLORS.pending}
          radius={[0, 4, 4, 0]}
          animationDuration={1000}
        />
      </BarChart>
    </ChartContainer>
  );
}

// Generate weekly task data helper
export function generateWeeklyTaskData(language: 'ar' | 'en' = 'ar'): TaskCompletionData[] {
  const days = language === 'ar' ? WEEKDAYS_AR : WEEKDAYS_EN;
  return days.map((day) => ({
    day,
    completed: Math.floor(Math.random() * 20) + 5,
    pending: Math.floor(Math.random() * 10) + 1,
  }));
}

// Generate monthly task data helper
export function generateMonthlyTaskData(language: 'ar' | 'en' = 'ar'): TaskCompletionData[] {
  const months = language === 'ar'
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return months.map((month) => ({
    day: month,
    completed: Math.floor(Math.random() * 50) + 20,
    pending: Math.floor(Math.random() * 30) + 10,
  }));
}
