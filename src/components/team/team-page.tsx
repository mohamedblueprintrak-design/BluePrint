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
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  UserCog,
  HardHat,
  Eye,
} from 'lucide-react';
import { type User, UserRole } from '@/types';

// Role labels in Arabic
const roleLabels = {
  [UserRole.ADMIN]: 'مدير',
  [UserRole.MANAGER]: 'مشرف',
  [UserRole.ENGINEER]: 'مهندس',
  [UserRole.DRAFTSMAN]: 'راسم',
  [UserRole.ACCOUNTANT]: 'محاسب',
  [UserRole.HR]: 'موارد بشرية',
  [UserRole.PROJECT_MANAGER]: 'مدير مشروع',
  [UserRole.VIEWER]: 'مشاهد',
  [UserRole.SECRETARY]: 'سكرتيرة',
} satisfies Record<UserRole, string>;

// Role badge variants
const roleVariants = {
  [UserRole.ADMIN]: 'destructive' as const,
  [UserRole.MANAGER]: 'default' as const,
  [UserRole.ENGINEER]: 'secondary' as const,
  [UserRole.DRAFTSMAN]: 'secondary' as const,
  [UserRole.ACCOUNTANT]: 'secondary' as const,
  [UserRole.HR]: 'secondary' as const,
  [UserRole.PROJECT_MANAGER]: 'default' as const,
  [UserRole.VIEWER]: 'outline' as const,
  [UserRole.SECRETARY]: 'secondary' as const,
} satisfies Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'>;

// Role icons
const roleIcons = {
  [UserRole.ADMIN]: Shield,
  [UserRole.MANAGER]: UserCog,
  [UserRole.ENGINEER]: HardHat,
  [UserRole.DRAFTSMAN]: HardHat,
  [UserRole.ACCOUNTANT]: Users,
  [UserRole.HR]: Users,
  [UserRole.PROJECT_MANAGER]: UserCog,
  [UserRole.VIEWER]: Eye,
  [UserRole.SECRETARY]: HardHat,
} satisfies Record<UserRole, any>;

export default function TeamPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'ENGINEER' as UserRole,
    department: '',
    phone: '',
    jobTitle: '',
  });

  // Fetch team members
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/team');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      (member.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Stats calculations
  const admins = members.filter((m) => m.role === UserRole.ADMIN).length;
  const managers = members.filter((m) => m.role === UserRole.MANAGER || m.role === UserRole.PROJECT_MANAGER).length;
  const engineers = members.filter((m) => m.role === UserRole.ENGINEER).length;

  // Open modal for create/edit
  const handleOpenModal = (member?: User) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        fullName: member.fullName || '',
        email: member.email,
        role: member.role,
        department: member.department || '',
        phone: member.phone || '',
        jobTitle: member.jobTitle || '',
      });
    } else {
      setEditingMember(null);
      setFormData({
        fullName: '',
        email: '',
        role: UserRole.ENGINEER,
        department: '',
        phone: '',
        jobTitle: '',
      });
    }
    setIsModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const url = editingMember ? `/api/team/${editingMember.id}` : '/api/team';
      const method = editingMember ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: editingMember ? 'تم تحديث العضو' : 'تم إضافة العضو',
          description: editingMember
            ? 'تم تحديث بيانات العضو بنجاح'
            : 'تم إضافة العضو الجديد بنجاح',
        });
        fetchMembers();
        setIsModalOpen(false);
      } else {
        throw new Error('Failed to save member');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ البيانات',
        variant: 'destructive',
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;

    try {
      const response = await fetch(`/api/team/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف العضو بنجاح' });
        fetchMembers();
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحذف',
        variant: 'destructive',
      });
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2);
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
          <h1 className="text-2xl font-bold text-gray-900">الفريق</h1>
          <p className="text-gray-500 mt-1">إدارة أعضاء الفريق والصلاحيات</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة عضو
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي الأعضاء</p>
                <p className="text-2xl font-bold text-gray-900">{members.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مديرين</p>
                <p className="text-2xl font-bold text-red-600">{admins}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مشرفين</p>
                <p className="text-2xl font-bold text-blue-600">{managers}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مهندسين</p>
                <p className="text-2xl font-bold text-green-600">{engineers}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <HardHat className="w-5 h-5 text-green-600" />
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
                  placeholder="البحث عن عضو..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="جميع الأدوار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="manager">مشرف</SelectItem>
                <SelectItem value="project_manager">مدير مشروع</SelectItem>
                <SelectItem value="engineer">مهندس</SelectItem>
                <SelectItem value="draftsman">راسم</SelectItem>
                <SelectItem value="accountant">محاسب</SelectItem>
                <SelectItem value="hr">موارد بشرية</SelectItem>
                <SelectItem value="viewer">مشاهد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const RoleIcon = roleIcons[member.role] || Users;
          return (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.fullName || ''}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(member.fullName || member.email)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {member.fullName || member.email}
                      </h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={roleVariants[member.role]}>{roleLabels[member.role]}</Badge>
                </div>

                <div className="space-y-3">
                  {member.jobTitle && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <RoleIcon className="w-4 h-4 text-gray-400" />
                      {member.jobTitle}
                    </div>
                  )}
                  {member.department && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="w-4 h-4 text-gray-400" />
                      {member.department}
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {member.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    انضم في{' '}
                    {member.createdAt
                      ? new Date(member.createdAt).toLocaleDateString('ar-SA')
                      : 'غير محدد'}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenModal(member)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {member.role !== UserRole.ADMIN && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد أعضاء</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'تعديل عضو' : 'إضافة عضو جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input
                id="name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="أدخل الاسم الكامل"
              />
            </div>

            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@company.com"
              />
            </div>

            <div>
              <Label>الدور</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineer">مهندس</SelectItem>
                  <SelectItem value="draftsman">راسم</SelectItem>
                  <SelectItem value="manager">مشرف</SelectItem>
                  <SelectItem value="project_manager">مدير مشروع</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="accountant">محاسب</SelectItem>
                  <SelectItem value="hr">موارد بشرية</SelectItem>
                  <SelectItem value="viewer">مشاهد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="jobTitle">المسمى الوظيفي</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="مثل: مهندس مدني"
              />
            </div>

            <div>
              <Label htmlFor="department">القسم</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="مثل: الهندسة، التصميم"
              />
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966 5X XXX XXXX"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>
              {editingMember ? 'حفظ التغييرات' : 'إضافة العضو'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
