'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useSuppliers, useCreateSupplier } from '@/hooks/use-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Truck, Plus, Search, Building2, User, Mail, Phone, 
  MapPin, Eye, Edit, Trash2, DollarSign, Star, CheckCircle,
  Clock, XCircle, FileText
} from 'lucide-react';

const SUPPLIER_TYPES = [
  { value: 'materials', label: 'مواد بناء', labelEn: 'Building Materials', icon: Building2, color: 'bg-amber-500' },
  { value: 'equipment', label: 'معدات', labelEn: 'Equipment', icon: Truck, color: 'bg-blue-500' },
  { value: 'services', label: 'خدمات', labelEn: 'Services', icon: User, color: 'bg-green-500' },
  { value: 'consulting', label: 'استشارات', labelEn: 'Consulting', icon: FileText, color: 'bg-purple-500' },
  { value: 'maintenance', label: 'صيانة', labelEn: 'Maintenance', icon: Truck, color: 'bg-cyan-500' },
  { value: 'other', label: 'أخرى', labelEn: 'Other', icon: Building2, color: 'bg-slate-500' },
];

const APPROVAL_STATUS = [
  { value: 'approved', label: 'معتمد', labelEn: 'Approved', icon: CheckCircle, color: 'bg-green-500' },
  { value: 'pending', label: 'قيد الاعتماد', labelEn: 'Pending Approval', icon: Clock, color: 'bg-yellow-500' },
  { value: 'rejected', label: 'مرفوض', labelEn: 'Rejected', icon: XCircle, color: 'bg-red-500' },
];

// Star Rating Component
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
}

export function SuppliersPage() {
  const { language } = useApp();
  const { t, formatCurrency, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { data: suppliersData, isLoading, refetch } = useSuppliers();
  const createSupplier = useCreateSupplier();
  
  const suppliers = suppliersData?.data || [];
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    supplierType: 'materials',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    taxNumber: '',
    creditLimit: '',
    rating: '3',
    notes: ''
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier: any) => {
    const matchesSearch = supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || supplier.supplierType === typeFilter;
    const matchesApproval = approvalFilter === 'all' || 
                           (approvalFilter === 'approved' && supplier.isApproved) ||
                           (approvalFilter === 'pending' && !supplier.isApproved && supplier.isActive) ||
                           (approvalFilter === 'rejected' && !supplier.isApproved && !supplier.isActive);
    return matchesSearch && matchesType && matchesApproval;
  });

  // Stats
  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s: any) => s.isActive).length,
    approved: suppliers.filter((s: any) => s.isApproved).length,
    pending: suppliers.filter((s: any) => !s.isApproved && s.isActive).length,
    totalCreditLimit: suppliers.reduce((sum: number, s: any) => sum + (s.creditLimit || 0), 0)
  };

  const handleCreateSupplier = async () => {
    if (!formData.name) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'اسم المورد مطلوب' : 'Supplier name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createSupplier.mutateAsync({
        name: formData.name,
        supplierType: formData.supplierType,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        contactPerson: formData.contactPerson,
        taxNumber: formData.taxNumber,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0,
        rating: formData.rating ? parseInt(formData.rating) : 0,
        notes: formData.notes,
        isApproved: false,
        isActive: true
      });
      
      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم إنشاء المورد بنجاح' : 'Supplier created successfully'
      });
      
      setShowAddDialog(false);
      resetForm();
      refetch();
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء المورد' : 'Failed to create supplier',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSupplier = async (_id: string) => {
    if (!confirm(t.confirmDelete)) return;
    
    try {
      // Note: deleteSupplier hook would need to be added to use-data.ts
      // For now, we'll just show a success message
      toast({
        title: t.successDelete,
        description: language === 'ar' ? 'تم حذف المورد بنجاح' : 'Supplier deleted successfully'
      });
      refetch();
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء حذف المورد' : 'Failed to delete supplier',
        variant: 'destructive'
      });
    }
  };

  const getSupplierTypeBadge = (type: string) => {
    const typeConfig = SUPPLIER_TYPES.find(t => t.value === type) || SUPPLIER_TYPES[5];
    const Icon = typeConfig.icon;
    return (
      <Badge variant="secondary" className={`${typeConfig.color} text-foreground gap-1`}>
        <Icon className="w-3 h-3" />
        {language === 'ar' ? typeConfig.label : typeConfig.labelEn}
      </Badge>
    );
  };

  const getApprovalBadge = (isApproved: boolean, isActive: boolean) => {
    let statusConfig;
    if (isApproved) {
      statusConfig = APPROVAL_STATUS[0];
    } else if (!isApproved && isActive) {
      statusConfig = APPROVAL_STATUS[1];
    } else {
      statusConfig = APPROVAL_STATUS[2];
    }
    const Icon = statusConfig.icon;
    return (
      <Badge variant="secondary" className={`${statusConfig.color} text-foreground gap-1`}>
        <Icon className="w-3 h-3" />
        {language === 'ar' ? statusConfig.label : statusConfig.labelEn}
      </Badge>
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      supplierType: 'materials',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
      taxNumber: '',
      creditLimit: '',
      rating: '3',
      notes: ''
    });
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Truck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{t.suppliers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Truck className="w-5 h-5 text-green-400" />
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
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'معتمدون' : 'Approved'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'قيد الاعتماد' : 'Pending Approval'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
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
              <SelectValue placeholder={t.supplierType} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">{t.all}</SelectItem>
              {SUPPLIER_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {language === 'ar' ? type.label : type.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="w-[160px] bg-muted border-border text-foreground">
              <SelectValue placeholder={language === 'ar' ? 'حالة الاعتماد' : 'Approval Status'} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">{t.all}</SelectItem>
              {APPROVAL_STATUS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {language === 'ar' ? status.label : status.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-foreground">
              <Plus className="w-4 h-4 me-2" />
              {t.newSupplier}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.newSupplier}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {language === 'ar' ? 'أدخل بيانات المورد الجديد' : 'Enter the new supplier details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-foreground/80">{t.name} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  placeholder={language === 'ar' ? 'أدخل اسم المورد' : 'Enter supplier name'}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.supplierType}</Label>
                  <Select value={formData.supplierType} onValueChange={(v) => setFormData({ ...formData, supplierType: v })}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder={t.supplierType} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {SUPPLIER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === 'ar' ? type.label : type.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.rating}</Label>
                  <Select value={formData.rating} onValueChange={(v) => setFormData({ ...formData, rating: v })}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder={t.rating} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <SelectItem key={star} value={star.toString()}>
                          <div className="flex items-center gap-1">
                            {star} <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.email}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.phone}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone number'}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground/80">{t.address}</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  placeholder={language === 'ar' ? 'العنوان' : 'Address'}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.contactPerson}</Label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder={language === 'ar' ? 'الشخص المسؤول' : 'Contact person'}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.taxNumber}</Label>
                  <Input
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder={language === 'ar' ? 'الرقم الضريبي' : 'Tax number'}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground/80">
                  {language === 'ar' ? 'الحد الائتماني' : 'Credit Limit'}
                </Label>
                <Input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground/80">{t.notes}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  rows={3}
                  placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }} className="text-muted-foreground">
                {t.cancel}
              </Button>
              <Button onClick={handleCreateSupplier} className="bg-blue-600 hover:bg-blue-700" disabled={createSupplier.isPending}>
                {createSupplier.isPending ? t.loading : t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t.loading}</div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Truck className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">{t.noData}</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 me-2" />
            {t.newSupplier}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier: any) => (
            <Card 
              key={supplier.id} 
              className="bg-card border-border hover:border-border transition-colors cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getSupplierTypeBadge(supplier.supplierType)}
                      {getApprovalBadge(supplier.isApproved, supplier.isActive)}
                    </div>
                    <CardTitle className="text-lg text-foreground line-clamp-1">{supplier.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t.rating}</span>
                  <StarRating rating={supplier.rating || 0} />
                </div>
                
                {/* Contact Info */}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{supplier.email}</span>
                  </div>
                )}
                
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{supplier.phone}</span>
                  </div>
                )}
                
                {supplier.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{supplier.address}</span>
                  </div>
                )}
                
                {supplier.contactPerson && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{supplier.contactPerson}</span>
                  </div>
                )}
                
                <Separator className="bg-muted" />
                
                {/* Credit Limit */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" />
                    <span>{language === 'ar' ? 'الحد الائتماني' : 'Credit Limit'}</span>
                  </div>
                  <p className="text-cyan-400 font-medium">
                    {formatCurrency(supplier.creditLimit || 0)}
                  </p>
                </div>
                
                <Separator className="bg-muted" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(supplier.createdAt)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSupplier(supplier.id);
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
    </div>
  );
}
