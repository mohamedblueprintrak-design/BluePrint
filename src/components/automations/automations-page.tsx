'use client';

import { useState, useEffect } from 'react';
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

// Status labels in Arabic
const statusLabels: Record<AutomationStatus, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  paused: 'متوقف مؤقتاً',
};

// Status badge variants
const statusVariants: Record<AutomationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  paused: 'outline',
};

// Trigger type labels
const triggerTypeLabels: Record<string, string> = {
  schedule: 'مجدول',
  event: 'بناء على حدث',
  threshold: 'بناء على حد',
};

// Action type labels
const actionTypeLabels: Record<string, string> = {
  notification: 'إشعار',
  email: 'بريد إلكتروني',
  webhook: 'Webhook',
  task: 'إنشاء مهمة',
};

// Templates data
const templates = [
  {
    name: 'تنبيه المهام',
    icon: Bell,
    description: 'إرسال تنبيه عند إنشاء أو تحديث مهمة',
    triggerType: 'event',
    actionType: 'notification',
  },
  {
    name: 'تقرير يومي',
    icon: FileText,
    description: 'إنشاء تقرير يومي تلقائي',
    triggerType: 'schedule',
    actionType: 'email',
  },
  {
    name: 'تنبيه الفواتير',
    icon: Mail,
    description: 'تذكير بالفواتير المستحقة',
    triggerType: 'schedule',
    actionType: 'notification',
  },
  {
    name: 'مراقبة الميزانية',
    icon: TrendingUp,
    description: 'تنبيه عند تجاوز حد الميزانية',
    triggerType: 'threshold',
    actionType: 'notification',
  },
];

export default function AutomationsPage() {
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
          title: 'تم تحديث الحالة',
          description: 'تم تحديث حالة الأتمتة بنجاح',
        });
        fetchAutomations();
      }
    } catch {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الحالة',
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الأتمتة</h1>
          <p className="text-gray-500 mt-1">أتمتة المهام والعمليات المتكررة</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          إنشاء أتمتة جديدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي الأتمتة</p>
                <p className="text-2xl font-bold text-gray-900">{automations.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">نشطة</p>
                <p className="text-2xl font-bold text-green-700">{activeCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">غير نشطة</p>
                <p className="text-2xl font-bold text-gray-700">{inactiveCount}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Pause className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">إجمالي التشغيلات</p>
                <p className="text-2xl font-bold text-purple-700">{totalRuns}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">الأتمتة النشطة</h2>
        {automations.map((automation) => (
          <Card key={automation.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{automation.name}</h3>
                    <Badge variant={statusVariants[automation.status]}>
                      {statusLabels[automation.status]}
                    </Badge>
                  </div>
                  {automation.description && (
                    <p className="text-gray-600 mb-4">{automation.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">المحفز:</span>
                      <span className="text-sm font-medium text-gray-700">
                        {triggerTypeLabels[automation.triggerType]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">الإجراء:</span>
                      <span className="text-sm font-medium text-gray-700">
                        {actionTypeLabels[automation.actionType]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">عدد التشغيلات:</span>
                      <span className="text-sm font-medium text-gray-700">{automation.runCount}</span>
                    </div>
                    {automation.lastRunAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">آخر تشغيل:</span>
                        <span className="text-sm font-medium text-gray-700">
                          {new Date(automation.lastRunAt).toLocaleString('ar-SA')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(automation.id, automation.status)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      automation.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        automation.status === 'active' ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <Button variant="ghost" size="sm">
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
        <h2 className="text-lg font-semibold text-gray-900">قوالب جاهزة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template, index) => {
            const Icon = template.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {automations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">لا توجد أتمتة</p>
            <p className="text-sm text-gray-400">
              ابدأ بإنشاء أتمتة جديدة أو استخدم أحد القوالب الجاهزة
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
