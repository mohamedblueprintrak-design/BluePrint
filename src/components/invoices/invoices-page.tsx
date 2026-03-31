'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useInvoices, useCreateInvoice, useClients, useProjects } from '@/hooks/use-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Plus, Search, Eye, Edit, Trash2, Download,
  Clock, AlertCircle, CheckCircle, Calendar
} from 'lucide-react';
import { downloadInvoicePDF } from '@/lib/pdf/invoice-pdf';
import { apiDelete } from '@/lib/api-client';

// Invoice Status Configuration
const INVOICE_STATUSES = [
  { value: 'draft', label: 'مسودة', labelEn: 'Draft', color: 'bg-slate-500', textColor: 'text-slate-100' },
  { value: 'sent', label: 'مُرسلة', labelEn: 'Sent', color: 'bg-blue-500', textColor: 'text-blue-100' },
  { value: 'partial', label: 'مدفوعة جزئياً', labelEn: 'Partial', color: 'bg-amber-500', textColor: 'text-amber-100' },
  { value: 'paid', label: 'مدفوعة', labelEn: 'Paid', color: 'bg-green-500', textColor: 'text-green-100' },
  { value: 'overdue', label: 'متأخرة', labelEn: 'Overdue', color: 'bg-red-500', textColor: 'text-red-100' },
  { value: 'cancelled', label: 'ملغاة', labelEn: 'Cancelled', color: 'bg-gray-500', textColor: 'text-gray-100' },
];

// Invoice Item Interface
interface InvoiceItemForm {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  total: number;
}

export function InvoicesPage() {
  const { language } = useApp();
  const { t, formatCurrency, formatDate } = useTranslation(language);
  const { toast } = useToast();

  // State for filters and dialogs
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Data hooks
  const { data: invoicesData, isLoading, isError, refetch } = useInvoices();
  const { data: clientsData } = useClients();
  const { data: projectsData } = useProjects();
  const createInvoice = useCreateInvoice();

  const clients = clientsData?.data || [];
  const projects = projectsData?.data || [];

  // Form state for new invoice
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    taxRate: 5,
    discountAmount: 0,
    notes: '',
    terms: language === 'ar' 
      ? 'الدفعة مستحقة خلال 30 يوم من تاريخ الفاتورة' 
      : 'Payment is due within 30 days from invoice date',
  });

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemForm[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, unit: '', total: 0 }
  ]);

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (formData.taxRate / 100);
  const grandTotal = subtotal + taxAmount - formData.discountAmount;
  const calculations = { subtotal, taxAmount, grandTotal };

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    const invoices = invoicesData?.data || [];
    return invoices.filter((invoice: any) => {
      const matchesSearch = 
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.project?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesClient = clientFilter === 'all' || invoice.clientId === clientFilter;
      
      let matchesDateRange = true;
      if (dateFromFilter && invoice.issueDate) {
        matchesDateRange = new Date(invoice.issueDate) >= new Date(dateFromFilter);
      }
      if (dateToFilter && invoice.issueDate) {
        matchesDateRange = matchesDateRange && new Date(invoice.issueDate) <= new Date(dateToFilter);
      }
      
      return matchesSearch && matchesStatus && matchesClient && matchesDateRange;
    });
  }, [invoicesData?.data, searchQuery, statusFilter, clientFilter, dateFromFilter, dateToFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const invoices = invoicesData?.data || [];
    const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
    const totalPaid = invoices.reduce((sum: number, inv: any) => sum + (inv.paidAmount || 0), 0);
    const pending = invoices
      .filter((inv: any) => inv.status === 'sent' || inv.status === 'partial')
      .reduce((sum: number, inv: any) => sum + ((inv.total || 0) - (inv.paidAmount || 0)), 0);
    const overdue = invoices
      .filter((inv: any) => inv.status === 'overdue')
      .reduce((sum: number, inv: any) => sum + ((inv.total || 0) - (inv.paidAmount || 0)), 0);
    return { totalInvoiced, totalPaid, pending, overdue };
  }, [invoicesData?.data]);

  // Add invoice item
  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, unit: '', total: 0 }
    ]);
  };

  // Remove invoice item
  const removeInvoiceItem = (id: string) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter(item => item.id !== id));
    }
  };

  // Update invoice item
  const updateInvoiceItem = (id: string, field: keyof InvoiceItemForm, value: any) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  // Handle create invoice
  const handleCreateInvoice = async () => {
    if (!formData.clientId) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار العميل' : 'Please select a client',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.dueDate) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى تحديد تاريخ الاستحقاق' : 'Please set a due date',
        variant: 'destructive'
      });
      return;
    }

    const validItems = invoiceItems.filter(item => item.description && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إضافة بند واحد على الأقل' : 'Please add at least one item',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createInvoice.mutateAsync({
        clientId: formData.clientId,
        projectId: formData.projectId || undefined,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        items: validItems.map(({ description, quantity, unitPrice, unit, total }) => ({
          description,
          quantity,
          unitPrice,
          unit,
          total
        })),
        subtotal: calculations.subtotal,
        taxRate: formData.taxRate,
        taxAmount: calculations.taxAmount,
        discountAmount: formData.discountAmount,
        total: calculations.grandTotal,
        notes: formData.notes,
        terms: formData.terms,
        status: 'draft'
      });

      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم إنشاء الفاتورة بنجاح' : 'Invoice created successfully'
      });

      setShowAddDialog(false);
      resetForm();
      refetch();
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء الفاتورة' : 'Failed to create invoice',
        variant: 'destructive'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      clientId: '',
      projectId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      taxRate: 5,
      discountAmount: 0,
      notes: '',
      terms: language === 'ar' 
        ? 'الدفعة مستحقة خلال 30 يوم من تاريخ الفاتورة' 
        : 'Payment is due within 30 days from invoice date',
    });
    setInvoiceItems([
      { id: '1', description: '', quantity: 1, unitPrice: 0, unit: '', total: 0 }
    ]);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = INVOICE_STATUSES.find(s => s.value === status) || INVOICE_STATUSES[0];
    return (
      <Badge variant="secondary" className={`${statusConfig.color} ${statusConfig.textColor}`}>
        {language === 'ar' ? statusConfig.label : statusConfig.labelEn}
      </Badge>
    );
  };

  // Handle view invoice
  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  // Handle delete invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    
    try {
      await apiDelete(`/api/invoices`, { id });
      
      toast({
        title: t.successDelete,
        description: language === 'ar' ? 'تم حذف الفاتورة بنجاح' : 'Invoice deleted successfully'
      });
      refetch();
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : (language === 'ar' ? 'فشل حذف الفاتورة' : 'Failed to delete invoice'),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{formatCurrency(stats.totalInvoiced)}</p>
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'إجمالي الفواتير' : 'Total Invoiced'}
                </p>
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
                <p className="text-xl font-bold text-white">{formatCurrency(stats.totalPaid)}</p>
                <p className="text-sm text-slate-400">{t.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{formatCurrency(stats.pending)}</p>
                <p className="text-sm text-slate-400">{t.pending}</p>
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
                <p className="text-xl font-bold text-white">{formatCurrency(stats.overdue)}</p>
                <p className="text-sm text-slate-400">{t.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={language === 'ar' ? 'بحث في الفواتير...' : 'Search invoices...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={t.status} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {INVOICE_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {language === 'ar' ? status.label : status.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={t.clientName} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {clients.map((client: any) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-[150px] bg-slate-800/50 border-slate-700 text-white"
              placeholder={language === 'ar' ? 'من تاريخ' : 'From'}
            />
            <Input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-[150px] bg-slate-800/50 border-slate-700 text-white"
              placeholder={language === 'ar' ? 'إلى تاريخ' : 'To'}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 me-2" />
                {t.newInvoice}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t.newInvoice}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {language === 'ar' ? 'أدخل بيانات الفاتورة الجديدة' : 'Enter the new invoice details'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Client & Project Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.clientName} *</Label>
                    <Select 
                      value={formData.clientId} 
                      onValueChange={(v) => setFormData({ ...formData, clientId: v })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder={language === 'ar' ? 'اختر العميل' : 'Select client'} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.project}</Label>
                    <Select 
                      value={formData.projectId} 
                      onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder={language === 'ar' ? 'اختر المشروع' : 'Select project'} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.issueDate} *</Label>
                    <Input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.dueDate} *</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                {/* Invoice Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300 text-lg">
                      {language === 'ar' ? 'بنود الفاتورة' : 'Invoice Items'}
                    </Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addInvoiceItem}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <Plus className="w-4 h-4 me-1" />
                      {language === 'ar' ? 'إضافة بند' : 'Add Item'}
                    </Button>
                  </div>

                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-3 pe-2">
                      {invoiceItems.map((item, _index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-slate-800/30 rounded-lg">
                          <div className="col-span-4">
                            <Label className="text-xs text-slate-400 mb-1 block">
                              {language === 'ar' ? 'الوصف' : 'Description'}
                            </Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateInvoiceItem(item.id, 'description', e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white h-9"
                              placeholder={language === 'ar' ? 'وصف البند' : 'Item description'}
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="text-xs text-slate-400 mb-1 block">
                              {language === 'ar' ? 'الكمية' : 'Qty'}
                            </Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="bg-slate-700/50 border-slate-600 text-white h-9"
                              min="0"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="text-xs text-slate-400 mb-1 block">
                              {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                            </Label>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateInvoiceItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="bg-slate-700/50 border-slate-600 text-white h-9"
                              min="0"
                            />
                          </div>

                          <div className="col-span-1">
                            <Label className="text-xs text-slate-400 mb-1 block">
                              {language === 'ar' ? 'الوحدة' : 'Unit'}
                            </Label>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateInvoiceItem(item.id, 'unit', e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white h-9"
                              placeholder="m²"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="text-xs text-slate-400 mb-1 block">
                              {language === 'ar' ? 'الإجمالي' : 'Total'}
                            </Label>
                            <div className="bg-slate-700/30 border border-slate-600 rounded-md px-3 py-1.5 text-cyan-400 font-medium h-9 flex items-center">
                              {formatCurrency(item.total)}
                            </div>
                          </div>

                          <div className="col-span-1 flex items-end justify-center pb-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Remove item"
                              className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => removeInvoiceItem(item.id)}
                              disabled={invoiceItems.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator className="bg-slate-700" />

                {/* Totals */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">{language === 'ar' ? 'نسبة الضريبة (%)' : 'Tax Rate (%)'}</Label>
                        <Input
                          type="number"
                          value={formData.taxRate}
                          onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-800/50 border-slate-700 text-white"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">{t.discount}</Label>
                        <Input
                          type="number"
                          value={formData.discountAmount}
                          onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-800/50 border-slate-700 text-white"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-800/30 p-4 rounded-lg">
                    <div className="flex justify-between text-slate-300">
                      <span>{t.subtotal}</span>
                      <span>{formatCurrency(calculations.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>{t.vat}</span>
                      <span>{formatCurrency(calculations.taxAmount)}</span>
                    </div>
                    {formData.discountAmount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>{t.discount}</span>
                        <span>-{formatCurrency(formData.discountAmount)}</span>
                      </div>
                    )}
                    <Separator className="bg-slate-600" />
                    <div className="flex justify-between text-white font-bold text-lg">
                      <span>{t.grandTotal}</span>
                      <span className="text-cyan-400">{formatCurrency(calculations.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                {/* Notes & Terms */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.notes}</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      rows={3}
                      placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">
                      {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
                    </Label>
                    <Textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      rows={3}
                      placeholder={language === 'ar' ? 'شروط الدفع...' : 'Payment terms...'}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowAddDialog(false);
                    resetForm();
                  }} 
                  className="text-slate-400"
                >
                  {t.cancel}
                </Button>
                <Button 
                  onClick={handleCreateInvoice} 
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={createInvoice.isPending}
                >
                  {createInvoice.isPending ? t.loading : t.save}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">{t.loading}</div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-red-400">
          <AlertCircle className="w-12 h-12 mb-3 opacity-70" />
          <p className="text-lg">{language === 'ar' ? 'فشل تحميل الفواتير' : 'Failed to load invoices'}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <FileText className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">{t.noData}</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 me-2" />
            {t.newInvoice}
          </Button>
        </div>
      ) : (
        <Card className="bg-slate-900/50 border-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-slate-400">{t.invoiceNumber}</TableHead>
                <TableHead className="text-slate-400">{t.clientName}</TableHead>
                <TableHead className="text-slate-400">{t.project}</TableHead>
                <TableHead className="text-slate-400">{t.issueDate}</TableHead>
                <TableHead className="text-slate-400">{t.dueDate}</TableHead>
                <TableHead className="text-slate-400">{t.total}</TableHead>
                <TableHead className="text-slate-400">{t.amountPaid}</TableHead>
                <TableHead className="text-slate-400">{t.status}</TableHead>
                <TableHead className="text-slate-400">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice: any) => (
                <TableRow key={invoice.id} className="border-slate-700 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-white">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {invoice.client?.name || '-'}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {invoice.project?.name || '-'}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {formatDate(invoice.issueDate)}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {formatDate(invoice.dueDate)}
                  </TableCell>
                  <TableCell className="text-cyan-400 font-medium">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                  <TableCell className="text-green-400">
                    {formatCurrency(invoice.paidAmount || 0)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invoice.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        aria-label="View invoice"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Edit invoice" className="h-8 w-8 text-slate-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        aria-label="Download invoice"
                        className="h-8 w-8 text-slate-400 hover:text-cyan-400"
                        onClick={() => {
                          downloadInvoicePDF({
                            invoiceNumber: invoice.invoiceNumber,
                            clientName: invoice.client?.name || 'Client',
                            clientEmail: invoice.client?.email,
                            clientPhone: invoice.client?.phone,
                            clientAddress: invoice.client?.address,
                            projectName: invoice.project?.name,
                            issueDate: invoice.issueDate,
                            dueDate: invoice.dueDate,
                            items: invoice.items || [],
                            subtotal: invoice.subtotal || 0,
                            taxRate: invoice.taxRate || 5,
                            taxAmount: invoice.taxAmount || 0,
                            discountAmount: invoice.discountAmount || 0,
                            total: invoice.total || 0,
                            notes: invoice.notes,
                            terms: invoice.terms,
                            status: invoice.status,
                            paidAmount: invoice.paidAmount || 0,
                          }, undefined, language);
                          toast({
                            title: language === 'ar' ? 'تم التحميل' : 'Downloaded',
                            description: language === 'ar' ? 'تم تحميل الفاتورة بنجاح' : 'Invoice downloaded successfully'
                          });
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        aria-label="Delete invoice"
                        className="h-8 w-8 text-slate-400 hover:text-red-400"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* View Invoice Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              {selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {language === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 py-4">
              {/* Invoice Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-400 text-xs">{t.clientName}</Label>
                    <p className="text-white font-medium">{selectedInvoice.client?.name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">{t.project}</Label>
                    <p className="text-white">{selectedInvoice.project?.name || '-'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <Label className="text-slate-400 text-xs">{t.issueDate}</Label>
                      <p className="text-white">{formatDate(selectedInvoice.issueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <Label className="text-slate-400 text-xs">{t.dueDate}</Label>
                      <p className="text-white">{formatDate(selectedInvoice.dueDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {/* Invoice Items */}
              <div>
                <Label className="text-slate-300 text-sm mb-3 block">
                  {language === 'ar' ? 'بنود الفاتورة' : 'Invoice Items'}
                </Label>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-400">{language === 'ar' ? 'الوصف' : 'Description'}</TableHead>
                        <TableHead className="text-slate-400 text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                        <TableHead className="text-slate-400 text-end">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                        <TableHead className="text-slate-400 text-end">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items?.map((item: any, index: number) => (
                        <TableRow key={item.id || index} className="border-slate-700">
                          <TableCell className="text-slate-300">{item.description}</TableCell>
                          <TableCell className="text-slate-300 text-center">
                            {item.quantity} {item.unit || ''}
                          </TableCell>
                          <TableCell className="text-slate-300 text-end">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-cyan-400 text-end">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>{t.subtotal}</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{t.vat}</span>
                  <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>{t.discount}</span>
                    <span>-{formatCurrency(selectedInvoice.discountAmount)}</span>
                  </div>
                )}
                <Separator className="bg-slate-600" />
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>{t.grandTotal}</span>
                  <span className="text-cyan-400">{formatCurrency(selectedInvoice.total)}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>{t.amountPaid}</span>
                  <span>{formatCurrency(selectedInvoice.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-amber-400 font-medium">
                  <span>{t.amountDue}</span>
                  <span>{formatCurrency((selectedInvoice.total || 0) - (selectedInvoice.paidAmount || 0))}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.status}</span>
                {getStatusBadge(selectedInvoice.status)}
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <Label className="text-slate-400 text-xs">{t.notes}</Label>
                  <p className="text-slate-300 mt-1">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Terms */}
              {selectedInvoice.terms && (
                <div>
                  <Label className="text-slate-400 text-xs">
                    {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
                  </Label>
                  <p className="text-slate-300 mt-1 text-sm">{selectedInvoice.terms}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowViewDialog(false)} 
              className="text-slate-400"
            >
              {t.close}
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (selectedInvoice) {
                  downloadInvoicePDF({
                    invoiceNumber: selectedInvoice.invoiceNumber,
                    clientName: selectedInvoice.client?.name || 'Client',
                    clientEmail: selectedInvoice.client?.email,
                    clientPhone: selectedInvoice.client?.phone,
                    clientAddress: selectedInvoice.client?.address,
                    projectName: selectedInvoice.project?.name,
                    issueDate: selectedInvoice.issueDate,
                    dueDate: selectedInvoice.dueDate,
                    items: selectedInvoice.items || [],
                    subtotal: selectedInvoice.subtotal || 0,
                    taxRate: selectedInvoice.taxRate || 5,
                    taxAmount: selectedInvoice.taxAmount || 0,
                    discountAmount: selectedInvoice.discountAmount || 0,
                    total: selectedInvoice.total || 0,
                    notes: selectedInvoice.notes,
                    terms: selectedInvoice.terms,
                    status: selectedInvoice.status,
                    paidAmount: selectedInvoice.paidAmount || 0,
                  }, undefined, language);
                }
              }}
            >
              <Download className="w-4 h-4 me-2" />
              {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
