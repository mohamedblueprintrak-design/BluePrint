'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useProjects } from '@/hooks/use-data';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/use-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Wallet, Plus, Search, Edit, TrendingUp, TrendingDown, Trash2,
  DollarSign, PieChart, BarChart3, Building2, AlertTriangle, Loader2
} from 'lucide-react';

const BUDGET_CATEGORIES = [
  { value: 'materials', label: 'المواد', labelEn: 'Materials', color: 'bg-blue-500' },
  { value: 'labor', label: 'عمالة', labelEn: 'Labor', color: 'bg-green-500' },
  { value: 'equipment', label: 'معدات', labelEn: 'Equipment', color: 'bg-purple-500' },
  { value: 'subcontractors', label: 'مقاولين من الباطن', labelEn: 'Subcontractors', color: 'bg-orange-500' },
  { value: 'overhead', label: 'مصاريف عامة', labelEn: 'Overhead', color: 'bg-cyan-500' },
  { value: 'contingency', label: 'احتياطي', labelEn: 'Contingency', color: 'bg-yellow-500' },
];

interface Budget {
  id: string;
  projectId: string;
  projectName?: string;
  category: string;
  description?: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
}

export function BudgetsPage() {
  const { language } = useApp();
  const { t, formatCurrency } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  const { data: projectsData } = useProjects();
  const projects = projectsData?.data || [];
  
  const { data: budgetsData, isLoading: budgetsLoading, error: budgetsError } = useBudgets();
  const budgets = budgetsData?.data || [];
  
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  
  const [formData, setFormData] = useState({
    projectId: '',
    category: '',
    description: '',
    budgetAmount: 0,
    actualAmount: 0,
  });

  const filteredBudgets = budgets.filter((budget: any) => {
    const matchesSearch = budget.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === 'all' || budget.projectId === projectFilter;
    const matchesCategory = categoryFilter === 'all' || budget.category === categoryFilter;
    return matchesSearch && matchesProject && matchesCategory;
  });

  const stats = {
    totalBudget: budgets.reduce((sum: number, b: any) => sum + (b.budgetAmount || 0), 0),
    totalActual: budgets.reduce((sum: number, b: any) => sum + (b.actualAmount || 0), 0),
    totalVariance: budgets.reduce((sum: number, b: any) => sum + (b.variance || 0), 0),
    overBudget: budgets.filter((b: any) => b.variance < 0).length,
  };

  const getCategoryLabel = (category: string) => {
    const cat = BUDGET_CATEGORIES.find(c => c.value === category);
    return language === 'ar' ? cat?.label : cat?.labelEn;
  };

  const getCategoryColor = (category: string) => {
    const cat = BUDGET_CATEGORIES.find(c => c.value === category);
    return cat?.color || 'bg-slate-500';
  };

  const getVarianceColor = (variance: number) => {
    if (variance >= 0) return 'text-green-400';
    return 'text-red-400';
  };

  const handleAddBudget = async () => {
    if (!formData.projectId || !formData.category || !formData.budgetAmount) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'جميع الحقول المطلوبة يجب ملؤها' : 'All required fields must be filled',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await createBudget.mutateAsync({
        projectId: formData.projectId,
        category: formData.category,
        description: formData.description,
        budgetAmount: formData.budgetAmount,
        actualAmount: formData.actualAmount,
      });
      
      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم إضافة الميزانية بنجاح' : 'Budget added successfully'
      });
      setShowAddDialog(false);
      setFormData({ projectId: '', category: '', description: '', budgetAmount: 0, actualAmount: 0 });
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل في إضافة الميزانية' : 'Failed to add budget',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget) return;
    
    try {
      await updateBudget.mutateAsync({
        id: editingBudget.id,
        projectId: formData.projectId,
        category: formData.category,
        description: formData.description,
        budgetAmount: formData.budgetAmount,
        actualAmount: formData.actualAmount,
      });
      
      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم تحديث الميزانية بنجاح' : 'Budget updated successfully'
      });
      setEditingBudget(null);
      setFormData({ projectId: '', category: '', description: '', budgetAmount: 0, actualAmount: 0 });
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل في تحديث الميزانية' : 'Failed to update budget',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الميزانية؟' : 'Are you sure you want to delete this budget?')) {
      return;
    }
    
    try {
      await deleteBudget.mutateAsync(id);
      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم حذف الميزانية بنجاح' : 'Budget deleted successfully'
      });
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل في حذف الميزانية' : 'Failed to delete budget',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      projectId: budget.projectId,
      category: budget.category,
      description: budget.description || '',
      budgetAmount: budget.budgetAmount,
      actualAmount: budget.actualAmount,
    });
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingBudget(null);
    setFormData({ projectId: '', category: '', description: '', budgetAmount: 0, actualAmount: 0 });
  };

  if (budgetsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (budgetsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">{language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalBudget)}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي الميزانية' : 'Total Budget'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalActual)}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'المصروف الفعلي' : 'Actual Spent'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.totalVariance >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {stats.totalVariance >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <p className={`text-lg font-bold ${getVarianceColor(stats.totalVariance)}`}>
                  {formatCurrency(Math.abs(stats.totalVariance))}
                </p>
                <p className="text-sm text-slate-400">
                  {stats.totalVariance >= 0 
                    ? (language === 'ar' ? 'فائض' : 'Under Budget')
                    : (language === 'ar' ? 'عجز' : 'Over Budget')}
                </p>
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
                <p className="text-2xl font-bold text-white">{stats.overBudget}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'تجاوز الميزانية' : 'Over Budget'}</p>
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
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={t.project} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={language === 'ar' ? 'الفئة' : 'Category'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {BUDGET_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {language === 'ar' ? cat.label : cat.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'إضافة ميزانية' : 'Add Budget'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إضافة ميزانية جديدة' : 'Add New Budget'}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {language === 'ar' ? 'أدخل تفاصيل الميزانية' : 'Enter budget details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
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
                <Label className="text-slate-300">{language === 'ar' ? 'الفئة' : 'Category'} *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {BUDGET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {language === 'ar' ? cat.label : cat.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'المبلغ الميزاني' : 'Budget Amount'} *</Label>
                <Input
                  type="number"
                  value={formData.budgetAmount || ''}
                  onChange={(e) => setFormData({ ...formData, budgetAmount: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'المبلغ الفعلي' : 'Actual Amount'}</Label>
                <Input
                  type="number"
                  value={formData.actualAmount || ''}
                  onChange={(e) => setFormData({ ...formData, actualAmount: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={closeDialog} className="text-slate-400">
                {t.cancel}
              </Button>
              <Button onClick={handleAddBudget} className="bg-blue-600 hover:bg-blue-700" disabled={createBudget.isPending}>
                {createBudget.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBudgets.map((budget: any) => {
          const usagePercentage = budget.budgetAmount > 0 ? (budget.actualAmount / budget.budgetAmount) * 100 : 0;
          
          return (
            <Card key={budget.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(budget.category)}20`}>
                      <PieChart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Badge className={`${getCategoryColor(budget.category)} text-white text-xs mb-1`}>
                        {getCategoryLabel(budget.category)}
                      </Badge>
                      <h3 className="text-white font-medium">{budget.description || getCategoryLabel(budget.category)}</h3>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-white"
                      onClick={() => openEditDialog(budget)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-400"
                      onClick={() => handleDeleteBudget(budget.id)}
                      disabled={deleteBudget.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <Building2 className="w-3 h-3" />
                  <span>{budget.projectName || language === 'ar' ? 'غير محدد' : 'Not specified'}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{language === 'ar' ? 'الاستخدام' : 'Usage'}</span>
                    <span className="text-white">{usagePercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
                </div>
                
                {/* Amounts */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-800/30 rounded">
                    <p className="text-xs text-slate-400">{language === 'ar' ? 'الميزانية' : 'Budget'}</p>
                    <p className="text-white font-medium">{formatCurrency(budget.budgetAmount)}</p>
                  </div>
                  <div className="p-2 bg-slate-800/30 rounded">
                    <p className="text-xs text-slate-400">{language === 'ar' ? 'المصروف' : 'Spent'}</p>
                    <p className="text-white font-medium">{formatCurrency(budget.actualAmount)}</p>
                  </div>
                  <div className={`p-2 rounded ${budget.variance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <p className="text-xs text-slate-400">{language === 'ar' ? 'الفرق' : 'Variance'}</p>
                    <p className={`font-medium ${getVarianceColor(budget.variance)}`}>
                      {formatCurrency(Math.abs(budget.variance))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBudgets.length === 0 && (
        <div className="text-center py-12">
          <PieChart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">{language === 'ar' ? 'لا توجد ميزانيات' : 'No budgets found'}</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل الميزانية' : 'Edit Budget'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {language === 'ar' ? 'تعديل تفاصيل الميزانية' : 'Edit budget details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t.project}</Label>
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
              <Label className="text-slate-300">{language === 'ar' ? 'الفئة' : 'Category'}</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {BUDGET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {language === 'ar' ? cat.label : cat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">{language === 'ar' ? 'المبلغ الميزاني' : 'Budget Amount'}</Label>
              <Input
                type="number"
                value={formData.budgetAmount || ''}
                onChange={(e) => setFormData({ ...formData, budgetAmount: parseFloat(e.target.value) || 0 })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">{language === 'ar' ? 'المبلغ الفعلي' : 'Actual Amount'}</Label>
              <Input
                type="number"
                value={formData.actualAmount || ''}
                onChange={(e) => setFormData({ ...formData, actualAmount: parseFloat(e.target.value) || 0 })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog} className="text-slate-400">
              {t.cancel}
            </Button>
            <Button onClick={handleUpdateBudget} className="bg-blue-600 hover:bg-blue-700" disabled={updateBudget.isPending}>
              {updateBudget.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
