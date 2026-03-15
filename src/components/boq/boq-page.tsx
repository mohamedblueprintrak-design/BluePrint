'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useProjects } from '@/hooks/use-data';
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
  Building2, DollarSign, Package, Save, X
} from 'lucide-react';

const BOQ_CATEGORIES = [
  { value: 'civil', label: 'أعمال مدنية', labelEn: 'Civil Works' },
  { value: 'structural', label: 'أعمال إنشائية', labelEn: 'Structural Works' },
  { value: 'mep', label: 'أعمال ميكانيكية وكهربائية', labelEn: 'MEP Works' },
  { value: 'finishing', label: 'أعمال تشطيبات', labelEn: 'Finishing Works' },
  { value: 'external', label: 'أعمال خارجية', labelEn: 'External Works' },
  { value: 'infrastructure', label: 'أعمال بنية تحتية', labelEn: 'Infrastructure' },
];

interface BOQItem {
  id: string;
  itemNumber: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
  notes?: string;
}

const mockBOQItems: BOQItem[] = [
  { id: '1', itemNumber: 'C-001', description: 'حفر وتسوية الموقع', unit: 'م³', quantity: 5000, unitPrice: 25, totalPrice: 125000, category: 'civil' },
  { id: '2', itemNumber: 'C-002', description: 'ردم ودحل', unit: 'م³', quantity: 3000, unitPrice: 35, totalPrice: 105000, category: 'civil' },
  { id: '3', itemNumber: 'S-001', description: 'خرسانة عادية C25 للأعمال الخرسانية', unit: 'م³', quantity: 200, unitPrice: 320, totalPrice: 64000, category: 'structural' },
  { id: '4', itemNumber: 'S-002', description: 'حديد تسليح Grade 60', unit: 'طن', quantity: 50, unitPrice: 2800, totalPrice: 140000, category: 'structural' },
  { id: '5', itemNumber: 'M-001', description: 'تمديدات صحية', unit: 'م', quantity: 500, unitPrice: 150, totalPrice: 75000, category: 'mep' },
  { id: '6', itemNumber: 'F-001', description: 'دهانات داخلية', unit: 'م²', quantity: 2000, unitPrice: 35, totalPrice: 70000, category: 'finishing' },
];

export function BOQPage() {
  const { language } = useApp();
  const { t, formatCurrency } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { data: projectsData } = useProjects();
  const projects = projectsData?.data || [];
  
  const [boqItems] = useState<BOQItem[]>(mockBOQItems);
  
  const [formData, setFormData] = useState({
    itemNumber: '',
    description: '',
    unit: '',
    quantity: 0,
    unitPrice: 0,
    category: '',
    notes: '',
  });

  const filteredItems = boqItems.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalItems: boqItems.length,
    totalValue: boqItems.reduce((sum, item) => sum + item.totalPrice, 0),
    categories: [...new Set(boqItems.map(item => item.category))].length,
  };

  const getCategoryLabel = (category: string) => {
    const cat = BOQ_CATEGORIES.find(c => c.value === category);
    return language === 'ar' ? cat?.label : cat?.labelEn;
  };

  const handleAddItem = async () => {
    if (!formData.description || !formData.unit || !formData.quantity || !formData.unitPrice) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'جميع الحقول المطلوبة يجب ملؤها' : 'All required fields must be filled',
        variant: 'destructive'
      });
      return;
    }

    const totalPrice = formData.quantity * formData.unitPrice;
    
    toast({
      title: t.successSave,
      description: language === 'ar' ? `تم إضافة البند بقيمة ${formatCurrency(totalPrice)}` : `Item added with value ${formatCurrency(totalPrice)}`
    });
    setShowAddDialog(false);
    setFormData({ itemNumber: '', description: '', unit: '', quantity: 0, unitPrice: 0, category: '', notes: '' });
  };

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
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'إضافة بند' : 'Add Item'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إضافة بند جديد' : 'Add New Item'}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {language === 'ar' ? 'أدخل تفاصيل البند' : 'Enter item details'}
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
              <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 me-2" />
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
                    <TableCell className="text-slate-300 font-mono">{item.itemNumber}</TableCell>
                    <TableCell className="text-white">{item.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-700 text-slate-300">
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{item.unit}</TableCell>
                    <TableCell className="text-slate-300 text-end">{item.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-slate-300 text-end">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-cyan-400 text-end font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Table Footer - Totals */}
          <div className="flex justify-end mt-4 pt-4 border-t border-slate-800">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{language === 'ar' ? 'عدد البنود' : 'Items Count'}</span>
                <span className="text-white">{filteredItems.length}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="text-cyan-400">{formatCurrency(filteredItems.reduce((sum, item) => sum + item.totalPrice, 0))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
