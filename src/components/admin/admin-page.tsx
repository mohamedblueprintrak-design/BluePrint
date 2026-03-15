'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useToast } from '@/hooks/use-toast';
import {
  Shield, Users, Building2, Settings, Database, Bell,
  Plus, Search, Edit, Trash2, Key, Activity, Server,
  CheckCircle, XCircle, Clock, Mail
} from 'lucide-react';

// Mock data for admin panel
const mockUsers = [
  { id: '1', username: 'admin', email: 'admin@blueprint.ae', fullName: 'مدير النظام', role: 'admin', isActive: true, lastLoginAt: new Date().toISOString() },
  { id: '2', username: 'engineer1', email: 'eng1@blueprint.ae', fullName: 'أحمد محمد', role: 'engineer', isActive: true, lastLoginAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', username: 'accountant', email: 'acc@blueprint.ae', fullName: 'سارة أحمد', role: 'accountant', isActive: true, lastLoginAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', username: 'viewer1', email: 'view@blueprint.ae', fullName: 'محمد علي', role: 'viewer', isActive: false, lastLoginAt: null },
];

const mockSystemInfo = {
  version: '3.0.0',
  database: 'SQLite',
  nodeVersion: '20.x',
  lastBackup: new Date(Date.now() - 86400000 * 2).toISOString(),
  totalUsers: 4,
  activeUsers: 3,
  storageUsed: '2.5 GB',
  storageLimit: '10 GB',
};

const mockRoles = [
  { id: 'admin', name: 'مدير', nameEn: 'Admin', permissions: ['all'] },
  { id: 'engineer', name: 'مهندس', nameEn: 'Engineer', permissions: ['projects', 'tasks', 'documents'] },
  { id: 'accountant', name: 'محاسب', nameEn: 'Accountant', permissions: ['invoices', 'clients', 'reports'] },
  { id: 'hr', name: 'موارد بشرية', nameEn: 'HR', permissions: ['hr', 'attendance', 'leaves'] },
  { id: 'project_manager', name: 'مدير مشروع', nameEn: 'Project Manager', permissions: ['projects', 'tasks', 'site-reports'] },
  { id: 'viewer', name: 'مشاهد', nameEn: 'Viewer', permissions: ['view'] },
];

export function AdminPage() {
  const { user } = useAuth();
  const { language } = useApp();
  const { t, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      admin: { label: 'مدير', color: 'bg-red-500' },
      engineer: { label: 'مهندس', color: 'bg-blue-500' },
      accountant: { label: 'محاسب', color: 'bg-green-500' },
      hr: { label: 'موارد بشرية', color: 'bg-purple-500' },
      project_manager: { label: 'مدير مشروع', color: 'bg-cyan-500' },
      viewer: { label: 'مشاهد', color: 'bg-slate-500' },
    };
    const roleConfig = roles[role] || roles.viewer;
    return (
      <Badge className={`${roleConfig.color} text-white text-xs`}>
        {language === 'ar' ? roleConfig.label : role}
      </Badge>
    );
  };

  const handleToggleUserStatus = (userId: string) => {
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم تحديث حالة المستخدم' : 'User status updated'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-red-400" />
            {t.admin}
          </h1>
          <p className="text-slate-400 mt-1">
            {language === 'ar' ? 'إدارة النظام والمستخدمين' : 'System and user management'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-800">
            <Users className="w-4 h-4 me-2" />
            {language === 'ar' ? 'المستخدمون' : 'Users'}
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-slate-800">
            <Key className="w-4 h-4 me-2" />
            {language === 'ar' ? 'الصلاحيات' : 'Roles'}
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-slate-800">
            <Server className="w-4 h-4 me-2" />
            {language === 'ar' ? 'النظام' : 'System'}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{mockSystemInfo.totalUsers}</p>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</p>
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
                    <p className="text-2xl font-bold text-white">{mockSystemInfo.activeUsers}</p>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'نشطون' : 'Active'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{mockSystemInfo.totalUsers - mockSystemInfo.activeUsers}</p>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'غير نشط' : 'Inactive'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{mockRoles.length}</p>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'أدوار' : 'Roles'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users List */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <CardTitle className="text-white">{language === 'ar' ? 'قائمة المستخدمين' : 'Users List'}</CardTitle>
                <div className="flex gap-3 w-full md:w-auto">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder={t.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-9 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder={t.status} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="all">{t.all}</SelectItem>
                      {mockRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {language === 'ar' ? role.name : role.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 me-2" />
                    {t.add}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-slate-700">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {u.fullName?.[0] || u.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{u.fullName || u.username}</p>
                          <p className="text-sm text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getRoleBadge(u.role)}
                        <Badge variant={u.isActive ? 'default' : 'secondary'} className={u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}>
                          {u.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                        </Badge>
                        {u.lastLoginAt && (
                          <span className="text-xs text-slate-500 hidden md:block">
                            <Clock className="w-3 h-3 inline me-1" />
                            {formatDate(u.lastLoginAt)}
                          </span>
                        )}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={() => handleToggleUserStatus(u.id)}>
                            {u.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRoles.map((role) => (
              <Card key={role.id} className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{language === 'ar' ? role.name : role.nameEn}</CardTitle>
                    <Badge variant="outline" className="border-slate-700 text-slate-400">
                      {role.permissions.length} {language === 'ar' ? 'صلاحية' : 'permissions'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
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
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-400" />
                  {language === 'ar' ? 'معلومات النظام' : 'System Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">{language === 'ar' ? 'الإصدار' : 'Version'}</span>
                  <span className="text-white font-medium">{mockSystemInfo.version}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">{language === 'ar' ? 'قاعدة البيانات' : 'Database'}</span>
                  <span className="text-white font-medium">{mockSystemInfo.database}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">{language === 'ar' ? 'Node.js' : 'Node.js'}</span>
                  <span className="text-white font-medium">{mockSystemInfo.nodeVersion}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">{language === 'ar' ? 'آخر نسخة احتياطية' : 'Last Backup'}</span>
                  <span className="text-white font-medium">{formatDate(mockSystemInfo.lastBackup)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-400" />
                  {language === 'ar' ? 'التخزين' : 'Storage'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'ar' ? 'المستخدم' : 'Used'}</span>
                    <span className="text-white">{mockSystemInfo.storageUsed} / {mockSystemInfo.storageLimit}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
                <Separator className="bg-slate-800" />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-slate-700">
                    {language === 'ar' ? 'نسخ احتياطي' : 'Backup'}
                  </Button>
                  <Button variant="outline" className="flex-1 border-slate-700">
                    {language === 'ar' ? 'استعادة' : 'Restore'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  {language === 'ar' ? 'حالة الخدمات' : 'Services Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                  <span className="text-slate-300">API Server</span>
                  <Badge className="bg-green-500 text-white">{language === 'ar' ? 'يعمل' : 'Running'}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                  <span className="text-slate-300">Database</span>
                  <Badge className="bg-green-500 text-white">{language === 'ar' ? 'متصل' : 'Connected'}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                  <span className="text-slate-300">Cache</span>
                  <Badge className="bg-green-500 text-white">{language === 'ar' ? 'يعمل' : 'Active'}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-slate-700">
                  <Database className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'مسح الكاش' : 'Clear Cache'}
                </Button>
                <Button variant="outline" className="w-full justify-start border-slate-700">
                  <Mail className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'اختبار البريد' : 'Test Email'}
                </Button>
                <Button variant="outline" className="w-full justify-start border-slate-700">
                  <Bell className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'إرسال إشعار' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
