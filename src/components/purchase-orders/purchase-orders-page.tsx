'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useProjects, useSuppliers, usePurchaseOrders, useCreatePurchaseOrder, useUpdatePurchaseOrder } from '@/hooks/use-data';
import { Card, CardContent } from '@/components/ui/card';
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
  ShoppingCart, Plus, Search, Eye, Edit, Send, CheckCircle,
  Clock, XCircle, Package, Building2, Calendar, DollarSign, Truck,
  Loader2, AlertCircle
} from 'lucide-react';

const PO_STATUSES = [
  { value: 'draft', label: 'مسودة', labelEn: 'Draft', color: 'bg-slate-500' },
  { value: 'submitted', label: 'قيد المراجعة', labelEn: 'Submitted', color: 'bg-yellow-500' },
  { value: 'approved', label: 'معتمد', labelEn: 'Approved', color: 'bg-blue-500' },
  { value: 'received', label: 'تم الاستلام', labelEn: 'Received', color: 'bg-green-500' },
  { value: 'cancelled', label: 'ملغي', labelEn: 'Cancelled', color: 'bg-red-500' },
];

export function PurchaseOrdersPage() {
  const { language } = useApp();
  const { t, formatCurrency, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { data: projectsData } = useProjects();
  const { data: suppliersData } = useSuppliers();
  const projects = projectsData?.data || [];
  const suppliers = suppliersData?.data || [];
  
  const { data: poData, isLoading, error } = usePurchaseOrders();
  const purchaseOrders = poData?.data || [];
  
  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  
  const [formData, setFormData] = useState({
    supplierId: '',
    projectId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, unit: '' }],
    notes: '',
  });

  const filteredPOs = purchaseOrders.filter((po: any) => {
    const matchesSearch = po.poNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          po.supplierName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: purchaseOrders.length,
    pending: purchaseOrders.filter((po: any) => po.status === 'submitted').length,
    approved: purchaseOrders.filter((po: any) => po.status === 'approved').length,
    received: purchaseOrders.filter((po: any) => po.status === 'received').length,
    totalValue: purchaseOrders.reduce((sum: number, po: any) => sum + (po.totalAmount || 0), 0),
  };

  const getStatusBadge = (status: string) => {
    const config = PO_STATUSES.find(s => s.value === status) || PO_STATUSES[0];
    return (
      <Badge className={`${config.color} text-white`}>
        {language === 'ar' ? config.label : config.labelEn}
      </Badge>
    );
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, unit: '' }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleCreatePO = async () => {
    if (!formData.supplierId || formData.items.length === 0) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'المورد والبنود مطلوبة' : 'Supplier and items are required',
        variant: 'destructive'
      });
      return;
    }
    
    createMutation.mutate({
      projectId: formData.projectId || undefined,
      supplierId: formData.supplierId,
      orderDate: formData.orderDate,
      expectedDate: formData.expectedDate || undefined,
      items: formData.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit
      })),
      notes: formData.notes
    }, {
      onSuccess: () => {
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم إنشاء أمر الشراء بنجاح' : 'Purchase order created successfully'
        });
        setShowAddDialog(false);
        setFormData({
          supplierId: '',
          projectId: '',
          orderDate: new Date().toISOString().split('T')[0],
          expectedDate: '',
          items: [{ description: '', quantity: 1, unitPrice: 0, unit: '' }],
          notes: '',
        });
      },
      onError: () => {
        toast({
          title: t.error,
          description: language === 'ar' ? 'فشل في إنشاء أمر الشراء' : 'Failed to create purchase order',
          variant: 'destructive'
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data'}</p>
        </div>
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
              <div className="p-2 rounded-lg bg-blue-500/20">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي الأوامر' : 'Total Orders'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Truck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.approved}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'معتمد' : 'Approved'}</p>
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
                <p className="text-2xl font-bold text-white">{stats.received}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'تم الاستلام' : 'Received'}</p>
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
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي القيمة' : 'Total Value'}</p>
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
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={t.status} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {PO_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {language === 'ar' ? status.label : status.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'أمر شراء جديد' : 'New PO'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إنشاء أمر شراء' : 'Create Purchase Order'}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {language === 'ar' ? 'أدخل تفاصيل أمر الشراء' : 'Enter purchase order details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'المورد' : 'Supplier'} *</Label>
                  <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder={language === 'ar' ? 'اختر المورد' : 'Select supplier'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {suppliers.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'تاريخ الطلب' : 'Order Date'}</Label>
                  <Input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'تاريخ التسليم المتوقع' : 'Expected Date'}</Label>
                  <Input
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
              
              {/* Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">{language === 'ar' ? 'البنود' : 'Items'}</Label>
                  <Button variant="outline" size="sm" onClick={handleAddItem} className="border-slate-700">
                    <Plus className="w-4 h-4 me-1" />
                    {language === 'ar' ? 'إضافة بند' : 'Add Item'}
                  </Button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-800/30 rounded-lg">
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs text-slate-400">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white h-9"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-slate-400">{language === 'ar' ? 'الكمية' : 'Qty'}</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="bg-slate-700/50 border-slate-600 text-white h-9"
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs text-slate-400">{language === 'ar' ? 'السعر' : 'Price'}</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="bg-slate-700/50 border-slate-600 text-white h-9"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center h-9 text-cyan-400 font-medium">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-1 h-9 w-9 text-red-400 hover:text-red-300"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {/* Total */}
                <div className="flex justify-end">
                  <div className="w-48 p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                      <span className="text-cyan-400">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="text-slate-400">
                {t.cancel}
              </Button>
              <Button onClick={handleCreatePO} className="bg-blue-600 hover:bg-blue-700">
                {language === 'ar' ? 'إنشاء أمر الشراء' : 'Create PO'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* PO List */}
      <div className="space-y-4">
        {filteredPOs.map((po: any) => (
          <Card key={po.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <ShoppingCart className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-medium">{po.poNumber}</h3>
                      {getStatusBadge(po.status)}
                    </div>
                    <p className="text-slate-400 text-sm">{po.supplierName || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                      {po.projectName && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{po.projectName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(po.orderDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{po.items?.length || 0} {language === 'ar' ? 'بند' : 'items'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-end">
                    <p className="text-xl font-bold text-cyan-400">{formatCurrency(po.totalAmount || 0)}</p>
                    {po.expectedDate && (
                      <p className="text-xs text-slate-500">
                        {language === 'ar' ? 'تسليم متوقع:' : 'Expected:'} {formatDate(po.expectedDate)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {po.status === 'draft' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:text-green-300">
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredPOs.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">{language === 'ar' ? 'لا توجد أوامر شراء' : 'No purchase orders found'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
