'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import { useSiteReports, useProjects } from '@/hooks/use-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, Plus, Search, Eye, Edit, Cloud, Thermometer,
  Users, AlertTriangle, FileText, Loader2, CheckCircle2, Send
} from 'lucide-react';

const WEATHER_OPTIONS = [
  { value: 'sunny', label: 'مشمس', icon: '☀️' },
  { value: 'cloudy', label: 'غائم', icon: '☁️' },
  { value: 'rainy', label: 'ممطر', icon: '🌧️' },
  { value: 'windy', label: 'عاصف', icon: '💨' },
];

const REPORT_STATUSES = [
  { value: 'draft', label: 'مسودة', color: 'bg-slate-500' },
  { value: 'submitted', label: 'مُرسل', color: 'bg-blue-500' },
  { value: 'approved', label: 'معتمد', color: 'bg-green-500' },
];

export function SiteDiaryPage() {
  const { language } = useApp();
  const { t, formatDate } = useTranslation(language);
  const { toast } = useToast();
  const { hasRole, token } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const canApprove = hasRole(['ADMIN', 'MANAGER', 'PROJECT_MANAGER']);
  
  const { data: reportsData, isLoading } = useSiteReports();
  const { data: projectsData } = useProjects();
  
  const reports = reportsData?.data || [];
  const projects = projectsData?.data || [];
  
  const [formData, setFormData] = useState({
    projectId: '',
    reportDate: new Date().toISOString().split('T')[0],
    weather: 'sunny',
    temperature: '',
    workersCount: '',
    workDescription: '',
    workArea: '',
    issues: '',
    safetyIssues: '',
    equipment: '',
    materialsReceived: '',
    nextSteps: '',
  });

  const filteredReports = reports.filter((report: any) => {
    const matchesSearch = report.workDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === 'all' || report.projectId === projectFilter;
    return matchesSearch && matchesProject;
  });

  const stats = {
    total: reports.length,
    thisWeek: reports.filter((r: any) => {
      const reportDate = new Date(r.reportDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reportDate >= weekAgo;
    }).length,
    thisMonth: reports.filter((r: any) => {
      const reportDate = new Date(r.reportDate);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return reportDate >= monthAgo;
    }).length,
    openIssues: reports.filter((r: any) => r.issues).length
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = REPORT_STATUSES.find(s => s.value === status) || REPORT_STATUSES[0];
    return (
      <Badge variant="secondary" className={`${statusConfig.color} text-white`}>
        {language === 'ar' ? statusConfig.label : status}
      </Badge>
    );
  };

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    setUpdatingStatus(reportId);
    try {
      const response = await fetch('/api/site-reports', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: reportId, status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: t.successSave,
          description: newStatus === 'SUBMITTED'
            ? (language === 'ar' ? 'تم إرسال التقرير بنجاح' : 'Report submitted successfully')
            : (language === 'ar' ? 'تم اعتماد التقرير بنجاح' : 'Report approved successfully')
        });
        queryClient.invalidateQueries({ queryKey: ['site-reports'] });
      } else {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: result.error?.message || (language === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status'),
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء تحديث الحالة' : 'An error occurred while updating status',
        variant: 'destructive'
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCreateReport = async () => {
    if (!formData.projectId) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار المشروع' : 'Please select a project',
        variant: 'destructive'
      });
      return;
    }
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم إنشاء التقرير بنجاح' : 'Report created successfully'
    });
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي التقارير' : 'Total Reports'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Calendar className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</p>
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
                <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.openIssues}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'مشاكل مفتوحة' : 'Open Issues'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={t.project} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'تقرير جديد' : 'New Report'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'تقرير موقع جديد' : 'New Site Report'}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {language === 'ar' ? 'أدخل تفاصيل تقرير الموقع' : 'Enter site report details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.project} *</Label>
                  <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder={language === 'ar' ? 'اختر المشروع' : 'Select project'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.date}</Label>
                  <Input
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.weather}</Label>
                  <Select value={formData.weather} onValueChange={(v) => setFormData({ ...formData, weather: v })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {WEATHER_OPTIONS.map((weather) => (
                        <SelectItem key={weather.value} value={weather.value}>
                          {weather.icon} {language === 'ar' ? weather.label : weather.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.temperature} °C</Label>
                  <Input
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="35"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.workersCount}</Label>
                  <Input
                    type="number"
                    value={formData.workersCount}
                    onChange={(e) => setFormData({ ...formData, workersCount: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">{t.workDescription}</Label>
                <Textarea
                  value={formData.workDescription}
                  onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  rows={3}
                  placeholder={language === 'ar' ? 'وصف العمل المنجز اليوم...' : 'Description of work done today...'}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.issues}</Label>
                  <Textarea
                    value={formData.issues}
                    onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.safetyIssues}</Label>
                  <Textarea
                    value={formData.safetyIssues}
                    onChange={(e) => setFormData({ ...formData, safetyIssues: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">{t.nextSteps}</Label>
                <Textarea
                  value={formData.nextSteps}
                  onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  rows={2}
                  placeholder={language === 'ar' ? 'خطة الغد...' : "Tomorrow's plan..."}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="text-slate-400">
                {t.cancel}
              </Button>
              <Button onClick={handleCreateReport} className="bg-blue-600 hover:bg-blue-700">
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">{t.loading}</div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <FileText className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">{t.noData}</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 me-2" />
            {language === 'ar' ? 'تقرير جديد' : 'New Report'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report: any) => (
            <Card key={report.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {report.reportNumber && (
                        <Badge variant="outline" className="text-slate-400 border-slate-700">
                          {report.reportNumber}
                        </Badge>
                      )}
                      {getStatusBadge(report.status)}
                    </div>
                    <CardTitle className="text-lg text-white line-clamp-1">
                      {report.project?.name || t.project}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(report.reportDate)}</span>
                  </div>
                  {report.weather && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Cloud className="w-4 h-4" />
                      <span>{report.weather}</span>
                    </div>
                  )}
                  {report.temperature && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Thermometer className="w-4 h-4" />
                      <span>{report.temperature}°C</span>
                    </div>
                  )}
                </div>
                
                {report.workersCount && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{report.workersCount} {language === 'ar' ? 'عامل' : 'workers'}</span>
                  </div>
                )}
                
                {report.workDescription && (
                  <p className="text-sm text-slate-400 line-clamp-2">{report.workDescription}</p>
                )}
                
                {report.issues && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400">{language === 'ar' ? 'يوجد مشاكل' : 'Has issues'}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">{formatDate(report.createdAt)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {report.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        disabled={updatingStatus === report.id}
                        onClick={() => handleStatusChange(report.id, 'SUBMITTED')}
                      >
                        {updatingStatus === report.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span className="text-xs">{language === 'ar' ? 'إرسال' : 'Submit'}</span>
                      </Button>
                    )}
                    {report.status === 'submitted' && canApprove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        disabled={updatingStatus === report.id}
                        onClick={() => handleStatusChange(report.id, 'APPROVED')}
                      >
                        {updatingStatus === report.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span className="text-xs">{language === 'ar' ? 'اعتماد' : 'Approve'}</span>
                      </Button>
                    )}
                    {report.status === 'approved' && (
                      <Badge variant="secondary" className="h-8 gap-1 bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-xs">{language === 'ar' ? 'معتمد' : 'Approved'}</span>
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
