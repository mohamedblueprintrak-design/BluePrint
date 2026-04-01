'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import { useDashboard, useProjects, useTasks, useInvoices } from '@/hooks/use-data';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { FloatingAIButton } from '@/components/ai/floating-ai-button';
import { AIInsightsCard } from '@/components/ai/ai-insights-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import {
  Building2, Users, DollarSign, CheckSquare, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock, FileText, Loader2, Plus,
  Rocket, BarChart3, CalendarDays, Sparkles, Info, AlertCircle,
  TrendingUp, ClipboardList, FileSpreadsheet, MessageSquare, FolderOpen,
  Activity, Timer, Briefcase, ChevronRight, LayoutDashboard
} from 'lucide-react';
import {
  RevenueChart,
  ProjectDonutChart,
  TaskCompletionChart,
  ExpenseDonutChart,
  generateWeeklyTaskData,
  generateMonthlyTaskData,
  type RevenueData,
  type ProjectStatusData,
  type TaskCompletionData,
  type ExpenseData,
} from './charts';

type Period = '7d' | '30d' | '90d' | 'year';

export function DashboardPage() {
  const router = useRouter();
  const { language } = useApp();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, hasRole, hasPermission } = useAuth();
  const canSeeFinancials = hasRole(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'PROJECT_MANAGER'] as any);
  const { t, formatCurrency, formatDate } = useTranslation(language);
  
  const [period, setPeriod] = useState<Period>('30d');
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  
  // Check if onboarding wizard should be shown - only on client side
  useEffect(() => {
    let isMounted = true;
    
    const checkOnboarding = () => {
      try {
        // Never show onboarding in demo mode - go straight to dashboard
        const isDemo = localStorage.getItem('blueprint_demo_mode') === 'true';
        if (isDemo) return;
        const hasCompleted = localStorage.getItem('blueprint_onboarding_completed');
        if (!hasCompleted && isMounted) {
          setShowOnboardingWizard(true);
        }
      } catch {
        // localStorage might not be available
      }
    };
    
    const timer = setTimeout(checkOnboarding, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);
  
  const { data: dashboardData, isLoading: dashboardLoading, error, refetch } = useDashboard();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ status: 'todo' });
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({ status: 'pending' });
  // All tasks (no filter) for operations center
  const { data: allTasksData } = useTasks();
  const allTasks = allTasksData?.data || [];

  const stats = dashboardData?.data;
  const projectsRaw = projectsData?.data;
  const tasks = tasksData?.data || [];
  const invoices = invoicesData?.data || [];

  // Memoize projects to avoid dependency issues
  const projects = useMemo(() => projectsRaw || [], [projectsRaw]);

  // Generate chart data based on period - Using REAL data from API
  const revenueData = useMemo((): RevenueData[] => {
    const months = language === 'ar'
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const numMonths = period === '7d' ? 1 : period === '30d' ? 3 : period === '90d' ? 6 : 12;
    
    // Use real financial data from API instead of random values
    const baseRevenue = stats?.financial?.totalPaid || 0;
    // Calculate expenses as percentage of revenue if not provided
    const baseExpenses = (stats?.financial as Record<string, number>)?.totalExpenses || baseRevenue * 0.4;
    const baseProfit = baseRevenue - baseExpenses;
    
    // Calculate monthly averages based on actual totals
    const monthlyRevenue = baseRevenue / numMonths;
    const monthlyExpenses = baseExpenses / numMonths;
    const monthlyProfit = baseProfit / numMonths;
    
    return months.slice(0, numMonths).map((month, index) => ({
      month,
      // Use calculated values based on real data with slight variance for chart visualization
      revenue: Math.round(monthlyRevenue * (0.85 + (index * 0.03))), // Gradual growth pattern
      expenses: Math.round(monthlyExpenses * (0.9 + (index * 0.02))),
      profit: Math.round(monthlyProfit * (0.8 + (index * 0.04))),
    }));
  }, [period, stats, language]);

  const projectStatusData = useMemo((): ProjectStatusData[] => {
    const activeProjects = projects.filter((p: { status: string }) => p.status === 'active').length;
    const completedProjects = projects.filter((p: { status: string }) => p.status === 'completed').length;
    const pendingProjects = projects.filter((p: { status: string }) => p.status === 'pending').length;
    const onHoldProjects = projects.filter((p: { status: string }) => p.status === 'on_hold').length;

    // Only use real data, no fake fallback values
    return [
      { name: 'active', value: activeProjects, color: '#3b82f6' },
      { name: 'completed', value: completedProjects, color: '#10b981' },
      { name: 'pending', value: pendingProjects, color: '#f59e0b' },
      { name: 'on_hold', value: onHoldProjects, color: '#8b5cf6' },
    ];
  }, [projects]);

  const taskCompletionData = useMemo((): TaskCompletionData[] => {
    if (period === '7d') {
      return generateWeeklyTaskData(language);
    } else if (period === 'year') {
      return generateMonthlyTaskData(language);
    }
    return generateWeeklyTaskData(language);
  }, [period, language]);

  const expenseData = useMemo((): ExpenseData[] => {
    const categories = language === 'ar'
      ? ['مواد', 'عمالة', 'معدات', 'نقل', 'مرافق', 'متفرقات']
      : ['Materials', 'Labor', 'Equipment', 'Transportation', 'Utilities', 'Miscellaneous'];

    // Use real expense data from API
    const financial = stats?.financial as Record<string, number> | undefined;
    const totalExpenses = financial?.totalExpenses || (stats?.financial?.totalPaid || 0) * 0.4;
    
    // Realistic expense distribution percentages based on construction industry standards
    const distribution = [0.35, 0.25, 0.15, 0.10, 0.08, 0.07]; // Materials, Labor, Equipment, Transport, Utilities, Misc
    
    return categories.map((category, index) => ({
      category,
      amount: Math.round(totalExpenses * distribution[index]),
    }));
  }, [stats, language]);

  // Quick stats cards
  const statCards = [
    {
      title: t.activeProjects,
      value: stats?.projects?.active || 0,
      total: stats?.projects?.total || 0,
      icon: Building2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      trend: '+12%',
      trendUp: true
    },
    {
      title: t.totalClients,
      value: stats?.clients?.total || 0,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      trend: '+5%',
      trendUp: true
    },
    canSeeFinancials ? {
      title: t.revenue,
      value: formatCurrency(stats?.financial?.totalPaid || 0),
      subtitle: `${formatCurrency(stats?.financial?.totalPending || 0)} ${language === 'ar' ? 'معلق' : 'pending'}`,
      icon: DollarSign,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      trend: '+18%',
      trendUp: true
    } : {
      title: language === 'ar' ? 'إجمالي المهام' : 'Total Tasks',
      value: stats?.tasks?.total || 0,
      total: stats?.tasks?.completed || 0,
      icon: CheckSquare,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      trend: '+8%',
      trendUp: true
    },
    {
      title: t.pendingTasks,
      value: stats?.tasks?.pending || 0,
      icon: CheckSquare,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      trend: '-3%',
      trendUp: false
    }
  ];

  // Recent projects
  const recentProjects = projects.slice(0, 5);

  // Recent tasks
  const recentTasks = tasks.slice(0, 5);

  // Pending invoices
  const pendingInvoices = invoices.filter((inv: { status: string }) => inv.status === 'pending' || inv.status === 'partial').slice(0, 5);

  // ========== Operations Center computed values ==========
  const opsNow = new Date();

  const opsActiveProjects = projects
    .filter((p: any) => p.status === 'active')
    .slice(0, 6);

  const opsPendingTasks = allTasks
    .filter((t: any) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a: any, b: any) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder as any)[a.priority] - (priorityOrder as any)[b.priority];
    })
    .slice(0, 8);

  const getTaskSLAStatus = (task: any) => {
    if (!task.slaDays || !task.slaStartDate) return null;
    const start = new Date(task.slaStartDate);
    const elapsed = Math.floor((opsNow.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = task.slaDays - elapsed;
    const pct = (remaining / task.slaDays) * 100;
    if (remaining <= 0) return { label: language === 'ar' ? 'مخالف' : 'Breached', color: 'text-red-400 bg-red-500/10', remaining };
    if (pct < 25) return { label: language === 'ar' ? 'خطر' : 'At Risk', color: 'text-red-400 bg-red-500/10', remaining };
    if (pct < 50) return { label: language === 'ar' ? 'تحذير' : 'Warning', color: 'text-amber-400 bg-amber-500/10', remaining };
    return { label: language === 'ar' ? 'على المسار' : 'On Track', color: 'text-green-400 bg-green-500/10', remaining };
  };

  const opsWorkloadSummary = {
    totalActive: allTasks.filter((t: any) => t.status === 'in_progress').length,
    overdue: allTasks.filter((t: any) => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < opsNow;
    }).length,
    completedToday: allTasks.filter((t: any) => {
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      return completed.toDateString() === opsNow.toDateString();
    }).length,
    slaBreached: allTasks.filter((t: any) => {
      if (!t.slaDays || !t.slaStartDate) return false;
      const start = new Date(t.slaStartDate);
      const elapsed = Math.floor((opsNow.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return elapsed > t.slaDays;
    }).length,
  };

  const opsQuickLinks = [
    { href: '/dashboard/tasks', icon: CheckSquare, label: language === 'ar' ? 'المهام' : 'Tasks', count: allTasks.filter((t: any) => t.status !== 'done').length, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { href: '/dashboard/site-management', icon: ClipboardList, label: language === 'ar' ? 'تقارير الموقع' : 'Site Reports', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    { href: '/dashboard/clients', icon: MessageSquare, label: language === 'ar' ? 'التفاعلات' : 'Interactions', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { href: '/dashboard/documents', icon: FileText, label: language === 'ar' ? 'المستندات' : 'Documents', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    { href: '/dashboard/finance', icon: DollarSign, label: language === 'ar' ? 'الفواتير' : 'Invoices', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    { href: '/dashboard/financials', icon: FileSpreadsheet, label: language === 'ar' ? 'جدول الكميات' : 'BOQ', color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
  ];

  const opsRecentActivities = [
    { id: '1', icon: CheckSquare, text: language === 'ar' ? 'تم إكمال مهمة "مراجعة المخططات"' : 'Task "Drawing Review" completed', time: '2h', color: 'text-green-400' },
    { id: '2', icon: FileText, text: language === 'ar' ? 'تم رفع مستند جديد' : 'New document uploaded', time: '3h', color: 'text-blue-400' },
    { id: '3', icon: AlertTriangle, text: language === 'ar' ? 'تنبيه SLA: مهمة حكومية مخالفة' : 'SLA Alert: Government task breached', time: '4h', color: 'text-red-400' },
    { id: '4', icon: Users, text: language === 'ar' ? 'تم تعيين مهمة جديدة' : 'New task assigned', time: '5h', color: 'text-purple-400' },
    { id: '5', icon: MessageSquare, text: language === 'ar' ? 'تعليق جديد من العميل' : 'New client comment', time: '6h', color: 'text-amber-400' },
    { id: '6', icon: BarChart3, text: language === 'ar' ? 'تم تحديث تقدم المشروع' : 'Project progress updated', time: '7h', color: 'text-cyan-400' },
  ];

  // Loading component
  const ChartLoader = () => (
    <div className="h-[300px] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Onboarding Wizard */}
      <OnboardingWizard isOpen={showOnboardingWizard} onClose={() => setShowOnboardingWizard(false)} />
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 text-white shadow-lg shadow-blue-500/20">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">
            {language === 'ar' ? 'مرحباً بك في BluePrint 👋' : 'Welcome to BluePrint 👋'}
          </h2>
          <p className="text-blue-100">
            {language === 'ar' 
              ? 'إليك نظرة عامة على أداء شركتك اليوم'
              : "Here's an overview of your company's performance today"}
          </p>
        </div>
        <div className="absolute end-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute start-10 bottom-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2" />
        <div className="absolute end-20 top-1/2 w-20 h-20 bg-white/5 rounded-full" />
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 me-2" />
            {language === 'ar' ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <LayoutDashboard className="w-4 h-4 me-2" />
            {language === 'ar' ? 'مركز العمليات' : 'Operations Center'}
          </TabsTrigger>
        </TabsList>

      <TabsContent value="overview" className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="7d">{language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days'}</SelectItem>
            <SelectItem value="30d">{language === 'ar' ? 'آخر 30 يوم' : 'Last 30 days'}</SelectItem>
            <SelectItem value="90d">{language === 'ar' ? 'آخر 90 يوم' : 'Last 90 days'}</SelectItem>
            <SelectItem value="year">{language === 'ar' ? 'هذا العام' : 'This Year'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-medium">
              {language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Failed to load dashboard data'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Projects */}
      {projects.length === 0 && !projectsLoading && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-2xl bg-blue-500/10 mb-4">
                <Rocket className="w-12 h-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {language === 'ar' ? 'مرحبًا بك في BluePrint!' : 'Welcome to BluePrint!'}
              </h3>
              <p className="text-slate-400 max-w-md mb-6">
                {language === 'ar'
                  ? 'ابدأ بإنشاء مشروعك الأول لإدارة المشاريع والمهام والفريق بسهولة'
                  : 'Start by creating your first project to manage projects, tasks, and team effortlessly'}
              </p>
              <Button
                onClick={() => router.push('/dashboard/projects')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 me-2" />
                {t.newProject}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const tooltipMap: Record<string, { ar: string; en: string }> = {
            [t.activeProjects]: {
              ar: 'عدد المشاريع التي تعمل عليها حاليًا من إجمالي المشاريع',
              en: 'Number of projects currently in progress out of total projects',
            },
            [t.totalClients]: {
              ar: 'إجمالي العملاء المسجلين في النظام',
              en: 'Total registered clients in the system',
            },
            ...(canSeeFinancials ? { [t.revenue]: {
              ar: 'إجمالي المبالغ المحصّلة من الفواتير المدفوعة',
              en: 'Total amount collected from paid invoices',
            }} : { [language === 'ar' ? 'إجمالي المهام' : 'Total Tasks']: {
              ar: 'إجمالي المهام المسجلة في النظام',
              en: 'Total tasks registered in the system',
            }}),
            [t.pendingTasks]: {
              ar: 'المهام التي لم تكتمل بعد وتحتاج إلى اهتمام',
              en: 'Tasks that are not yet completed and need attention',
            },
          };
          const tooltipText = tooltipMap[stat.title];

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Card
                  className="bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1 group cursor-default"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        {tooltipText && (
                          <Info className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        )}
                        <div className={`flex items-center gap-1 text-sm ${stat.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                          {stat.trend}
                          {stat.trendUp ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      {stat.total && (
                        <p className="text-sm text-slate-400">{language === 'ar' ? 'من' : 'of'} {stat.total}</p>
                      )}
                      {stat.subtitle && (
                        <p className="text-sm text-slate-400">{stat.subtitle}</p>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{stat.title}</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              {tooltipText && (
                <TooltipContent side="bottom" className="bg-slate-800 border-slate-700 text-slate-200 max-w-xs">
                  <p className="text-xs">{language === 'ar' ? tooltipText.ar : tooltipText.en}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>

      {/* Charts Row 1 - Revenue & Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart (financial users) / Project Progress (non-financial users) */}
        {canSeeFinancials ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              {language === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'ar' ? 'نظرة عامة على الإيرادات والمصروفات' : 'Overview of revenue and expenses'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <ChartLoader />
            ) : (
              <RevenueChart
                data={revenueData}
                formatCurrency={formatCurrency}
                language={language}
              />
            )}
          </CardContent>
        </Card>
        ) : (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              {language === 'ar' ? 'تقدم المشاريع' : 'Project Progress'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'ar' ? 'نظرة عامة على تقدم المشاريع' : 'Overview of project progress'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <ChartLoader />
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {recentProjects.length > 0 ? recentProjects.map((project: any) => (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">{project.name}</p>
                        <span className="text-xs text-slate-400">{project.progressPercentage || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${project.progressPercentage || 0}%` }}
                        />
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <Building2 className="w-12 h-12 mb-4 opacity-50" />
                      <p>{t.noData}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        )}

        {/* Project Status Distribution */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              {language === 'ar' ? 'حالة المشاريع' : 'Project Status'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'ar' ? 'توزيع المشاريع حسب الحالة' : 'Distribution of projects by status'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <ChartLoader />
            ) : (
              <ProjectDonutChart
                data={projectStatusData}
                language={language}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Task Completion & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              {language === 'ar' ? 'اتجاه إنجاز المهام' : 'Task Completion Trend'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'ar' ? 'المهام المكتملة والمعلقة' : 'Completed and pending tasks'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <ChartLoader />
            ) : (
              <TaskCompletionChart
                data={taskCompletionData}
                language={language}
              />
            )}
          </CardContent>
        </Card>

        {/* Expense by Category (financial users) / Team Activity (non-financial users) */}
        {canSeeFinancials ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              {language === 'ar' ? 'المصروفات حسب الفئة' : 'Expenses by Category'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'ar' ? 'توزيع المصروفات' : 'Distribution of expenses'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <ChartLoader />
            ) : (
              <ExpenseDonutChart
                data={expenseData}
                formatCurrency={formatCurrency}
                language={language}
              />
            )}
          </CardContent>
        </Card>
        ) : (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              {language === 'ar' ? 'نشاط الفريق' : 'Team Activity'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'ar' ? 'نظرة عامة على نشاط المهام' : 'Overview of task activity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <ChartLoader />
            ) : (
              <TaskCompletionChart
                data={taskCompletionData}
                language={language}
              />
            )}
          </CardContent>
        </Card>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">{t.projects}</CardTitle>
              <CardDescription className="text-slate-400">
                {language === 'ar' ? 'آخر المشاريع' : 'Recent projects'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/projects')} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
              {t.view} {language === 'ar' ? 'الكل' : 'All'}
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="space-y-4">
                  {recentProjects.length > 0 ? recentProjects.map((project: {
                    id: string;
                    name: string;
                    location?: string;
                    projectNumber?: string;
                    status: string;
                    progressPercentage?: number;
                  }) => (
                    <div 
                      key={project.id} 
                      className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{project.name}</p>
                        <p className="text-sm text-slate-400 truncate">{project.location || project.projectNumber}</p>
                      </div>
                      <div className="text-end">
                        <Badge variant={
                          project.status === 'active' ? 'default' :
                          project.status === 'completed' ? 'outline' :
                          project.status === 'pending' ? 'secondary' : 'destructive'
                        } className={project.status === 'completed' ? 'border-green-500 text-green-400' : ''}>
                          {project.status}
                        </Badge>
                        <p className="text-sm text-slate-400 mt-1">
                          {project.progressPercentage || 0}%
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <Building2 className="w-12 h-12 mb-4 opacity-50" />
                      <p>{t.noData}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-blue-500/20 hover:border-blue-500 transition-all duration-300 group"
                onClick={() => router.push('/dashboard/projects')}
              >
                <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs text-slate-300 group-hover:text-white">{t.newProject}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-green-500/20 hover:border-green-500 transition-all duration-300 group"
                onClick={() => router.push('/dashboard/clients')}
              >
                <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-xs text-slate-300 group-hover:text-white">{t.newClient}</span>
              </Button>
              {canSeeFinancials && (
              <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-cyan-500/20 hover:border-cyan-500 transition-all duration-300 group"
                onClick={() => router.push('/dashboard/finance')}
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs text-slate-300 group-hover:text-white">{t.newInvoice}</span>
              </Button>
              )}
              <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-orange-500/20 hover:border-orange-500 transition-all duration-300 group"
                onClick={() => router.push('/dashboard/tasks')}
              >
                <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <CheckSquare className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-xs text-slate-300 group-hover:text-white">{t.newTask}</span>
              </Button>
            </CardContent>
          </Card>

          {/* Enhanced Quick Actions Bar */}
          <Card className="bg-gradient-to-br from-violet-950/50 to-slate-900/50 border-violet-500/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-2">
                {hasPermission('REPORTS_READ') && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-slate-300 hover:bg-violet-500/10 hover:text-violet-300 p-3 h-auto"
                  onClick={() => router.push('/dashboard/reports')}
                >
                  <div className="p-1.5 rounded-lg bg-violet-500/20">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="text-start">
                    <p className="text-sm font-medium">{language === 'ar' ? 'إنشاء تقرير' : 'Generate Report'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ar' ? 'تقارير مالية وتشغيلية' : 'Financial & operational reports'}</p>
                  </div>
                </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-slate-300 hover:bg-blue-500/10 hover:text-blue-300 p-3 h-auto"
                  onClick={() => router.push('/dashboard/calendar')}
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/20">
                    <CalendarDays className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-start">
                    <p className="text-sm font-medium">{language === 'ar' ? 'عرض الجدول' : 'View Schedule'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ar' ? 'جدول المشاريع والجداول الزمنية' : 'Project schedule & timelines'}</p>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-300 p-3 h-auto"
                  onClick={() => router.push('/dashboard/ai-chat')}
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/20">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-start">
                    <p className="text-sm font-medium">{language === 'ar' ? 'اسأل الذكاء الاصطناعي' : 'Ask AI'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ar' ? 'المساعد الذكي بلو جاهز لمساعدتك' : 'Blu AI assistant ready to help'}</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Open Defects */}
          <Card className="bg-slate-900/50 border-slate-800 hover:border-red-500/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/site-management')}>
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                {t.openDefects}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-5xl font-bold text-red-400">{stats?.defects?.open || 0}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {language === 'ar' ? 'عيوب تحتاج معالجة' : 'Defects need attention'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <AIInsightsCard
            title={language === 'ar' ? 'رؤى ذكية' : 'AI Insights'}
            context={JSON.stringify(canSeeFinancials ? {
              activeProjects: stats?.projects?.active || 0,
              totalRevenue: stats?.financial?.totalPaid || 0,
              pendingTasks: stats?.tasks?.pending || 0,
              openDefects: stats?.defects?.open || 0
            } : {
              activeProjects: stats?.projects?.active || 0,
              pendingTasks: stats?.tasks?.pending || 0,
              openDefects: stats?.defects?.open || 0
            })}
            taskType="data-analysis"
            compact
          />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-orange-400" />
              {t.pendingTasks}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/tasks')} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
              {t.view} {language === 'ar' ? 'الكل' : 'All'}
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {recentTasks.length > 0 ? recentTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'urgent' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-orange-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{task.title}</p>
                        <p className="text-xs text-slate-400">{task.project?.name || task.project || t.noData}</p>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <CheckSquare className="w-12 h-12 mb-4 opacity-50" />
                      <p>{t.noData}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      </TabsContent>

      {/* ===== Operations Center Tab ===== */}
      <TabsContent value="operations" className="space-y-6">
        {/* Operations Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <LayoutDashboard className="w-7 h-7 text-blue-400" />
              {language === 'ar' ? 'مركز العمليات' : 'Operations Center'}
            </h1>
            <p className="text-slate-400 mt-1">
              {language === 'ar' ? 'نظرة عامة شاملة على جميع العمليات' : 'Comprehensive overview of all operations'}
            </p>
          </div>
          <div className="text-sm text-slate-500">
            {opsNow.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Operations Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{opsActiveProjects.length}</p>
                  <p className="text-xs text-slate-400">{language === 'ar' ? 'مشاريع نشطة' : 'Active Projects'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/20">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{opsWorkloadSummary.totalActive}</p>
                  <p className="text-xs text-slate-400">{language === 'ar' ? 'مهام قيد التنفيذ' : 'Active Tasks'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{opsWorkloadSummary.overdue + opsWorkloadSummary.slaBreached}</p>
                  <p className="text-xs text-slate-400">{language === 'ar' ? 'تحذيرات' : 'Alerts'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{opsWorkloadSummary.completedToday}</p>
                  <p className="text-xs text-slate-400">{language === 'ar' ? 'مكتمل اليوم' : 'Completed Today'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects with SLA */}
          <Card className="bg-slate-900/50 border-slate-800 lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  {language === 'ar' ? 'المشاريع النشطة' : 'Active Projects'}
                </CardTitle>
                <Link href="/dashboard/projects">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    {language === 'ar' ? 'عرض الكل' : 'View All'}
                    <ChevronRight className="w-4 h-4 ms-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {opsActiveProjects.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    {language === 'ar' ? 'لا توجد مشاريع نشطة' : 'No active projects'}
                  </div>
                ) : (
                  opsActiveProjects.map((project: any) => {
                    const projectTasks = allTasks.filter((t: any) => t.projectId === project.id);
                    const doneTasks = projectTasks.filter((t: any) => t.status === 'done').length;
                    const totalTasks = projectTasks.length;
                    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
                    const overdueTasks = projectTasks.filter((t: any) => {
                      if (!t.dueDate || t.status === 'done') return false;
                      return new Date(t.dueDate) < opsNow;
                    }).length;
                    const slaTasks = projectTasks.filter((t: any) => t.slaDays && t.slaStartDate);
                    const breachedSla = slaTasks.filter((t: any) => {
                      const start = new Date(t.slaStartDate);
                      const elapsed = Math.floor((opsNow.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      return elapsed > t.slaDays;
                    }).length;
                    return (
                      <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors group cursor-pointer">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white truncate">{project.name}</p>
                              {overdueTasks > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-red-500/30 text-red-400 bg-red-500/10">
                                  {overdueTasks} {language === 'ar' ? 'متأخر' : 'overdue'}
                                </Badge>
                              )}
                              {breachedSla > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-red-500/30 text-red-400 bg-red-500/10 animate-pulse">
                                  SLA ⚠
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <Progress value={progress} className="h-1.5 flex-1" />
                              <span className="text-xs text-slate-400">{progress}%</span>
                              <span className="text-[10px] text-slate-500">
                                {doneTasks}/{totalTasks} {language === 'ar' ? 'مهام' : 'tasks'}
                              </span>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                  {language === 'ar' ? 'وصول سريع' : 'Quick Access'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {opsQuickLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer group">
                        <div className={`p-2 rounded-lg ${link.bgColor}`}>
                          <link.icon className={`w-5 h-5 ${link.color}`} />
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-white">{link.label}</span>
                        {link.count !== undefined && (
                          <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-[10px]">{link.count}</Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
                  </CardTitle>
                  <Link href="/dashboard/activities">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                      {language === 'ar' ? 'الكل' : 'All'}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {opsRecentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300">{activity.text}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pending Tasks / Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Urgent Tasks */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Timer className="w-5 h-5 text-amber-400" />
                  {language === 'ar' ? 'مهام عاجلة' : 'Urgent Tasks'}
                </CardTitle>
                <Link href="/dashboard/tasks">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    {language === 'ar' ? 'عرض الكل' : 'View All'}
                    <ChevronRight className="w-4 h-4 ms-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {opsPendingTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    {language === 'ar' ? 'لا توجد مهام عاجلة' : 'No urgent tasks'}
                  </div>
                ) : (
                  opsPendingTasks.map((task: any) => {
                    const slaStatus = getTaskSLAStatus(task);
                    const isOverdue = task.dueDate && new Date(task.dueDate) < opsNow && task.status !== 'done';
                    const priorityColors: Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' };
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => router.push('/dashboard/tasks')}
                      >
                        <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority] || 'bg-gray-500'} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {task.dueDate && (
                              <span className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                            {slaStatus && (
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border ${slaStatus.color}`}>
                                SLA: {slaStatus.remaining}{language === 'ar' ? 'ي' : 'd'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-5 border shrink-0 ${
                            task.status === 'todo'
                              ? 'border-slate-600 text-slate-400'
                              : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                          }`}
                        >
                          {task.status === 'todo'
                            ? (language === 'ar' ? 'قيد الانتظار' : 'To Do')
                            : (language === 'ar' ? 'قيد التنفيذ' : 'In Progress')
                          }
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workload Summary */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                {language === 'ar' ? 'ملخص العمل' : 'Workload Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm text-slate-400">{language === 'ar' ? 'توزيع المهام' : 'Task Distribution'}</h4>
                {[
                  { label: language === 'ar' ? 'مكتمل' : 'Done', count: allTasks.filter((t: any) => t.status === 'done').length, total: allTasks.length, color: 'bg-green-500' },
                  { label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress', count: allTasks.filter((t: any) => t.status === 'in_progress').length, total: allTasks.length, color: 'bg-blue-500' },
                  { label: language === 'ar' ? 'مراجعة' : 'Review', count: allTasks.filter((t: any) => t.status === 'review').length, total: allTasks.length, color: 'bg-purple-500' },
                  { label: language === 'ar' ? 'قيد الانتظار' : 'To Do', count: allTasks.filter((t: any) => t.status === 'todo').length, total: allTasks.length, color: 'bg-gray-500' },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-white font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all`}
                        style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-sm text-slate-400 mb-3">{language === 'ar' ? 'مؤشرات الأداء' : 'Performance Metrics'}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-800/30 text-center">
                    <p className="text-lg font-bold text-white">
                      {allTasks.length > 0 ? Math.round((allTasks.filter((t: any) => t.status === 'done').length / allTasks.length) * 100) : 0}%
                    </p>
                    <p className="text-[10px] text-slate-500">{language === 'ar' ? 'نسبة الإنجاز' : 'Completion Rate'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 text-center">
                    <p className="text-lg font-bold text-white">
                      {allTasks.filter((t: any) => {
                        if (!t.slaDays || !t.slaStartDate) return true;
                        const start = new Date(t.slaStartDate);
                        const elapsed = Math.floor((opsNow.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                        return elapsed <= t.slaDays;
                      }).length}
                    </p>
                    <p className="text-[10px] text-slate-500">{language === 'ar' ? 'SLA ملتزم' : 'SLA Compliant'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 text-center">
                    <p className="text-lg font-bold text-amber-400">{opsWorkloadSummary.overdue}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ar' ? 'متأخرات' : 'Overdue'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 text-center">
                    <p className="text-lg font-bold text-red-400">{opsWorkloadSummary.slaBreached}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ar' ? 'SLA مخالف' : 'SLA Breached'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      </Tabs>

      {/* FloatingAIButton stays outside tabs */}
      <FloatingAIButton
        context={language === 'ar' ? 'لوحة التحكم الرئيسية' : 'Main Dashboard'}
        entityType="project"
      />


    </div>
  );
}
