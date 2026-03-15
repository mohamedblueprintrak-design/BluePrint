'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity, Search, Filter, Calendar, User, Building2, FileText,
  DollarSign, CheckSquare, Package, Settings, Bell, Plus, Edit,
  Trash2, Eye, ArrowUpRight, ArrowDownRight, Clock, Users
} from 'lucide-react';

// Mock activity data
const mockActivities = [
  { id: '1', type: 'project', action: 'create', title: 'إنشاء مشروع جديد', description: 'تم إنشاء مشروع برج دبي', userId: '1', userName: 'أحمد محمد', projectId: 'p1', projectName: 'برج دبي', createdAt: new Date().toISOString() },
  { id: '2', type: 'invoice', action: 'update', title: 'تحديث فاتورة', description: 'تم تحديث حالة الفاتورة INV-001 إلى مدفوعة', userId: '2', userName: 'سارة أحمد', projectId: 'p2', projectName: 'فيلا المرفأ', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'task', action: 'complete', title: 'إكمال مهمة', description: 'تم إكمال مهمة مراجعة المخططات', userId: '1', userName: 'أحمد محمد', projectId: 'p1', projectName: 'برج دبي', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', type: 'client', action: 'create', title: 'إضافة عميل جديد', description: 'تم إضافة عميل شركة الإنشاءات المتحدة', userId: '3', userName: 'محمد علي', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: '5', type: 'document', action: 'upload', title: 'رفع مستند', description: 'تم رفع ملف المخططات الهندسية', userId: '1', userName: 'أحمد محمد', projectId: 'p1', projectName: 'برج دبي', createdAt: new Date(Date.now() - 21600000).toISOString() },
  { id: '6', type: 'user', action: 'login', title: 'تسجيل دخول', description: 'تم تسجيل الدخول من جهاز جديد', userId: '2', userName: 'سارة أحمد', createdAt: new Date(Date.now() - 28800000).toISOString() },
  { id: '7', type: 'hr', action: 'approve', title: 'موافقة على إجازة', description: 'تم الموافقة على طلب إجازة سنوية', userId: '1', userName: 'أحمد محمد', createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: '8', type: 'supplier', action: 'create', title: 'إضافة مورد', description: 'تم إضافة مورد شركة المواد الإنشائية', userId: '3', userName: 'محمد علي', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '9', type: 'contract', action: 'sign', title: 'توقيع عقد', description: 'تم توقيع عقد مع شركة التوريدات', userId: '1', userName: 'أحمد محمد', projectId: 'p3', projectName: 'مجمع تجاري', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: '10', type: 'settings', action: 'update', title: 'تحديث الإعدادات', description: 'تم تحديث إعدادات الشركة', userId: '1', userName: 'أحمد محمد', createdAt: new Date(Date.now() - 259200000).toISOString() },
];

const ACTIVITY_TYPES = [
  { value: 'project', label: 'مشروع', labelEn: 'Project', icon: Building2, color: 'bg-blue-500' },
  { value: 'invoice', label: 'فاتورة', labelEn: 'Invoice', icon: DollarSign, color: 'bg-green-500' },
  { value: 'task', label: 'مهمة', labelEn: 'Task', icon: CheckSquare, color: 'bg-orange-500' },
  { value: 'client', label: 'عميل', labelEn: 'Client', icon: Users, color: 'bg-purple-500' },
  { value: 'document', label: 'مستند', labelEn: 'Document', icon: FileText, color: 'bg-cyan-500' },
  { value: 'user', label: 'مستخدم', labelEn: 'User', icon: User, color: 'bg-pink-500' },
  { value: 'hr', label: 'موارد بشرية', labelEn: 'HR', icon: User, color: 'bg-indigo-500' },
  { value: 'supplier', label: 'مورد', labelEn: 'Supplier', icon: Package, color: 'bg-amber-500' },
  { value: 'contract', label: 'عقد', labelEn: 'Contract', icon: FileText, color: 'bg-teal-500' },
  { value: 'settings', label: 'إعدادات', labelEn: 'Settings', icon: Settings, color: 'bg-slate-500' },
];

const ACTION_TYPES = [
  { value: 'create', label: 'إنشاء', labelEn: 'Create', icon: Plus, color: 'text-green-400' },
  { value: 'update', label: 'تحديث', labelEn: 'Update', icon: Edit, color: 'text-blue-400' },
  { value: 'delete', label: 'حذف', labelEn: 'Delete', icon: Trash2, color: 'text-red-400' },
  { value: 'complete', label: 'إكمال', labelEn: 'Complete', icon: CheckSquare, color: 'text-green-400' },
  { value: 'approve', label: 'موافقة', labelEn: 'Approve', icon: CheckSquare, color: 'text-green-400' },
  { value: 'upload', label: 'رفع', labelEn: 'Upload', icon: ArrowUpRight, color: 'text-cyan-400' },
  { value: 'login', label: 'دخول', labelEn: 'Login', icon: User, color: 'text-purple-400' },
  { value: 'sign', label: 'توقيع', labelEn: 'Sign', icon: FileText, color: 'text-teal-400' },
];

export function ActivitiesPage() {
  const { language } = useApp();
  const { t, formatDate, formatDateTime } = useTranslation(language);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          activity.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchesDate = new Date(activity.createdAt) >= today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(activity.createdAt) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(activity.createdAt) >= monthAgo;
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const stats = {
    total: mockActivities.length,
    today: mockActivities.filter(a => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(a.createdAt) >= today;
    }).length,
    thisWeek: mockActivities.filter(a => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(a.createdAt) >= weekAgo;
    }).length,
  };

  const getActivityTypeInfo = (type: string) => {
    return ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
  };

  const getActionInfo = (action: string) => {
    return ACTION_TYPES.find(a => a.value === action) || ACTION_TYPES[1];
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Now';
    if (diffMins < 60) return language === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return language === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return language === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    return formatDate(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-cyan-400" />
            {language === 'ar' ? 'سجل النشاطات' : 'Activity Log'}
          </h1>
          <p className="text-slate-400 mt-1">
            {language === 'ar' ? 'تتبع جميع النشاطات والأحداث في النظام' : 'Track all activities and events in the system'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي النشاطات' : 'Total Activities'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.today}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'اليوم' : 'Today'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-700 text-white">
                <Filter className="w-4 h-4 me-2 text-slate-400" />
                <SelectValue placeholder={t.type} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">{t.all}</SelectItem>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {language === 'ar' ? type.label : type.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-700 text-white">
                <Calendar className="w-4 h-4 me-2 text-slate-400" />
                <SelectValue placeholder={t.date} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="today">{t.today}</SelectItem>
                <SelectItem value="week">{t.thisWeek}</SelectItem>
                <SelectItem value="month">{t.thisMonth}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">{language === 'ar' ? 'النشاطات الأخيرة' : 'Recent Activities'}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute start-8 top-0 bottom-0 w-px bg-slate-800" />
              
              <div className="space-y-6">
                {filteredActivities.map((activity) => {
                  const typeInfo = getActivityTypeInfo(activity.type);
                  const actionInfo = getActionInfo(activity.action);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <div key={activity.id} className="relative flex gap-4 ps-2 group">
                      {/* Timeline dot */}
                      <div className={`relative z-10 w-12 h-12 rounded-full ${typeInfo.color}/20 border-2 border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <TypeIcon className="w-5 h-5 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`border-slate-700 ${actionInfo.color}`}>
                                {language === 'ar' ? actionInfo.label : actionInfo.labelEn}
                              </Badge>
                              <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                                {language === 'ar' ? typeInfo.label : typeInfo.labelEn}
                              </Badge>
                            </div>
                            <h3 className="text-white font-medium">{activity.title}</h3>
                            <p className="text-sm text-slate-400 mt-1">{activity.description}</p>
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {getTimeAgo(activity.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="bg-blue-600 text-white text-[8px]">
                                {activity.userName?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{activity.userName}</span>
                          </div>
                          {activity.projectName && (
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>{activity.projectName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
