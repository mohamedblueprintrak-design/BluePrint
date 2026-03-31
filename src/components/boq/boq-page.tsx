'use client';

import { useState} from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useProjects, useBOQItems, useCreateBOQItem, useUpdateBOQItem, useDeleteBOQItem } from '@/hooks/use-data';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  FileSpreadsheet, Plus, Search, Edit, Trash2, Calculator,
  Building2, DollarSign, Package, Save, Loader2, AlertCircle
} from 'lucide-react';
import type { BOQItem } from '@/types';

const BOQ_CATEGORIES = [
  { value: 'civil', label: 'أعمال مدنية', labelEn: 'Civil Works' },
  { value: 'structural', label: 'أعمال إنشائية', labelEn: 'Structural Works' },
  { value: 'mep', label: 'أعمال ميكانيكية وكهربائية', labelEn: 'MEP Works' },
  { value: 'finishing', label: 'أعمال تشطيبات', labelEn: 'Finishing Works' },
  { value: 'external', label: 'أعمال خارجية', labelEn: 'External Works' },
  { value: 'infrastructure', label: 'أعمال بنية تحتية', labelEn: 'Infrastructure' },
];

export function BOQPage() {
  const { language } = useApp();
  const { t, formatCurrency } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BOQItem | null>(null);
  
  const { data: projectsData } = useProjects();
  const projects = projectsData?.data || [];
  
  // Fetch BOQ items based on selected project
  const { data: boqData, isLoading, error, refetch } = useBOQItems(
    projectFilter !== 'all' ? projectFilter : undefined
  );
  const boqItems = boqData?.data || [];
  
  // Mutations
  const createMutation = useCreateBOQItem();
  const updateMutation = useUpdateBOQItem();
  const deleteMutation = useDeleteBOQItem();
  
  const [formData, setFormData] = useState({
    itemNumber: '',
    description: '',
    unit: '',
    quantity: 0,
    unitPrice: 0,
    category: '',
    notes: '',
    projectId: '',
  });

  const filteredItems = boqItems.filter((item) => {
    const matchesSearch = item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.itemNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalItems: boqItems.length,
    totalValue: boqItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
    categories: [...new Set(boqItems.map(item => item.category))].length,
  };

  const getCategoryLabel = (category: string | undefined) => {
    if (!category) return '-';
    const cat = BOQ_CATEGORIES.find(c => c.value === category);
    return language === 'ar' ? cat?.label : cat?.labelEn;
  };

  const resetFormData = () => {
    setFormData({
      itemNumber: '',
      description: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
      category: '',
      notes: '',
      projectId: projectFilter !== 'all' ? projectFilter : '',
    });
  };

  const handleAddItem = async () => {
    if (!formData.description || !formData.unit || !formData.quantity || !formData.unitPrice || !formData.projectId) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'جميع الحقول المطلوبة يجب ملؤها' : 'All required fields must be filled',
        variant: 'destructive'
      });
      return;
    }

    const totalPrice = formData.quantity * formData.unitPrice;
    
    createMutation.mutate({
      projectId: formData.projectId,
      itemNumber: formData.itemNumber,
      description: formData.description,
      unit: formData.unit,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      totalPrice,
      category: formData.category,
      notes: formData.notes,
    }, {
      onSuccess: () => {
        toast({
          title: t.successSave,
          description: language === 'ar' ? `تم إضافة البند بقيمة ${formatCurrency(totalPrice)}` : `Item added with value ${formatCurrency(totalPrice)}`
        });
        setShowAddDialog(false);
        resetFormData();
      },
      onError: () => {
        toast({
          title: t.error,
          description: language === 'ar' ? 'فشل في إضافة البند' : 'Failed to add item',
          variant: 'destructive'
        });
      }
    });
  };

  const handleEditItem = async () => {
    if (!selectedItem || !formData.description || !formData.unit || !formData.quantity || !formData.unitPrice) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'جميع الحقول المطلوبة يجب ملؤها' : 'All required fields must be filled',
        variant: 'destructive'
      });
      return;
    }

    const totalPrice = formData.quantity * formData.unitPrice;
    
    updateMutation.mutate({
      id: selectedItem.id,
      projectId: selectedItem.projectId,
      itemNumber: formData.itemNumber,
      description: formData.description,
      unit: formData.unit,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      totalPrice,
      category: formData.category,
      notes: formData.notes,
    }, {
      onSuccess: () => {
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم تحديث البند بنجاح' : 'Item updated successfully'
        });
        setShowEditDialog(false);
        setSelectedItem(null);
        resetFormData();
      },
      onError: () => {
        toast({
          title: t.error,
          description: language === 'ar' ? 'فشل في تحديث البند' : 'Failed to update item',
          variant: 'destructive'
        });
      }
    });
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    deleteMutation.mutate({
      id: selectedItem.id,
      projectId: selectedItem.projectId,
    }, {
      onSuccess: () => {
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم حذف البند بنجاح' : 'Item deleted successfully'
        });
        setShowDeleteDialog(false);
        setSelectedItem(null);
      },
      onError: () => {
        toast({
          title: t.error,
          description: language === 'ar' ? 'فشل في حذف البند' : 'Failed to delete item',
          variant: 'destructive'
        });
      }
    });
  };

  const openEditDialog = (item: BOQItem) => {
    setSelectedItem(item);
    setFormData({
      itemNumber: item.itemNumber || '',
      description: item.description,
      unit: item.unit || '',
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      category: item.category || '',
      notes: item.notes || '',
      projectId: item.projectId,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (item: BOQItem) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  // Open add dialog with reset form
  const openAddDialog = () => {
    resetFormData();
    setShowAddDialog(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-slate-400">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="bg-slate-900/50 border-slate-800 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {language === 'ar' ? 'خطأ في التحميل' : 'Error Loading'}
            </h3>
            <p className="text-slate-400 mb-4">
              {language === 'ar' ? 'فشل في تحميل بيانات جدول الكميات' : 'Failed to load BOQ data'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي البنود' : 'Total Items'}</p>
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
                <p className="text-xl font-bold text-white">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي القيمة' : 'Total Value'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.categories}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'الفئات' : 'Categories'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full md:w-auto flex-wrap">
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
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={language === 'ar' ? 'المشروع' : 'Project'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{language === 'ar' ? 'جميع المشاريع' : 'All Projects'}</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={language === 'ar' ? 'الفئة' : 'Category'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {BOQ_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {language === 'ar' ? cat.label : cat.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={openAddDialog}>
            <Plus className="w-4 h-4 me-2" />
            {language === 'ar' ? 'إضافة بند' : 'Add Item'}
          </Button>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إضافة بند جديد' : 'Add New Item'}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {language === 'ar' ? 'أدخل تفاصيل البند' : 'Enter item details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'المشروع' : 'Project'} *</Label>
                <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder={language === 'ar' ? 'اختر المشروع' : 'Select project'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'رقم البند' : 'Item Number'}</Label>
                  <Input
                    value={formData.itemNumber}
                    onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                    placeholder="C-001"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'الفئة' : 'Category'} *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {BOQ_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {language === 'ar' ? cat.label : cat.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'الوصف' : 'Description'} *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={language === 'ar' ? 'وصف البند' : 'Item description'}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'الوحدة' : 'Unit'} *</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder={language === 'ar' ? 'الوحدة' : 'Unit'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="م²">م²</SelectItem>
                      <SelectItem value="م³">م³</SelectItem>
                      <SelectItem value="م">م</SelectItem>
                      <SelectItem value="طن">طن</SelectItem>
                      <SelectItem value="كجم">كجم</SelectItem>
                      <SelectItem value="قطعة">قطعة</SelectItem>
                      <SelectItem value="م.طولي">م.طولي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'الكمية' : 'Quantity'} *</Label>
                  <Input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'} *</Label>
                  <Input
                    type="number"
                    value={formData.unitPrice || ''}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
              
              {/* Auto-calculated Total */}
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <span className="text-slate-400">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="text-xl font-bold text-cyan-400">
                  {formatCurrency(formData.quantity * formData.unitPrice)}
                </span>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="text-slate-400">
                {t.cancel}
              </Button>
              <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 me-2" />
                )}
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* BOQ Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            {language === 'ar' ? 'جدول الكميات' : 'Bill of Quantities'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Empty State */}
          {projectFilter === 'all' ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {language === 'ar' ? 'اختر مشروعاً' : 'Select a Project'}
              </h3>
              <p className="text-slate-400">
                {language === 'ar' 
                  ? 'يرجى اختيار مشروع من القائمة لعرض جدول الكميات الخاص به'
                  : 'Please select a project from the list to view its BOQ items'}
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {language === 'ar' ? 'لا توجد بنود' : 'No Items Found'}
              </h3>
              <p className="text-slate-400">
                {language === 'ar' 
                  ? 'لم يتم العثور على بنود لهذا المشروع'
                  : 'No BOQ items found for this project'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400">{language === 'ar' ? 'الرقم' : 'No.'}</TableHead>
                    <TableHead className="text-slate-400">{language === 'ar' ? 'الوصف' : 'Description'}</TableHead>
                    <TableHead className="text-slate-400">{language === 'ar' ? 'الفئة' : 'Category'}</TableHead>
                    <TableHead className="text-slate-400">{language === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
                    <TableHead className="text-slate-400 text-end">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                    <TableHead className="text-slate-400 text-end">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</TableHead>
                    <TableHead className="text-slate-400 text-end">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                    <TableHead className="text-slate-400 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="text-slate-300 font-mono">{item.itemNumber || '-'}</TableCell>
                      <TableCell className="text-white">{item.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-700 text-slate-300">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">{item.unit || '-'}</TableCell>
                      <TableCell className="text-slate-300 text-end">{item.quantity?.toLocaleString() || '-'}</TableCell>
                      <TableCell className="text-slate-300 text-end">{formatCurrency(item.unitPrice || 0)}</TableCell>
                      <TableCell className="text-cyan-400 text-end font-medium">{formatCurrency(item.totalPrice || 0)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-white"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-400"
                            onClick={() => openDeleteDialog(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Table Footer - Totals */}
          {filteredItems.length > 0 && (
            <div className="flex justify-end mt-4 pt-4 border-t border-slate-800">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{language === 'ar' ? 'عدد البنود' : 'Items Count'}</span>
                  <span className="text-white">{filteredItems.length}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-cyan-400">{formatCurrency(filteredItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0))}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل البند' : 'Edit Item'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {language === 'ar' ? 'تعديل تفاصيل البند' : 'Edit item details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'رقم البند' : 'Item Number'}</Label>
                <Input
                  value={formData.itemNumber}
                  onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                  placeholder="C-001"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {BOQ_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {language === 'ar' ? cat.label : cat.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">{language === 'ar' ? 'الوصف' : 'Description'} *</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'ar' ? 'وصف البند' : 'Item description'}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'الوحدة' : 'Unit'} *</Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder={language === 'ar' ? 'الوحدة' : 'Unit'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="م²">م²</SelectItem>
                    <SelectItem value="م³">م³</SelectItem>
                    <SelectItem value="م">م</SelectItem>
                    <SelectItem value="طن">طن</SelectItem>
                    <SelectItem value="كجم">كجم</SelectItem>
                    <SelectItem value="قطعة">قطعة</SelectItem>
                    <SelectItem value="م.طولي">م.طولي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'الكمية' : 'Quantity'} *</Label>
                <Input
                  type="number"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'} *</Label>
                <Input
                  type="number"
                  value={formData.unitPrice || ''}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
            
            {/* Auto-calculated Total */}
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-slate-400">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
              <span className="text-xl font-bold text-cyan-400">
                {formatCurrency(formData.quantity * formData.unitPrice)}
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditDialog(false)} className="text-slate-400">
              {t.cancel}
            </Button>
            <Button onClick={handleEditItem} className="bg-blue-600 hover:bg-blue-700" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 me-2" />
              )}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400">{language === 'ar' ? 'حذف البند' : 'Delete Item'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {language === 'ar' 
                ? `هل أنت متأكد من حذف البند "${selectedItem?.description}"؟`
                : `Are you sure you want to delete "${selectedItem?.description}"?`}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="text-slate-400">
              {t.cancel}
            </Button>
            <Button 
              onClick={handleDeleteItem} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 me-2" />
              )}
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
