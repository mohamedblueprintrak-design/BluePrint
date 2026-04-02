'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Activity, Search, Filter, Calendar, User, Building2, FileText,
  DollarSign, CheckSquare, Package, Settings, Plus, Edit,
  Trash2, ArrowUpRight, Clock, Users, Loader2, Download,
  X, ChevronLeft, ChevronRight, FileDown
} from 'lucide-react';

interface ActivityItem {
  id: string;
  userId?: string | null;
  userName: string;
  userAvatar?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  description: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  fullName: string;
  email?: string;
  role?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTIVITY_TYPES = [
  { value: 'project', label: 'مشروع', labelEn: 'Project', icon: Building2, color: 'bg-blue-500' },
  { value: 'invoice', label: 'فاتورة', labelEn: 'Invoice', icon: DollarSign, color: 'bg-green-500' },
  { value: 'task', label: 'مهمة', labelEn: 'Task', icon: CheckSquare, color: 'bg-orange-500' },
  { value: 'client', label: 'عميل', labelEn: 'Client', icon: Users, color: 'bg-purple-500' },
  { value: 'document', label: 'مستند', labelEn: 'Document', icon: FileText, color: 'bg-cyan-500' },
  { value: 'user', label: 'مستخدم', labelEn: 'User', icon: User, color: 'bg-pink-500' },
  { value: 'hr', label: 'موارد بشرية', labelEn: 'HR', icon: User, color: 'bg-violet-500' },
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

const ITEMS_PER_PAGE = 20;

export function ActivitiesPage() {
  const { language } = useApp();
  const { t, formatDate } = useTranslation(language);

  // Data state
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Compute active filter count
  const activeFilterCount = [
    typeFilter !== 'all',
    actionFilter !== 'all',
    userFilter !== 'all',
    startDate !== '',
    endDate !== '',
    searchQuery !== '',
  ].filter(Boolean).length;

  // Fetch team members for user filter
  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch('/api/team');
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(data.data || []);
        }
      } catch {
        // silent fail
      }
    }
    fetchTeam();
  }, []);

  // Build API query params
  const buildQueryParams = useCallback((page: number) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(ITEMS_PER_PAGE));

    if (typeFilter !== 'all') params.set('entityType', typeFilter);
    if (userFilter !== 'all') params.set('userId', userFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    return params.toString();
  }, [typeFilter, userFilter, startDate, endDate]);

  // Fetch activities
  const fetchActivities = useCallback(async (page?: number) => {
    const currentPage = page || pagination.page;
    setLoading(true);
    try {
      const queryParams = buildQueryParams(currentPage);
      const response = await fetch(`/api/activities?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || []);
        if (data.meta) {
          setPagination(data.meta);
        } else {
          setPagination(prev => ({
            ...prev,
            page: currentPage,
            total: data.data?.length || 0,
            totalPages: Math.ceil((data.data?.length || 0) / ITEMS_PER_PAGE),
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, buildQueryParams]);

  // Refetch on filter changes
  useEffect(() => {
    fetchActivities(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, userFilter, startDate, endDate]);

  // Client-side filtering for search and action filter (applied on top of server data)
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = !searchQuery ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.entityType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || activity.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const stats = {
    total: pagination.total || activities.length,
    today: activities.filter(a => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(a.createdAt) >= today;
    }).length,
    thisWeek: activities.filter(a => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(a.createdAt) >= weekAgo;
    }).length,
  };

  // Pagination helpers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchActivities(page);
    }
  };

  const getPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setActionFilter('all');
    setUserFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // CSV Export
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('export', 'csv');
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (typeFilter !== 'all') params.set('entityType', typeFilter);
      if (userFilter !== 'all') params.set('userId', userFilter);

      const response = await fetch(`/api/activities?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
      setExportDialogOpen(false);
    }
  };

  const getActivityTypeInfo = (type: string) => {
    return ACTIVITY_TYPES.find(at => at.value === type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-7 h-7 text-cyan-400" />
            {language === 'ar' ? 'سجل النشاطات' : 'Activity Log'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'تتبع جميع النشاطات والأحداث في النظام' : 'Track all activities and events in the system'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="border-border bg-muted text-foreground/80 hover:bg-secondary hover:text-foreground"
          >
            <Filter className="w-4 h-4 me-2" />
            {language === 'ar' ? 'فلاتر متقدمة' : 'Advanced Filters'}
            {activeFilterCount > 0 && (
              <Badge className="ms-2 bg-cyan-500 text-foreground text-xs px-1.5 py-0.5 min-w-5 text-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialogOpen(true)}
            className="border-border bg-muted text-foreground/80 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-400"
          >
            <FileDown className="w-4 h-4 me-2" />
            {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي النشاطات' : 'Total Activities'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.today}</p>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'اليوم' : 'Today'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.thisWeek}</p>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Main filter row */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 bg-muted border-border text-foreground"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] bg-muted border-border text-foreground">
                  <Filter className="w-4 h-4 me-2 text-muted-foreground" />
                  <SelectValue placeholder={t.type} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">{t.all}</SelectItem>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {language === 'ar' ? type.label : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px] bg-muted border-border text-foreground">
                  <SelectValue placeholder={language === 'ar' ? 'الإجراء' : 'Action'} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">{t.all}</SelectItem>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {language === 'ar' ? action.label : action.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced filters */}
            {showAdvancedFilters && (
              <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-border">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    {language === 'ar' ? 'من تاريخ' : 'Start Date'}
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    {language === 'ar' ? 'إلى تاريخ' : 'End Date'}
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    {language === 'ar' ? 'المستخدم' : 'User'}
                  </Label>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder={language === 'ar' ? 'جميع المستخدمين' : 'All Users'} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">{language === 'ar' ? 'جميع المستخدمين' : 'All Users'}</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeFilterCount > 0 && (
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4 me-1" />
                      {language === 'ar' ? 'مسح الكل' : 'Clear All'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">{language === 'ar' ? 'النشاطات الأخيرة' : 'Recent Activities'}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'ar'
                ? `عرض ${filteredActivities.length} من ${pagination.total} نشاط`
                : `Showing ${filteredActivities.length} of ${pagination.total} activities`}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{language === 'ar' ? 'لا توجد نشاطات' : 'No activities found'}</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[500px]">
                <div className="relative">
                  <div className="absolute start-8 top-0 bottom-0 w-px bg-muted" />
                  <div className="space-y-6">
                    {filteredActivities.map((activity) => {
                      const typeInfo = getActivityTypeInfo(activity.entityType);
                      const actionInfo = getActionInfo(activity.action);
                      const TypeIcon = typeInfo.icon;

                      return (
                        <div key={activity.id} className="relative flex gap-4 ps-2 group">
                          <div className={`relative z-10 w-12 h-12 rounded-full ${typeInfo.color}/20 border-2 border-border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <TypeIcon className="w-5 h-5 text-foreground" />
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className={`border-border ${actionInfo.color}`}>
                                    {language === 'ar' ? actionInfo.label : actionInfo.labelEn}
                                  </Badge>
                                  <Badge variant="secondary" className="bg-muted text-foreground/80">
                                    {language === 'ar' ? typeInfo.label : typeInfo.labelEn}
                                  </Badge>
                                </div>
                                <h3 className="text-foreground font-medium">{activity.description}</h3>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {getTimeAgo(activity.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="bg-blue-600 text-foreground text-[8px]">
                                    {activity.userName?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{activity.userName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar'
                      ? `صفحة ${pagination.page} من ${pagination.totalPages}`
                      : `Page ${pagination.page} of ${pagination.totalPages}`}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="border-border bg-muted text-foreground/80 hover:bg-secondary disabled:opacity-50"
                    >
                      {(language as string) === 'rtl' ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronLeft className="w-4 h-4" />
                      )}
                    </Button>
                    {getPageNumbers().map((pageNum, idx) =>
                      typeof pageNum === 'string' ? (
                        <span key={`dots-${idx}`} className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className={
                            pageNum === pagination.page
                              ? 'bg-cyan-500 text-foreground hover:bg-cyan-600'
                              : 'border-border bg-muted text-foreground/80 hover:bg-secondary'
                          }
                        >
                          {pageNum}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="border-border bg-muted text-foreground/80 hover:bg-secondary disabled:opacity-50"
                    >
                      {(language as string) === 'rtl' ? (
                        <ChevronLeft className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* CSV Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-emerald-400" />
              {language === 'ar' ? 'تصدير سجل النشاطات' : 'Export Activity Log'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {language === 'ar'
                ? 'اختر الفلاتر المطلوبة لتصدير البيانات كملف CSV'
                : 'Choose filters to export data as a CSV file'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm text-foreground/80">
                {language === 'ar' ? 'من تاريخ' : 'Start Date'}
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-foreground/80">
                {language === 'ar' ? 'إلى تاريخ' : 'End Date'}
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-foreground/80">
                {language === 'ar' ? 'نوع الكيان' : 'Entity Type'}
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">{t.all}</SelectItem>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {language === 'ar' ? type.label : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-foreground/80">
                {language === 'ar' ? 'المستخدم' : 'User'}
              </Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">{language === 'ar' ? 'جميع المستخدمين' : 'All Users'}</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
              className="border-border bg-muted text-foreground/80 hover:bg-secondary"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={exportLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-foreground"
            >
              {exportLoading ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 me-2" />
              )}
              {language === 'ar' ? 'تحميل CSV' : 'Download CSV'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
