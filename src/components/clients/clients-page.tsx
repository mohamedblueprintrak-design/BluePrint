'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useClients, useCreateClient, useDeleteClient } from '@/hooks/use-data';
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
  Users, Plus, Search, Building2, User, Landmark, Mail, Phone, 
  MapPin, Eye, Edit, Trash2, CreditCard, FileText
} from 'lucide-react';

const CLIENT_TYPES = [
  { value: 'company', label: 'شركة', labelEn: 'Company', icon: Building2, color: 'bg-blue-500' },
  { value: 'individual', label: 'فرد', labelEn: 'Individual', icon: User, color: 'bg-green-500' },
  { value: 'government', label: 'حكومي', labelEn: 'Government', icon: Landmark, color: 'bg-purple-500' },
];

export function ClientsPage() {
  const { language } = useApp();
  const { t, formatCurrency, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { data: clientsData, isLoading, refetch } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();
  
  const clients = clientsData?.data || [];
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    taxNumber: '',
    clientType: 'company',
    creditLimit: '',
    notes: ''
  });

  // Filter clients
  const filteredClients = clients.filter((client: any) => {
    const matchesSearch = client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || client.clientType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Stats
  const stats = {
    total: clients.length,
    active: clients.filter((c: any) => c.status === 'active' || !c.status).length,
    companies: clients.filter((c: any) => c.clientType === 'company').length,
    individuals: clients.filter((c: any) => c.clientType === 'individual').length,
    government: clients.filter((c: any) => c.clientType === 'government').length,
    totalInvoiced: clients.reduce((sum: number, c: any) => sum + (c.totalInvoiced || 0), 0),
    totalPaid: clients.reduce((sum: number, c: any) => sum + (c.totalPaid || 0), 0)
  };

  const handleCreateClient = async () => {
    if (!formData.name) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'اسم العميل مطلوب' : 'Client name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createClient.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        contactPerson: formData.contactPerson,
        taxNumber: formData.taxNumber,
        clientType: formData.clientType as 'company' | 'individual' | 'government',
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0,
        notes: formData.notes
      });
      
      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم إنشاء العميل بنجاح' : 'Client created successfully'
      });
      
      setShowAddDialog(false);
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        address: '', 
        contactPerson: '', 
        taxNumber: '', 
        clientType: 'company', 
        creditLimit: '', 
        notes: '' 
      });
      refetch();
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء العميل' : 'Failed to create client',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    
    try {
      await deleteClient.mutateAsync(id);
      toast({
        title: t.successDelete,
        description: language === 'ar' ? 'تم حذف العميل بنجاح' : 'Client deleted successfully'
      });
      refetch();
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء حذف العميل' : 'Failed to delete client',
        variant: 'destructive'
      });
    }
  };

  const getClientTypeBadge = (type: string) => {
    const typeConfig = CLIENT_TYPES.find(t => t.value === type) || CLIENT_TYPES[0];
    const Icon = typeConfig.icon;
    return (
      <Badge variant="secondary" className={`${typeConfig.color} text-foreground gap-1`}>
        <Icon className="w-3 h-3" />
        {language === 'ar' ? typeConfig.label : typeConfig.labelEn}
      </Badge>
    );
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      address: '', 
      contactPerson: '', 
      taxNumber: '', 
      clientType: 'company', 
      creditLimit: '', 
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
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{t.clients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Users className="w-5 h-5 text-green-400" />
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
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.companies}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'شركات' : 'Companies'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.individuals}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'أفراد' : 'Individuals'}
                </p>
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
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] bg-muted border-border text-foreground">
              <SelectValue placeholder={t.clientType} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">{t.all}</SelectItem>
              {CLIENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {language === 'ar' ? type.label : type.labelEn}
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
              {t.newClient}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.newClient}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {language === 'ar' ? 'أدخل بيانات العميل الجديد' : 'Enter the new client details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-foreground/80">{t.name} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  placeholder={language === 'ar' ? 'أدخل اسم العميل' : 'Enter client name'}
                />
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.clientType}</Label>
                  <Select value={formData.clientType} onValueChange={(v) => setFormData({ ...formData, clientType: v })}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder={t.clientType} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {CLIENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === 'ar' ? type.label : type.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button onClick={handleCreateClient} className="bg-blue-600 hover:bg-blue-700" disabled={createClient.isPending}>
                {createClient.isPending ? t.loading : t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t.loading}</div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">{t.noData}</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 me-2" />
            {t.newClient}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client: any) => (
            <Card 
              key={client.id} 
              className="bg-card border-border hover:border-border transition-colors cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getClientTypeBadge(client.clientType)}
                    </div>
                    <CardTitle className="text-lg text-foreground line-clamp-1">{client.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{client.email}</span>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{client.phone}</span>
                  </div>
                )}
                
                {client.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{client.address}</span>
                  </div>
                )}
                
                {client.contactPerson && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{client.contactPerson}</span>
                  </div>
                )}
                
                <Separator className="bg-muted" />
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      <span>{language === 'ar' ? 'إجمالي الفواتير' : 'Total Invoiced'}</span>
                    </div>
                    <p className="text-cyan-400 font-medium">
                      {formatCurrency(client.totalInvoiced || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CreditCard className="w-3 h-3" />
                      <span>{language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}</span>
                    </div>
                    <p className="text-green-400 font-medium">
                      {formatCurrency(client.totalPaid || 0)}
                    </p>
                  </div>
                </div>
                
                <Separator className="bg-muted" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(client.createdAt)}
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
                        handleDeleteClient(client.id);
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
