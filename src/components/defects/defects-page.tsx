'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useProjects } from '@/hooks/use-data';
import { useDefects, useCreateDefect, useUpdateDefect, useDeleteDefect, useUploadFile } from '@/hooks/use-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle, Plus, Search, Eye, Edit, CheckCircle, Clock, Trash2,
  Building2, MapPin, Calendar, User, AlertCircle, Loader2, Upload, X
} from 'lucide-react';

const SEVERITY_LEVELS = [
  { value: 'low', label: 'منخفض', labelEn: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'متوسط', labelEn: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'عالي', labelEn: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'حرج', labelEn: 'Critical', color: 'bg-red-500' },
];

const STATUS_OPTIONS = [
  { value: 'Open', label: 'مفتوح', labelEn: 'Open', color: 'bg-red-500' },
  { value: 'In_Progress', label: 'قيد المعالجة', labelEn: 'In Progress', color: 'bg-blue-500' },
  { value: 'Resolved', label: 'تم الحل', labelEn: 'Resolved', color: 'bg-green-500' },
  { value: 'Closed', label: 'مغلق', labelEn: 'Closed', color: 'bg-slate-500' },
];

interface Defect {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'Open' | 'In_Progress' | 'Resolved' | 'Closed';
  location: string;
  projectId: string;
  projectName: string;
  assignedTo: string;
  imageId?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export function DefectsPage() {
  const { language } = useApp();
  const { t, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDefect, setEditingDefect] = useState<Defect | null>(null);
  const [viewingDefect, setViewingDefect] = useState<Defect | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { data: projectsData } = useProjects();
  const projects = projectsData?.data || [];
  
  const { data: defectsData, isLoading: defectsLoading, error: defectsError } = useDefects();
  const defects = defectsData?.data || [];
  
  const createDefect = useCreateDefect();
  const updateDefect = useUpdateDefect();
  const deleteDefect = useDeleteDefect();
  const uploadFile = useUploadFile();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location: '',
    projectId: '',
    assignedTo: '',
    status: 'Open' as 'Open' | 'In_Progress' | 'Resolved' | 'Closed',
    resolutionNotes: '',
  });

  const filteredDefects = defects.filter((defect: Defect) => {
    const matchesSearch = defect.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          defect.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || defect.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || defect.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const stats = {
    total: defects.length,
    open: defects.filter((d: Defect) => d.status === 'Open').length,
    inProgress: defects.filter((d: Defect) => d.status === 'In_Progress').length,
    critical: defects.filter((d: Defect) => d.severity === 'critical' && d.status !== 'Closed').length,
    resolved: defects.filter((d: Defect) => d.status === 'Resolved' || d.status === 'Closed').length,
  };

  const getSeverityBadge = (severity: string) => {
    const config = SEVERITY_LEVELS.find(s => s.value === severity) || SEVERITY_LEVELS[0];
    return (
      <Badge className={`${config.color} text-white text-xs`}>
        {language === 'ar' ? config.label : config.labelEn}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return (
      <Badge variant="secondary" className={`${config.color} text-white`}>
        {language === 'ar' ? config.label : config.labelEn}
      </Badge>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleAddDefect = async () => {
    if (!formData.title || !formData.projectId) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'العنوان والمشروع مطلوبان' : 'Title and project are required',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      let imageId = '';
      
      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadFile.mutateAsync(selectedFile);
        if (uploadResult.success && uploadResult.data) {
          imageId = uploadResult.data.url;
        }
      }
      
      await createDefect.mutateAsync({
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        status: formData.status,
        location: formData.location,
        assignedTo: formData.assignedTo,
        imageId,
      });
      
      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم إضافة العيب بنجاح' : 'Defect added successfully'
      });
      setShowAddDialog(false);
      setFormData({ title: '', description: '', severity: 'medium', location: '', projectId: '', assignedTo: '', status: 'Open', resolutionNotes: '' });
      clearFile();
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل في إضافة العيب' : 'Failed to add defect',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateDefect = async () => {
    if (!editingDefect) return;
    
    try {
      await updateDefect.mutateAsync({
        id: editingDefect.id,
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        status: formData.status,
        location: formData.location,
        assignedTo: formData.assignedTo,
        resolutionNotes: formData.resolutionNotes,
      });
      
      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم تحديث العيب بنجاح' : 'Defect updated successfully'
      });
      setEditingDefect(null);
      setFormData({ title: '', description: '', severity: 'medium', location: '', projectId: '', assignedTo: '', status: 'Open', resolutionNotes: '' });
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل في تحديث العيب' : 'Failed to update defect',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteDefect = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا العيب؟' : 'Are you sure you want to delete this defect?')) {
      return;
    }
    
    try {
      await deleteDefect.mutateAsync(id);
      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم حذف العيب بنجاح' : 'Defect deleted successfully'
      });
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل في حذف العيب' : 'Failed to delete defect',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (defect: Defect) => {
    setEditingDefect(defect);
    setFormData({
      title: defect.title,
      description: defect.description || '',
      severity: defect.severity,
      location: defect.location || '',
      projectId: defect.projectId,
      assignedTo: defect.assignedTo || '',
      status: defect.status,
      resolutionNotes: defect.resolutionNotes || '',
    });
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingDefect(null);
    setViewingDefect(null);
    setFormData({ title: '', description: '', severity: 'medium', location: '', projectId: '', assignedTo: '', status: 'Open', resolutionNotes: '' });
    clearFile();
  };

  if (defectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (defectsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">{language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-500/20">
                <AlertTriangle className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'الإجمالي' : 'Total'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.open}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'مفتوح' : 'Open'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'قيد المعالجة' : 'In Progress'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.critical}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'حرجة' : 'Critical'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.resolved}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'تم الحل' : 'Resolved'}</p>
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
          
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[130px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={language === 'ar' ? 'الخطورة' : 'Severity'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {SEVERITY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {language === 'ar' ? level.label : level.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={t.status} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {language === 'ar' ? status.label : status.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'إضافة عيب' : 'Add Defect'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إضافة عيب جديد' : 'Add New Defect'}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {language === 'ar' ? 'أدخل تفاصيل العيب أو المخالفة' : 'Enter defect details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'العنوان' : 'Title'} *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'المشروع' : 'Project'} *</Label>
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
                  <Label className="text-slate-300">{language === 'ar' ? 'مستوى الخطورة' : 'Severity'}</Label>
                  <Select value={formData.severity} onValueChange={(v: any) => setFormData({ ...formData, severity: v })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {SEVERITY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {language === 'ar' ? level.label : level.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'الموقع' : 'Location'}</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'المسؤول' : 'Assigned To'}</Label>
                  <Input
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'الحالة' : 'Status'}</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {language === 'ar' ? status.label : status.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'صورة' : 'Photo'}</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                  {selectedFile && (
                    <Button variant="ghost" size="icon" onClick={clearFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-2">
                    <img src={previewUrl} alt="Preview" className="max-h-32 rounded" />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={closeDialog} className="text-slate-400">
                {t.cancel}
              </Button>
              <Button onClick={handleAddDefect} className="bg-red-600 hover:bg-red-700" disabled={createDefect.isPending || uploadFile.isPending}>
                {(createDefect.isPending || uploadFile.isPending) && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Defects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDefects.map((defect: Defect) => (
          <Card key={defect.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(defect.severity)}
                  {getStatusBadge(defect.status)}
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-white"
                    onClick={() => setViewingDefect(defect)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-white"
                    onClick={() => openEditDialog(defect)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-red-400"
                    onClick={() => handleDeleteDefect(defect.id)}
                    disabled={deleteDefect.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="text-white font-medium mb-2">{defect.title}</h3>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">{defect.description}</p>
              
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>{defect.projectName || language === 'ar' ? 'غير محدد' : 'Not specified'}</span>
                </div>
                {defect.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{defect.location}</span>
                  </div>
                )}
                {defect.assignedTo && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{defect.assignedTo}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(defect.createdAt)}</span>
                </div>
              </div>
              
              {defect.imageId && (
                <div className="mt-3">
                  <img src={defect.imageId} alt="Defect" className="max-h-24 rounded" />
                </div>
              )}
              
              {defect.resolutionNotes && (
                <div className="mt-3 p-2 bg-green-500/10 rounded text-xs text-green-400">
                  <strong>{language === 'ar' ? 'الحل:' : 'Resolution:'}</strong> {defect.resolutionNotes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDefects.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">{language === 'ar' ? 'لا توجد عيوب' : 'No defects found'}</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDefect} onOpenChange={() => setEditingDefect(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل العيب' : 'Edit Defect'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {language === 'ar' ? 'تعديل تفاصيل العيب' : 'Edit defect details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-slate-300">{language === 'ar' ? 'العنوان' : 'Title'} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'المشروع' : 'Project'}</Label>
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
                <Label className="text-slate-300">{language === 'ar' ? 'مستوى الخطورة' : 'Severity'}</Label>
                <Select value={formData.severity} onValueChange={(v: any) => setFormData({ ...formData, severity: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {SEVERITY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {language === 'ar' ? level.label : level.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'الموقع' : 'Location'}</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'المسؤول' : 'Assigned To'}</Label>
                <Input
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">{language === 'ar' ? 'الحالة' : 'Status'}</Label>
              <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {language === 'ar' ? status.label : status.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">{language === 'ar' ? 'ملاحظات الحل' : 'Resolution Notes'}</Label>
              <Textarea
                value={formData.resolutionNotes}
                onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog} className="text-slate-400">
              {t.cancel}
            </Button>
            <Button onClick={handleUpdateDefect} className="bg-red-600 hover:bg-red-700" disabled={updateDefect.isPending}>
              {updateDefect.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingDefect} onOpenChange={() => setViewingDefect(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingDefect?.title}</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              {viewingDefect && getSeverityBadge(viewingDefect.severity)}
              {viewingDefect && getStatusBadge(viewingDefect.status)}
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {viewingDefect?.imageId && (
              <img src={viewingDefect.imageId} alt="Defect" className="w-full rounded max-h-48 object-cover" />
            )}
            
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{viewingDefect?.projectName}</span>
              </div>
              {viewingDefect?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{viewingDefect.location}</span>
                </div>
              )}
              {viewingDefect?.assignedTo && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{viewingDefect.assignedTo}</span>
                </div>
              )}
              {viewingDefect?.createdAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(viewingDefect.createdAt)}</span>
                </div>
              )}
            </div>
            
            {viewingDefect?.description && (
              <div>
                <Label className="text-slate-300">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <p className="text-slate-400 mt-1">{viewingDefect.description}</p>
              </div>
            )}
            
            {viewingDefect?.resolutionNotes && (
              <div className="p-3 bg-green-500/10 rounded">
                <Label className="text-green-400">{language === 'ar' ? 'ملاحظات الحل' : 'Resolution Notes'}</Label>
                <p className="text-green-300 mt-1">{viewingDefect.resolutionNotes}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewingDefect(null)} className="text-slate-400">
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
