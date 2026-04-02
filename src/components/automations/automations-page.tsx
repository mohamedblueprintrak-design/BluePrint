'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  Plus,
  Settings,
  Clock,
  Mail,
  Bell,
  FileText,
  Play,
  Pause,
  Edit,
  TrendingUp,
} from 'lucide-react';
import type { Automation, AutomationStatus } from '@/types';

// Status labels
const statusLabels: Record<AutomationStatus, { ar: string; en: string }> = {
  active: { ar: 'نشط', en: 'Active' },
  inactive: { ar: 'غير نشط', en: 'Inactive' },
  paused: { ar: 'متوقف مؤقتاً', en: 'Paused' },
};

// Status badge variants
const statusVariants: Record<AutomationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  paused: 'outline',
};

// Trigger type labels
const triggerTypeLabels: Record<string, { ar: string; en: string }> = {
  schedule: { ar: 'مجدول', en: 'Scheduled' },
  event: { ar: 'بناء على حدث', en: 'Event-based' },
  threshold: { ar: 'بناء على حد', en: 'Threshold-based' },
};

// Action type labels
const actionTypeLabels: Record<string, { ar: string; en: string }> = {
  notification: { ar: 'إشعار', en: 'Notification' },
  email: { ar: 'بريد إلكتروني', en: 'Email' },
  webhook: { ar: 'Webhook', en: 'Webhook' },
  task: { ar: 'إنشاء مهمة', en: 'Create Task' },
};

// Templates data
const templates = [
  {
    name: { ar: 'تنبيه المهام', en: 'Task Alerts' },
    icon: Bell,
    description: { ar: 'إرسال تنبيه عند إنشاء أو تحديث مهمة', en: 'Send alert when a task is created or updated' },
    triggerType: 'event',
    actionType: 'notification',
  },
  {
    name: { ar: 'تقرير يومي', en: 'Daily Report' },
    icon: FileText,
    description: { ar: 'إنشاء تقرير يومي تلقائي', en: 'Auto-generate daily report' },
    triggerType: 'schedule',
    actionType: 'email',
  },
  {
    name: { ar: 'تنبيه الفواتير', en: 'Invoice Alerts' },
    icon: Mail,
    description: { ar: 'تذكير بالفواتير المستحقة', en: 'Remind about due invoices' },
    triggerType: 'schedule',
    actionType: 'notification',
  },
  {
    name: { ar: 'مراقبة الميزانية', en: 'Budget Monitor' },
    icon: TrendingUp,
    description: { ar: 'تنبيه عند تجاوز حد الميزانية', en: 'Alert when budget limit is exceeded' },
    triggerType: 'threshold',
    actionType: 'notification',
  },
];

export default function AutomationsPage() {
  const { language, isRTL } = useApp();
  const isArabic = language === 'ar';
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch automations
  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await fetch('/api/automations');
      if (response.ok) {
        const data = await response.json();
        setAutomations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle automation status
  const toggleStatus = async (id: string, currentStatus: AutomationStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: isArabic ? 'تم تحديث الحالة' : 'Status updated',
          description: isArabic ? 'تم تحديث حالة الأتمتة بنجاح' : 'Automation status updated successfully',
        });
        fetchAutomations();
      }
    } catch {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ أثناء تحديث الحالة' : 'Failed to update automation status',
        variant: 'destructive',
      });
    }
  };

  // Stats
  const activeCount = automations.filter((a) => a.status === 'active').length;
  const inactiveCount = automations.filter((a) => a.status === 'inactive').length;
  const totalRuns = automations.reduce((sum, a) => sum + a.runCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isArabic ? 'الأتمتة' : 'Automations'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isArabic ? 'أتمتة المهام والعمليات المتكررة' : 'Automate repetitive tasks and workflows'}
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-foreground">
          <Plus className={`w-4 h-4 ${isRTL ? 'me-2' : 'ms-2'}`} />
          {isArabic ? 'إنشاء أتمتة جديدة' : 'New Automation'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? 'إجمالي الأتمتة' : 'Total'}</p>
                <p className="text-2xl font-bold text-foreground">{automations.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400">{isArabic ? 'نشطة' : 'Active'}</p>
                <p className="text-2xl font-bold text-green-400">{activeCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? 'غير نشطة' : 'Inactive'}</p>
                <p className="text-2xl font-bold text-foreground/80">{inactiveCount}</p>
              </div>
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <Pause className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-400">{isArabic ? 'إجمالي التشغيلات' : 'Total Runs'}</p>
                <p className="text-2xl font-bold text-purple-400">{totalRuns}</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          {isArabic ? 'الأتمتة النشطة' : 'Active Automations'}
        </h2>
        {automations.map((automation) => (
          <Card key={automation.id} className="bg-card border-border hover:border-border transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground text-lg">{automation.name}</h3>
                    <Badge variant={statusVariants[automation.status]}>
                      {statusLabels[automation.status][isRTL ? 'ar' : 'en']}
                    </Badge>
                  </div>
                  {automation.description && (
                    <p className="text-muted-foreground mb-4">{automation.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{isArabic ? 'المحفز:' : 'Trigger:'}</span>
                      <span className="text-sm font-medium text-foreground/80">
                        {triggerTypeLabels[automation.triggerType]?.[isRTL ? 'ar' : 'en'] || automation.triggerType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{isArabic ? 'الإجراء:' : 'Action:'}</span>
                      <span className="text-sm font-medium text-foreground/80">
                        {actionTypeLabels[automation.actionType]?.[isRTL ? 'ar' : 'en'] || automation.actionType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{isArabic ? 'عدد التشغيلات:' : 'Runs:'}</span>
                      <span className="text-sm font-medium text-foreground/80">{automation.runCount}</span>
                    </div>
                    {automation.lastRunAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{isArabic ? 'آخر تشغيل:' : 'Last run:'}</span>
                        <span className="text-sm font-medium text-foreground/80">
                          {new Date(automation.lastRunAt).toLocaleString(isArabic ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleStatus(automation.id, automation.status)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      automation.status === 'active' ? 'bg-green-500' : 'bg-slate-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        automation.status === 'active' ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Templates */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          {isArabic ? 'قوالب جاهزة' : 'Templates'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template, index) => {
            const Icon = template.icon;
            return (
              <Card
                key={index}
                className="bg-card border-border hover:border-border transition-colors cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{template.name[isRTL ? 'ar' : 'en']}</h3>
                      <p className="text-sm text-muted-foreground">{template.description[isRTL ? 'ar' : 'en']}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {automations.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{isArabic ? 'لا توجد أتمتة' : 'No automations'}</p>
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? 'ابدأ بإنشاء أتمتة جديدة أو استخدم أحد القوالب الجاهزة'
                : 'Create a new automation or use one of the ready-made templates'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
