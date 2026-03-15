'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useProjects, useClients } from '@/hooks/use-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Receipt, Plus, Search, Eye, Edit, Printer, ArrowDownToLine,
  ArrowUpFromLine, DollarSign, Calendar, Building2, User, FileText
} from 'lucide-react';

const VOUCHER_TYPES = [
  { value: 'receipt', label: 'سند قبض', labelEn: 'Receipt Voucher', icon: ArrowDownToLine, color: 'text-green-400' },
  { value: 'payment', label: 'سند صرف', labelEn: 'Payment Voucher', icon: ArrowUpFromLine, color: 'text-red-400' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقداً', labelEn: 'Cash' },
  { value: 'bank_transfer', label: 'تحويل بنكي', labelEn: 'Bank Transfer' },
  { value: 'cheque', label: 'شيك', labelEn: 'Cheque' },
  { value: 'credit_card', label: 'بطاقة ائتمان', labelEn: 'Credit Card' },
];

interface Voucher {
  id: string;
  voucherNumber: string;
  voucherType: 'receipt' | 'payment';
  amount: number;
  clientId?: string;
  clientName?: string;
  supplierId?: string;
  supplierName?: string;
  projectId?: string;
  projectName?: string;
  date: string;
  paymentMethod: string;
  referenceNumber?: string;
  description: string;
  status: string;
  createdAt: string;
}

const mockVouchers: Voucher[] = [
  { id: '1', voucherNumber: 'RV-2024-0001', voucherType: 'receipt', amount: 150000, clientId: 'c1', clientName: 'شركة الإنشاءات المتحدة', projectId: 'p1', projectName: 'برج دبي', date: new Date().toISOString(), paymentMethod: 'bank_transfer', referenceNumber: 'TRN-12345', description: 'دفعة أولى حسب العقد', status: 'completed', createdAt: new Date().toISOString() },
  { id: '2', voucherNumber: 'PV-2024-0001', voucherType: 'payment', amount: 75000, supplierId: 's1', supplierName: 'شركة الخرسانة المتحدة', projectId: 'p1', projectName: 'برج دبي', date: new Date().toISOString(), paymentMethod: 'cheque', referenceNumber: 'CHQ-001', description: 'دفع مستحقات الخرسانة', status: 'completed', createdAt: new Date().toISOString() },
  { id: '3', voucherNumber: 'RV-2024-0002', voucherType: 'receipt', amount: 50000, clientId: 'c2', clientName: 'مؤسسة الفجيرة للمقاولات', projectId: 'p2', projectName: 'فيلا المرفأ', date: new Date(Date.now() - 86400000).toISOString(), paymentMethod: 'cash', description: 'دفعة مقدمة', status: 'completed', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', voucherNumber: 'PV-2024-0002', voucherType: 'payment', amount: 28000, supplierId: 's2', supplierName: 'مؤسسة الحديد والتسليح', projectId: 'p1', projectName: 'برج دبي', date: new Date(Date.now() - 172800000).toISOString(), paymentMethod: 'bank_transfer', referenceNumber: 'TRN-12346', description: 'مستحقات حديد التسليح', status: 'pending', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export function VouchersPage() {
  const { language } = useApp();
  const { t, formatCurrency, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [voucherType, setVoucherType] = useState<'receipt' | 'payment'>('receipt');
  
  const { data: projectsData } = useProjects();
  const { data: clientsData } = useClients();
  const projects = projectsData?.data || [];
  const clients = clientsData?.data || [];
  
  const [vouchers] = useState<Voucher[]>(mockVouchers);
  
  const [formData, setFormData] = useState({
    amount: 0,
    projectId: '',
    clientId: '',
    supplierName: '',
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch = voucher.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          voucher.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || voucher.voucherType === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalReceipts: vouchers.filter(v => v.voucherType === 'receipt').reduce((sum, v) => sum + v.amount, 0),
    totalPayments: vouchers.filter(v => v.voucherType === 'payment').reduce((sum, v) => sum + v.amount, 0),
    pendingPayments: vouchers.filter(v => v.voucherType === 'payment' && v.status === 'pending').reduce((sum, v) => sum + v.amount, 0),
    netCash: vouchers.filter(v => v.voucherType === 'receipt').reduce((sum, v) => sum + v.amount, 0) -
             vouchers.filter(v => v.voucherType === 'payment').reduce((sum, v) => sum + v.amount, 0),
  };

  const getPaymentMethodLabel = (method: string) => {
    const config = PAYMENT_METHODS.find(m => m.value === method);
    return language === 'ar' ? config?.label : config?.labelEn;
  };

  const handleAddVoucher = async () => {
    if (!formData.amount || !formData.description) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'المبلغ والوصف مطلوبان' : 'Amount and description are required',
        variant: 'destructive'
      });
      return;
    }
    
    const prefix = voucherType === 'receipt' ? 'RV' : 'PV';
    toast({
      title: t.successSave,
      description: language === 'ar' ? `تم إنشاء السند بنجاح` : 'Voucher created successfully'
    });
    setShowAddDialog(false);
    setFormData({ amount: 0, projectId: '', clientId: '', supplierName: '', paymentMethod: 'bank_transfer', referenceNumber: '', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const ReceiptVoucherIcon = ArrowDownToLine;
  const PaymentVoucherIcon = ArrowUpFromLine;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <ArrowDownToLine className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalReceipts)}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي القبض' : 'Total Receipts'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <ArrowUpFromLine className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalPayments)}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي الصرف' : 'Total Payments'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Receipt className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.pendingPayments)}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'معلق' : 'Pending'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.netCash >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <DollarSign className={`w-5 h-5 ${stats.netCash >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${stats.netCash >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(stats.netCash)}
                </p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'صافي النقد' : 'Net Cash'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-800">
              {language === 'ar' ? 'الكل' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="receipt" className="data-[state=active]:bg-slate-800">
              <ArrowDownToLine className="w-4 h-4 me-2 text-green-400" />
              {language === 'ar' ? 'سندات القبض' : 'Receipts'}
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-slate-800">
              <ArrowUpFromLine className="w-4 h-4 me-2 text-red-400" />
              {language === 'ar' ? 'سندات الصرف' : 'Payments'}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-3">
            <div className="relative min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'سند جديد' : 'New Voucher'}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle>{language === 'ar' ? 'إنشاء سند جديد' : 'Create New Voucher'}</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {language === 'ar' ? 'اختر نوع السند وأدخل التفاصيل' : 'Select voucher type and enter details'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Voucher Type Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    {VOUCHER_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.value}
                          variant={voucherType === type.value ? 'default' : 'outline'}
                          className={`h-16 flex flex-col gap-1 ${voucherType === type.value ? 'bg-blue-600' : 'border-slate-700'}`}
                          onClick={() => setVoucherType(type.value as 'receipt' | 'payment')}
                        >
                          <Icon className={`w-5 h-5 ${type.color}`} />
                          <span className="text-xs">{language === 'ar' ? type.label : type.labelEn}</span>
                        </Button>
                      );
                    })}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">{language === 'ar' ? 'المبلغ' : 'Amount'} *</Label>
                      <Input
                        type="number"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label className="text-slate-300">
                        {voucherType === 'receipt' ? t.clientName : language === 'ar' ? 'المورد' : 'Supplier'}
                      </Label>
                      {voucherType === 'receipt' ? (
                        <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                            <SelectValue placeholder={language === 'ar' ? 'اختر العميل' : 'Select client'} />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            {clients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={formData.supplierName}
                          onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                          placeholder={language === 'ar' ? 'اسم المورد' : 'Supplier name'}
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</Label>
                      <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {language === 'ar' ? method.label : method.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">{language === 'ar' ? 'رقم المرجع' : 'Reference No.'}</Label>
                      <Input
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">{language === 'ar' ? 'الوصف' : 'Description'} *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      rows={2}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="text-slate-400">
                    {t.cancel}
                  </Button>
                  <Button onClick={handleAddVoucher} className="bg-blue-600 hover:bg-blue-700">
                    {language === 'ar' ? 'إنشاء السند' : 'Create Voucher'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Voucher Lists */}
        <TabsContent value="all" className="space-y-4">
          {filteredVouchers.map((voucher) => (
            <Card key={voucher.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${voucher.voucherType === 'receipt' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {voucher.voucherType === 'receipt' ? (
                        <ArrowDownToLine className="w-6 h-6 text-green-400" />
                      ) : (
                        <ArrowUpFromLine className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-medium">{voucher.voucherNumber}</h3>
                        <Badge variant="outline" className={voucher.voucherType === 'receipt' ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}>
                          {voucher.voucherType === 'receipt' ? (language === 'ar' ? 'قبض' : 'Receipt') : (language === 'ar' ? 'صرف' : 'Payment')}
                        </Badge>
                        {voucher.status === 'pending' && (
                          <Badge className="bg-yellow-500 text-white">{language === 'ar' ? 'معلق' : 'Pending'}</Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">{voucher.description}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        {voucher.projectName && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>{voucher.projectName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{voucher.clientName || voucher.supplierName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(voucher.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{getPaymentMethodLabel(voucher.paymentMethod)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <p className={`text-xl font-bold ${voucher.voucherType === 'receipt' ? 'text-green-400' : 'text-red-400'}`}>
                      {voucher.voucherType === 'receipt' ? '+' : '-'}{formatCurrency(voucher.amount)}
                    </p>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="receipt" className="space-y-4">
          {filteredVouchers.filter(v => v.voucherType === 'receipt').map((voucher) => (
            <Card key={voucher.id} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/20">
                      <ArrowDownToLine className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{voucher.voucherNumber}</h3>
                      <p className="text-slate-400 text-sm">{voucher.description}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-400">+{formatCurrency(voucher.amount)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          {filteredVouchers.filter(v => v.voucherType === 'payment').map((voucher) => (
            <Card key={voucher.id} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-red-500/20">
                      <ArrowUpFromLine className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{voucher.voucherNumber}</h3>
                      <p className="text-slate-400 text-sm">{voucher.description}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-red-400">-{formatCurrency(voucher.amount)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
