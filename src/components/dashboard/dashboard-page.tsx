'use client';

import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useDashboard, useProjects, useTasks, useInvoices } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2, Users, DollarSign, CheckSquare, AlertTriangle,
  TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight,
  Calendar, Briefcase, FileText, Activity
} from 'lucide-react';

export function DashboardPage() {
  const { language, setCurrentPage } = useApp();
  const { t, formatCurrency, formatDate, formatPercentage } = useTranslation(language);
  
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard();
  const { data: projectsData } = useProjects();
  const { data: tasksData } = useTasks({ status: 'todo' });
  const { data: invoicesData } = useInvoices({ status: 'pending' });

  const stats = dashboardData?.data;
  const projects = projectsData?.data || [];
  const tasks = tasksData?.data || [];
  const invoices = invoicesData?.data || [];

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
  const pendingInvoices = invoices.filter((inv: any) => inv.status === 'pending' || inv.status === 'partial').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
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
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('projects')} className="text-blue-400">
              {t.view} {language === 'ar' ? 'الكل' : 'All'}
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {recentProjects.length > 0 ? recentProjects.map((project: any) => (
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
                className="h-20 flex flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-blue-500"
                onClick={() => setCurrentPage('projects')}
              >
                <Building2 className="w-5 h-5 text-blue-400" />
                <span className="text-xs">{t.newProject}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-green-500"
                onClick={() => setCurrentPage('clients')}
              >
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-xs">{t.newClient}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-cyan-500"
                onClick={() => setCurrentPage('invoices')}
              >
                <DollarSign className="w-5 h-5 text-cyan-400" />
                <span className="text-xs">{t.newInvoice}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-orange-500"
                onClick={() => setCurrentPage('tasks')}
              >
                <CheckSquare className="w-5 h-5 text-orange-400" />
                <span className="text-xs">{t.newTask}</span>
              </Button>
            </CardContent>
          </Card>

          {/* Open Defects */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                {t.openDefects}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-red-400">{stats?.defects?.open || 0}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {language === 'ar' ? 'عيوب تحتاج معالجة' : 'Defects need attention'}
                </p>
              </div>
            </CardContent>
          </Card>
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
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('tasks')} className="text-blue-400">
              {t.view} {language === 'ar' ? 'الكل' : 'All'}
            </Button>
          </CardHeader>
          <CardContent>
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
                      <p className="text-xs text-slate-400">{task.project || t.noData}</p>
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
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              {t.pendingInvoices}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('invoices')} className="text-blue-400">
              {t.view} {language === 'ar' ? 'الكل' : 'All'}
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {pendingInvoices.length > 0 ? pendingInvoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-400">{invoice.client || t.noData}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-medium text-white">{formatCurrency(invoice.total)}</p>
                      <p className="text-xs text-slate-400">{formatDate(invoice.dueDate)}</p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
