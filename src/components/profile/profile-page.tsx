'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  useProfile, useUpdateProfile, useChangePassword, useUploadAvatar, useDeleteAvatar,
  ProfileUpdate
} from '@/hooks/use-data';
import {
  User, Building2, Calendar, Shield, Key,
  Globe, Moon, Sun, Camera, Save, Eye, EyeOff, Loader2, Trash2
} from 'lucide-react';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { language, theme, setTheme, setLanguage } = useApp();
  const { t, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  // Profile API hooks
  const { data: profileData } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use profile data from API or fallback to auth context user
  const profileUser = profileData?.data || user;
  
  // Form state for editing - initialize with current profile values
  const [profileForm, setProfileForm] = useState(() => ({
    fullName: profileUser?.fullName || '',
    email: profileUser?.email || '',
    phone: profileUser?.phone || '',
    jobTitle: profileUser?.jobTitle || '',
    department: profileUser?.department || '',
    nationality: profileUser?.nationality || '',
  }));
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Reset form to current profile values when editing is cancelled
  const _resetFormToProfile = useCallback(() => {
    if (profileUser) {
      setProfileForm({
        fullName: profileUser.fullName || '',
        email: profileUser.email || '',
        phone: profileUser.phone || '',
        jobTitle: profileUser.jobTitle || '',
        department: profileUser.department || '',
        nationality: profileUser.nationality || '',
      });
    }
  }, [profileUser]);
  
  // Update form when profile data changes (after API load)
  const profileUserId = profileUser?.id;
  const prevUserIdRef = useRef<string | undefined>(undefined);
  
  if (profileUserId !== prevUserIdRef.current) {
    prevUserIdRef.current = profileUserId;
    if (profileUser) {
      setProfileForm({
        fullName: profileUser.fullName || '',
        email: profileUser.email || '',
        phone: profileUser.phone || '',
        jobTitle: profileUser.jobTitle || '',
        department: profileUser.department || '',
        nationality: profileUser.nationality || '',
      });
    }
  }

  const handleSaveProfile = async () => {
    try {
      const updateData: ProfileUpdate = {
        fullName: profileForm.fullName,
        email: profileForm.email,
        phone: profileForm.phone,
        jobTitle: profileForm.jobTitle,
        department: profileForm.department,
        nationality: profileForm.nationality,
      };
      
      const result = await updateProfile.mutateAsync(updateData);
      
      if (result.success && result.data) {
        // Update auth context
        updateUser({
          fullName: result.data.fullName,
          email: result.data.email,
          phone: result.data.phone,
          jobTitle: result.data.jobTitle,
          department: result.data.department,
          nationality: result.data.nationality,
        });
        
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated successfully'
        });
        setIsEditing(false);
      } else {
        toast({
          title: t.error,
          description: result.error?.message || (language === 'ar' ? 'فشل في الحفظ' : 'Failed to save'),
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleChangePassword = async () => {
    // Client-side validation
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

    try {
      const result = await changePassword.mutateAsync(passwordForm);
      
      if (result.success) {
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed successfully'
        });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast({
          title: t.error,
          description: result.error?.message || (language === 'ar' ? 'فشل في تغيير كلمة المرور' : 'Failed to change password'),
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'نوع الملف غير مدعوم' : 'File type not supported',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حجم الملف كبير جداً' : 'File too large',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await uploadAvatar.mutateAsync(file);
      
      if (result.success && result.data) {
        // Update auth context with new avatar
        updateUser({ avatar: result.data.avatar });
        
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم تحديث الصورة الشخصية' : 'Avatar updated successfully'
        });
      } else {
        toast({
          title: t.error,
          description: result.error?.message || (language === 'ar' ? 'فشل في رفع الصورة' : 'Failed to upload avatar'),
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive'
      });
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const result = await deleteAvatar.mutateAsync();
      
      if (result.success) {
        updateUser({ avatar: undefined });
        toast({
          title: t.successSave,
          description: language === 'ar' ? 'تم حذف الصورة الشخصية' : 'Avatar deleted successfully'
        });
      } else {
        toast({
          title: t.error,
          description: result.error?.message || (language === 'ar' ? 'فشل في حذف الصورة' : 'Failed to delete avatar'),
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleLanguageChange = async (newLanguage: 'ar' | 'en') => {
    setLanguage(newLanguage);
    
    // Save preference to backend
    try {
      await updateProfile.mutateAsync({ language: newLanguage });
    } catch {
      // Silently fail - UI already updated
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    
    // Save preference to backend
    try {
      await updateProfile.mutateAsync({ theme: newTheme });
    } catch {
      // Silently fail - UI already updated
    }
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
      <Badge className={`${roleConfig.color} text-foreground`}>
        {roleConfig.label}
      </Badge>
    );
  };

  const isSaving = updateProfile.isPending;
  const isChangingPassword = changePassword.isPending;
  const isUploadingAvatar = uploadAvatar.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.profile}</h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'إدارة معلومات حسابك' : 'Manage your account information'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card border border-border p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-muted">
            <User className="w-4 h-4 me-2" />
            {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Info'}
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-muted">
            <Shield className="w-4 h-4 me-2" />
            {language === 'ar' ? 'الأمان' : 'Security'}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-muted">
            <Globe className="w-4 h-4 me-2" />
            {language === 'ar' ? 'التفضيلات' : 'Preferences'}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Avatar Card */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-border">
                    <AvatarImage src={profileUser?.avatar} />
                    <AvatarFallback className="bg-blue-600 text-foreground text-2xl">
                      {profileUser?.fullName?.[0] || profileUser?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 end-0 rounded-full bg-blue-600 hover:bg-blue-700 w-8 h-8"
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="text-center md:text-start flex-1">
                  <h2 className="text-xl font-bold text-foreground">{profileUser?.fullName || profileUser?.username}</h2>
                  <p className="text-muted-foreground">{profileUser?.email}</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                    {getRoleBadge(profileUser?.role || 'viewer')}
                    {profileUser?.isActive && (
                      <Badge variant="outline" className="text-green-400 border-green-500/30">
                        {language === 'ar' ? 'نشط' : 'Active'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {profileUser?.avatar && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={handleDeleteAvatar}
                      disabled={isUploadingAvatar}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-border"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? 'تعديل' : 'Edit')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'تحديث معلوماتك الشخصية' : 'Update your personal information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.username}</Label>
                  <Input
                    value={profileUser?.username}
                    disabled
                    className="bg-muted/50 border-border text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.fullName}</Label>
                  <Input
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    disabled={!isEditing}
                    className="bg-muted border-border text-foreground disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.email}</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    disabled={!isEditing}
                    className="bg-muted border-border text-foreground disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{t.phone}</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    disabled={!isEditing}
                    className="bg-muted border-border text-foreground disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</Label>
                  <Input
                    value={profileForm.jobTitle}
                    onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                    disabled={!isEditing}
                    className="bg-muted border-border text-foreground disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{language === 'ar' ? 'القسم' : 'Department'}</Label>
                  <Input
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    disabled={!isEditing}
                    className="bg-muted border-border text-foreground disabled:opacity-50"
                  />
                </div>
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter className="border-t border-border pt-4">
                <Button 
                  onClick={handleSaveProfile} 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 me-2" />
                  )}
                  {isSaving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t.save}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Work Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{language === 'ar' ? 'معلومات العمل' : 'Work Information'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المنظمة' : 'Organization'}</p>
                    <p className="text-foreground font-medium">{profileUser?.organization?.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تاريخ الانضمام' : 'Join Date'}</p>
                    <p className="text-foreground font-medium">{profileUser?.hireDate ? formatDate(profileUser.hireDate) : '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'رصيد الإجازات' : 'Leave Balance'}</p>
                    <p className="text-foreground font-medium">{profileUser?.leaveBalance || 0} {language === 'ar' ? 'يوم' : 'days'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'ar' ? 'تحديث كلمة المرور الخاصة بك' : 'Update your password'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground/80">{language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="bg-muted border-border text-foreground pe-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute end-0 top-0 h-full text-muted-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">{language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="bg-muted border-border text-foreground pe-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute end-0 top-0 h-full text-muted-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {language === 'ar' 
                  ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل وتحتوي على حرف ورقم'
                  : 'Password must be at least 6 characters with at least one letter and one number'}
              </p>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <Button 
                onClick={handleChangePassword} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                ) : (
                  <Key className="w-4 h-4 me-2" />
                )}
                {isChangingPassword 
                  ? (language === 'ar' ? 'جاري التغيير...' : 'Changing...') 
                  : (language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{language === 'ar' ? 'التفضيلات' : 'Preferences'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-foreground font-medium">{t.language}</p>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'اختر لغة الواجهة' : 'Choose interface language'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={language === 'ar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLanguageChange('ar')}
                    className={language === 'ar' ? 'bg-blue-600' : 'border-border'}
                  >
                    العربية
                  </Button>
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLanguageChange('en')}
                    className={language === 'en' ? 'bg-blue-600' : 'border-border'}
                  >
                    English
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                  <div>
                    <p className="text-foreground font-medium">{t.theme}</p>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'اختر مظهر التطبيق' : 'Choose app appearance'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange('light')}
                    className={theme === 'light' ? 'bg-blue-600' : 'border-border'}
                  >
                    <Sun className="w-4 h-4 me-1" />
                    {language === 'ar' ? 'فاتح' : 'Light'}
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange('dark')}
                    className={theme === 'dark' ? 'bg-blue-600' : 'border-border'}
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
