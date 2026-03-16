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

export interface ProjectStatusData {
  name: string;
  value: number;
  color?: string;
}

interface ProjectStatusChartProps {
  data: ProjectStatusData[];
  language?: 'ar' | 'en';
  innerRadius?: number;
  outerRadius?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  active: { ar: 'نشط', en: 'Active' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  pending: { ar: 'معلق', en: 'Pending' },
  on_hold: { ar: 'متوقف', en: 'On Hold' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

export function ProjectStatusChart({
  data,
  language = 'ar',
  innerRadius = 60,
  outerRadius = 100,
}: ProjectStatusChartProps) {
  const localizedConfig = data.reduce((acc, item, index) => {
    const statusInfo = STATUS_LABELS[item.name.toLowerCase().replace(' ', '_')];
    acc[item.name] = {
      label: statusInfo ? statusInfo[language] : item.name,
      color: item.color || COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
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
          label={renderCustomizedLabel}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
          animationDuration={1000}
          animationBegin={0}
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
                const statusInfo = STATUS_LABELS[name as string]?.[language] || name;
                return `${statusInfo}: ${value}`;
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  );
}

// Donut chart variant
export function ProjectDonutChart({
  data,
  language = 'ar',
  innerRadius = 70,
  outerRadius = 100,
}: ProjectStatusChartProps) {
  const localizedConfig = data.reduce((acc, item, index) => {
    const statusInfo = STATUS_LABELS[item.name.toLowerCase().replace(' ', '_')];
    acc[item.name] = {
      label: statusInfo ? statusInfo[language] : item.name,
      color: item.color || COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer config={localizedConfig} className="h-[300px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
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
                const statusInfo = STATUS_LABELS[name as string]?.[language] || name;
                const percent = ((value as number) / total) * 100;
                return `${statusInfo}: ${value} (${percent.toFixed(1)}%)`;
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
          className="fill-white text-2xl font-bold"
        >
          {total}
        </text>
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-400 text-sm"
        >
          {language === 'ar' ? 'مجموع' : 'Total'}
        </text>
      </PieChart>
    </ChartContainer>
  );
}
