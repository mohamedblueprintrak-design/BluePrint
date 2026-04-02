'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useProjects } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin, Plus, Search, Eye, Camera, Building2,
  Calendar, User, FileText, CheckCircle, Clock, AlertCircle,
  Loader2, Landmark, ClipboardList, ImagePlus,
  Trash2} from 'lucide-react';

const MUNICIPALITIES = [
  { value: 'RAK', label: 'رأس الخيمة', labelEn: 'Ras Al Khaimah' },
  { value: 'DUBAI', label: 'دبي', labelEn: 'Dubai' },
  { value: 'ABU_DHABI', label: 'أبوظبي', labelEn: 'Abu Dhabi' },
  { value: 'SHARJAH', label: 'الشارقة', labelEn: 'Sharjah' },
  { value: 'AJMAN', label: 'عجمان', labelEn: 'Ajman' },
  { value: 'UAQ', label: 'أم القيوين', labelEn: 'Umm Al Quwain' },
  { value: 'FUJAIRAH', label: 'فجيرة', labelEn: 'Fujairah' },
];

const STATUS_CONFIG: Record<string, { label: string; labelEn: string; color: string; bg: string }> = {
  DRAFT: { label: 'مسودة', labelEn: 'Draft', color: 'text-muted-foreground', bg: 'bg-slate-500/20 border-border/30' },
  SUBMITTED: { label: 'تم التقديم', labelEn: 'Submitted', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
  APPROVED: { label: 'تمت الموافقة', labelEn: 'Approved', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
  REJECTED: { label: 'مرفوض', labelEn: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
};

const CASE_TYPES = [
  { value: 'BUILDING_PERMIT', label: 'رخصة بناء', labelEn: 'Building Permit' },
  { value: 'STRUCTURAL_INSPECTION', label: 'تفتيش إنشائي', labelEn: 'Structural Inspection' },
  { value: 'BOUNDARY_DEMARCTION', label: 'تحديد حدود', labelEn: 'Boundary Demarcation' },
  { value: 'FINAL_INSPECTION', label: 'معاينة نهائية', labelEn: 'Final Inspection' },
  { value: 'VIOLATION_CHECK', label: 'كشف مخالفات', labelEn: 'Violation Check' },
  { value: 'OTHER', label: 'أخرى', labelEn: 'Other' },
];

interface SiteVisitReport {
  id: string;
  projectId: string;
  reportDate: string;
  plotNumber?: string;
  clientName?: string;
  consultantName?: string;
  caseType?: string;
  otherDescription?: string;
  municipality: string;
  department?: string;
  generalDescription?: string;
  boundaryGateDescription?: string;
  neighbourSetbackDescription?: string;
  buildingDescription?: string;
  boundaryGatePhotos?: string[];
  neighbourSetbackPhotos?: string[];
  buildingPhotos?: string[];
  status: string;
  notes?: string;
  project?: { name: string };
}

const emptyForm = {
  projectId: '',
  plotNumber: '',
  clientName: '',
  consultantName: '',
  caseType: 'BUILDING_PERMIT',
  otherDescription: '',
  municipality: 'RAK',
  department: '',
  generalDescription: '',
  boundaryGateDescription: '',
  neighbourSetbackDescription: '',
  buildingDescription: '',
  notes: '',
};

export function SiteVisitReportsPage() {
  const { language } = useApp();
  const { t: _t, formatDate } = useTranslation(language);
  const { toast } = useToast();
  const { data: projectsData } = useProjects();
  const isRTL = language === 'ar';

  const [reports, setReports] = useState<SiteVisitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [municipalityFilter, setMunicipalityFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingReport, setViewingReport] = useState<SiteVisitReport | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/site-visit-reports');
      const json = await res.json();
      if (json.success) setReports(json.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filteredReports = reports.filter((r) => {
    const matchSearch = !searchQuery ||
      r.plotNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.clientName?.includes(searchQuery) ||
      r.project?.name?.includes(searchQuery);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchMun = municipalityFilter === 'all' || r.municipality === municipalityFilter;
    return matchSearch && matchStatus && matchMun;
  });

  const handleSubmit = async () => {
    if (!form.projectId) {
      toast({ title: isRTL ? 'يرجى اختيار المشروع' : 'Please select a project', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/site-visit-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: isRTL ? 'تم إنشاء التقرير بنجاح' : 'Report created successfully' });
        setShowAddDialog(false);
        setForm(emptyForm);
        fetchReports();
      } else {
        toast({ title: json.error?.message || 'Error', variant: 'destructive' });
      }
    } catch {
      toast({ title: isRTL ? 'حدث خطأ' : 'An error occurred', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/site-visit-reports?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast({ title: isRTL ? 'تم حذف التقرير' : 'Report deleted' });
        fetchReports();
      }
    } catch { /* silent */ }
  };

  const getMunicipalityName = (code: string) => {
    const m = MUNICIPALITIES.find((x) => x.value === code);
    return m ? (isRTL ? m.label : m.labelEn) : code;
  };

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
      <Badge variant="outline" className={`${cfg.bg} ${cfg.color} border`}>
        {status === 'APPROVED' && <CheckCircle className="w-3 h-3 me-1" />}
        {status === 'REJECTED' && <AlertCircle className="w-3 h-3 me-1" />}
        {status === 'SUBMITTED' && <Clock className="w-3 h-3 me-1" />}
        {isRTL ? cfg.label : cfg.labelEn}
      </Badge>
    );
  };

  const inputField = (label: string, field: keyof typeof emptyForm, placeholder: string, type = 'text') => (
    <div className="space-y-2">
      <Label className="text-foreground/80 text-sm">{label}</Label>
      {type === 'textarea' ? (
        <Textarea
          value={form[field] as string || ''}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          placeholder={placeholder}
          className="bg-muted border-border text-foreground min-h-[80px]"
        />
      ) : (
        <Input
          value={form[field] as string || ''}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          placeholder={placeholder}
          type={type}
          className="bg-muted border-border text-foreground"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <MapPin className="w-7 h-7 text-blue-400" />
            {isRTL ? 'تقارير زيارة الموقع' : 'Site Visit Reports'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'تقارير الموقع الخاصة بالبلديات - نموذج بلدية رأس الخيمة' : 'Municipality Site Reports - RAK Municipality Template'}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-foreground gap-2">
          <Plus className="w-4 h-4" />
          {isRTL ? 'تقرير جديد' : 'New Report'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'بحث برقم القسيمة أو اسم العميل...' : 'Search by plot no. or client...'}
                className={`bg-muted border-border text-foreground ${isRTL ? 'pr-10' : 'pl-10'}`}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-muted border-border text-foreground">
                <SelectValue placeholder={isRTL ? 'الحالة' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{isRTL ? v.label : v.labelEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
              <SelectTrigger className="w-full sm:w-44 bg-muted border-border text-foreground">
                <SelectValue placeholder={isRTL ? 'البلدية' : 'Municipality'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                {MUNICIPALITIES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{isRTL ? m.label : m.labelEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : filteredReports.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">{isRTL ? 'لا توجد تقارير زيارة موقع' : 'No site visit reports found'}</p>
            <p className="text-muted-foreground text-sm mt-1">{isRTL ? 'أنشئ تقريراً جديداً للبدء' : 'Create a new report to get started'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredReports.map((report) => (
            <Card key={report.id} className="bg-card border-border hover:border-border transition-all group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-blue-400 font-medium">{getMunicipalityName(report.municipality)}</span>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
                <CardTitle className="text-foreground text-lg mt-2">{report.project?.name || isRTL ? 'مشروع غير محدد' : 'Unspecified Project'}</CardTitle>
                <CardDescription className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(new Date(report.reportDate))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.plotNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{isRTL ? 'رقم القسيمة' : 'Plot No.'}:</span>
                    <span className="text-foreground">{report.plotNumber}</span>
                  </div>
                )}
                {report.clientName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{isRTL ? 'العميل' : 'Client'}:</span>
                    <span className="text-foreground truncate">{report.clientName}</span>
                  </div>
                )}
                {report.generalDescription && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{report.generalDescription}</p>
                )}
                <Separator className="bg-muted" />
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    className="flex-1 bg-muted border-border text-foreground/80 hover:bg-secondary hover:text-foreground"
                    onClick={() => { setViewingReport(report); setShowViewDialog(true); }}
                  >
                    <Eye className="w-3.5 h-3.5 me-1" />
                    {isRTL ? 'عرض' : 'View'}
                  </Button>
                  <Button variant="outline" size="sm" className="bg-muted border-red-900/30 text-red-400 hover:bg-red-900/20"
                    onClick={() => handleDelete(report.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Report Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
          {viewingReport && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  {isRTL ? 'تقرير زيارة الموقع' : 'Site Visit Report'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {getMunicipalityName(viewingReport.municipality)} - {formatDate(new Date(viewingReport.reportDate))}
                  <span className="ms-3">{getStatusBadge(viewingReport.status)}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Municipality Header */}
                <div className="text-center p-4 bg-muted rounded-xl border border-border">
                  <p className="text-xl font-bold text-foreground">
                    {isRTL ? 'بلدية' : ''} {getMunicipalityName(viewingReport.municipality)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isRTL ? 'إدارة التراخيص' : 'Permit Department'}
                  </p>
                  <p className="text-lg font-semibold text-blue-400 mt-2">
                    {isRTL ? 'تقرير الموقع' : 'Site Report'}
                  </p>
                </div>

                {/* Project Info */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoField icon={<MapPin className="w-4 h-4" />} label={isRTL ? 'رقم القسيمة' : 'Plot No.'} value={viewingReport.plotNumber} />
                  <InfoField icon={<User className="w-4 h-4" />} label={isRTL ? 'اسم المالك' : 'Client Name'} value={viewingReport.clientName} />
                  <InfoField icon={<Building2 className="w-4 h-4" />} label={isRTL ? 'المكتب الاستشاري' : 'Consultant'} value={viewingReport.consultantName} />
                  <InfoField icon={<ClipboardList className="w-4 h-4" />} label={isRTL ? 'نوع المعاملة' : 'Case Type'} value={
                    (() => { const c = CASE_TYPES.find(x => x.value === viewingReport.caseType); return c ? (isRTL ? c.label : c.labelEn) : viewingReport.caseType; })()
                  } />
                </div>

                {viewingReport.otherDescription && (
                  <InfoField icon={<FileText className="w-4 h-4" />} label={isRTL ? 'وصف إضافي' : 'Other Description'} value={viewingReport.otherDescription} />
                )}

                <Separator className="bg-secondary" />

                {/* Site Sections */}
                <SiteSection
                  title={isRTL ? 'الوصف العام' : 'General Description'}
                  titleAr="الوصف"
                  description={viewingReport.generalDescription}
                  photos={viewingReport.boundaryGatePhotos}
                  isRTL={isRTL}
                />
                <SiteSection
                  title={isRTL ? 'الحائط / البوابات' : 'Boundary / Gates'}
                  titleAr="صور الحائط / البوابات"
                  description={viewingReport.boundaryGateDescription}
                  photos={viewingReport.boundaryGatePhotos}
                  isRTL={isRTL}
                />
                <SiteSection
                  title={isRTL ? 'الجوار / الارتدادات' : 'Neighbour / Setback'}
                  titleAr="صور الجوار / الارتدادات"
                  description={viewingReport.neighbourSetbackDescription}
                  photos={viewingReport.neighbourSetbackPhotos}
                  isRTL={isRTL}
                />
                <SiteSection
                  title={isRTL ? 'المباني' : 'Buildings'}
                  titleAr="صور المباني"
                  description={viewingReport.buildingDescription}
                  photos={viewingReport.buildingPhotos}
                  isRTL={isRTL}
                />

                {viewingReport.notes && (
                  <>
                    <Separator className="bg-secondary" />
                    <div>
                      <Label className="text-foreground/80 font-medium">{isRTL ? 'ملاحظات' : 'Notes'}</Label>
                      <p className="text-muted-foreground mt-1 text-sm bg-muted p-3 rounded-lg">{viewingReport.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Report Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              {isRTL ? 'تقرير زيارة موقع جديد' : 'New Site Visit Report'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isRTL ? 'إنشاء تقرير موقع حسب نموذج البلدية' : 'Create a site report following municipality template'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="mt-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="bg-muted w-full">
              <TabsTrigger value="info" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-foreground">
                {isRTL ? 'بيانات المشروع' : 'Project Info'}
              </TabsTrigger>
              <TabsTrigger value="site" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-foreground">
                {isRTL ? 'وصف الموقع' : 'Site Description'}
              </TabsTrigger>
              <TabsTrigger value="municipality" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-foreground">
                <Landmark className="w-3.5 h-3.5 me-1" />
                {isRTL ? 'البلدية' : 'Municipality'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-foreground/80 text-sm">{isRTL ? 'المشروع' : 'Project'} *</Label>
                  <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder={isRTL ? 'اختر المشروع' : 'Select project'} />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsData?.data?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {inputField(isRTL ? 'رقم القسيمة' : 'Plot Number', 'plotNumber', isRTL ? 'رقم القسيمة...' : 'Plot number...')}
                {inputField(isRTL ? 'اسم المالك' : 'Client Name', 'clientName', isRTL ? 'اسم العميل...' : 'Client name...')}
                {inputField(isRTL ? 'المكتب الاستشاري' : 'Consultant', 'consultantName', isRTL ? 'اسم المكتب الاستشاري...' : 'Consultant name...')}
                <div className="space-y-2">
                  <Label className="text-foreground/80 text-sm">{isRTL ? 'نوع المعاملة' : 'Case Type'}</Label>
                  <Select value={form.caseType} onValueChange={(v) => setForm({ ...form, caseType: v })}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CASE_TYPES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{isRTL ? c.label : c.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {inputField(isRTL ? 'وصف إضافي' : 'Other Description', 'otherDescription', isRTL ? 'وصف إضافي...' : 'Additional description...', 'textarea')}
              </div>
            </TabsContent>

            <TabsContent value="site" className="space-y-4 mt-4">
              {inputField(isRTL ? 'الوصف العام' : 'General Description', 'generalDescription', isRTL ? 'وصف عام للموقع...' : 'General site description...', 'textarea')}
              {inputField(isRTL ? 'الحائط / البوابات' : 'Boundary / Gates', 'boundaryGateDescription', isRTL ? 'وصف الحائط والبوابات...' : 'Boundary/gate description...', 'textarea')}
              {inputField(isRTL ? 'الجوار / الارتدادات' : 'Neighbour / Setback', 'neighbourSetbackDescription', isRTL ? 'وصف الجوار والارتدادات...' : 'Neighbour/setback description...', 'textarea')}
              {inputField(isRTL ? 'المباني' : 'Buildings', 'buildingDescription', isRTL ? 'وصف المباني...' : 'Building description...', 'textarea')}
            </TabsContent>

            <TabsContent value="municipality" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-foreground/80 text-sm">{isRTL ? 'البلدية' : 'Municipality'}</Label>
                <Select value={form.municipality} onValueChange={(v) => setForm({ ...form, municipality: v })}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MUNICIPALITIES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{isRTL ? m.label : m.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {inputField(isRTL ? 'القسم / الإدارة' : 'Department', 'department', isRTL ? 'إدارة التراخيص...' : 'Permit Department...')}
              {inputField(isRTL ? 'ملاحظات' : 'Notes', 'notes', isRTL ? 'ملاحظات إضافية...' : 'Additional notes...', 'textarea')}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="bg-muted border-border text-foreground/80">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-foreground gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <FileText className="w-4 h-4" />
              {isRTL ? 'إنشاء التقرير' : 'Create Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-components
function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
      <div className="text-blue-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SiteSection({ title, titleAr, description, photos, isRTL }: { title: string; titleAr: string; description?: string | null; photos?: any[]; isRTL: boolean }) {
  const hasPhotos = photos && Array.isArray(photos) && photos.length > 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground font-medium flex items-center gap-2">
          <Camera className="w-4 h-4 text-muted-foreground" />
          {title}
        </h3>
        {hasPhotos && <Badge variant="outline" className="bg-muted border-border text-muted-foreground text-xs">{photos.length} {isRTL ? 'صورة' : 'photos'}</Badge>}
      </div>
      {description ? (
        <p className="text-sm text-foreground/80 bg-muted p-3 rounded-lg leading-relaxed">{description}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-lg">
          {isRTL ? 'لا يوجد وصف' : 'No description'}
        </p>
      )}
      {!hasPhotos && (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <ImagePlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">{titleAr}</p>
        </div>
      )}
    </div>
  );
}
