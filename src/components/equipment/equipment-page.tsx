'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Wrench,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import type { Equipment, EquipmentStatus, EquipmentCondition, Project } from '@/types';

// Status labels in Arabic
const statusLabels: Record<EquipmentStatus, string> = {
  available: 'متاحة',
  in_use: 'قيد الاستخدام',
  maintenance: 'صيانة',
  retired: 'متقاعدة',
};

// Condition labels in Arabic
const conditionLabels: Record<EquipmentCondition, string> = {
  excellent: 'ممتاز',
  good: 'جيد',
  fair: 'مقبول',
  poor: 'سيء',
};

// Status badge variants
const statusVariants: Record<EquipmentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  in_use: 'secondary',
  maintenance: 'outline',
  retired: 'destructive',
};

// Condition colors
const conditionColors: Record<EquipmentCondition, string> = {
  excellent: 'text-green-600',
  good: 'text-blue-600',
  fair: 'text-yellow-600',
  poor: 'text-red-600',
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    equipmentType: '',
    model: '',
    serialNumber: '',
    status: 'available' as EquipmentStatus,
    projectId: '',
    location: '',
    condition: 'good' as EquipmentCondition,
    purchaseValue: 0,
    notes: '',
  });

  // Fetch equipment data
  useEffect(() => {
    fetchEquipment();
    fetchProjects();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Filter equipment
  const filteredEquipment = equipment.filter((eq) => {
    const matchesStatus = filterStatus === 'all' || eq.status === filterStatus;
    const matchesType = filterType === 'all' || eq.equipmentType === filterType;
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (eq.serialNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  // Get unique equipment types
  const equipmentTypes = [...new Set(equipment.map((e) => e.equipmentType).filter(Boolean))];

  // Stats calculations
  const totalValue = equipment.reduce((sum, e) => sum + (e.purchaseValue || 0), 0);
  const inUseCount = equipment.filter((e) => e.status === 'in_use').length;
  const maintenanceCount = equipment.filter((e) => e.status === 'maintenance').length;

  // Open modal for create/edit
  const handleOpenModal = (eq?: Equipment) => {
    if (eq) {
      setEditingEquipment(eq);
      setFormData({
        name: eq.name,
        equipmentType: eq.equipmentType,
        model: eq.model || '',
        serialNumber: eq.serialNumber || '',
        status: eq.status,
        projectId: eq.projectId || '',
        location: eq.location || '',
        condition: eq.condition,
        purchaseValue: eq.purchaseValue || 0,
        notes: eq.notes || '',
      });
    } else {
      setEditingEquipment(null);
      setFormData({
        name: '',
        equipmentType: '',
        model: '',
        serialNumber: '',
        status: 'available',
        projectId: '',
        location: '',
        condition: 'good',
        purchaseValue: 0,
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const url = editingEquipment ? `/api/equipment/${editingEquipment.id}` : '/api/equipment';
      const method = editingEquipment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectId: formData.projectId || undefined,
          purchaseDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: editingEquipment ? 'تم تحديث المعدة' : 'تم إضافة المعدة',
          description: editingEquipment
            ? 'تم تحديث بيانات المعدة بنجاح'
            : 'تم إضافة المعدة الجديدة بنجاح',
        });
        fetchEquipment();
        setIsModalOpen(false);
      } else {
        throw new Error('Failed to save equipment');
      }
    } catch {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ البيانات',
        variant: 'destructive',
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المعدة؟')) return;

    try {
      const response = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف المعدة بنجاح' });
        fetchEquipment();
      }
    } catch {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحذف',
        variant: 'destructive',
      });
    }
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
          <h1 className="text-2xl font-bold text-gray-900">المعدات</h1>
          <p className="text-gray-500 mt-1">إدارة ومتابعة جميع المعدات</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة معدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي المعدات</p>
                <p className="text-2xl font-bold text-gray-900">{equipment.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">قيد الاستخدام</p>
                <p className="text-2xl font-bold text-blue-600">{inUseCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">تحتاج صيانة</p>
                <p className="text-2xl font-bold text-yellow-600">{maintenanceCount}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">القيمة الإجمالية</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(totalValue / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
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
                  placeholder="البحث في المعدات..."
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
                {equipmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="available">متاحة</SelectItem>
                <SelectItem value="in_use">قيد الاستخدام</SelectItem>
                <SelectItem value="maintenance">صيانة</SelectItem>
                <SelectItem value="retired">متقاعدة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((eq) => (
          <Card key={eq.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{eq.name}</h3>
                    <p className="text-sm text-gray-500">{eq.model}</p>
                  </div>
                </div>
                <Badge variant={statusVariants[eq.status]}>{statusLabels[eq.status]}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                {eq.serialNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">الرقم التسلسلي:</span>
                    <span className="text-gray-900 font-mono">{eq.serialNumber}</span>
                  </div>
                )}
                {eq.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">الموقع:</span>
                    <span className="text-gray-900">{eq.location}</span>
                  </div>
                )}
                {eq.project && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">المشروع:</span>
                    <span className="text-gray-900 truncate max-w-[150px]">{eq.project.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">الحالة:</span>
                  <span className={conditionColors[eq.condition]}>{conditionLabels[eq.condition]}</span>
                </div>
                {eq.purchaseValue && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">القيمة:</span>
                    <span className="text-gray-900">{eq.purchaseValue.toLocaleString()} SAR</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {eq.lastMaintenanceDate && (
                    <p>آخر صيانة: {new Date(eq.lastMaintenanceDate).toLocaleDateString('ar-SA')}</p>
                  )}
                  {eq.nextMaintenanceDate && (
                    <p>الصيانة القادمة: {new Date(eq.nextMaintenanceDate).toLocaleDateString('ar-SA')}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenModal(eq)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(eq.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد معدات</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingEquipment ? 'تعديل المعدة' : 'إضافة معدة جديدة'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="name">اسم المعدة</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثل: رافعة برجية"
              />
            </div>

            <div>
              <Label htmlFor="type">النوع</Label>
              <Input
                id="type"
                value={formData.equipmentType}
                onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
                placeholder="مثل: Crane"
              />
            </div>

            <div>
              <Label htmlFor="model">الموديل</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="مثل: Liebherr 710"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="serial">الرقم التسلسلي</Label>
              <Input
                id="serial"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="الرقم التسلسلي الفريد"
              />
            </div>

            <div>
              <Label>المشروع (اختياري)</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="غير محدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">غير محدد</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">الموقع</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="الموقع الحالي"
              />
            </div>

            <div>
              <Label>الحالة</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as EquipmentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">متاحة</SelectItem>
                  <SelectItem value="in_use">قيد الاستخدام</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                  <SelectItem value="retired">متقاعدة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>الحالة الفنية</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value as EquipmentCondition })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">ممتاز</SelectItem>
                  <SelectItem value="good">جيد</SelectItem>
                  <SelectItem value="fair">مقبول</SelectItem>
                  <SelectItem value="poor">سيء</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="value">القيمة (SAR)</Label>
              <Input
                id="value"
                type="number"
                value={formData.purchaseValue}
                onChange={(e) => setFormData({ ...formData, purchaseValue: Number(e.target.value) })}
                placeholder="قيمة المعدة"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>{editingEquipment ? 'حفظ التغييرات' : 'إضافة المعدة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
