'use client';

// React imports not needed - no hooks used
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useProjects, useTasks } from '@/hooks/use-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2, CheckSquare, FileText, BarChart3, AlertTriangle,
  Clock, Users, TrendingUp, ArrowUpRight,
  ClipboardList, FileSpreadsheet, MessageSquare, FolderOpen,
  Activity, Timer, Briefcase, DollarSign, ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';

export default function OperationsPage() {
  const { language } = useApp();
  const { formatDate } = useTranslation(language);
  const { data: projectsData } = useProjects();
  const { data: tasksData } = useTasks();

  const projects = projectsData?.data || [];
  const tasks = tasksData?.data || [];

  const now = new Date();

  // Active projects with SLA status
  const activeProjects = projects
    .filter((p: any) => p.status === 'active')
    .slice(0, 6);

  // Pending tasks (high priority)
  const pendingTasks = tasks
    .filter((t: any) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a: any, b: any) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder as any)[a.priority] - (priorityOrder as any)[b.priority];
    })
    .slice(0, 8);

  // SLA status for tasks
  const getTaskSLAStatus = (task: any) => {
    if (!task.slaDays || !task.slaStartDate) return null;
    const start = new Date(task.slaStartDate);
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = task.slaDays - elapsed;
    const pct = (remaining / task.slaDays) * 100;
    
    if (remaining <= 0) return { label: language === 'ar' ? 'مخالف' : 'Breached', color: 'text-red-400 bg-red-500/10', remaining };
    if (pct < 25) return { label: language === 'ar' ? 'خطر' : 'At Risk', color: 'text-red-400 bg-red-500/10', remaining };
    if (pct < 50) return { label: language === 'ar' ? 'تحذير' : 'Warning', color: 'text-amber-400 bg-amber-500/10', remaining };
    return { label: language === 'ar' ? 'على المسار' : 'On Track', color: 'text-green-400 bg-green-500/10', remaining };
  };

  // Workload summary
  const workloadSummary = {
    totalActive: tasks.filter((t: any) => t.status === 'in_progress').length,
    overdue: tasks.filter((t: any) => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < now;
    }).length,
    completedToday: tasks.filter((t: any) => {
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      return completed.toDateString() === now.toDateString();
    }).length,
    slaBreached: tasks.filter((t: any) => {
      if (!t.slaDays || !t.slaStartDate) return false;
      const start = new Date(t.slaStartDate);
      const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return elapsed > t.slaDays;
    }).length,
  };

  // Quick links
  const quickLinks = [
    { 
      href: '/dashboard/tasks', 
      icon: CheckSquare, 
      label: language === 'ar' ? 'المهام' : 'Tasks', 
      count: tasks.filter((t: any) => t.status !== 'done').length,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    { 
      href: '/dashboard/site-management', 
      icon: ClipboardList, 
      label: language === 'ar' ? 'تقارير الموقع' : 'Site Reports', 
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    { 
      href: '/dashboard/clients', 
      icon: MessageSquare, 
      label: language === 'ar' ? 'التفاعلات' : 'Interactions', 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    { 
      href: '/dashboard/documents', 
      icon: FileText, 
      label: language === 'ar' ? 'المستندات' : 'Documents', 
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20'
    },
    { 
      href: '/dashboard/finance', 
      icon: DollarSign, 
      label: language === 'ar' ? 'الفواتير' : 'Invoices', 
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20'
    },
    { 
      href: '/dashboard/financials', 
      icon: FileSpreadsheet, 
      label: language === 'ar' ? 'جدول الكميات' : 'BOQ', 
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20'
    },
  ];

  // Recent activities (mock)
  const recentActivities = [
    { id: '1', icon: CheckSquare, text: language === 'ar' ? 'تم إكمال مهمة "مراجعة المخططات"' : 'Task "Drawing Review" completed', time: '2h', color: 'text-green-400' },
    { id: '2', icon: FileText, text: language === 'ar' ? 'تم رفع مستند جديد' : 'New document uploaded', time: '3h', color: 'text-blue-400' },
    { id: '3', icon: AlertTriangle, text: language === 'ar' ? 'تنبيه SLA: مهمة حكومية مخالفة' : 'SLA Alert: Government task breached', time: '4h', color: 'text-red-400' },
    { id: '4', icon: Users, text: language === 'ar' ? 'تم تعيين مهمة جديدة' : 'New task assigned', time: '5h', color: 'text-purple-400' },
    { id: '5', icon: MessageSquare, text: language === 'ar' ? 'تعليق جديد من العميل' : 'New client comment', time: '6h', color: 'text-amber-400' },
    { id: '6', icon: BarChart3, text: language === 'ar' ? 'تم تحديث تقدم المشروع' : 'Project progress updated', time: '7h', color: 'text-cyan-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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
          {now.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeProjects.length}</p>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'مشاريع نشطة' : 'Active Projects'}
                </p>
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
                <p className="text-2xl font-bold text-white">{workloadSummary.totalActive}</p>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'مهام قيد التنفيذ' : 'Active Tasks'}
                </p>
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
                <p className="text-2xl font-bold text-white">{workloadSummary.overdue + workloadSummary.slaBreached}</p>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'تحذيرات' : 'Alerts'}
                </p>
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
                <p className="text-2xl font-bold text-white">{workloadSummary.completedToday}</p>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'مكتمل اليوم' : 'Completed Today'}
                </p>
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
              {activeProjects.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {language === 'ar' ? 'لا توجد مشاريع نشطة' : 'No active projects'}
                </div>
              ) : (
                activeProjects.map((project: any) => {
                  const projectTasks = tasks.filter((t: any) => t.projectId === project.id);
                  const doneTasks = projectTasks.filter((t: any) => t.status === 'done').length;
                  const totalTasks = projectTasks.length;
                  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
                  const overdueTasks = projectTasks.filter((t: any) => {
                    if (!t.dueDate || t.status === 'done') return false;
                    return new Date(t.dueDate) < now;
                  }).length;
                  const slaTasks = projectTasks.filter((t: any) => t.slaDays && t.slaStartDate);
                  const breachedSla = slaTasks.filter((t: any) => {
                    const start = new Date(t.slaStartDate);
                    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer group">
                      <div className={`p-2 rounded-lg ${link.bgColor}`}>
                        <link.icon className={`w-5 h-5 ${link.color}`} />
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-white">
                        {link.label}
                      </span>
                      {link.count !== undefined && (
                        <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-[10px]">
                          {link.count}
                        </Badge>
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
                  {recentActivities.map((activity) => (
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
        {/* Pending Approvals */}
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
              {pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {language === 'ar' ? 'لا توجد مهام عاجلة' : 'No urgent tasks'}
                </div>
              ) : (
                pendingTasks.map((task: any) => {
                  const slaStatus = getTaskSLAStatus(task);
                  const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
                  const priorityColors: Record<string, string> = {
                    urgent: 'bg-red-500',
                    high: 'bg-orange-500',
                    medium: 'bg-yellow-500',
                    low: 'bg-green-500',
                  };
                  
                  return (
                    <div 
                      key={task.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = '/dashboard/tasks'}
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
            {/* Task Status Distribution */}
            <div className="space-y-3">
              <h4 className="text-sm text-slate-400">
                {language === 'ar' ? 'توزيع المهام' : 'Task Distribution'}
              </h4>
              {[
                { label: language === 'ar' ? 'مكتمل' : 'Done', count: tasks.filter((t: any) => t.status === 'done').length, total: tasks.length, color: 'bg-green-500' },
                { label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress', count: tasks.filter((t: any) => t.status === 'in_progress').length, total: tasks.length, color: 'bg-blue-500' },
                { label: language === 'ar' ? 'مراجعة' : 'Review', count: tasks.filter((t: any) => t.status === 'review').length, total: tasks.length, color: 'bg-purple-500' },
                { label: language === 'ar' ? 'قيد الانتظار' : 'To Do', count: tasks.filter((t: any) => t.status === 'todo').length, total: tasks.length, color: 'bg-gray-500' },
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
              <h4 className="text-sm text-slate-400 mb-3">
                {language === 'ar' ? 'مؤشرات الأداء' : 'Performance Metrics'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/30 text-center">
                  <p className="text-lg font-bold text-white">
                    {tasks.length > 0 ? Math.round((tasks.filter((t: any) => t.status === 'done').length / tasks.length) * 100) : 0}%
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {language === 'ar' ? 'نسبة الإنجاز' : 'Completion Rate'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/30 text-center">
                  <p className="text-lg font-bold text-white">
                    {tasks.filter((t: any) => {
                      if (!t.slaDays || !t.slaStartDate) return true;
                      const start = new Date(t.slaStartDate);
                      const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      return elapsed <= t.slaDays;
                    }).length}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {language === 'ar' ? 'SLA ملتزم' : 'SLA Compliant'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/30 text-center">
                  <p className="text-lg font-bold text-amber-400">{workloadSummary.overdue}</p>
                  <p className="text-[10px] text-slate-500">
                    {language === 'ar' ? 'متأخرات' : 'Overdue'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/30 text-center">
                  <p className="text-lg font-bold text-red-400">{workloadSummary.slaBreached}</p>
                  <p className="text-[10px] text-slate-500">
                    {language === 'ar' ? 'SLA مخالف' : 'SLA Breached'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
