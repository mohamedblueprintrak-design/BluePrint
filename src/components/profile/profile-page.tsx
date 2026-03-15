'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  User, Mail, Phone, Building2, Calendar, Shield, Key,
  Globe, Moon, Sun, Camera, Save, Eye, EyeOff
} from 'lucide-react';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { language, theme, setTheme, setLanguage } = useApp();
  const { t, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    nationality: user?.nationality || '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = () => {
    updateUser({
      fullName: profileForm.fullName,
      email: profileForm.email,
      phone: profileForm.phone,
      jobTitle: profileForm.jobTitle,
      department: profileForm.department,
      nationality: profileForm.nationality,
    });
    
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated successfully'
    });
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'كلمة المرور قصيرة جداً' : 'Password too short',
        variant: 'destructive'
      });
      return;
    }
    
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed successfully'
    });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      admin: { label: language === 'ar' ? 'مدير' : 'Admin', color: 'bg-red-500' },
      engineer: { label: language === 'ar' ? 'مهندس' : 'Engineer', color: 'bg-blue-500' },
      accountant: { label: language === 'ar' ? 'محاسب' : 'Accountant', color: 'bg-green-500' },
      hr: { label: language === 'ar' ? 'موارد بشرية' : 'HR', color: 'bg-purple-500' },
      project_manager: { label: language === 'ar' ? 'مدير مشروع' : 'Project Manager', color: 'bg-cyan-500' },
      viewer: { label: language === 'ar' ? 'مشاهد' : 'Viewer', color: 'bg-slate-500' },
    };
    const roleConfig = roles[role] || roles.viewer;
    return (
      <Badge className={`${roleConfig.color} text-white`}>
        {roleConfig.label}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.profile}</h1>
          <p className="text-slate-400 mt-1">
            {language === 'ar' ? 'إدارة معلومات حسابك' : 'Manage your account information'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-slate-800">
            <User className="w-4 h-4 me-2" />
            {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Info'}
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-800">
            <Shield className="w-4 h-4 me-2" />
            {language === 'ar' ? 'الأمان' : 'Security'}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-slate-800">
            <Globe className="w-4 h-4 me-2" />
            {language === 'ar' ? 'التفضيلات' : 'Preferences'}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Avatar Card */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-slate-700">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-blue-600 text-white text-2xl">
                      {user?.fullName?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 end-0 rounded-full bg-blue-600 hover:bg-blue-700 w-8 h-8"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-center md:text-start flex-1">
                  <h2 className="text-xl font-bold text-white">{user?.fullName || user?.username}</h2>
                  <p className="text-slate-400">{user?.email}</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                    {getRoleBadge(user?.role || 'viewer')}
                    {user?.isActive && (
                      <Badge variant="outline" className="text-green-400 border-green-500/30">
                        {language === 'ar' ? 'نشط' : 'Active'}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-700"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? 'تعديل' : 'Edit')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</CardTitle>
              <CardDescription className="text-slate-400">
                {language === 'ar' ? 'تحديث معلوماتك الشخصية' : 'Update your personal information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.username}</Label>
                  <Input
                    value={user?.username}
                    disabled
                    className="bg-slate-800/30 border-slate-700 text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.fullName}</Label>
                  <Input
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    disabled={!isEditing}
                    className="bg-slate-800/50 border-slate-700 text-white disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.email}</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    disabled={!isEditing}
                    className="bg-slate-800/50 border-slate-700 text-white disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.phone}</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    disabled={!isEditing}
                    className="bg-slate-800/50 border-slate-700 text-white disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</Label>
                  <Input
                    value={profileForm.jobTitle}
                    onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                    disabled={!isEditing}
                    className="bg-slate-800/50 border-slate-700 text-white disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'القسم' : 'Department'}</Label>
                  <Input
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    disabled={!isEditing}
                    className="bg-slate-800/50 border-slate-700 text-white disabled:opacity-50"
                  />
                </div>
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter className="border-t border-slate-800 pt-4">
                <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 me-2" />
                  {t.save}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Work Info */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">{language === 'ar' ? 'معلومات العمل' : 'Work Information'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'المنظمة' : 'Organization'}</p>
                    <p className="text-white font-medium">{user?.organization?.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'تاريخ الانضمام' : 'Join Date'}</p>
                    <p className="text-white font-medium">{user?.hireDate ? formatDate(user.hireDate) : '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'رصيد الإجازات' : 'Leave Balance'}</p>
                    <p className="text-white font-medium">{user?.leaveBalance || 0} {language === 'ar' ? 'يوم' : 'days'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">{language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</CardTitle>
              <CardDescription className="text-slate-400">
                {language === 'ar' ? 'تحديث كلمة المرور الخاصة بك' : 'Update your password'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white pe-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute end-0 top-0 h-full text-slate-400"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white pe-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute end-0 top-0 h-full text-slate-400"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-800 pt-4">
              <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700">
                <Key className="w-4 h-4 me-2" />
                {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">{language === 'ar' ? 'التفضيلات' : 'Preferences'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">{t.language}</p>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'اختر لغة الواجهة' : 'Choose interface language'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={language === 'ar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('ar')}
                    className={language === 'ar' ? 'bg-blue-600' : 'border-slate-700'}
                  >
                    العربية
                  </Button>
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                    className={language === 'en' ? 'bg-blue-600' : 'border-slate-700'}
                  >
                    English
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                  <div>
                    <p className="text-white font-medium">{t.theme}</p>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'اختر مظهر التطبيق' : 'Choose app appearance'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className={theme === 'light' ? 'bg-blue-600' : 'border-slate-700'}
                  >
                    <Sun className="w-4 h-4 me-1" />
                    {language === 'ar' ? 'فاتح' : 'Light'}
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className={theme === 'dark' ? 'bg-blue-600' : 'border-slate-700'}
                  >
                    <Moon className="w-4 h-4 me-1" />
                    {language === 'ar' ? 'داكن' : 'Dark'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
