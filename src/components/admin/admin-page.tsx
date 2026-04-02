'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useDashboard,
  type AdminUser,
  type UpdateUserData,
} from '@/hooks/use-data';
import {
  Shield, Users, Settings, Database, Bell,
  Plus, Search, Edit, Trash2, Key, Activity, Server,
  CheckCircle, XCircle, Clock, Mail, Loader2
} from 'lucide-react';

// Roles are defined as constants (not fetched from API)
const ROLES = [
  { id: 'admin', name: 'مدير', nameEn: 'Admin', permissions: ['all'] },
  { id: 'engineer', name: 'مهندس', nameEn: 'Engineer', permissions: ['projects', 'tasks', 'documents'] },
  { id: 'draftsman', name: 'راسم', nameEn: 'Draftsman', permissions: ['projects', 'tasks', 'documents'] },
  { id: 'accountant', name: 'محاسب', nameEn: 'Accountant', permissions: ['invoices', 'clients', 'reports'] },
  { id: 'hr', name: 'موارد بشرية', nameEn: 'HR', permissions: ['hr', 'attendance', 'leaves'] },
  { id: 'project_manager', name: 'مدير مشروع', nameEn: 'Project Manager', permissions: ['projects', 'tasks', 'site-reports'] },
  { id: 'viewer', name: 'مشاهد', nameEn: 'Viewer', permissions: ['view'] },
];

// System info constants
const SYSTEM_INFO = {
  version: '3.1.0',
  database: 'SQLite',
  nodeVersion: '20.x',
  storageUsed: '2.5 GB',
  storageLimit: '10 GB',
};

export function AdminPage() {
  const { user } = useAuth();
  const { language } = useApp();
  const { t, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  // API Hooks
  const { data: usersResponse, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
  const { data: dashboardResponse } = useDashboard();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  
  // Extract users from response
  const users = usersResponse?.success ? (usersResponse.data ?? []) : [];
  const dashboard = dashboardResponse?.success ? dashboardResponse.data : null;
  
  // Calculate stats from real data
  const totalUsers = users?.length ?? 0;
  const activeUsers = (users ?? []).filter((u: AdminUser) => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'VIEWER',
  });

  // Filter users
  const filteredUsers = users.filter((u: AdminUser) => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      admin: { label: 'مدير', color: 'bg-red-500' },
      engineer: { label: 'مهندس', color: 'bg-blue-500' },
      draftsman: { label: 'راسم', color: 'bg-indigo-500' },
      accountant: { label: 'محاسب', color: 'bg-green-500' },
      hr: { label: 'موارد بشرية', color: 'bg-purple-500' },
      project_manager: { label: 'مدير مشروع', color: 'bg-cyan-500' },
      viewer: { label: 'مشاهد', color: 'bg-slate-500' },
    };
    const roleConfig = roles[role] || roles.viewer;
    return (
      <Badge className={`${roleConfig.color} text-foreground text-xs`}>
        {language === 'ar' ? roleConfig.label : role}
      </Badge>
    );
  };

  const handleAddUser = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'جميع الحقول مطلوبة' : 'All fields are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await createUser.mutateAsync({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
      });

      if (result.success) {
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم إضافة المستخدم بنجاح' : 'User added successfully'
        });
        setShowAddUserDialog(false);
        setFormData({ username: '', email: '', password: '', fullName: '', role: 'VIEWER' });
      } else {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: result.error?.message || (language === 'ar' ? 'فشل في إضافة المستخدم' : 'Failed to add user'),
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إضافة المستخدم' : 'Failed to add user',
        variant: 'destructive'
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData: UpdateUserData = {
        id: selectedUser.id,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
      };

      const result = await updateUser.mutateAsync(updateData);

      if (result.success) {
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم تحديث المستخدم بنجاح' : 'User updated successfully'
        });
        setShowEditUserDialog(false);
        setSelectedUser(null);
        setFormData({ username: '', email: '', password: '', fullName: '', role: 'VIEWER' });
      } else {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: result.error?.message || (language === 'ar' ? 'فشل في تحديث المستخدم' : 'Failed to update user'),
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحديث المستخدم' : 'Failed to update user',
        variant: 'destructive'
      });
    }
  };

  const handleToggleUserStatus = async (targetUser: AdminUser) => {
    try {
      const result = await updateUser.mutateAsync({
        id: targetUser.id,
        isActive: !targetUser.isActive,
      });

      if (result.success) {
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم تحديث حالة المستخدم' : 'User status updated'
        });
      } else {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: result.error?.message || (language === 'ar' ? 'فشل في تحديث الحالة' : 'Failed to update status'),
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحديث الحالة' : 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (targetUser: AdminUser) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const result = await deleteUser.mutateAsync(targetUser.id);

      if (result.success) {
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم حذف المستخدم' : 'User deleted'
        });
      } else {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: result.error?.message || (language === 'ar' ? 'فشل في حذف المستخدم' : 'Failed to delete user'),
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حذف المستخدم' : 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (targetUser: AdminUser) => {
    setSelectedUser(targetUser);
    setFormData({
      username: targetUser.username,
      email: targetUser.email,
      password: '',
      fullName: targetUser.fullName || '',
      role: targetUser.role,
    });
    setShowEditUserDialog(true);
  };

  // Loading state
  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (usersError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data'}</p>
          <Button onClick={() => refetchUsers()} variant="outline">
            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-7 h-7 text-red-400" />
            {t.admin}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'إدارة النظام والمستخدمين' : 'System and user management'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-card border border-border p-1">
          <TabsTrigger value="users" className="data-[state=active]:bg-muted">
            <Users className="w-4 h-4 me-2" />
            {language === 'ar' ? 'المستخدمون' : 'Users'}
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-muted">
            <Key className="w-4 h-4 me-2" />
            {language === 'ar' ? 'الصلاحيات' : 'Roles'}
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-muted">
            <Server className="w-4 h-4 me-2" />
            {language === 'ar' ? 'النظام' : 'System'}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</p>
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
                    <p className="text-2xl font-bold text-foreground">{activeUsers}</p>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'نشطون' : 'Active'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{inactiveUsers}</p>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'غير نشط' : 'Inactive'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{ROLES.length}</p>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'أدوار' : 'Roles'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <CardTitle className="text-foreground">{language === 'ar' ? 'قائمة المستخدمين' : 'Users List'}</CardTitle>
                <div className="flex gap-3 w-full md:w-auto">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-9 bg-muted border-border text-foreground"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[140px] bg-muted border-border text-foreground">
                      <SelectValue placeholder={t.status} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">{t.all}</SelectItem>
                      {ROLES.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {language === 'ar' ? role.name : role.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setFormData({ username: '', email: '', password: '', fullName: '', role: 'VIEWER' });
                      setShowAddUserDialog(true);
                    }}
                  >
                    <Plus className="w-4 h-4 me-2" />
                    {t.add}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredUsers.map((u: AdminUser) => (
                      <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-border">
                            <AvatarFallback className="bg-blue-600 text-foreground">
                              {u.fullName?.[0] || u.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-foreground font-medium">{u.fullName || u.username}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getRoleBadge(u.role)}
                          <Badge variant={u.isActive ? 'default' : 'secondary'} className={u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-muted-foreground'}>
                            {u.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                          </Badge>
                          {u.createdAt && (
                            <span className="text-xs text-muted-foreground hidden md:block">
                              <Clock className="w-3 h-3 inline me-1" />
                              {formatDate(u.createdAt)}
                            </span>
                          )}
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditDialog(u)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-red-400" 
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={u.id === user?.id}
                            >
                              {u.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-red-400"
                              onClick={() => handleDeleteUser(u)}
                              disabled={u.id === user?.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES.map((role) => (
              <Card key={role.id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground text-lg">{language === 'ar' ? role.name : role.nameEn}</CardTitle>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {role.permissions.length} {language === 'ar' ? 'صلاحية' : 'permissions'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-muted text-foreground/80 text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-400" />
                  {language === 'ar' ? 'معلومات النظام' : 'System Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">{language === 'ar' ? 'الإصدار' : 'Version'}</span>
                  <span className="text-foreground font-medium">{SYSTEM_INFO.version}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">{language === 'ar' ? 'قاعدة البيانات' : 'Database'}</span>
                  <span className="text-foreground font-medium">{SYSTEM_INFO.database}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">{language === 'ar' ? 'Node.js' : 'Node.js'}</span>
                  <span className="text-foreground font-medium">{SYSTEM_INFO.nodeVersion}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">{language === 'ar' ? 'الموظفين' : 'Employees'}</span>
                  <span className="text-foreground font-medium">{dashboard?.employees?.total || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-400" />
                  {language === 'ar' ? 'التخزين' : 'Storage'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'ar' ? 'المستخدم' : 'Used'}</span>
                    <span className="text-foreground">{SYSTEM_INFO.storageUsed} / {SYSTEM_INFO.storageLimit}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
                <Separator className="bg-muted" />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-border">
                    {language === 'ar' ? 'نسخ احتياطي' : 'Backup'}
                  </Button>
                  <Button variant="outline" className="flex-1 border-border">
                    {language === 'ar' ? 'استعادة' : 'Restore'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  {language === 'ar' ? 'حالة الخدمات' : 'Services Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-foreground/80">API Server</span>
                  <Badge className="bg-green-500 text-foreground">{language === 'ar' ? 'يعمل' : 'Running'}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-foreground/80">Database</span>
                  <Badge className="bg-green-500 text-foreground">{language === 'ar' ? 'متصل' : 'Connected'}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-foreground/80">Cache</span>
                  <Badge className="bg-green-500 text-foreground">{language === 'ar' ? 'يعمل' : 'Active'}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-border">
                  <Database className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'مسح الكاش' : 'Clear Cache'}
                </Button>
                <Button variant="outline" className="w-full justify-start border-border">
                  <Mail className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'اختبار البريد' : 'Test Email'}
                </Button>
                <Button variant="outline" className="w-full justify-start border-border">
                  <Bell className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'إرسال إشعار' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {language === 'ar' ? 'أدخل بيانات المستخدم الجديد' : 'Enter the new user details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground/80">{language === 'ar' ? 'اسم المستخدم' : 'Username'}</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-muted border-border text-foreground"
                placeholder={language === 'ar' ? 'اسم المستخدم' : 'Username'}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-muted border-border text-foreground"
                placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-muted border-border text-foreground"
                placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-muted border-border text-foreground"
                placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">{language === 'ar' ? 'الدور' : 'Role'}</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder={language === 'ar' ? 'اختر الدور' : 'Select role'} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {ROLES.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {language === 'ar' ? role.name : role.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)} className="border-border">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700" disabled={createUser.isPending}>
              {createUser.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {language === 'ar' ? 'إضافة' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل المستخدم' : 'Edit User'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {language === 'ar' ? 'تعديل بيانات المستخدم' : 'Edit user details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground/80">{language === 'ar' ? 'اسم المستخدم' : 'Username'}</Label>
              <Input
                value={formData.username}
                disabled
                className="bg-muted border-border text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">{language === 'ar' ? 'الدور' : 'Role'}</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder={language === 'ar' ? 'اختر الدور' : 'Select role'} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {ROLES.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {language === 'ar' ? role.name : role.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)} className="border-border">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleEditUser} className="bg-blue-600 hover:bg-blue-700" disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
