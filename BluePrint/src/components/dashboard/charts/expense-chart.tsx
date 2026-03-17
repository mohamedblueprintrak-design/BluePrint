'use client';

import { PieChart, Pie, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

export interface ExpenseData {
  category: string;
  amount: number;
  percentage?: number;
  color?: string;
}

interface ExpenseChartProps {
  data: ExpenseData[];
  formatCurrency?: (value: number) => string;
  language?: 'ar' | 'en';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  materials: { ar: 'مواد', en: 'Materials' },
  labor: { ar: 'عمالة', en: 'Labor' },
  equipment: { ar: 'معدات', en: 'Equipment' },
  transportation: { ar: 'نقل', en: 'Transportation' },
  utilities: { ar: 'مرافق', en: 'Utilities' },
  miscellaneous: { ar: 'متفرقات', en: 'Miscellaneous' },
  salaries: { ar: 'رواتب', en: 'Salaries' },
  rent: { ar: 'إيجار', en: 'Rent' },
  insurance: { ar: 'تأمين', en: 'Insurance' },
  maintenance: { ar: 'صيانة', en: 'Maintenance' },
  marketing: { ar: 'تسويق', en: 'Marketing' },
  other: { ar: 'أخرى', en: 'Other' },
};

export function ExpenseChart({ data, formatCurrency, language = 'ar' }: ExpenseChartProps) {
  const formatValue = (value: number) => {
    if (formatCurrency) return formatCurrency(value);
    return value.toLocaleString();
  };

  const localizedConfig = data.reduce((acc, item, index) => {
    const categoryInfo = CATEGORY_LABELS[item.category.toLowerCase().replace(' ', '_')];
    acc[item.category] = {
      label: categoryInfo ? categoryInfo[language] : item.category,
      color: item.color || COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !percent || percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartContainer config={localizedConfig} className="h-[300px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="amount"
          animationDuration={1000}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || COLORS[index % COLORS.length]}
              stroke="#1f2937"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const categoryInfo = CATEGORY_LABELS[name as string]?.[language] || name;
                const percent = ((value as number) / total) * 100;
                return `${categoryInfo}: ${formatValue(value as number)} (${percent.toFixed(1)}%)`;
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  );
}

// Expense donut chart
export function ExpenseDonutChart({ data, formatCurrency, language = 'ar' }: ExpenseChartProps) {
  const formatValue = (value: number) => {
    if (formatCurrency) return formatCurrency(value);
    return value.toLocaleString();
  };

  const localizedConfig = data.reduce((acc, item, index) => {
    const categoryInfo = CATEGORY_LABELS[item.category.toLowerCase().replace(' ', '_')];
    acc[item.category] = {
      label: categoryInfo ? categoryInfo[language] : item.category,
      color: item.color || COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ChartContainer config={localizedConfig} className="h-[300px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          fill="#8884d8"
          dataKey="amount"
          animationDuration={1000}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || COLORS[index % COLORS.length]}
              stroke="#1f2937"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const categoryInfo = CATEGORY_LABELS[name as string]?.[language] || name;
                const percent = ((value as number) / total) * 100;
                return `${categoryInfo}: ${formatValue(value as number)} (${percent.toFixed(1)}%)`;
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white text-lg font-bold"
        >
          {formatValue(total)}
        </text>
      </PieChart>
    </ChartContainer>
  );
}

// Generate sample expense data
export function generateExpenseData(): ExpenseData[] {
  return [
    { category: 'Materials', amount: 45000 },
    { category: 'Labor', amount: 32000 },
    { category: 'Equipment', amount: 18000 },
    { category: 'Transportation', amount: 12000 },
    { category: 'Utilities', amount: 8000 },
    { category: 'Miscellaneous', amount: 5000 },
  ];
}
