'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useMaterials, useCreateMaterial, useSuppliers } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Package, Plus, Search, Filter, MoreVertical, Edit, Trash2,
  Eye, ArrowDownToLine, ArrowUpFromLine, AlertTriangle,
  Warehouse, DollarSign, TrendingDown, ShoppingCart,
  History, FileText, MapPin, Hash
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MATERIAL_CATEGORIES = [
  { value: 'concrete', label: 'خرسانة', labelEn: 'Concrete' },
  { value: 'steel', label: 'حديد', labelEn: 'Steel' },
  { value: 'wood', label: 'أخشاب', labelEn: 'Wood' },
  { value: 'electrical', label: 'كهربائيات', labelEn: 'Electrical' },
  { value: 'plumbing', label: 'سباكة', labelEn: 'Plumbing' },
  { value: 'paint', label: 'دهانات', labelEn: 'Paint' },
  { value: 'tiles', label: 'بلاط', labelEn: 'Tiles' },
  { value: 'insulation', label: 'عزل', labelEn: 'Insulation' },
  { value: 'other', label: 'أخرى', labelEn: 'Other' },
];

const MATERIAL_UNITS = [
  { value: 'piece', label: 'قطعة', labelEn: 'Piece' },
  { value: 'meter', label: 'متر', labelEn: 'Meter' },
  { value: 'sqm', label: 'متر مربع', labelEn: 'Sq. Meter' },
  { value: 'cum', label: 'متر مكعب', labelEn: 'Cu. Meter' },
  { value: 'kg', label: 'كيلوغرام', labelEn: 'Kilogram' },
  { value: 'ton', label: 'طن', labelEn: 'Ton' },
  { value: 'liter', label: 'لتر', labelEn: 'Liter' },
  { value: 'box', label: 'صندوق', labelEn: 'Box' },
  { value: 'roll', label: 'لفة', labelEn: 'Roll' },
  { value: 'bag', label: 'كيس', labelEn: 'Bag' },
];

interface StockTransaction {
  id: string;
  materialId: string;
  materialName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  notes?: string;
  date: Date;
}

// Mock data for transactions
const mockTransactions: StockTransaction[] = [
  { id: '1', materialId: '1', materialName: 'حديد تسليح 16مم', type: 'in', quantity: 50, notes: 'فاتورة شراء #1234', date: new Date('2024-01-15') },
  { id: '2', materialId: '2', materialName: 'أسمنت بورتلاندي', type: 'out', quantity: 20, notes: 'مشروع الفيلا', date: new Date('2024-01-14') },
  { id: '3', materialId: '3', materialName: 'رمل نظيف', type: 'in', quantity: 100, notes: 'توريد المورد', date: new Date('2024-01-13') },
  { id: '4', materialId: '1', materialName: 'حديد تسليح 16مم', type: 'out', quantity: 30, notes: 'مشروع المبنى التجاري', date: new Date('2024-01-12') },
];

export function InventoryPage() {
  const { language } = useApp();
  const { t, formatCurrency, formatDate, formatNumber } = useTranslation(language);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');

  const { data: materialsData, isLoading, refetch } = useMaterials();
  const { data: suppliersData } = useSuppliers();
  const createMaterial = useCreateMaterial();

  const materials = materialsData?.data || [];
  const suppliers = suppliersData?.data || [];

  // Form state for new material
  const [formData, setFormData] = useState({
    materialCode: '',
    name: '',
    category: '',
    unit: 'piece',
    unitPrice: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    location: '',
    supplier: '',
  });

  // Form state for stock movement
  const [movementForm, setMovementForm] = useState({
    materialId: '',
    quantity: '',
    notes: '',
  });

  // Filter materials
  const filteredMaterials = materials.filter((material: any) => {
    const matchesSearch = material.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.materialCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get low stock materials
  const lowStockMaterials = materials.filter((material: any) =>
    material.currentStock <= material.minStock
  );

  // Stats
  const stats = {
    totalMaterials: materials.length,
    lowStockCount: lowStockMaterials.length,
    totalValue: materials.reduce((sum: number, m: any) => sum + (m.currentStock * m.unitPrice || 0), 0),
    categories: [...new Set(materials.map((m: any) => m.category).filter(Boolean))].length,
  };

  const handleCreateMaterial = async () => {
    if (!formData.name) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'اسم المادة مطلوب' : 'Material name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createMaterial.mutateAsync({
        materialCode: formData.materialCode,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : 0,
        currentStock: formData.currentStock ? parseFloat(formData.currentStock) : 0,
        minStock: formData.minStock ? parseFloat(formData.minStock) : 0,
        maxStock: formData.maxStock ? parseFloat(formData.maxStock) : 0,
        location: formData.location,
        supplier: formData.supplier,
        isActive: true,
      });

      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم إنشاء المادة بنجاح' : 'Material created successfully'
      });

      setShowAddDialog(false);
      setFormData({
        materialCode: '',
        name: '',
        category: '',
        unit: 'piece',
        unitPrice: '',
        currentStock: '',
        minStock: '',
        maxStock: '',
        location: '',
        supplier: '',
      });
      refetch();
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء المادة' : 'Failed to create material',
        variant: 'destructive'
      });
    }
  };

  const handleStockMovement = () => {
    if (!movementForm.materialId || !movementForm.quantity) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    // In a real app, this would call an API
    toast({
      title: t.successSave,
      description: language === 'ar'
        ? `تم تسجيل حركة المخزون (${movementType === 'in' ? 'وارد' : 'صادر'})`
        : `Stock ${movementType === 'in' ? 'in' : 'out'} recorded successfully`
    });

    setShowMovementDialog(false);
    setMovementForm({ materialId: '', quantity: '', notes: '' });
  };

  const handleQuickReorder = (material: any) => {
    toast({
      title: language === 'ar' ? 'تم إرسال طلب إعادة الطلب' : 'Reorder request sent',
      description: language === 'ar'
        ? `تم إرسال طلب إعادة طلب ${material.name}`
        : `Reorder request sent for ${material.name}`
    });
  };

  const getCategoryLabel = (category: string) => {
    const cat = MATERIAL_CATEGORIES.find(c => c.value === category);
    return language === 'ar' ? cat?.label : cat?.labelEn;
  };

  const getUnitLabel = (unit: string) => {
    const u = MATERIAL_UNITS.find(u => u.value === unit);
    return language === 'ar' ? u?.label : u?.labelEn;
  };

  const getStockStatus = (material: any) => {
    if (material.currentStock <= material.minStock) {
      return { status: 'critical', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    } else if (material.currentStock <= material.minStock * 1.5) {
      return { status: 'low', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    }
    return { status: 'normal', color: 'text-green-400', bgColor: 'bg-green-500/20' };
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.totalMaterials)}</p>
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'إجمالي المواد' : 'Total Materials'}
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
                <p className="text-2xl font-bold text-white">{formatNumber(stats.lowStockCount)}</p>
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'إجمالي القيمة' : 'Total Value'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Warehouse className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.categories)}</p>
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'الفئات' : 'Categories'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="materials" className="data-[state=active]:bg-slate-700">
              <Package className="w-4 h-4 me-2" />
              {language === 'ar' ? 'المواد' : 'Materials'}
            </TabsTrigger>
            <TabsTrigger value="movements" className="data-[state=active]:bg-slate-700">
              <History className="w-4 h-4 me-2" />
              {language === 'ar' ? 'حركة المخزون' : 'Stock Movements'}
            </TabsTrigger>
            <TabsTrigger value="low-stock" className="data-[state=active]:bg-slate-700">
              <AlertTriangle className="w-4 h-4 me-2" />
              {language === 'ar' ? 'تنبيهات المخزون' : 'Low Stock Alerts'}
              {lowStockMaterials.length > 0 && (
                <Badge className="ms-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                  {lowStockMaterials.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => {
                setMovementType('in');
                setShowMovementDialog(true);
              }}
            >
              <ArrowDownToLine className="w-4 h-4 me-2 text-green-400" />
              {t.stockIn}
            </Button>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => {
                setMovementType('out');
                setShowMovementDialog(true);
              }}
            >
              <ArrowUpFromLine className="w-4 h-4 me-2 text-orange-400" />
              {t.stockOut}
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 me-2" />
                  {t.newMaterial}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t.newMaterial}</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {language === 'ar' ? 'أدخل بيانات المادة الجديدة' : 'Enter the new material details'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">{t.materialCode}</Label>
                      <Input
                        value={formData.materialCode}
                        onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="MAT-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">{t.materialName} *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder={language === 'ar' ? 'اسم المادة' : 'Material name'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">{t.category}</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                          <SelectValue placeholder={t.category} />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          {MATERIAL_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {language === 'ar' ? cat.label : cat.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">{t.unit}</Label>
                      <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                          <SelectValue placeholder={t.unit} />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          {MATERIAL_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {language === 'ar' ? unit.label : unit.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">{t.unitPrice}</Label>
                      <Input
                        type="number"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">{t.currentStock}</Label>
                      <Input
                        type="number"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">{t.minStock}</Label>
                      <Input
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">{t.maxStock}</Label>
                      <Input
                        type="number"
                        value={formData.maxStock}
                        onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">
                        {language === 'ar' ? 'الموقع' : 'Location'}
                      </Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="A-1-01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.supplier}</Label>
                    <Select value={formData.supplier} onValueChange={(v) => setFormData({ ...formData, supplier: v })}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder={language === 'ar' ? 'اختر المورد' : 'Select supplier'} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {suppliers.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="text-slate-400">
                    {t.cancel}
                  </Button>
                  <Button onClick={handleCreateMaterial} className="bg-blue-600 hover:bg-blue-700" disabled={createMaterial.isPending}>
                    {createMaterial.isPending ? t.loading : t.save}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Materials Tab */}
        <TabsContent value="materials">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${language === 'ar' ? 'pr-9' : 'pl-9'} bg-slate-800/50 border-slate-700 text-white`}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder={t.category} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">{t.all}</SelectItem>
                {MATERIAL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {language === 'ar' ? cat.label : cat.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Materials Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">{t.loading}</div>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">{t.noData}</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 me-2" />
                {t.newMaterial}
              </Button>
            </div>
          ) : (
            <Card className="bg-slate-900/50 border-slate-800">
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                      <TableHead className="text-slate-400">{t.materialCode}</TableHead>
                      <TableHead className="text-slate-400">{t.materialName}</TableHead>
                      <TableHead className="text-slate-400">{t.category}</TableHead>
                      <TableHead className="text-slate-400">{t.unit}</TableHead>
                      <TableHead className="text-slate-400">{t.unitPrice}</TableHead>
                      <TableHead className="text-slate-400">{t.currentStock}</TableHead>
                      <TableHead className="text-slate-400">{language === 'ar' ? 'الحدود' : 'Min/Max'}</TableHead>
                      <TableHead className="text-slate-400">{language === 'ar' ? 'الموقع' : 'Location'}</TableHead>
                      <TableHead className="text-slate-400">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material: any) => {
                      const stockStatus = getStockStatus(material);
                      return (
                        <TableRow key={material.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-slate-500" />
                              <span className="text-white font-mono text-sm">{material.materialCode || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-blue-400" />
                              <span className="text-white font-medium">{material.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {material.category && (
                              <Badge variant="outline" className="border-slate-700 text-slate-300">
                                {getCategoryLabel(material.category)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {getUnitLabel(material.unit)}
                          </TableCell>
                          <TableCell className="text-cyan-400 font-medium">
                            {formatCurrency(material.unitPrice || 0)}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 ${stockStatus.color}`}>
                              <span className="font-medium">{formatNumber(material.currentStock || 0)}</span>
                              {stockStatus.status !== 'normal' && (
                                <AlertTriangle className="w-4 h-4" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="text-red-400">{material.minStock || 0}</span>
                              <span className="text-slate-500 mx-1">/</span>
                              <span className="text-green-400">{material.maxStock || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {material.location && (
                              <div className="flex items-center gap-1 text-slate-400 text-sm">
                                <MapPin className="w-3 h-3" />
                                {material.location}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'} className="bg-slate-900 border-slate-800">
                                <DropdownMenuItem className="text-slate-300 hover:bg-slate-800">
                                  <Eye className="w-4 h-4 me-2" />
                                  {t.view}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-slate-300 hover:bg-slate-800">
                                  <Edit className="w-4 h-4 me-2" />
                                  {t.edit}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-400 hover:bg-slate-800 focus:text-red-400"
                                  onClick={() => {
                                    if (confirm(t.confirmDelete)) {
                                      toast({
                                        title: t.successDelete,
                                        description: language === 'ar' ? 'تم حذف المادة' : 'Material deleted'
                                      });
                                      refetch();
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 me-2" />
                                  {t.delete}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          )}
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="movements">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                {language === 'ar' ? 'سجل حركة المخزون' : 'Stock Movement History'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {language === 'ar' ? 'آخر عمليات الوارد والصادر' : 'Recent stock in and out transactions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                      <TableHead className="text-slate-400">{t.date}</TableHead>
                      <TableHead className="text-slate-400">{t.materialName}</TableHead>
                      <TableHead className="text-slate-400">{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                      <TableHead className="text-slate-400">{language === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                      <TableHead className="text-slate-400">{t.notes}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="text-slate-300">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-400" />
                            <span className="text-white">{transaction.materialName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${transaction.type === 'in' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {transaction.type === 'in'
                              ? (language === 'ar' ? 'وارد' : 'Stock In')
                              : (language === 'ar' ? 'صادر' : 'Stock Out')
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${transaction.type === 'in' ? 'text-green-400' : 'text-orange-400'}`}>
                            {transaction.type === 'in' ? '+' : '-'}{transaction.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {transaction.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Alerts Tab */}
        <TabsContent value="low-stock">
          {lowStockMaterials.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Package className="w-16 h-16 mb-4 text-green-400 opacity-50" />
                <p className="text-lg text-green-400">
                  {language === 'ar' ? 'جميع المواد ضمن الحد الآمن' : 'All materials are within safe limits'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockMaterials.map((material: any) => (
                <Card key={material.id} className="bg-slate-900/50 border-slate-800 border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <CardTitle className="text-white text-base">{material.name}</CardTitle>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400">
                        {language === 'ar' ? 'منخفض' : 'Low'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{t.currentStock}:</span>
                      <span className="text-red-400 font-bold">{formatNumber(material.currentStock || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{t.minStock}:</span>
                      <span className="text-slate-300">{formatNumber(material.minStock || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{language === 'ar' ? 'النقص' : 'Shortage'}:</span>
                      <span className="text-orange-400 font-bold">
                        {formatNumber((material.minStock || 0) - (material.currentStock || 0))}
                      </span>
                    </div>

                    <Progress
                      value={material.minStock > 0 ? (material.currentStock / material.minStock) * 100 : 0}
                      className="h-2"
                    />

                    <Separator className="bg-slate-800" />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleQuickReorder(material)}
                      >
                        <ShoppingCart className="w-4 h-4 me-1" />
                        {language === 'ar' ? 'إعادة طلب' : 'Reorder'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={() => {
                          setMovementType('in');
                          setMovementForm({ ...movementForm, materialId: material.id });
                          setShowMovementDialog(true);
                        }}
                      >
                        <ArrowDownToLine className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stock Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {movementType === 'in' ? (
                <>
                  <ArrowDownToLine className="w-5 h-5 text-green-400" />
                  {t.stockIn}
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="w-5 h-5 text-orange-400" />
                  {t.stockOut}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {movementType === 'in'
                ? (language === 'ar' ? 'تسجيل مواد واردة للمخزون' : 'Record incoming materials to stock')
                : (language === 'ar' ? 'تسجيل مواد صادرة من المخزون' : 'Record outgoing materials from stock')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t.materialName} *</Label>
              <Select
                value={movementForm.materialId}
                onValueChange={(v) => setMovementForm({ ...movementForm, materialId: v })}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder={language === 'ar' ? 'اختر المادة' : 'Select material'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {materials.map((material: any) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.materialCode || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">
                {language === 'ar' ? 'الكمية' : 'Quantity'} *
              </Label>
              <Input
                type="number"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{t.notes}</Label>
              <Textarea
                value={movementForm.notes}
                onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
                rows={3}
                placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowMovementDialog(false)} className="text-slate-400">
              {t.cancel}
            </Button>
            <Button
              onClick={handleStockMovement}
              className={movementType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
