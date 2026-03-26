'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useDashboard, useProjects, useTasks, useInvoices } from '@/hooks/use-data';
import { WelcomeModal } from '@/components/onboarding/welcome-modal';
import { FloatingAIButton } from '@/components/ai/floating-ai-button';
import { AIInsightsCard } from '@/components/ai/ai-insights-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2, Users, DollarSign, CheckSquare, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock, FileText, Loader2, Plus
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
  const { language, setCurrentPage } = useApp();
  const { t, formatCurrency, formatDate } = useTranslation(language);
  
  const [period, setPeriod] = useState<Period>('30d');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Check if welcome modal should be shown - only on client side
  useEffect(() => {
    // Use a flag to prevent multiple checks
    let isMounted = true;
    
    const checkWelcomeModal = () => {
      try {
        const hasSeenModal = localStorage.getItem('blueprint_welcome_modal_seen');
        if (!hasSeenModal && isMounted) {
          setShowWelcomeModal(true);
        }
      } catch (e) {
        // localStorage might not be available
        console.warn('localStorage not available');
      }
    };
    
    // Small delay to ensure component is mounted
    const timer = setTimeout(checkWelcomeModal, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);
  
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ status: 'todo' });
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({ status: 'pending' });

  const stats = dashboardData?.data;
  const projectsRaw = projectsData?.data;
  const tasks = tasksData?.data || [];
  const invoices = invoicesData?.data || [];

  // Memoize projects to avoid dependency issues
  const projects = useMemo(() => projectsRaw || [], [projectsRaw]);

  // Generate chart data based on period
  const revenueData = useMemo((): RevenueData[] => {
    const months = language === 'ar'
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const numMonths = period === '7d' ? 1 : period === '30d' ? 3 : period === '90d' ? 6 : 12;
    const startIndex = 0;
    
    return months.slice(startIndex, numMonths).map((month) => ({
      month,
      revenue: (stats?.financial?.totalPaid || 50000) * (0.7 + Math.random() * 0.6),
      expenses: (stats?.financial?.totalPaid || 50000) * (0.3 + Math.random() * 0.3),
      profit: (stats?.financial?.totalPaid || 50000) * (0.2 + Math.random() * 0.4),
    }));
  }, [period, stats, language]);

  const projectStatusData = useMemo((): ProjectStatusData[] => {
    const activeProjects = projects.filter((p: { status: string }) => p.status === 'active').length;
    const completedProjects = projects.filter((p: { status: string }) => p.status === 'completed').length;
    const pendingProjects = projects.filter((p: { status: string }) => p.status === 'pending').length;
    const onHoldProjects = projects.filter((p: { status: string }) => p.status === 'on_hold').length;

    return [
      { name: 'active', value: activeProjects || 8, color: '#3b82f6' },
      { name: 'completed', value: completedProjects || 5, color: '#10b981' },
      { name: 'pending', value: pendingProjects || 3, color: '#f59e0b' },
      { name: 'on_hold', value: onHoldProjects || 2, color: '#8b5cf6' },
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

    return categories.map((category) => ({
      category,
      amount: (stats?.financial?.totalPaid || 120000) * (0.05 + Math.random() * 0.25),
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
    {
      title: t.revenue,
      value: formatCurrency(stats?.financial?.totalPaid || 0),
      subtitle: `${formatCurrency(stats?.financial?.totalPending || 0)} ${language === 'ar' ? 'معلق' : 'pending'}`,
      icon: DollarSign,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      trend: '+18%',
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

  // Loading component
  const ChartLoader = () => (
    <div className="h-[300px] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Welcome Modal */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)} 
      />
      
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1 group"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend}
                  {stat.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
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
        ))}
      </div>

      {/* Charts Row 1 - Revenue & Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
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

        {/* Expense by Category */}
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
              <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-cyan-500/20 hover:border-cyan-500 transition-all duration-300 group"
                onClick={() => router.push('/dashboard/invoices')}
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs text-slate-300 group-hover:text-white">{t.newInvoice}</span>
              </Button>
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

          {/* Open Defects */}
          <Card className="bg-slate-900/50 border-slate-800 hover:border-red-500/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/defects')}>
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
            context={JSON.stringify({
              activeProjects: stats?.projects?.active || 0,
              totalRevenue: stats?.financial?.totalPaid || 0,
              pendingTasks: stats?.tasks?.pending || 0,
              openDefects: stats?.defects?.open || 0
            })}
            taskType="data-analysis"
            compact
          />
        </div>
      </div>

      {/* Floating AI Button */}
      <FloatingAIButton
        context={language === 'ar' ? 'لوحة التحكم الرئيسية' : 'Main Dashboard'}
        entityType="project"
      />

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

        {/* Pending Invoices */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              {t.pendingInvoices}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/invoices')} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
              {t.view} {language === 'ar' ? 'الكل' : 'All'}
            </Button>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {pendingInvoices.length > 0 ? pendingInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-slate-400">{invoice.client?.name || invoice.client || t.noData}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-sm font-medium text-white">{formatCurrency(invoice.total)}</p>
                        <p className="text-xs text-slate-400">{invoice.dueDate ? formatDate(invoice.dueDate) : ''}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <DollarSign className="w-12 h-12 mb-4 opacity-50" />
                      <p>{t.noData}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
