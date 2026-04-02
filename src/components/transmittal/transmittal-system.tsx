'use client';

/**
 * Transmittal System Component
 * نظام إرسال المستندات
 */

import { useState, useEffect } from 'react';
import { 
  Send, Plus, Trash2, FileText, 
  CheckCircle, AlertTriangle,
   XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Types
interface TransmittalItem {
  id: string;
  transmittalId: string;
  documentNumber: string;
  documentTitle: string;
  revision: string;
  copies: number;
  documentType?: string;
  status: string;
  notes?: string;
}

interface TransmittalResponse {
  id: string;
  transmittalId: string;
  responseDate: Date;
  responseType: string;
  respondentName: string;
  respondentEmail?: string;
  comments?: string;
}

interface Transmittal {
  id: string;
  projectId?: string;
  transmittalNumber: string;
  subject: string;
  description?: string;
  senderId?: string;
  recipientName: string;
  recipientEmail?: string;
  recipientCompany?: string;
  recipientPhone?: string;
  sendDate: Date;
  dueDate?: Date | null;
  status: 'draft' | 'sent' | 'acknowledged' | 'rejected' | 'overdue';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deliveryMethod: 'email' | 'hand' | 'courier' | 'post';
  trackingNumber?: string;
  acknowledgedDate?: Date | null;
  acknowledgedBy?: string;
  notes?: string;
  items?: TransmittalItem[];
  responses?: TransmittalResponse[];
}

interface TransmittalSystemProps {
  projectId?: string;
  lang?: 'ar' | 'en';
  onTransmittalUpdate?: (transmittal: Transmittal) => void;
  onTransmittalCreate?: (transmittal: Partial<Transmittal>) => void;
  onTransmittalDelete?: (transmittalId: string) => void;
}

// Constants
const TRANSMITTAL_STATUS: Record<string, { en: string; ar: string; color: string; icon: React.ReactNode }> = {
  draft: { en: 'Draft', ar: 'مسودة', color: 'bg-slate-500', icon: <FileText className="w-4 h-4" /> },
  sent: { en: 'Sent', ar: 'مرسل', color: 'bg-blue-500', icon: <Send className="w-4 h-4" /> },
  acknowledged: { en: 'Acknowledged', ar: 'مستلم', color: 'bg-green-500', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { en: 'Rejected', ar: 'مرفوض', color: 'bg-red-500', icon: <XCircle className="w-4 h-4" /> },
  overdue: { en: 'Overdue', ar: 'متأخر', color: 'bg-amber-500', icon: <AlertTriangle className="w-4 h-4" /> },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  normal: '#3b82f6',
  high: '#f59e0b',
  urgent: '#dc2626',
};

const DELIVERY_METHODS: Record<string, { en: string; ar: string }> = {
  email: { en: 'Email', ar: 'بريد إلكتروني' },
  hand: { en: 'Hand Delivery', ar: 'تسليم يدوي' },
  courier: { en: 'Courier', ar: 'بريد سريع' },
  post: { en: 'Post', ar: 'بريد عادي' },
};

const DOCUMENT_TYPES: Record<string, { en: string; ar: string }> = {
  drawing: { en: 'Drawing', ar: 'رسم' },
  specification: { en: 'Specification', ar: 'موصفات' },
  report: { en: 'Report', ar: 'تقرير' },
  calculation: { en: 'Calculation', ar: 'حسابات' },
  correspondence: { en: 'Correspondence', ar: 'مراسلات' },
  certificate: { en: 'Certificate', ar: 'شهادة' },
  other: { en: 'Other', ar: 'أخرى' },
};

const ITEM_STATUS: Record<string, { en: string; ar: string }> = {
  for_review: { en: 'For Review', ar: 'للمراجعة' },
  for_approval: { en: 'For Approval', ar: 'للاعتماد' },
  for_information: { en: 'For Information', ar: 'للاطلاع' },
  for_action: { en: 'For Action', ar: 'للتنفيذ' },
};

// Generate transmittal number
function generateTransmittalNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TR-${year}${month}-${random}`;
}

export function TransmittalSystem({
  projectId,
  lang = 'ar',
  onTransmittalUpdate,
  onTransmittalCreate,
  onTransmittalDelete,
}: TransmittalSystemProps) {
  const [transmittals, setTransmittals] = useState<Transmittal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransmittal, setSelectedTransmittal] = useState<Transmittal | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const _isRTL = lang === 'ar';

  // Fetch transmittals
  useEffect(() => {
    async function fetchTransmittals() {
      try {
        const url = projectId 
          ? `/api/transmittals?projectId=${projectId}`
          : '/api/transmittals';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          const parsed = data.data.map((t: any) => ({
            ...t,
            sendDate: new Date(t.sendDate),
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            acknowledgedDate: t.acknowledgedDate ? new Date(t.acknowledgedDate) : null,
          }));
          setTransmittals(parsed);
        }
      } catch (error) {
        console.error('Error fetching transmittals:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransmittals();
  }, [projectId]);

  // Calculate statistics
  const stats = {
    total: transmittals.length,
    draft: transmittals.filter(t => t.status === 'draft').length,
    sent: transmittals.filter(t => t.status === 'sent').length,
    acknowledged: transmittals.filter(t => t.status === 'acknowledged').length,
    overdue: transmittals.filter(t => t.status === 'overdue').length,
  };

  // Filter transmittals
  const filteredTransmittals = filterStatus === 'all' 
    ? transmittals 
    : transmittals.filter(t => t.status === filterStatus);

  // Handle create transmittal
  const handleCreateTransmittal = async (transmittal: Partial<Transmittal>) => {
    try {
      const response = await fetch('/api/transmittals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transmittal),
      });

      if (response.ok) {
        const data = await response.json();
        setTransmittals(prev => [...prev, data.data]);
        onTransmittalCreate?.(transmittal);
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating transmittal:', error);
    }
  };

  // Handle delete transmittal
  const handleDeleteTransmittal = async (transmittalId: string) => {
    try {
      const response = await fetch(`/api/transmittals?id=${transmittalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTransmittals(prev => prev.filter(t => t.id !== transmittalId));
        onTransmittalDelete?.(transmittalId);
        setIsViewDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting transmittal:', error);
    }
  };

  // Handle send transmittal
  const handleSendTransmittal = async (transmittal: Transmittal) => {
    try {
      const response = await fetch('/api/transmittals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...transmittal, status: 'sent' }),
      });

      if (response.ok) {
        setTransmittals(prev => prev.map(t => 
          t.id === transmittal.id ? { ...t, status: 'sent' } : t
        ));
        onTransmittalUpdate?.({ ...transmittal, status: 'sent' });
      }
    } catch (error) {
      console.error('Error sending transmittal:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${_isRTL ? 'rtl' : 'ltr'}`} dir={_isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Send className="w-8 h-8 text-blue-500" />
            {lang === 'ar' ? 'نظام الإرسال' : 'Transmittal System'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === 'ar' 
              ? 'إدارة إرسال واستلام المستندات' 
              : 'Manage document transmittals'}
          </p>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {lang === 'ar' ? 'إرسال جديد' : 'New Transmittal'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'إجمالي' : 'Total'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-muted-foreground">{stats.draft}</p>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'مسودات' : 'Drafts'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">{stats.sent}</p>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'مرسلة' : 'Sent'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{stats.acknowledged}</p>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'مستلمة' : 'Acknowledged'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">{stats.overdue}</p>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'متأخرة' : 'Overdue'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-muted border-border">
            <SelectValue placeholder={lang === 'ar' ? 'الحالة' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'ar' ? 'الكل' : 'All'}</SelectItem>
            {Object.entries(TRANSMITTAL_STATUS).map(([key, value]) => (
              <SelectItem key={key} value={key}>{value[lang]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transmittals Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted">
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'رقم الإرسال' : 'Number'}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'الموضوع' : 'Subject'}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'المستلم' : 'Recipient'}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'تاريخ الإرسال' : 'Send Date'}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'الأولوية' : 'Priority'}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'الحالة' : 'Status'}
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  {lang === 'ar' ? 'إجراءات' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransmittals.map((transmittal) => (
                <TableRow 
                  key={transmittal.id} 
                  className="border-border hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setSelectedTransmittal(transmittal);
                    setIsViewDialogOpen(true);
                  }}
                >
                  <TableCell className="text-blue-400 font-mono">
                    {transmittal.transmittalNumber}
                  </TableCell>
                  <TableCell>
                    <p className="text-foreground font-medium">{transmittal.subject}</p>
                    {transmittal.items && transmittal.items.length > 0 && (
                      <p className="text-muted-foreground text-sm">
                        {transmittal.items.length} {lang === 'ar' ? 'مستندات' : 'documents'}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-foreground">{transmittal.recipientName}</p>
                    {transmittal.recipientCompany && (
                      <p className="text-muted-foreground text-sm">{transmittal.recipientCompany}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground/80">
                    {transmittal.sendDate.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      style={{ 
                        backgroundColor: PRIORITY_COLORS[transmittal.priority] + '20',
                        color: PRIORITY_COLORS[transmittal.priority]
                      }}
                    >
                      {transmittal.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={TRANSMITTAL_STATUS[transmittal.status]?.color + ' text-foreground'}>
                      {TRANSMITTAL_STATUS[transmittal.status]?.[lang]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {transmittal.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendTransmittal(transmittal);
                          }}
                        >
                          <Send className="w-4 h-4 text-green-400" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTransmittal(transmittal.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Transmittal Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTransmittal?.transmittalNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTransmittal && (
            <TransmittalDetails
              transmittal={selectedTransmittal}
              lang={lang}
              onClose={() => setIsViewDialogOpen(false)}
              onDelete={() => handleDeleteTransmittal(selectedTransmittal.id)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Transmittal Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {lang === 'ar' ? 'إنشاء إرسال جديد' : 'Create New Transmittal'}
            </DialogTitle>
          </DialogHeader>
          
          <TransmittalForm
            lang={lang}
            projectId={projectId}
            onSubmit={handleCreateTransmittal}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Transmittal Details Component
function TransmittalDetails({
  transmittal,
  lang,
  onClose,
  onDelete,
}: {
  transmittal: Transmittal;
  lang: 'ar' | 'en';
  onClose: () => void;
  onDelete: () => void;
}) {
  const _isRTL = lang === 'ar';

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">{lang === 'ar' ? 'الموضوع' : 'Subject'}</Label>
          <p className="text-foreground">{transmittal.subject}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">{lang === 'ar' ? 'تاريخ الإرسال' : 'Send Date'}</Label>
          <p className="text-foreground">
            {transmittal.sendDate.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
          </p>
        </div>
        <div>
          <Label className="text-muted-foreground">{lang === 'ar' ? 'المستلم' : 'Recipient'}</Label>
          <p className="text-foreground">{transmittal.recipientName}</p>
          {transmittal.recipientCompany && (
            <p className="text-muted-foreground text-sm">{transmittal.recipientCompany}</p>
          )}
        </div>
        <div>
          <Label className="text-muted-foreground">{lang === 'ar' ? 'طريقة التسليم' : 'Delivery Method'}</Label>
          <p className="text-foreground">{DELIVERY_METHODS[transmittal.deliveryMethod]?.[lang]}</p>
        </div>
        {transmittal.description && (
          <div className="col-span-2">
            <Label className="text-muted-foreground">{lang === 'ar' ? 'الوصف' : 'Description'}</Label>
            <p className="text-foreground">{transmittal.description}</p>
          </div>
        )}
      </div>

      {/* Items */}
      {transmittal.items && transmittal.items.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {lang === 'ar' ? 'المستندات المرفقة' : 'Attached Documents'}
          </h3>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'رقم المستند' : 'Doc No.'}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'العنوان' : 'Title'}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'المراجعة' : 'Rev'}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'النسخ' : 'Copies'}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'النوع' : 'Type'}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {lang === 'ar' ? 'الغرض' : 'Purpose'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transmittal.items.map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="text-blue-400 font-mono">{item.documentNumber}</TableCell>
                  <TableCell className="text-foreground">{item.documentTitle}</TableCell>
                  <TableCell className="text-foreground">{item.revision}</TableCell>
                  <TableCell className="text-foreground">{item.copies}</TableCell>
                  <TableCell className="text-foreground/80">
                    {item.documentType ? DOCUMENT_TYPES[item.documentType]?.[lang] : '-'}
                  </TableCell>
                  <TableCell className="text-foreground/80">
                    {ITEM_STATUS[item.status]?.[lang]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          {lang === 'ar' ? 'حذف' : 'Delete'}
        </Button>
        <Button variant="outline" onClick={onClose}>
          {lang === 'ar' ? 'إغلاق' : 'Close'}
        </Button>
      </div>
    </div>
  );
}

// Transmittal Form Component
function TransmittalForm({
  lang,
  projectId,
  onSubmit,
  onCancel,
}: {
  lang: 'ar' | 'en';
  projectId?: string;
  onSubmit: (transmittal: Partial<Transmittal>) => void;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientCompany, setRecipientCompany] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'hand' | 'courier' | 'post'>('email');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [items, setItems] = useState<Omit<TransmittalItem, 'id' | 'transmittalId'>[]>([]);
  const [newItem, setNewItem] = useState({
    documentNumber: '',
    documentTitle: '',
    revision: 'A',
    copies: 1,
    documentType: 'drawing',
    status: 'for_review',
    notes: '',
  });

  const addItem = () => {
    if (newItem.documentNumber && newItem.documentTitle) {
      setItems(prev => [...prev, { ...newItem }]);
      setNewItem({
        documentNumber: '',
        documentTitle: '',
        revision: 'A',
        copies: 1,
        documentType: 'drawing',
        status: 'for_review',
        notes: '',
      });
    }
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit({
      transmittalNumber: generateTransmittalNumber(),
      subject,
      description,
      recipientName,
      recipientEmail,
      recipientCompany,
      priority,
      deliveryMethod,
      trackingNumber: trackingNumber || undefined,
      projectId,
      status: 'draft',
      items: items as any[],
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>{lang === 'ar' ? 'الموضوع' : 'Subject'} *</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={lang === 'ar' ? 'موضوع الإرسال' : 'Transmittal subject'}
          />
        </div>
        <div>
          <Label>{lang === 'ar' ? 'اسم المستلم' : 'Recipient Name'} *</Label>
          <Input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder={lang === 'ar' ? 'اسم المستلم' : 'Recipient name'}
          />
        </div>
        <div>
          <Label>{lang === 'ar' ? 'الشركة' : 'Company'}</Label>
          <Input
            value={recipientCompany}
            onChange={(e) => setRecipientCompany(e.target.value)}
            placeholder={lang === 'ar' ? 'اسم الشركة' : 'Company name'}
          />
        </div>
        <div>
          <Label>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
          <Input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div>
          <Label>{lang === 'ar' ? 'طريقة التسليم' : 'Delivery Method'}</Label>
          <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DELIVERY_METHODS).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value[lang]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{lang === 'ar' ? 'الأولوية' : 'Priority'}</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{lang === 'ar' ? 'منخفضة' : 'Low'}</SelectItem>
              <SelectItem value="normal">{lang === 'ar' ? 'عادية' : 'Normal'}</SelectItem>
              <SelectItem value="high">{lang === 'ar' ? 'عالية' : 'High'}</SelectItem>
              <SelectItem value="urgent">{lang === 'ar' ? 'عاجلة' : 'Urgent'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {deliveryMethod === 'courier' && (
          <div>
            <Label>{lang === 'ar' ? 'رقم التتبع' : 'Tracking Number'}</Label>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="TRK-XXXX"
            />
          </div>
        )}
        <div className="col-span-2">
          <Label>{lang === 'ar' ? 'الوصف' : 'Description'}</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={lang === 'ar' ? 'وصف الإرسال' : 'Transmittal description'}
            rows={2}
          />
        </div>
      </div>

      {/* Documents */}
      <div>
        <Label className="text-lg font-semibold text-foreground">
          {lang === 'ar' ? 'المستندات' : 'Documents'}
        </Label>
        
        {/* Add Item Form */}
        <div className="grid grid-cols-6 gap-2 mt-2 p-4 bg-muted rounded-lg">
          <Input
            placeholder={lang === 'ar' ? 'رقم المستند' : 'Doc No.'}
            value={newItem.documentNumber}
            onChange={(e) => setNewItem(prev => ({ ...prev, documentNumber: e.target.value }))}
          />
          <Input
            className="col-span-2"
            placeholder={lang === 'ar' ? 'عنوان المستند' : 'Document Title'}
            value={newItem.documentTitle}
            onChange={(e) => setNewItem(prev => ({ ...prev, documentTitle: e.target.value }))}
          />
          <Input
            placeholder="Rev"
            value={newItem.revision}
            onChange={(e) => setNewItem(prev => ({ ...prev, revision: e.target.value }))}
          />
          <Input
            type="number"
            placeholder={lang === 'ar' ? 'نسخ' : 'Copies'}
            value={newItem.copies}
            onChange={(e) => setNewItem(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
          />
          <Button onClick={addItem} variant="secondary">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="mt-4 space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-blue-400 font-mono">{item.documentNumber}</span>
                <span className="text-foreground flex-1">{item.documentTitle}</span>
                <span className="text-muted-foreground">Rev {item.revision}</span>
                <span className="text-muted-foreground">{item.copies}x</span>
                <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button onClick={handleSubmit} disabled={!subject || !recipientName}>
          {lang === 'ar' ? 'إنشاء' : 'Create'}
        </Button>
      </div>
    </div>
  );
}

export default TransmittalSystem;
