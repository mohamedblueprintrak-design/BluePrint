'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

export interface RevenueData {
  month: string;
  revenue: number;
  expenses?: number;
  profit?: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  formatCurrency?: (value: number) => string;
  language?: 'ar' | 'en';
}

export function RevenueChart({ data, formatCurrency, language = 'ar' }: RevenueChartProps) {
  const formatValue = (value: number) => {
    if (formatCurrency) return formatCurrency(value);
    return value.toLocaleString();
  };

  const localizedConfig = {
    revenue: {
      label: language === 'ar' ? 'الإيرادات' : 'Revenue',
      color: '#3b82f6',
    },
    expenses: {
      label: language === 'ar' ? 'المصروفات' : 'Expenses',
      color: '#ef4444',
    },
    profit: {
      label: language === 'ar' ? 'الربح' : 'Profit',
      color: '#10b981',
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={localizedConfig} className="h-[300px] w-full">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="month"
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          tickLine={{ stroke: '#374151' }}
        />
        <YAxis
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          tickLine={{ stroke: '#374151' }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value;
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatValue(value as number)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorRevenue)"
          strokeWidth={2}
          animationDuration={1000}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#ef4444"
          fillOpacity={1}
          fill="url(#colorExpenses)"
          strokeWidth={2}
          animationDuration={1200}
        />
        <Area
          type="monotone"
          dataKey="profit"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorProfit)"
          strokeWidth={2}
          animationDuration={1400}
        />
      </AreaChart>
    </ChartContainer>
  );
}

// Line Chart variant for revenue
export function RevenueLineChart({ data, formatCurrency, language = 'ar' }: RevenueChartProps) {
  const formatValue = (value: number) => {
    if (formatCurrency) return formatCurrency(value);
    return value.toLocaleString();
  };

  const localizedConfig = {
    revenue: {
      label: language === 'ar' ? 'الإيرادات' : 'Revenue',
      color: '#3b82f6',
    },
    expenses: {
      label: language === 'ar' ? 'المصروفات' : 'Expenses',
      color: '#ef4444',
    },
    profit: {
      label: language === 'ar' ? 'الربح' : 'Profit',
      color: '#10b981',
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={localizedConfig} className="h-[300px] w-full">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="month"
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
        />
        <YAxis
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value;
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatValue(value as number)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.1}
          strokeWidth={3}
          animationDuration={1000}
        />
      </AreaChart>
    </ChartContainer>
  );
}
