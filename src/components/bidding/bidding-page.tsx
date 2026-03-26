'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { Bid, BidType, BidStatus } from '@/types';

// Status labels in Arabic
const statusLabels: Record<BidStatus, string> = {
  open: 'مفتوحة',
  submitted: 'تم التقديم',
  won: 'فازت',
  lost: 'خسرت',
  cancelled: 'ملغاة',
};

// Type labels in Arabic
const typeLabels: Record<BidType, string> = {
  tender: 'مناقصة',
  rfp: 'طلب عرض',
  rfq: 'طلب تسعير',
  rfi: 'طلب معلومات',
};

// Status badge variants
const statusVariants: Record<BidStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'secondary',
  submitted: 'default',
  won: 'default',
  lost: 'destructive',
  cancelled: 'outline',
};

// Status colors for icons
const statusColors: Record<BidStatus, string> = {
  open: 'text-blue-600 bg-blue-100',
  submitted: 'text-yellow-600 bg-yellow-100',
  won: 'text-green-600 bg-green-100',
  lost: 'text-red-600 bg-red-100',
  cancelled: 'text-gray-600 bg-gray-100',
};

export default function BiddingPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    reference: '',
    clientId: '',
    bidType: 'tender' as BidType,
    deadline: '',
    estimatedValue: 0,
    location: '',
    scope: '',
    requirements: '',
  });

  // Fetch bids data
  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const response = await fetch('/api/bidding');
      if (response.ok) {
        const data = await response.json();
        setBids(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter bids
  const filteredBids = bids.filter((bid) => {
    const matchesStatus = filterStatus === 'all' || bid.status === filterStatus;
    const matchesType = filterType === 'all' || bid.bidType === filterType;
    const matchesSearch =
      bid.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bid.client?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      bid.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  // Stats calculations
  const openBids = bids.filter((b) => b.status === 'open').length;
  const submittedBids = bids.filter((b) => b.status === 'submitted').length;
  const wonBids = bids.filter((b) => b.status === 'won').length;
  const lostBids = bids.filter((b) => b.status === 'lost').length;
  const winRate = submittedBids > 0 ? ((wonBids / (wonBids + lostBids)) * 100).toFixed(0) : 0;

  // Open modal for create
  const handleOpenModal = () => {
    setFormData({
      title: '',
      reference: '',
      clientId: '',
      bidType: 'tender',
      deadline: '',
      estimatedValue: 0,
      location: '',
      scope: '',
      requirements: '',
    });
    setIsModalOpen(true);
  };

  // View bid details
  const handleViewDetails = (bid: Bid) => {
    setSelectedBid(bid);
    setIsDetailOpen(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/bidding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deadline: new Date(formData.deadline).toISOString(),
          requirements: formData.requirements.split('\n').filter((r) => r.trim()),
        }),
      });

      if (response.ok) {
        toast({
          title: 'تم إضافة المناقصة',
          description: 'تم إضافة المناقصة الجديدة بنجاح',
        });
        fetchBids();
        setIsModalOpen(false);
      } else {
        throw new Error('Failed to save bid');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ البيانات',
        variant: 'destructive',
      });
    }
  };

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: BidStatus) => {
    try {
      const response = await fetch(`/api/bidding/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'تم تحديث الحالة',
          description: 'تم تحديث حالة المناقصة بنجاح',
        });
        fetchBids();
        setIsDetailOpen(false);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الحالة',
        variant: 'destructive',
      });
    }
  };

  // Get type icon
  const getTypeIcon = (type: BidType) => {
    return <FileText className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المناقصات والعروض</h1>
          <p className="text-gray-500 mt-1">إدارة ومتابعة جميع المناقصات والعروض</p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus className="w-4 h-4 ml-2" />
          مناقصة جديدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مناقصات مفتوحة</p>
                <p className="text-2xl font-bold text-blue-600">{openBids}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">تم التقديم</p>
                <p className="text-2xl font-bold text-yellow-600">{submittedBids}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">فازت</p>
                <p className="text-2xl font-bold text-green-600">{wonBids}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">نسبة الفوز</p>
                <p className="text-2xl font-bold text-purple-600">{winRate}%</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في المناقصات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="جميع الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="tender">مناقصة</SelectItem>
                <SelectItem value="rfp">طلب عرض</SelectItem>
                <SelectItem value="rfq">طلب تسعير</SelectItem>
                <SelectItem value="rfi">طلب معلومات</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="open">مفتوحة</SelectItem>
                <SelectItem value="submitted">تم التقديم</SelectItem>
                <SelectItem value="won">فازت</SelectItem>
                <SelectItem value="lost">خسرت</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bids List */}
      <div className="space-y-4">
        {filteredBids.map((bid) => (
          <Card
            key={bid.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewDetails(bid)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      statusColors[bid.status]
                    }`}
                  >
                    {getTypeIcon(bid.bidType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{bid.title}</h3>
                      <Badge variant={statusVariants[bid.status]}>{statusLabels[bid.status]}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{bid.client?.name || 'عميل غير محدد'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{typeLabels[bid.bidType]}</span>
                      <span>•</span>
                      <span>{bid.reference}</span>
                      {bid.location && (
                        <>
                          <span>•</span>
                          <span>{bid.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-left md:text-right">
                    <p className="text-sm text-gray-500">القيمة التقديرية</p>
                    <p className="font-semibold text-gray-900">
                      {((bid.estimatedValue || 0) / 1000000).toFixed(0)}M SAR
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-gray-500">الموعد النهائي</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(bid.deadline).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  {bid.status === 'open' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(bid.id, 'submitted');
                      }}
                    >
                      تقديم العرض
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBids.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد مناقصات</p>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مناقصة جديدة</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="title">عنوان المناقصة</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="أدخل عنوان المناقصة"
              />
            </div>

            <div>
              <Label htmlFor="reference">المرجع</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="رقم المرجع"
              />
            </div>

            <div>
              <Label>النوع</Label>
              <Select
                value={formData.bidType}
                onValueChange={(value) => setFormData({ ...formData, bidType: value as BidType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tender">مناقصة</SelectItem>
                  <SelectItem value="rfp">طلب عرض</SelectItem>
                  <SelectItem value="rfq">طلب تسعير</SelectItem>
                  <SelectItem value="rfi">طلب معلومات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="client">الجهة المالكة</Label>
              <Input
                id="client"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="اسم الجهة المالكة"
              />
            </div>

            <div>
              <Label htmlFor="location">الموقع</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="موقع المشروع"
              />
            </div>

            <div>
              <Label htmlFor="deadline">الموعد النهائي</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="value">القيمة التقديرية (SAR)</Label>
              <Input
                id="value"
                type="number"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                placeholder="القيمة التقديرية للمشروع"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="scope">نطاق العمل</Label>
              <Textarea
                id="scope"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="وصف نطاق العمل المطلوب"
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="requirements">المتطلبات (كل سطر متطلب)</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="متطلب 1&#10;متطلب 2&#10;متطلب 3"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>إضافة المناقصة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          {selectedBid && (
            <>
              <DialogHeader>
                <DialogTitle>تفاصيل المناقصة</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedBid.title}</h3>
                    <p className="text-gray-500">{selectedBid.client?.name || 'عميل غير محدد'}</p>
                  </div>
                  <Badge variant={statusVariants[selectedBid.status]}>
                    {statusLabels[selectedBid.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">المرجع</p>
                    <p className="font-medium">{selectedBid.reference}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">النوع</p>
                    <p className="font-medium">{typeLabels[selectedBid.bidType]}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">القيمة التقديرية</p>
                    <p className="font-medium">
                      {(selectedBid.estimatedValue || 0).toLocaleString()} SAR
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">الموعد النهائي</p>
                    <p className="font-medium">
                      {new Date(selectedBid.deadline).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>

                {selectedBid.scope && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">نطاق العمل</h4>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{selectedBid.scope}</p>
                  </div>
                )}

                {selectedBid.requirements && selectedBid.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">المتطلبات</h4>
                    <ul className="space-y-2">
                      {selectedBid.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedBid.status === 'open' && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedBid.id, 'cancelled')}
                    >
                      إلغاء المناقصة
                    </Button>
                    <Button onClick={() => handleStatusChange(selectedBid.id, 'submitted')}>
                      تقديم العرض
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
