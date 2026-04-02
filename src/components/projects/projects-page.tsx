'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useProjects, useCreateProject, useDeleteProject, useClients } from '@/hooks/use-data';
import { FloatingAIButton } from '@/components/ai/floating-ai-button';
import { AIInsightsBadge } from '@/components/ai/ai-insights-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Building2, Plus, Search, Edit, Trash2,
  Eye, MapPin, DollarSign, Users, AlertCircle
} from 'lucide-react';

const PROJECT_TYPES = [
  { value: 'residential', label: 'سكني', labelEn: 'Residential' },
  { value: 'commercial', label: 'تجاري', labelEn: 'Commercial' },
  { value: 'industrial', label: 'صناعي', labelEn: 'Industrial' },
  { value: 'infrastructure', label: 'بنية تحتية', labelEn: 'Infrastructure' },
  { value: 'hospitality', label: 'ضيافة', labelEn: 'Hospitality' },
];

const PROJECT_STATUSES = [
  { value: 'pending', label: 'قيد الانتظار', labelEn: 'Pending', color: 'bg-yellow-500' },
  { value: 'active', label: 'نشط', labelEn: 'Active', color: 'bg-green-500' },
  { value: 'on_hold', label: 'موقوف', labelEn: 'On Hold', color: 'bg-red-500' },
  { value: 'completed', label: 'مكتمل', labelEn: 'Completed', color: 'bg-blue-500' },
  { value: 'cancelled', label: 'ملغي', labelEn: 'Cancelled', color: 'bg-gray-500' },
];

export function ProjectsPage() {
  const router = useRouter();
  const { language, setCurrentPage: _setCurrentPage } = useApp();
  const { t, formatCurrency, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { data: projectsData, isLoading, isError, refetch } = useProjects();
  const { data: clientsData } = useClients();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  
  const clients = clientsData?.data || [];
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    projectType: '',
    clientId: '',
    contractValue: '',
    description: ''
  });

  // Filtered projects
  const filteredProjects = useMemo(() => {
    const projects = projectsData?.data || [];
    return projects.filter((project: any) => {
      const matchesSearch = project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            project.projectNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            project.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesType = typeFilter === 'all' || project.projectType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [projectsData?.data, searchQuery, statusFilter, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const projects = projectsData?.data || [];
    return {
      total: projects.length,
      active: projects.filter((p: any) => p.status === 'active').length,
      completed: projects.filter((p: any) => p.status === 'completed').length,
      pending: projects.filter((p: any) => p.status === 'pending').length,
      totalValue: projects.reduce((sum: number, p: any) => sum + (p.contractValue || 0), 0)
    };
  }, [projectsData?.data]);

  const handleCreateProject = async () => {
    if (!formData.name) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'اسم المشروع مطلوب' : 'Project name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createProject.mutateAsync({
        name: formData.name,
        location: formData.location,
        projectType: formData.projectType,
        clientId: formData.clientId,
        contractValue: formData.contractValue ? parseFloat(formData.contractValue) : 0,
        description: formData.description
      });
      
      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم إنشاء المشروع بنجاح' : 'Project created successfully'
      });
      
      setShowAddDialog(false);
      setFormData({ name: '', location: '', projectType: '', clientId: '', contractValue: '', description: '' });
      refetch();
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء المشروع' : 'Failed to create project',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    
    try {
      await deleteProject.mutateAsync(id);
      toast({
        title: t.successDelete,
        description: language === 'ar' ? 'تم حذف المشروع بنجاح' : 'Project deleted successfully'
      });
      refetch();
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء حذف المشروع' : 'Failed to delete project',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = PROJECT_STATUSES.find(s => s.value === status) || PROJECT_STATUSES[0];
    return (
      <Badge variant="secondary" className={`${statusConfig.color} text-foreground`}>
        {language === 'ar' ? statusConfig.label : status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{t.projects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Building2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-sm text-muted-foreground">{t.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">{t.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Building2 className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">{t.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-muted-foreground">{t.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 bg-muted border-border text-foreground"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-muted border-border text-foreground">
              <SelectValue placeholder={t.status} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">{t.all}</SelectItem>
              {PROJECT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {language === 'ar' ? status.label : status.labelEn || status.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] bg-muted border-border text-foreground">
              <SelectValue placeholder={t.projectType} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">{t.all}</SelectItem>
              {PROJECT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {language === 'ar' ? type.label : type.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-foreground">
              <Plus className="w-4 h-4 me-2" />
              {t.newProject}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.newProject}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {language === 'ar' ? 'أدخل بيانات المشروع الجديد' : 'Enter the new project details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground/80">{t.projectName} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  placeholder={language === 'ar' ? 'أدخل اسم المشروع' : 'Enter project name'}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.projectLocation}</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder={language === 'ar' ? 'الموقع' : 'Location'}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.projectType}</Label>
                  <Select value={formData.projectType} onValueChange={(v) => setFormData({ ...formData, projectType: v })}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder={t.projectType} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {PROJECT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === 'ar' ? type.label : type.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.clientName}</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder={language === 'ar' ? 'اختر العميل' : 'Select client'} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.contractValue}</Label>
                  <Input
                    type="number"
                    value={formData.contractValue}
                    onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground/80">{t.description}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  rows={3}
                  placeholder={language === 'ar' ? 'وصف المشروع...' : 'Project description...'}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="text-muted-foreground">
                {t.cancel}
              </Button>
              <Button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700" disabled={createProject.isPending}>
                {createProject.isPending ? t.loading : t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t.loading}</div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-red-400">
          <AlertCircle className="w-12 h-12 mb-3 opacity-70" />
          <p className="text-lg">{language === 'ar' ? 'فشل تحميل المشاريع' : 'Failed to load projects'}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Building2 className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">{t.noData}</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 me-2" />
            {t.newProject}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project: any) => (
            <Card 
              key={project.id} 
              className="bg-card border-border hover:border-border transition-colors cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-muted-foreground border-border">
                        {project.projectNumber}
                      </Badge>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardTitle className="text-lg text-foreground line-clamp-1">{project.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{project.location}</span>
                  </div>
                )}
                
                {project.client && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="line-clamp-1">{project.client}</span>
                  </div>
                )}
                
                {project.contractValue > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-medium">{formatCurrency(project.contractValue)}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.progress}</span>
                    <span className="text-foreground font-medium">{project.progressPercentage || 0}%</span>
                  </div>
                  <Progress value={project.progressPercentage || 0} className="h-2" />
                </div>
                
                <Separator className="bg-muted" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(project.createdAt)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AIInsightsBadge
                      context={`مشروع: ${project.name}، النوع: ${project.projectType}، القيمة: ${project.contractValue}، التقدم: ${project.progressPercentage}%`}
                      taskType="risk-assessment"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/projects/${project.id}`);
                      }}
                      title="Workspace"
                      aria-label="View project">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Edit project">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      aria-label="Delete project"
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating AI Button */}
      <FloatingAIButton
        context={JSON.stringify(stats)}
        entityType="project"
      />
    </div>
  );
}
