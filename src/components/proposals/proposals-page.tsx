'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useProposals, useClients, useProjects, useCreateProposal } from '@/hooks/use-data';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Plus, Search, Eye, Edit, Trash2, Send,
  DollarSign, Users, Clock, CheckCircle
} from 'lucide-react';

const PROPOSAL_STATUSES = [
  { value: 'draft', label: 'مسودة', labelEn: 'Draft', color: 'bg-slate-500' },
  { value: 'sent', label: 'مُرسل', labelEn: 'Sent', color: 'bg-blue-500' },
  { value: 'accepted', label: 'مقبول', labelEn: 'Accepted', color: 'bg-green-500' },
  { value: 'rejected', label: 'مرفوض', labelEn: 'Rejected', color: 'bg-red-500' },
  { value: 'expired', label: 'منتهي', labelEn: 'Expired', color: 'bg-orange-500' },
];

export function ProposalsPage() {
  const { language } = useApp();
  const { t, formatCurrency, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { data: proposalsData, isLoading } = useProposals();
  const { data: clientsData } = useClients();
  const { data: projectsData } = useProjects();
  const createProposal = useCreateProposal();
  
  const proposals = proposalsData?.data || [];
  const clients = clientsData?.data || [];
  const projects = projectsData?.data || [];
  
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    projectId: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, unit: '' }],
    validUntil: '',
    notes: '',
    terms: '',
  });

  const filteredProposals = proposals.filter((proposal: any) => {
    const matchesSearch = proposal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          proposal.proposalNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: proposals.length,
    draft: proposals.filter((p: any) => p.status === 'draft').length,
    sent: proposals.filter((p: any) => p.status === 'sent').length,
    accepted: proposals.filter((p: any) => p.status === 'accepted').length,
    totalValue: proposals.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0)
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = PROPOSAL_STATUSES.find(s => s.value === status) || PROPOSAL_STATUSES[0];
    return (
      <Badge variant="secondary" className={`${statusConfig.color} text-foreground`}>
        {language === 'ar' ? statusConfig.label : statusConfig.labelEn}
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

  const handleCreateProposal = async () => {
    if (!formData.title || !formData.clientId) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'العنوان والعميل مطلوبان' : 'Title and client are required',
        variant: 'destructive'
      });
      return;
    }
    
    const subtotal = calculateTotal();
    const taxAmount = subtotal * 0.05;
    const totalAmount = subtotal + taxAmount;
    
    await createProposal.mutateAsync({
      title: formData.title,
      clientId: formData.clientId,
      projectId: formData.projectId,
      items: formData.items,
      subtotal,
      taxRate: 5,
      taxAmount,
      totalAmount,
      validUntil: formData.validUntil,
      notes: formData.notes,
      terms: formData.terms,
    });
    
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم إنشاء العرض بنجاح' : 'Proposal created successfully'
    });
    setShowAddDialog(false);
    setFormData({
      title: '',
      clientId: '',
      projectId: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, unit: '' }],
      validUntil: '',
      notes: '',
      terms: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي العروض' : 'Total'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-500/20">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مسودات' : 'Drafts'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Send className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.sent}</p>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مرسلة' : 'Sent'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.accepted}</p>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مقبولة' : 'Accepted'}</p>
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
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي القيمة' : 'Total Value'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
              {PROPOSAL_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {language === 'ar' ? status.label : status.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-foreground">
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'عرض جديد' : 'New Proposal'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'عرض سعر جديد' : 'New Proposal'}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {language === 'ar' ? 'أدخل بيانات العرض' : 'Enter proposal details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">{language === 'ar' ? 'عنوان العرض' : 'Title'} *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.clientName} *</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder={language === 'ar' ? 'اختر العميل' : 'Select client'} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.project}</Label>
                  <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder={language === 'ar' ? 'اختر المشروع' : 'Select project'} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</Label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
              </div>
              
              {/* Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground/80">{language === 'ar' ? 'بنود العرض' : 'Items'}</Label>
                  <Button variant="outline" size="sm" onClick={handleAddItem} className="border-border">
                    <Plus className="w-4 h-4 me-1" />
                    {language === 'ar' ? 'إضافة بند' : 'Add Item'}
                  </Button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/50 rounded-lg">
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="bg-secondary/50 border-border text-foreground h-9"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'الكمية' : 'Qty'}</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="bg-secondary/50 border-border text-foreground h-9"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'السعر' : 'Price'}</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="bg-secondary/50 border-border text-foreground h-9"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'الإجمالي' : 'Total'}</Label>
                      <div className="h-9 px-3 flex items-center bg-secondary/30 rounded-md text-cyan-400">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-1 h-9 w-9 text-red-400 hover:text-red-300"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{language === 'ar' ? 'المجموع' : 'Subtotal'}</span>
                      <span className="text-foreground">{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{language === 'ar' ? 'الضريبة (5%)' : 'VAT (5%)'}</span>
                      <span className="text-foreground">{formatCurrency(calculateTotal() * 0.05)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-foreground">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                      <span className="text-cyan-400">{formatCurrency(calculateTotal() * 1.05)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground/80">{t.notes}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="text-muted-foreground">
                {t.cancel}
              </Button>
              <Button onClick={handleCreateProposal} className="bg-blue-600 hover:bg-blue-700">
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Proposals Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t.loading}</div>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileText className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">{t.noData}</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 me-2" />
            {language === 'ar' ? 'عرض جديد' : 'New Proposal'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProposals.map((proposal: any) => (
            <Card key={proposal.id} className="bg-card border-border hover:border-border transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-muted-foreground border-border">
                        {proposal.proposalNumber}
                      </Badge>
                      {getStatusBadge(proposal.status)}
                    </div>
                    <CardTitle className="text-lg text-foreground line-clamp-1">{proposal.title || t.project}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {proposal.client && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="line-clamp-1">{proposal.client}</span>
                  </div>
                )}
                
                {proposal.totalAmount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-medium">{formatCurrency(proposal.totalAmount)}</span>
                  </div>
                )}
                
                {proposal.validUntil && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{language === 'ar' ? 'صالح حتى' : 'Valid until'}: {formatDate(proposal.validUntil)}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{formatDate(proposal.createdAt)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300">
                      <Send className="w-4 h-4" />
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
