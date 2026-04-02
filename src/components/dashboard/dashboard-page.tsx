'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import { useDashboard, useProjects, useTasks, useInvoices } from '@/hooks/use-data';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { FloatingAIButton } from '@/components/ai/floating-ai-button';
import { AIInsightsCard } from '@/components/ai/ai-insights-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, DollarSign, CheckSquare, AlertTriangle,
  ArrowUpRight, Clock, FileText, Loader2, Plus,
  Rocket, BarChart3, CalendarDays, Sparkles, AlertCircle,
  TrendingUp, ClipboardList, ChevronDown,
  ChevronRight, Shield, UserPlus, Eye, CreditCard,
  Receipt, CalendarCheck, UserCog, HeartHandshake,
  Mail
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

// ─── Role types ───────────────────────────────────────────────
type RoleKey = 'ADMIN' | 'MANAGER' | 'PROJECT_MANAGER' | 'ENGINEER' | 'ACCOUNTANT' | 'HR' | 'DRAFTSMAN' | 'SECRETARY' | 'VIEWER';

interface StatCardDef {
  title: string;
  titleEn: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtitle?: string;
}

interface QuickActionDef {
  label: string;
  labelEn: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

// ─── Helpers ──────────────────────────────────────────────────
function getGreeting(lang: string): string {
  const h = new Date().getHours();
  if (h < 12) return lang === 'ar' ? 'صباح الخير' : 'Good Morning';
  if (h < 18) return lang === 'ar' ? 'مساء الخير' : 'Good Afternoon';
  return lang === 'ar' ? 'مساء الخير' : 'Good Evening';
}

function getRoleMessage(role: string, lang: string): string {
  const messages: Record<string, { ar: string; en: string }> = {
    ADMIN:      { ar: 'إليك نظرة عامة على أداء المؤسسة اليوم', en: "Here's your organization performance overview for today" },
    MANAGER:    { ar: 'تابع تقدم المشاريع والفريق اليوم', en: "Track your projects and team progress today" },
    PROJECT_MANAGER: { ar: 'إدارة مشاريعك بكفاءة اليوم', en: "Manage your projects efficiently today" },
    ENGINEER:   { ar: 'مهامك لع اليوم جاهزة، هيا نبدأ!', en: "Your tasks for today are ready, let's go!" },
    ACCOUNTANT: { ar: 'ملخصك المالي اليوم جاهز', en: "Your financial summary for today is ready" },
    HR:         { ar: 'تابع شؤون الموظفين اليوم', en: "Manage your HR tasks for today" },
    DRAFTSMAN:  { ar: 'راجع مهام الرسم والمستندات', en: "Review your drawing and document tasks" },
    SECRETARY:  { ar: 'جدولك ومهامك الإدارية اليوم', en: "Your schedule and admin tasks for today" },
    VIEWER:     { ar: 'تصفح آخر التحديثات', en: "Browse the latest updates" },
  };
  const m = messages[role] || messages.VIEWER;
  return lang === 'ar' ? m.ar : m.en;
}

// ─── Main Component ──────────────────────────────────────────
export function DashboardPage() {
  const router = useRouter();
  const { language } = useApp();
  const { user, hasRole } = useAuth();
  const canSeeFinancials = hasRole(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'PROJECT_MANAGER'] as any);
  const { t, formatCurrency } = useTranslation(language);
  const role = (user?.role || 'VIEWER') as RoleKey;
  const isAr = language === 'ar';
  const now = useMemo(() => new Date(), []);

  const [period, setPeriod] = useState<Period>('30d');
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);

  // ─── Onboarding check ───
  useEffect(() => {
    let isMounted = true;
    const check = () => {
      try {
        const isDemo = localStorage.getItem('blueprint_demo_mode') === 'true';
        if (isDemo) return;
        const hasCompleted = localStorage.getItem('blueprint_onboarding_completed');
        if (!hasCompleted && isMounted) setShowOnboardingWizard(true);
      } catch { /* noop */ }
    };
    const timer = setTimeout(check, 100);
    return () => { isMounted = false; clearTimeout(timer); };
  }, []);

  // ─── Data hooks (same as original) ───
  const { data: dashboardData, isLoading: dashboardLoading, error, refetch } = useDashboard();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ status: 'todo' });
  const { data: invoicesData } = useInvoices({ status: 'pending' });
  const { data: allTasksData } = useTasks();

  const stats = dashboardData?.data;
  const projectsRaw = projectsData?.data;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tasks = tasksData?.data || [];
  const invoices = useMemo(() => invoicesData?.data || [], [invoicesData?.data]);
  const allTasks = useMemo(() => allTasksData?.data || [], [allTasksData?.data]);
  const projects = useMemo(() => projectsRaw || [], [projectsRaw]);

  // ─── Computed values ───
  const overdueTasks = useMemo(() => allTasks.filter((tk: any) => tk.dueDate && tk.status !== 'done' && new Date(tk.dueDate) < now).length, [allTasks, now]);
  const slaBreached = useMemo(() => allTasks.filter((tk: any) => {
    if (!tk.slaDays || !tk.slaStartDate) return false;
    const elapsed = Math.floor((now.getTime() - new Date(tk.slaStartDate).getTime()) / 86400000);
    return elapsed > tk.slaDays;
  }).length, [allTasks, now]);
  const overdueInvoices = useMemo(() => invoices.filter((inv: any) => inv.dueDate && inv.status !== 'paid' && new Date(inv.dueDate) < now).length, [invoices, now]);
  const openDefects = stats?.defects?.open || 0;

  const activeProjects = useMemo(() => projects.filter((p: any) => p.status === 'active'), [projects]);

  // Today's tasks (for Engineer)
  const todayTasks = useMemo(() => allTasks.filter((tk: any) => {
    if (!tk.dueDate || tk.status === 'done') return false;
    return new Date(tk.dueDate).toDateString() === now.toDateString();
  }).slice(0, 10), [allTasks, now]);

  // ─── Chart data (same logic as original) ───
  const revenueData = useMemo((): RevenueData[] => {
    const months = isAr
      ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const numMonths = period === '7d' ? 1 : period === '30d' ? 3 : period === '90d' ? 6 : 12;
    const baseRevenue = stats?.financial?.totalPaid || 0;
    const baseExpenses = (stats?.financial as Record<string, number>)?.totalExpenses || baseRevenue * 0.4;
    const baseProfit = baseRevenue - baseExpenses;
    const mr = baseRevenue / (numMonths || 1);
    const me = baseExpenses / (numMonths || 1);
    const mp = baseProfit / (numMonths || 1);
    return months.slice(0, numMonths).map((month, i) => ({
      month,
      revenue: Math.round(mr * (0.85 + i * 0.03)),
      expenses: Math.round(me * (0.9 + i * 0.02)),
      profit: Math.round(mp * (0.8 + i * 0.04)),
    }));
  }, [period, stats, isAr]);

  const projectStatusData = useMemo((): ProjectStatusData[] => [
    { name: 'active', value: projects.filter((p: any) => p.status === 'active').length, color: '#3b82f6' },
    { name: 'completed', value: projects.filter((p: any) => p.status === 'completed').length, color: '#10b981' },
    { name: 'pending', value: projects.filter((p: any) => p.status === 'pending').length, color: '#f59e0b' },
    { name: 'on_hold', value: projects.filter((p: any) => p.status === 'on_hold').length, color: '#8b5cf6' },
  ], [projects]);

  const taskCompletionData = useMemo((): TaskCompletionData[] => {
    if (period === 'year') return generateMonthlyTaskData(language);
    return generateWeeklyTaskData(language);
  }, [period, language]);

  const expenseData = useMemo((): ExpenseData[] => {
    const categories = isAr ? ['مواد','عمالة','معدات','نقل','مرافق','متفرقات'] : ['Materials','Labor','Equipment','Transportation','Utilities','Miscellaneous'];
    const financial = stats?.financial as Record<string, number> | undefined;
    const totalExpenses = financial?.totalExpenses || (stats?.financial?.totalPaid || 0) * 0.4;
    const distribution = [0.35, 0.25, 0.15, 0.10, 0.08, 0.07];
    return categories.map((category, i) => ({ category, amount: Math.round(totalExpenses * distribution[i]) }));
  }, [stats, isAr]);

  // ─── Role-adaptive Stat Cards ───
  const statCards: StatCardDef[] = useMemo(() => {
    const map: Record<RoleKey, StatCardDef[]> = {
      ADMIN: [
        { title: 'إجمالي المستخدمين', titleEn: 'Total Users', value: stats?.clients?.total || 0, icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { title: 'المشاريع النشطة', titleEn: 'Active Projects', value: stats?.projects?.active || 0, icon: Building2, color: 'text-green-400', bgColor: 'bg-green-500/10' },
        { title: 'الإيرادات', titleEn: 'Revenue', value: formatCurrency(stats?.financial?.totalPaid || 0), icon: DollarSign, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', subtitle: `${formatCurrency(stats?.financial?.totalPending || 0)} ${isAr ? 'معلق' : 'pending'}` },
        { title: 'تنبيهات SLA', titleEn: 'SLA Alerts', value: slaBreached, icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
      ],
      MANAGER: [
        { title: 'المشاريع النشطة', titleEn: 'Active Projects', value: stats?.projects?.active || 0, icon: Building2, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { title: 'المهام المعلقة', titleEn: 'Pending Tasks', value: stats?.tasks?.pending || 0, icon: CheckSquare, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
        { title: 'الإيرادات', titleEn: 'Revenue', value: formatCurrency(stats?.financial?.totalPaid || 0), icon: DollarSign, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
        { title: 'تنبيهات SLA', titleEn: 'SLA Alerts', value: slaBreached, icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
      ],
      PROJECT_MANAGER: [
        { title: 'مشاريعي النشطة', titleEn: 'My Active Projects', value: activeProjects.length, icon: Building2, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { title: 'المهام المعلقة', titleEn: 'Pending Tasks', value: stats?.tasks?.pending || 0, icon: CheckSquare, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
        { title: 'فواتير معلقة', titleEn: 'Pending Invoices', value: invoices.length, icon: CreditCard, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
        { title: 'تنبيهات SLA', titleEn: 'SLA Alerts', value: slaBreached, icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
      ],
      ENGINEER: [
        { title: 'مهامي النهارده', titleEn: "Today's Tasks", value: todayTasks.length, icon: CheckSquare, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { title: 'مهام متأخرة', titleEn: 'Overdue Tasks', value: overdueTasks, icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
        { title: 'عيوب مطلوبة', titleEn: 'Open Defects', value: openDefects, icon: ClipboardList, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
        { title: 'مستندات بانتظار', titleEn: 'Pending Documents', value: 0, icon: FileText, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
      ],
      ACCOUNTANT: [
        { title: 'فواتير معلقة', titleEn: 'Pending Invoices', value: invoices.length, icon: CreditCard, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { title: 'فواتير متأخرة', titleEn: 'Overdue Invoices', value: overdueInvoices, icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
        { title: 'تحصيلات اليوم', titleEn: "Today's Collections", value: 0, icon: DollarSign, color: 'text-green-400', bgColor: 'bg-green-500/10' },
        { title: 'السندات المدفوعة', titleEn: 'Paid Vouchers', value: stats?.financial?.totalPaid ? 1 : 0, icon: Receipt, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
      ],
      HR: [
        { title: 'الحاضرون اليوم', titleEn: "Today's Attendance", value: stats?.clients?.total || 0, icon: CalendarCheck, color: 'text-green-400', bgColor: 'bg-green-500/10' },
        { title: 'طلبات إجازة', titleEn: 'Leave Requests', value: 0, icon: HeartHandshake, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
        { title: 'متأخرين اليوم', titleEn: "Today's Late", value: 0, icon: Clock, color: 'text-red-400', bgColor: 'bg-red-500/10' },
        { title: 'الموظفين النشطين', titleEn: 'Active Employees', value: stats?.clients?.total || 0, icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
      ],
      DRAFTSMAN: [
        { title: 'مهامي النهارده', titleEn: "Today's Tasks", value: todayTasks.length, icon: CheckSquare, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { title: 'المراجعات المعلقة', titleEn: 'Pending Reviews', value: stats?.tasks?.pending || 0, icon: Eye, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
        { title: 'المستندات النشطة', titleEn: 'Active Documents', value: 0, icon: FileText, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
        { title: 'مشاريعي', titleEn: 'My Projects', value: activeProjects.length, icon: Building2, color: 'text-green-400', bgColor: 'bg-green-500/10' },
      ],
      SECRETARY: [
        { title: 'الاجتماعات اليوم', titleEn: "Today's Meetings", value: 0, icon: CalendarDays, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { title: 'المراسلات المعلقة', titleEn: 'Pending Correspondence', value: 0, icon: Mail, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
        { title: 'المستندات النشطة', titleEn: 'Active Documents', value: 0, icon: FileText, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
        { title: 'المواعيد', titleEn: 'Appointments', value: 0, icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
      ],
      VIEWER: [
        { title: 'المشاريع النشطة', titleEn: 'Active Projects', value: stats?.projects?.active || 0, icon: Building2, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { title: 'المهام النشطة', titleEn: 'Active Tasks', value: stats?.tasks?.total || 0, icon: CheckSquare, color: 'text-green-400', bgColor: 'bg-green-500/10' },
        { title: 'التحديثات الأخيرة', titleEn: 'Recent Updates', value: 0, icon: TrendingUp, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
        { title: isAr ? '—' : '—', titleEn: '—', value: '—', icon: Eye, color: 'text-slate-400', bgColor: 'bg-slate-500/10' },
      ],
    };
    return map[role] || map.VIEWER;
  }, [role, stats, invoices, activeProjects.length, todayTasks.length, overdueTasks, overdueInvoices, slaBreached, openDefects, formatCurrency, isAr]);

  // ─── Role-adaptive Quick Actions ───
  const quickActions: QuickActionDef[] = useMemo(() => {
    const map: Record<RoleKey, QuickActionDef[]> = {
      ADMIN: [
        { label: 'إدارة المستخدمين', labelEn: 'Manage Users', href: '/dashboard/users', icon: UserCog, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: 'عرض النشاط', labelEn: 'View Activity', href: '/dashboard/activities', icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-500/20' },
        { label: 'تقرير', labelEn: 'Reports', href: '/dashboard/reports', icon: BarChart3, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
        { label: 'المساعد الذكي', labelEn: 'AI Assistant', href: '/dashboard/ai-chat', icon: Sparkles, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
      ],
      MANAGER: [
        { label: 'تعيين مهمة', labelEn: 'Assign Task', href: '/dashboard/tasks', icon: CheckSquare, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: 'تقرير تقدم', labelEn: 'Progress Report', href: '/dashboard/reports', icon: BarChart3, color: 'text-green-400', bgColor: 'bg-green-500/20' },
        { label: 'إنشاء فاتورة', labelEn: 'Create Invoice', href: '/dashboard/finance', icon: CreditCard, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
        { label: 'اجتماع جديد', labelEn: 'New Meeting', href: '/dashboard/calendar', icon: CalendarDays, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
      ],
      PROJECT_MANAGER: [
        { label: 'تعيين مهمة', labelEn: 'Assign Task', href: '/dashboard/tasks', icon: CheckSquare, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: 'تحديث تقدم', labelEn: 'Update Progress', href: '/dashboard/projects', icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-500/20' },
        { label: 'إنشاء فاتورة', labelEn: 'Create Invoice', href: '/dashboard/finance', icon: CreditCard, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
        { label: 'تسجيل زيارة', labelEn: 'Log Visit', href: '/dashboard/site-management', icon: ClipboardList, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
      ],
      ENGINEER: [
        { label: 'تسجيل يومية', labelEn: 'Daily Log', href: '/dashboard/site-management', icon: ClipboardList, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: 'الإبلاغ عن عيب', labelEn: 'Report Defect', href: '/dashboard/site-management', icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
        { label: 'رفع مستند', labelEn: 'Upload Document', href: '/dashboard/documents', icon: FileText, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
        { label: 'إتمام مهمة', labelEn: 'Complete Task', href: '/dashboard/tasks', icon: CheckSquare, color: 'text-green-400', bgColor: 'bg-green-500/20' },
      ],
      ACCOUNTANT: [
        { label: 'إنشاء فاتورة', labelEn: 'Create Invoice', href: '/dashboard/finance', icon: CreditCard, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: 'تسجيل دفعة', labelEn: 'Record Payment', href: '/dashboard/finance', icon: DollarSign, color: 'text-green-400', bgColor: 'bg-green-500/20' },
        { label: 'تقرير مالي', labelEn: 'Financial Report', href: '/dashboard/reports', icon: BarChart3, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
        { label: 'إدارة سندات', labelEn: 'Manage Vouchers', href: '/dashboard/finance', icon: Receipt, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
      ],
      HR: [
        { label: 'الموافقة على إجازة', labelEn: 'Approve Leave', href: '/dashboard/users', icon: HeartHandshake, color: 'text-green-400', bgColor: 'bg-green-500/20' },
        { label: 'عرض الحضور', labelEn: 'View Attendance', href: '/dashboard/users', icon: CalendarCheck, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: 'إضافة موظف', labelEn: 'Add Employee', href: '/dashboard/users', icon: UserPlus, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
        { label: 'المعاشات', labelEn: 'Pensions', href: '/dashboard/users', icon: Shield, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
      ],
      DRAFTSMAN: [
        { label: 'مشروع جديد', labelEn: 'New Project', href: '/dashboard/projects', icon: Building2, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: 'مهمة جديدة', labelEn: 'New Task', href: '/dashboard/tasks', icon: CheckSquare, color: 'text-green-400', bgColor: 'bg-green-500/20' },
        { label: 'عرض التقارير', labelEn: 'View Reports', href: '/dashboard/reports', icon: BarChart3, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
        { label: 'المساعد الذكي', labelEn: 'AI Assistant', href: '/dashboard/ai-chat', icon: Sparkles, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
      ],
      SECRETARY: [
        { label: 'مشروع جديد', labelEn: 'New Project', href: '/dashboard/projects', icon: Building2, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: 'مهمة جديدة', labelEn: 'New Task', href: '/dashboard/tasks', icon: CheckSquare, color: 'text-green-400', bgColor: 'bg-green-500/20' },
        { label: 'عرض التقارير', labelEn: 'View Reports', href: '/dashboard/reports', icon: BarChart3, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
        { label: 'المساعد الذكي', labelEn: 'AI Assistant', href: '/dashboard/ai-chat', icon: Sparkles, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
      ],
      VIEWER: [
        { label: 'مشروع جديد', labelEn: 'New Project', href: '/dashboard/projects', icon: Building2, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: 'مهمة جديدة', labelEn: 'New Task', href: '/dashboard/tasks', icon: CheckSquare, color: 'text-green-400', bgColor: 'bg-green-500/20' },
        { label: 'عرض التقارير', labelEn: 'View Reports', href: '/dashboard/reports', icon: BarChart3, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
        { label: 'المساعد الذكي', labelEn: 'AI Assistant', href: '/dashboard/ai-chat', icon: Sparkles, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
      ],
    };
    return map[role] || map.VIEWER;
  }, [role]);

  // ─── Alerts ───
  const alerts = useMemo(() => {
    const items: { id: string; severity: 'red' | 'amber'; icon: React.ElementType; text: string; count: number; href: string }[] = [];
    if (slaBreached > 0) items.push({ id: 'sla', severity: 'red', icon: AlertTriangle, text: isAr ? 'SLA مخالف' : 'SLA Breached', count: slaBreached, href: '/dashboard/tasks' });
    if (overdueInvoices > 0) items.push({ id: 'overdue-inv', severity: 'red', icon: CreditCard, text: isAr ? 'فواتير متأخرة' : 'Overdue Invoices', count: overdueInvoices, href: '/dashboard/finance' });
    if (overdueTasks > 0) items.push({ id: 'overdue-tasks', severity: 'amber', icon: Clock, text: isAr ? 'مهام متأخرة' : 'Overdue Tasks', count: overdueTasks, href: '/dashboard/tasks' });
    if (role === 'HR') items.push({ id: 'leave', severity: 'amber', icon: HeartHandshake, text: isAr ? 'طلبات إجازة معلقة' : 'Pending Leave Requests', count: 0, href: '/dashboard/users' });
    if (openDefects > 0) items.push({ id: 'defects', severity: 'amber', icon: ClipboardList, text: isAr ? 'عيوب مفتوحة' : 'Open Defects', count: openDefects, href: '/dashboard/site-management' });
    return items;
  }, [slaBreached, overdueInvoices, overdueTasks, openDefects, role, isAr]);

  // ─── Chart loader ───
  const ChartLoader = () => (
    <div className="h-[300px] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  // ─── Get SLA status for a task ───
  const getTaskSLAStatus = useCallback((task: any) => {
    if (!task.slaDays || !task.slaStartDate) return null;
    const start = new Date(task.slaStartDate);
    const elapsed = Math.floor((now.getTime() - start.getTime()) / 86400000);
    const remaining = task.slaDays - elapsed;
    const pct = (remaining / task.slaDays) * 100;
    if (remaining <= 0) return { label: isAr ? 'مخالف' : 'Breached', color: 'text-red-400 bg-red-500/10', remaining };
    if (pct < 25) return { label: isAr ? 'خطر' : 'At Risk', color: 'text-red-400 bg-red-500/10', remaining };
    if (pct < 50) return { label: isAr ? 'تحذير' : 'Warning', color: 'text-amber-400 bg-amber-500/10', remaining };
    return { label: isAr ? 'على المسار' : 'On Track', color: 'text-green-400 bg-green-500/10', remaining };
  }, [isAr, now]);

  // ─── Render ───
  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <OnboardingWizard isOpen={showOnboardingWizard} onClose={() => setShowOnboardingWizard(false)} />

      {/* ═══ 1. Welcome Banner ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 text-white shadow-lg shadow-blue-500/20">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">
            {getGreeting(language)} يا {user?.fullName || (isAr ? 'مستخدم' : 'User')} 👋
          </h2>
          <p className="text-blue-100">{getRoleMessage(role, language)}</p>
        </div>
        <div className="absolute end-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute start-10 bottom-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2" />
        <div className="absolute end-20 top-1/2 w-20 h-20 bg-white/5 rounded-full" />
      </div>

      {/* ═══ Error State ═══ */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-medium">{isAr ? 'حدث خطأ في تحميل البيانات' : 'Failed to load dashboard data'}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">{isAr ? 'إعادة المحاولة' : 'Retry'}</Button>
          </CardContent>
        </Card>
      )}

      {/* ═══ Empty State ═══ */}
      {projects.length === 0 && !projectsLoading && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-2xl bg-blue-500/10 mb-4"><Rocket className="w-12 h-12 text-blue-400" /></div>
              <h3 className="text-xl font-bold text-white mb-2">{isAr ? 'مرحبًا بك في BluePrint!' : 'Welcome to BluePrint!'}</h3>
              <p className="text-slate-400 max-w-md mb-6">{isAr ? 'ابدأ بإنشاء مشروعك الأول' : 'Start by creating your first project'}</p>
              <Button onClick={() => router.push('/dashboard/projects')} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 me-2" />{t.newProject}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ 2. Stat Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1 group">
            <CardContent className="p-5">
              <div className={`p-2.5 rounded-xl ${stat.bgColor} w-fit group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                {stat.subtitle && <p className="text-sm text-slate-400 mt-0.5">{stat.subtitle}</p>}
              </div>
              <p className="text-sm text-slate-400 mt-1">{isAr ? stat.title : stat.titleEn}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ 3. Alerts Banner ═══ */}
      {alerts.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              {isAr ? 'تنبيهات تحتاج اهتمامك' : 'Alerts Needing Attention'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <Link key={alert.id} href={alert.href} className="block">
                  <div className={`flex items-center gap-3 p-3 rounded-lg border-s-2 transition-colors cursor-pointer ${
                    alert.severity === 'red' ? 'bg-red-500/5 border-red-500/30 hover:bg-red-500/10' : 'bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10'
                  }`}>
                    <div className={`p-2 rounded-lg ${alert.severity === 'red' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                      <alert.icon className={`w-4 h-4 ${alert.severity === 'red' ? 'text-red-400' : 'text-amber-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${alert.severity === 'red' ? 'text-red-300' : 'text-amber-300'}`}>{alert.text}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs px-2 py-0.5 ${alert.severity === 'red' ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-amber-500/40 text-amber-400 bg-amber-500/10'}`}>
                      {alert.count}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ 4. Quick Actions ═══ */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                className="h-20 flex flex-col gap-2 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all duration-300 group"
                onClick={() => router.push(action.href)}
              >
                <div className={`p-2 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-xs text-slate-300 group-hover:text-white truncate">{isAr ? action.label : action.labelEn}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ 5. Active Content Section (role-adaptive) ═══ */}
      {(role === 'ADMIN' || role === 'MANAGER' || role === 'PROJECT_MANAGER') && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                {isAr ? 'المشاريع النشطة' : 'Active Projects'}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/projects')} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
              {isAr ? 'عرض الكل' : 'View All'} <ChevronRight className="w-4 h-4 ms-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeProjects.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">{isAr ? 'لا توجد مشاريع نشطة' : 'No active projects'}</div>
                ) : (
                  activeProjects.slice(0, 6).map((project: any) => {
                    const projectTasks = allTasks.filter((tk: any) => tk.projectId === project.id);
                    const done = projectTasks.filter((tk: any) => tk.status === 'done').length;
                    const total = projectTasks.length;
                    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
                    const overdue = projectTasks.filter((tk: any) => tk.dueDate && tk.status !== 'done' && new Date(tk.dueDate) < now).length;
                    return (
                      <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer group">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white truncate">{project.name}</p>
                              {overdue > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-red-500/30 text-red-400 bg-red-500/10">
                                  {overdue} {isAr ? 'متأخر' : 'overdue'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <Progress value={progress} className="h-1.5 flex-1" />
                              <span className="text-xs text-slate-400">{progress}%</span>
                              <span className="text-[10px] text-slate-500">{done}/{total}</span>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {role === 'ENGINEER' && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-400" />
                {isAr ? 'مهامي النهارده' : "Today's Tasks"}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/tasks')} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
              {isAr ? 'عرض الكل' : 'View All'} <ChevronRight className="w-4 h-4 ms-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">{isAr ? 'لا توجد مهام لليوم' : 'No tasks for today'}</div>
                ) : (
                  todayTasks.map((task: any) => {
                    const slaStatus = getTaskSLAStatus(task);
                    const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
                    const priorityColors: Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' };
                    return (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/tasks')}>
                        <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority] || 'bg-gray-500'} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">{task.project?.name || ''}</span>
                            {slaStatus && (
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border ${slaStatus.color}`}>
                                SLA: {slaStatus.remaining}{isAr ? 'ي' : 'd'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isOverdue && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-red-500/30 text-red-400 bg-red-500/10 shrink-0">{isAr ? 'متأخر' : 'Overdue'}</Badge>}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {role === 'ACCOUNTANT' && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                {isAr ? 'الفواتير المعلقة' : 'Pending Invoices'}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/finance')} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
              {isAr ? 'عرض الكل' : 'View All'} <ChevronRight className="w-4 h-4 ms-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">{isAr ? 'لا توجد فواتير معلقة' : 'No pending invoices'}</div>
              ) : (
                invoices.slice(0, 8).map((inv: any) => (
                  <div key={inv.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/finance')}>
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{inv.invoiceNumber || (isAr ? 'فاتورة' : 'Invoice')}</p>
                      <p className="text-xs text-slate-500">{inv.client?.name || ''}</p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-sm font-medium text-white">{formatCurrency(inv.amount || 0)}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-400 bg-amber-500/10 mt-1">
                        {isAr ? 'معلق' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {role === 'HR' && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-amber-400" />
              {isAr ? 'طلبات الإجازة المعلقة' : 'Pending Leave Requests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500 text-sm">{isAr ? 'لا توجد طلبات معلقة حاليًا' : 'No pending requests right now'}</div>
          </CardContent>
        </Card>
      )}

      {/* ═══ 6. AI Insights ═══ */}
      <AIInsightsCard
        title={isAr ? 'رؤى ذكية' : 'AI Insights'}
        context={JSON.stringify(canSeeFinancials ? {
          activeProjects: stats?.projects?.active || 0,
          totalRevenue: stats?.financial?.totalPaid || 0,
          pendingTasks: stats?.tasks?.pending || 0,
          openDefects: stats?.defects?.open || 0,
          role,
        } : {
          activeProjects: stats?.projects?.active || 0,
          pendingTasks: stats?.tasks?.pending || 0,
          openDefects: stats?.defects?.open || 0,
          role,
        })}
        taskType="data-analysis"
        compact
      />

      {/* ═══ 7. Charts Section (Collapsible) ═══ */}
      <Collapsible open={chartsOpen} onOpenChange={setChartsOpen}>
        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">{isAr ? '📊 التحليلات والرسوم البيانية' : '📊 Analytics & Charts'}</span>
              </div>
              <motion.div
                animate={{ rotate: chartsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </motion.div>
            </button>
          </CollapsibleTrigger>
          <AnimatePresence initial={false}>
            {chartsOpen && (
              <CollapsibleContent forceMount>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-6">
                    {/* Period selector inside charts */}
                    <div className="flex justify-end pt-2">
                      <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                        <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="7d">{isAr ? 'آخر 7 أيام' : 'Last 7 days'}</SelectItem>
                          <SelectItem value="30d">{isAr ? 'آخر 30 يوم' : 'Last 30 days'}</SelectItem>
                          <SelectItem value="90d">{isAr ? 'آخر 90 يوم' : 'Last 90 days'}</SelectItem>
                          <SelectItem value="year">{isAr ? 'هذا العام' : 'This Year'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {canSeeFinancials ? (
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-white text-base">{isAr ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {dashboardLoading ? <ChartLoader /> : <RevenueChart data={revenueData} formatCurrency={formatCurrency} language={language} />}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-white text-base">{isAr ? 'تقدم المشاريع' : 'Project Progress'}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-[300px]">
                              <div className="space-y-4">
                                {projects.slice(0, 5).map((project: any) => (
                                  <div key={project.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-white truncate">{project.name}</p>
                                      <span className="text-xs text-slate-400">{project.progressPercentage || 0}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${project.progressPercentage || 0}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      )}
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-white text-base">{isAr ? 'حالة المشاريع' : 'Project Status'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {projectsLoading ? <ChartLoader /> : <ProjectDonutChart data={projectStatusData} language={language} />}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-white text-base">{isAr ? 'اتجاه إنجاز المهام' : 'Task Completion Trend'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {tasksLoading ? <ChartLoader /> : <TaskCompletionChart data={taskCompletionData} language={language} />}
                        </CardContent>
                      </Card>
                      {canSeeFinancials ? (
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-white text-base">{isAr ? 'المصروفات حسب الفئة' : 'Expenses by Category'}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {dashboardLoading ? <ChartLoader /> : <ExpenseDonutChart data={expenseData} formatCurrency={formatCurrency} language={language} />}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-white text-base">{isAr ? 'نشاط الفريق' : 'Team Activity'}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {tasksLoading ? <ChartLoader /> : <TaskCompletionChart data={taskCompletionData} language={language} />}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Card>
      </Collapsible>

      {/* ═══ Floating AI Button ═══ */}
      <FloatingAIButton
        context={isAr ? 'لوحة التحكم الرئيسية' : 'Main Dashboard'}
        entityType="project"
      />
    </div>
  );
}
