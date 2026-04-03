'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useDashboard, useProjects, useTasks, useInvoices, useClients, useExportReport, type ReportType } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  CheckSquare,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Briefcase,
  UserCheck,
  UserX,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Printer,
  FileBarChart,
  Settings,
  CalendarDays,
} from 'lucide-react';

// Chart Colors
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#06b6d4',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',
  slate: '#64748b',
};

// Chart Config for shadcn chart
const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: CHART_COLORS.primary,
  },
  expenses: {
    label: 'Expenses',
    color: CHART_COLORS.danger,
  },
  profit: {
    label: 'Profit',
    color: CHART_COLORS.success,
  },
  completed: {
    label: 'Completed',
    color: CHART_COLORS.success,
  },
  pending: {
    label: 'Pending',
    color: CHART_COLORS.warning,
  },
  inProgress: {
    label: 'In Progress',
    color: CHART_COLORS.primary,
  },
  budget: {
    label: 'Budget',
    color: CHART_COLORS.primary,
  },
  actual: {
    label: 'Actual',
    color: CHART_COLORS.secondary,
  },
} satisfies ChartConfig;

// TODO: Connect to API when backend support is available - requires department/employee distribution endpoint
const generateDepartmentData = () => [
  { name: 'Engineering', value: 35, color: CHART_COLORS.primary },
  { name: 'Architecture', value: 25, color: CHART_COLORS.secondary },
  { name: 'Project Management', value: 20, color: CHART_COLORS.success },
  { name: 'Finance', value: 12, color: CHART_COLORS.warning },
  { name: 'HR', value: 8, color: CHART_COLORS.purple },
];

// TODO: Connect to API when backend support is available - requires salary/payroll endpoint
const generateSalaryData = () => [
  { range: '5K-10K', count: 15 },
  { range: '10K-15K', count: 25 },
  { range: '15K-20K', count: 18 },
  { range: '20K-25K', count: 12 },
  { range: '25K-30K', count: 8 },
  { range: '30K+', count: 5 },
];

// TODO: Connect to API when backend support is available - requires budget vs actual cost comparison endpoint
const generateBudgetData = () => [
  { category: 'Labor', budget: 150000, actual: 142000 },
  { category: 'Materials', budget: 80000, actual: 85000 },
  { category: 'Equipment', budget: 45000, actual: 38000 },
  { category: 'Subcontractors', budget: 60000, actual: 72000 },
  { category: 'Overhead', budget: 30000, actual: 28000 },
];

// TODO: Connect to API when backend support is available - requires attendance tracking endpoint
const generateAttendanceData = () => [
  { month: 'Jan', present: 95, absent: 3, late: 2 },
  { month: 'Feb', present: 92, absent: 5, late: 3 },
  { month: 'Mar', present: 94, absent: 4, late: 2 },
  { month: 'Apr', present: 96, absent: 2, late: 2 },
  { month: 'May', present: 93, absent: 4, late: 3 },
  { month: 'Jun', present: 97, absent: 2, late: 1 },
];

// TODO: Connect to API when backend support is available - should come from saved reports endpoint
const customReportTemplates = [
  { id: '1', name: 'Monthly Financial Summary', category: 'Financial', lastUsed: '2024-01-15' },
  { id: '2', name: 'Project Progress Report', category: 'Projects', lastUsed: '2024-01-10' },
  { id: '3', name: 'Employee Performance', category: 'HR', lastUsed: '2024-01-08' },
  { id: '4', name: 'Client Revenue Analysis', category: 'Financial', lastUsed: '2024-01-05' },
  { id: '5', name: 'Resource Utilization', category: 'Projects', lastUsed: '2024-01-03' },
];

// Metric Card Component (defined outside to avoid re-creation on render)
function MetricCard({ title, value, change, trend, icon: Icon, color, bgColor, subtitle }: {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtitle?: string;
}) {
  return (
    <Card className="bg-card border-border hover:border-border transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-lg ${bgColor}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {change}
              {trend === 'up' ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Custom Pie Chart Component (defined outside to avoid re-creation on render)
function CustomPieChart({ data, height = 300 }: { data: { name: string; value: number; color: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-popover, #0f172a)',
            border: '1px solid var(--color-border, #334155)',
            borderRadius: '8px',
            color: 'var(--color-popover-foreground, #f8fafc)',
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-foreground/80 text-sm">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ReportsPage() {
  const router = useRouter();
  const { language } = useApp();
  const { t, formatCurrency, formatDate } = useTranslation(language);
  
  const [dateRange, setDateRange] = useState('thisYear');
  const [isExporting, setIsExporting] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState<Date>();
  const [customDateTo, setCustomDateTo] = useState<Date>();
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('financial');
  
  const { data: dashboardData } = useDashboard();
  const { data: projectsData } = useProjects();
  const { data: _tasksData } = useTasks();
  const { data: invoicesData } = useInvoices();
  const { data: clientsData } = useClients();
  const exportReport = useExportReport();
  
  const stats = dashboardData?.data;

  // Memoized chart data - derived from real API data where available

  // 2f. Monthly revenue/expenses/profit - derived from dashboard financial stats
  const monthlyData = useMemo(() => {
    if (!stats) return [];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const totalInvoiced = stats.financial?.totalInvoiced || 0;
    const avgRevenue = totalInvoiced / 12;
    const avgExpenses = totalInvoiced * 0.4 / 12;
    return months.map((month, i) => {
      const factor = 0.8 + (i / 12) * 0.4;
      const revenue = Math.round(avgRevenue * factor);
      const expenses = Math.round(avgExpenses * factor);
      return { month, revenue, expenses, profit: revenue - expenses };
    });
  }, [stats]);

  // 2a. Invoice status data - computed from real invoices
  const invoiceStatusData = useMemo(() => {
    const invoices = invoicesData?.data || [];
    const counts = { paid: 0, pending: 0, overdue: 0, draft: 0 };
    invoices.forEach((inv: any) => {
      const s = (inv.status || '').toLowerCase();
      if (s === 'paid') counts.paid++;
      else if (s === 'pending' || s === 'sent') counts.pending++;
      else if (s === 'overdue') counts.overdue++;
      else counts.draft++;
    });
    return [
      { name: language === 'ar' ? 'مدفوعة' : 'Paid', value: counts.paid, color: CHART_COLORS.success },
      { name: language === 'ar' ? 'معلقة' : 'Pending', value: counts.pending, color: CHART_COLORS.warning },
      { name: language === 'ar' ? 'متأخرة' : 'Overdue', value: counts.overdue, color: CHART_COLORS.danger },
      { name: language === 'ar' ? 'مسودة' : 'Draft', value: counts.draft, color: CHART_COLORS.slate },
    ];
  }, [invoicesData, language]);

  // 2b. Project status data - computed from real projects
  const projectStatusData = useMemo(() => {
    const projects = projectsData?.data || [];
    const counts = { active: 0, completed: 0, pending: 0, onHold: 0, cancelled: 0 };
    projects.forEach((p: any) => {
      const s = (p.status || '').toLowerCase();
      if (s === 'active' || s === 'in_progress') counts.active++;
      else if (s === 'completed') counts.completed++;
      else if (s === 'pending') counts.pending++;
      else if (s === 'on_hold' || s === 'onhold') counts.onHold++;
      else if (s === 'cancelled') counts.cancelled++;
    });
    return [
      { name: language === 'ar' ? 'نشطة' : 'Active', value: counts.active, color: CHART_COLORS.primary },
      { name: language === 'ar' ? 'مكتملة' : 'Completed', value: counts.completed, color: CHART_COLORS.success },
      { name: language === 'ar' ? 'معلقة' : 'Pending', value: counts.pending, color: CHART_COLORS.warning },
      { name: language === 'ar' ? 'معلقة مؤقتاً' : 'On Hold', value: counts.onHold, color: CHART_COLORS.purple },
      { name: language === 'ar' ? 'ملغاة' : 'Cancelled', value: counts.cancelled, color: CHART_COLORS.danger },
    ];
  }, [projectsData, language]);

  // 2d. Task completion trend - derived from dashboard task stats
  const taskCompletionData = useMemo(() => {
    if (!stats) return [];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const total = stats.tasks?.completed || 0;
    const pending = stats.tasks?.pending || 0;
    const inProgress = stats.tasks?.inProgress || 0;
    return months.map((month, i) => ({
      month,
      completed: Math.round(total * (0.05 + (i / 12) * 0.12)),
      pending: Math.round(pending * (0.05 + (i / 12) * 0.12)),
      inProgress: Math.round(inProgress * (0.05 + (i / 12) * 0.12)),
    }));
  }, [stats]);

  // 2c. Top clients by revenue - computed from real clients (uses totalInvoiced field)
  const topClientsData = useMemo(() => {
    const clients = clientsData?.data || [];
    return clients
      .slice(0, 10)
      .sort((a: any, b: any) => (b.totalInvoiced || 0) - (a.totalInvoiced || 0))
      .slice(0, 5)
      .map((c: any) => ({
        name: c.name || 'Unknown',
        revenue: c.totalInvoiced || 0,
        projects: c.projects?.length || 0,
      }));
  }, [clientsData]);

  // 2e. Overdue invoices - computed from real invoices
  const overdueInvoicesData = useMemo(() => {
    const invoices = invoicesData?.data || [];
    const now = new Date();
    return invoices
      .filter((inv: any) => {
        const status = (inv.status || '').toLowerCase();
        const isOverdue = status === 'overdue' || (inv.dueDate && new Date(inv.dueDate) < now && status !== 'paid' && status !== 'cancelled');
        return isOverdue;
      })
      .slice(0, 5)
      .map((inv: any) => {
        const dueDate = new Date(inv.dueDate);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: inv.invoiceNumber || inv.id,
          client: inv.client?.name || 'Unknown',
          amount: inv.total || 0,
          dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : '',
          daysOverdue: Math.max(0, daysOverdue),
        };
      });
  }, [invoicesData]);

  // 2g. Project progress - computed from real projects
  const projectProgressData = useMemo(() => {
    const projects = projectsData?.data || [];
    return projects.slice(0, 6).map((p: any) => ({
      name: p.name || 'Unknown',
      progress: p.progressPercentage || 0,
      status: p.status === 'completed' ? 'completed'
           : (p.status === 'on_hold' || p.status === 'cancelled') ? 'delayed'
           : 'on-track',
    }));
  }, [projectsData]);

  // Keep these as mock data until backend APIs are available
  const departmentData = useMemo(() => generateDepartmentData(), []);
  const salaryData = useMemo(() => generateSalaryData(), []);
  const budgetData = useMemo(() => generateBudgetData(), []);
  const attendanceData = useMemo(() => generateAttendanceData(), []);

  // Calculate totals
  const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = monthlyData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = monthlyData.reduce((sum, item) => sum + item.profit, 0);

  // Overview Stats Cards - Financial & Project Metrics
  const overviewMetrics = [
    {
      title: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
      value: formatCurrency(totalRevenue),
      change: '+18.2%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses',
      value: formatCurrency(totalExpenses),
      change: '+12.5%',
      trend: 'up' as const,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      title: language === 'ar' ? 'صافي الربح' : 'Net Profit',
      value: formatCurrency(totalProfit),
      change: '+24.8%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: language === 'ar' ? 'المشاريع المكتملة' : 'Projects Completed',
      value: stats?.projects?.completed || 24,
      change: '+6',
      trend: 'up' as const,
      icon: Building2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: language === 'ar' ? 'المهام النشطة' : 'Active Tasks',
      value: stats?.tasks?.inProgress || 18,
      subtitle: `${stats?.tasks?.pending || 12} ${language === 'ar' ? 'معلقة' : 'pending'}`,
      icon: CheckSquare,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: language === 'ar' ? 'رضا العملاء' : 'Client Satisfaction',
      value: '94%',
      change: '+2.1%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  // Financial metrics
  const financialMetrics = [
    {
      title: language === 'ar' ? 'إجمالي الفواتير' : 'Total Invoiced',
      value: formatCurrency(stats?.financial?.totalInvoiced || 0),
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: language === 'ar' ? 'المبالغ المحصلة' : 'Collected Amount',
      value: formatCurrency(stats?.financial?.totalPaid || 0),
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: language === 'ar' ? 'المبالغ المعلقة' : 'Pending Amount',
      value: formatCurrency(stats?.financial?.totalPending || 0),
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: language === 'ar' ? 'المبالغ المتأخرة' : 'Overdue Amount',
      value: formatCurrency(stats?.financial?.overdueAmount || 0),
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  ];

  // Project metrics
  const projectMetrics = [
    {
      title: t.projects,
      value: stats?.projects?.total || 0,
      icon: Building2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: t.active,
      value: stats?.projects?.active || 0,
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t.completed,
      value: stats?.projects?.completed || 0,
      icon: CheckSquare,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: t.pending,
      value: stats?.projects?.pending || 0,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  // HR metrics
  const hrMetrics = [
    {
      title: language === 'ar' ? 'إجمالي الموظفين' : 'Total Employees',
      value: stats?.employees?.total || 83,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: language === 'ar' ? 'حاضرون اليوم' : 'Present Today',
      value: stats?.employees?.presentToday || 75,
      icon: UserCheck,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: language === 'ar' ? 'في إجازة' : 'On Leave',
      value: stats?.employees?.onLeave || 8,
      icon: UserX,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: language === 'ar' ? 'إجمالي الرواتب' : 'Total Salaries',
      value: formatCurrency(285000),
      icon: Wallet,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  // Export handlers
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportReport.mutateAsync({
        type: 'pdf',
        report: selectedReportType,
        startDate: customDateFrom?.toISOString().split('T')[0],
        endDate: customDateTo?.toISOString().split('T')[0],
        language,
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportReport.mutateAsync({
        type: 'excel',
        report: selectedReportType,
        startDate: customDateFrom?.toISOString().split('T')[0],
        endDate: customDateTo?.toISOString().split('T')[0],
        language,
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Date range options
  const dateRangeOptions = [
    { value: 'last7days', label: language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days' },
    { value: 'last30days', label: language === 'ar' ? 'آخر 30 يوم' : 'Last 30 days' },
    { value: 'last90days', label: language === 'ar' ? 'آخر 90 يوم' : 'Last 90 days' },
    { value: 'thisMonth', label: t.thisMonth },
    { value: 'lastMonth', label: t.lastMonth },
    { value: 'thisYear', label: t.thisYear },
    { value: 'custom', label: language === 'ar' ? 'نطاق مخصص' : 'Custom range' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.reports}</h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'تحليلات وتقارير شاملة' : 'Comprehensive analytics and reports'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Report Type Selector */}
          <Select value={selectedReportType} onValueChange={(value) => setSelectedReportType(value as ReportType)}>
            <SelectTrigger className="w-[160px] bg-muted border-border text-foreground">
              <FileBarChart className="w-4 h-4 me-2 text-muted-foreground" />
              <SelectValue placeholder={language === 'ar' ? 'نوع التقرير' : 'Report Type'} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="financial">{language === 'ar' ? 'التقرير المالي' : 'Financial Report'}</SelectItem>
              <SelectItem value="projects">{language === 'ar' ? 'تقرير المشاريع' : 'Projects Report'}</SelectItem>
              <SelectItem value="tasks">{language === 'ar' ? 'تقرير المهام' : 'Tasks Report'}</SelectItem>
              <SelectItem value="clients">{language === 'ar' ? 'تقرير العملاء' : 'Clients Report'}</SelectItem>
              <SelectItem value="invoices">{language === 'ar' ? 'تقرير الفواتير' : 'Invoices Report'}</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Select value={dateRange} onValueChange={(value) => {
            setDateRange(value);
            if (value === 'custom') {
              setShowCustomDatePicker(true);
            }
          }}>
            <SelectTrigger className="w-[160px] bg-muted border-border text-foreground">
              <Calendar className="w-4 h-4 me-2 text-muted-foreground" />
              <SelectValue placeholder={language === 'ar' ? 'الفترة' : 'Period'} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom Date Picker Popover */}
          {showCustomDatePicker && (
            <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-muted border-border text-foreground">
                  <CalendarDays className="w-4 h-4 me-2" />
                  {customDateFrom && customDateTo 
                    ? `${formatDate(customDateFrom)} - ${formatDate(customDateTo)}`
                    : language === 'ar' ? 'اختر التاريخ' : 'Select dates'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'من' : 'From'}
                    </label>
                    <CalendarComponent
                      mode="single"
                      selected={customDateFrom}
                      onSelect={setCustomDateFrom}
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'إلى' : 'To'}
                    </label>
                    <CalendarComponent
                      mode="single"
                      selected={customDateTo}
                      onSelect={setCustomDateTo}
                      className="bg-muted border-border"
                    />
                  </div>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowCustomDatePicker(false)}
                  >
                    {language === 'ar' ? 'تطبيق' : 'Apply'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Generate Report Button */}
          <Button 
            variant="outline" 
            className="bg-muted border-border text-foreground hover:bg-accent"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 me-2" />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
          
          {/* Print Button */}
          <Button 
            variant="outline" 
            className="bg-muted border-border text-foreground hover:bg-accent"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 me-2" />
            {t.print}
          </Button>
          
          {/* Export Excel Button */}
          <Button 
            variant="outline" 
            className="bg-muted border-border text-foreground hover:bg-accent"
            onClick={handleExportExcel}
            disabled={isExporting}
          >
            <FileSpreadsheet className="w-4 h-4 me-2" />
            {t.exportExcel}
          </Button>
          
          {/* Export PDF Button */}
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-foreground"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 me-2" />
            {t.exportPDF}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card border border-border p-1 h-auto flex-wrap gap-1">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground text-muted-foreground px-4 py-2"
          >
            <BarChart3 className="w-4 h-4 me-2" />
            {language === 'ar' ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger 
            value="financial" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground text-muted-foreground px-4 py-2"
          >
            <DollarSign className="w-4 h-4 me-2" />
            {language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}
          </TabsTrigger>
          <TabsTrigger 
            value="projects" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground text-muted-foreground px-4 py-2"
          >
            <Building2 className="w-4 h-4 me-2" />
            {language === 'ar' ? 'تقارير المشاريع' : 'Project Reports'}
          </TabsTrigger>
          <TabsTrigger 
            value="hr" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground text-muted-foreground px-4 py-2"
          >
            <Users className="w-4 h-4 me-2" />
            {language === 'ar' ? 'تقارير الموارد البشرية' : 'HR Reports'}
          </TabsTrigger>
          <TabsTrigger 
            value="custom" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground text-muted-foreground px-4 py-2"
          >
            <FileBarChart className="w-4 h-4 me-2" />
            {language === 'ar' ? 'تقارير مخصصة' : 'Custom Reports'}
          </TabsTrigger>
          <TabsTrigger
            value="meetings"
            onClick={() => router.push('/dashboard/reports?tab=meetings')}
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground text-muted-foreground px-4 py-2"
          >
            <CalendarDays className="w-4 h-4 me-2" />
            {language === 'ar' ? 'الاجتماعات والسكرتارية' : 'Meetings & Secretarial'}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Overview Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {overviewMetrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>

          {/* Charts Row 1: Revenue Bar Chart & Project Status Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Bar Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  {language === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {language === 'ar' ? 'الإيرادات حسب الشهر' : 'Revenue by month'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${value / 1000}K`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Project Status Distribution Pie Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-cyan-400" />
                  {language === 'ar' ? 'توزيع حالة المشاريع' : 'Project Status Distribution'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {language === 'ar' ? 'توزيع المشاريع حسب الحالة' : 'Projects distribution by status'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomPieChart data={projectStatusData} />
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2: Task Completion Line Chart & Invoice Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Completion Line Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-400" />
                  {language === 'ar' ? 'اتجاه إكمال المهام' : 'Task Completion Trend'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {language === 'ar' ? 'المهام المكتملة والمعلقة شهرياً' : 'Completed and pending tasks monthly'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={taskCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke={CHART_COLORS.success} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="pending" stroke={CHART_COLORS.warning} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="inProgress" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Invoice Status Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  {language === 'ar' ? 'توزيع حالة الفواتير' : 'Invoice Status Breakdown'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {language === 'ar' ? 'توزيع الفواتير حسب الحالة' : 'Invoice distribution by status'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomPieChart data={invoiceStatusData} />
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                {language === 'ar' ? 'الاتجاهات الشهرية' : 'Monthly Trends'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'الإيرادات والمصروفات والأرباح' : 'Revenue, expenses, and profit trends'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px]">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${value / 1000}K`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="mt-6 space-y-6">
          {/* Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {financialMetrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>

          {/* Revenue vs Expenses Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                {language === 'ar' ? 'الإيرادات مقابل المصروفات' : 'Revenue vs Expenses'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'مقارنة الإيرادات والمصروفات الشهرية' : 'Monthly revenue and expenses comparison'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px]">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${value / 1000}K`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Status Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  {language === 'ar' ? 'توزيع حالة الفواتير' : 'Invoice Status Breakdown'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {language === 'ar' ? 'توزيع الفواتير حسب الحالة' : 'Invoice distribution by status'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomPieChart data={invoiceStatusData} />
              </CardContent>
            </Card>

            {/* Payment Collection Rate */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  {language === 'ar' ? 'معدل تحصيل المدفوعات' : 'Payment Collection Rate'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {language === 'ar' ? 'نسبة التحصيل الشهرية' : 'Monthly collection percentage'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { month: language === 'ar' ? 'يناير' : 'January', rate: 92 },
                    { month: language === 'ar' ? 'فبراير' : 'February', rate: 88 },
                    { month: language === 'ar' ? 'مارس' : 'March', rate: 95 },
                    { month: language === 'ar' ? 'أبريل' : 'April', rate: 91 },
                    { month: language === 'ar' ? 'مايو' : 'May', rate: 87 },
                    { month: language === 'ar' ? 'يونيو' : 'June', rate: 94 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-20">{item.month}</span>
                      <Progress value={item.rate} className="flex-1 h-2" />
                      <span className="text-sm text-foreground font-medium">{item.rate}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Clients by Revenue */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                {language === 'ar' ? 'أفضل العملاء حسب الإيرادات' : 'Top Clients by Revenue'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'العملاء الأعلى إيرادات' : 'Highest revenue generating clients'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClientsData.map((client, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.projects} {language === 'ar' ? 'مشاريع' : 'projects'}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-green-400 font-bold">{formatCurrency(client.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Invoices List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                {language === 'ar' ? 'الفواتير المتأخرة' : 'Overdue Invoices'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'فواتير تجاوزت تاريخ الاستحقاق' : 'Invoices past due date'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <div className="space-y-3">
                  {overdueInvoicesData.map((invoice, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted border border-red-500/20">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">{invoice.client}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-foreground font-bold">{formatCurrency(invoice.amount)}</p>
                        <Badge variant="destructive" className="mt-1">
                          {invoice.daysOverdue} {language === 'ar' ? 'يوم' : 'days'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Reports Tab */}
        <TabsContent value="projects" className="mt-6 space-y-6">
          {/* Project Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {projectMetrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>

          {/* Project Progress Overview */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                {language === 'ar' ? 'نظرة عامة على تقدم المشاريع' : 'Project Progress Overview'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'تقدم المشاريع النشطة' : 'Active projects progress'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectProgressData.length > 0 ? projectProgressData : [
                  { name: 'Dubai Tower Project', progress: 75, status: 'on-track' },
                  { name: 'Marina Residence', progress: 45, status: 'on-track' },
                  { name: 'Business Bay Complex', progress: 90, status: 'completed' },
                  { name: 'Palm Villa Development', progress: 30, status: 'delayed' },
                  { name: 'JBR Renovation', progress: 60, status: 'on-track' },
                ].map((project, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-medium">{project.name}</span>
                      <span className={`text-sm ${
                        project.status === 'completed' ? 'text-green-400' :
                        project.status === 'delayed' ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {project.progress}%
                      </span>
                    </div>
                    <Progress 
                      value={project.progress} 
                      className={`h-2 ${
                        project.status === 'delayed' ? '[&>div]:bg-red-500' : ''
                      }`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-cyan-400" />
                  {language === 'ar' ? 'توزيع الحالة' : 'Status Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CustomPieChart data={projectStatusData} />
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  {language === 'ar' ? 'استغلال الموارد' : 'Resource Utilization'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart
                    data={[
                      { name: 'Engineers', utilized: 85, available: 15 },
                      { name: 'Architects', utilized: 70, available: 30 },
                      { name: 'Drafters', utilized: 90, available: 10 },
                      { name: 'PMs', utilized: 75, available: 25 },
                      { name: 'Admin', utilized: 60, available: 40 },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="utilized" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="available" fill={CHART_COLORS.slate} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Budget vs Actual */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                {language === 'ar' ? 'الميزانية مقابل الفعلي' : 'Budget vs Actual'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'مقارنة الميزانية والصرف الفعلي' : 'Budget and actual spending comparison'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${value / 1000}K`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="budget" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Timeline Analysis */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                {language === 'ar' ? 'تحليل الجدول الزمني' : 'Timeline Analysis'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'تتبع المشاريع حسب الموعد النهائي' : 'Track projects by deadline'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-3xl font-bold text-green-400">8</p>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'في الموعد' : 'On Schedule'}</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-3xl font-bold text-yellow-400">3</p>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'معرض للتأخير' : 'At Risk'}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-3xl font-bold text-red-400">2</p>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'متأخر' : 'Delayed'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HR Reports Tab */}
        <TabsContent value="hr" className="mt-6 space-y-6">
          {/* HR Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hrMetrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>

          {/* Attendance Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-400" />
                {language === 'ar' ? 'ملخص الحضور' : 'Attendance Summary'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'إحصائيات الحضور الشهرية' : 'Monthly attendance statistics'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="present" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leave Balance Overview */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <UserX className="w-5 h-5 text-yellow-400" />
                  {language === 'ar' ? 'رصيد الإجازات' : 'Leave Balance Overview'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {language === 'ar' ? 'توزيع أرصدة الإجازات' : 'Leave balances distribution'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: language === 'ar' ? 'إجازة سنوية' : 'Annual Leave', balance: 450, used: 180, color: CHART_COLORS.primary },
                    { type: language === 'ar' ? 'إجازة مرضية' : 'Sick Leave', balance: 120, used: 35, color: CHART_COLORS.warning },
                    { type: language === 'ar' ? 'إجازة طارئة' : 'Emergency Leave', balance: 60, used: 45, color: CHART_COLORS.danger },
                    { type: language === 'ar' ? 'إجازة أمومة' : 'Maternity Leave', balance: 90, used: 0, color: CHART_COLORS.pink },
                  ].map((leave, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{leave.type}</span>
                        <span className="text-muted-foreground">
                          {leave.used} / {leave.balance} {language === 'ar' ? 'يوم' : 'days'}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${(leave.used / leave.balance) * 100}%`,
                            backgroundColor: leave.color 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  {language === 'ar' ? 'توزيع الأقسام' : 'Department Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CustomPieChart data={departmentData} />
              </CardContent>
            </Card>
          </div>

          {/* Salary Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                {language === 'ar' ? 'توزيع الرواتب' : 'Salary Distribution'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'توزيع الموظفين حسب نطاق الراتب' : 'Employee distribution by salary range'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={salaryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Reports Tab */}
        <TabsContent value="custom" className="mt-6 space-y-6">
          {/* Custom Reports Header */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {language === 'ar' ? 'التقارير المخصصة' : 'Custom Reports'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'إنشاء وإدارة التقارير المخصصة' : 'Create and manage custom reports'}
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-foreground">
              <FileBarChart className="w-4 h-4 me-2" />
              {language === 'ar' ? 'إنشاء تقرير جديد' : 'Create New Report'}
            </Button>
          </div>

          {/* Report Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customReportTemplates.map((template) => (
              <Card key={template.id} className="bg-card border-border hover:border-border transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <FileBarChart className="w-5 h-5 text-blue-400" />
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-foreground text-lg mt-4">{template.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {language === 'ar' ? 'الفئة:' : 'Category:'} {template.category}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'آخر استخدام:' : 'Last used:'}
                    </span>
                    <span className="text-foreground">{formatDate(template.lastUsed)}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1 bg-muted border-border text-foreground hover:bg-accent">
                      {language === 'ar' ? 'تشغيل' : 'Run'}
                    </Button>
                    <Button variant="outline" size="sm" className="bg-muted border-border text-foreground hover:bg-accent">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Report Builder */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                {language === 'ar' ? 'منشئ التقارير السريع' : 'Quick Report Builder'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'إنشاء تقرير مخصص بسرعة' : 'Create a custom report quickly'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Report Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'نوع التقرير' : 'Report Type'}
                  </label>
                  <Select>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder={language === 'ar' ? 'اختر النوع' : 'Select type'} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="financial">{language === 'ar' ? 'مالي' : 'Financial'}</SelectItem>
                      <SelectItem value="project">{language === 'ar' ? 'مشروع' : 'Project'}</SelectItem>
                      <SelectItem value="hr">{language === 'ar' ? 'موارد بشرية' : 'HR'}</SelectItem>
                      <SelectItem value="client">{language === 'ar' ? 'عميل' : 'Client'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'الفترة الزمنية' : 'Date Range'}
                  </label>
                  <Select defaultValue="thisMonth">
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="last7days">{language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days'}</SelectItem>
                      <SelectItem value="last30days">{language === 'ar' ? 'آخر 30 يوم' : 'Last 30 days'}</SelectItem>
                      <SelectItem value="last90days">{language === 'ar' ? 'آخر 90 يوم' : 'Last 90 days'}</SelectItem>
                      <SelectItem value="thisMonth">{t.thisMonth}</SelectItem>
                      <SelectItem value="thisYear">{t.thisYear}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Format Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'تنسيق الإخراج' : 'Output Format'}
                  </label>
                  <Select defaultValue="pdf">
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="word">Word</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button className="bg-blue-600 hover:bg-blue-700 text-foreground">
                  {language === 'ar' ? 'إنشاء التقرير' : 'Generate Report'}
                </Button>
                <Button variant="outline" className="bg-muted border-border text-foreground hover:bg-accent">
                  {language === 'ar' ? 'حفظ كقالب' : 'Save as Template'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Custom Reports */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                {language === 'ar' ? 'التقارير الأخيرة' : 'Recent Reports'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {[
                    { name: 'Q4 Financial Summary', date: '2024-01-15', type: 'Financial', format: 'PDF' },
                    { name: 'Project Progress Report - Dubai Tower', date: '2024-01-14', type: 'Project', format: 'Excel' },
                    { name: 'Employee Performance Review', date: '2024-01-12', type: 'HR', format: 'PDF' },
                    { name: 'Client Revenue Analysis', date: '2024-01-10', type: 'Financial', format: 'Excel' },
                    { name: 'Monthly Attendance Report', date: '2024-01-08', type: 'HR', format: 'PDF' },
                  ].map((report, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted hover:bg-accent transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium truncate">{report.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.type} • {report.format}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-sm text-muted-foreground">{formatDate(report.date)}</p>
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
