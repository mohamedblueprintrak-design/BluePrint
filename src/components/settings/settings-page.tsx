'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Building2,
  Palette,
  Bell,
  Shield,
  CreditCard,
  Plug,
  Upload,
  Sun,
  Moon,
  Monitor,
  Check,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Mail,
  Globe,
  Copy,
  Trash2,
  Plus,
  Download,
  CheckCircle,
  Zap,
  Users,
  HardDrive,
  FileText,
  Fingerprint,
  History,
  Link2,
  Webhook,
  Cloud,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface CompanySettings {
  name: string;
  logo: string | null;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  website: string;
  currency: string;
  timezone: string;
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
}

interface NotificationSettings {
  email: {
    projects: boolean;
    tasks: boolean;
    invoices: boolean;
    reports: boolean;
    marketing: boolean;
  };
  push: {
    projects: boolean;
    tasks: boolean;
    invoices: boolean;
    reports: boolean;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessions: Array<{
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
  apiKeys: Array<{
    id: string;
    name: string;
    key: string;
    createdAt: string;
    lastUsed: string;
  }>;
}

interface BillingSettings {
  plan: {
    name: string;
    price: number;
    billing: 'monthly' | 'yearly';
    features: string[];
  };
  usage: {
    storage: { used: number; total: number };
    projects: { used: number; total: number };
    users: { used: number; total: number };
  };
  history: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    invoice: string;
  }>;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  category: 'productivity' | 'storage' | 'development' | 'communication';
}

export function SettingsPage() {
  const { language, isRTL, theme, setTheme, setLanguage, currency, setCurrency } = useApp();
  const { t } = useTranslation(language);
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState('company');
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [isCreateApiDialogOpen, setIsCreateApiDialogOpen] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');

  // Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: language === 'ar' ? 'شركة الاستشارات الهندسية' : 'Engineering Consultancy Co.',
    logo: null,
    email: 'info@blueprint.ae',
    phone: '+971 4 123 4567',
    address: language === 'ar' ? 'دبي، الإمارات العربية المتحدة' : 'Dubai, UAE',
    taxNumber: '10001-2345-6789',
    website: 'https://blueprint.ae',
    currency: 'AED',
    timezone: 'Asia/Dubai',
    workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    workingHours: { start: '08:00', end: '17:00' },
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: {
      projects: true,
      tasks: true,
      invoices: true,
      reports: false,
      marketing: false,
    },
    push: {
      projects: true,
      tasks: true,
      invoices: true,
      reports: false,
    },
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessions: [
      {
        id: '1',
        device: language === 'ar' ? 'ماك بوك برو' : 'MacBook Pro',
        browser: 'Chrome 120',
        location: language === 'ar' ? 'دبي، الإمارات' : 'Dubai, UAE',
        lastActive: new Date().toISOString(),
        current: true,
      },
      {
        id: '2',
        device: language === 'ar' ? 'آيفون 15' : 'iPhone 15',
        browser: 'Safari 17',
        location: language === 'ar' ? 'أبوظبي، الإمارات' : 'Abu Dhabi, UAE',
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        current: false,
      },
    ],
    apiKeys: [
      {
        id: '1',
        name: 'Production API Key',
        key: 'bp_live_xxxxxxxxxxxxxxxxxxxxxx',
        createdAt: '2024-01-15',
        lastUsed: new Date().toISOString(),
      },
    ],
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Billing Settings State
  const [billingSettings] = useState<BillingSettings>({
    plan: {
      name: language === 'ar' ? 'الخطة الاحترافية' : 'Professional Plan',
      price: 299,
      billing: 'monthly',
      features: language === 'ar'
        ? ['مشاريع غير محدودة', '50 مستخدم', 'تخزين 100 جيجابايت', 'دعم فني على مدار الساعة']
        : ['Unlimited Projects', '50 Users', '100GB Storage', '24/7 Support'],
    },
    usage: {
      storage: { used: 45, total: 100 },
      projects: { used: 23, total: 999 },
      users: { used: 18, total: 50 },
    },
    history: [
      {
        id: '1',
        date: '2024-01-01',
        amount: 299,
        status: 'paid',
        invoice: 'INV-2024-001',
      },
      {
        id: '2',
        date: '2023-12-01',
        amount: 299,
        status: 'paid',
        invoice: 'INV-2023-012',
      },
      {
        id: '3',
        date: '2023-11-01',
        amount: 299,
        status: 'paid',
        invoice: 'INV-2023-011',
      },
    ],
  });

  // Integrations State
  const [integrations] = useState<Integration[]>([
    {
      id: 'slack',
      name: 'Slack',
      description: language === 'ar' ? 'إرسال الإشعارات إلى قنوات سلاك' : 'Send notifications to Slack channels',
      icon: <Webhook className="w-5 h-5" />,
      connected: true,
      category: 'communication',
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: language === 'ar' ? 'مزامنة الملفات مع جوجل درايف' : 'Sync files with Google Drive',
      icon: <Cloud className="w-5 h-5" />,
      connected: true,
      category: 'storage',
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: language === 'ar' ? 'مزامنة الملفات مع دروب بوكس' : 'Sync files with Dropbox',
      icon: <HardDrive className="w-5 h-5" />,
      connected: false,
      category: 'storage',
    },
    {
      id: 'github',
      name: 'GitHub',
      description: language === 'ar' ? 'ربط مستودعات جيت هب' : 'Connect GitHub repositories',
      icon: <Link2 className="w-5 h-5" />,
      connected: false,
      category: 'development',
    },
    {
      id: 'figma',
      name: 'Figma',
      description: language === 'ar' ? 'استيراد التصاميم من فيجما' : 'Import designs from Figma',
      icon: <Palette className="w-5 h-5" />,
      connected: false,
      category: 'productivity',
    },
    {
      id: 'trello',
      name: 'Trello',
      description: language === 'ar' ? 'مزامنة المهام مع تريلو' : 'Sync tasks with Trello',
      icon: <CheckCircle className="w-5 h-5" />,
      connected: false,
      category: 'productivity',
    },
  ]);

  // Webhooks State
  const [webhooks] = useState([
    { id: '1', name: 'Project Updates', url: 'https://api.example.com/webhooks/projects', active: true },
    { id: '2', name: 'Invoice Events', url: 'https://api.example.com/webhooks/invoices', active: true },
  ]);

  // Theme options
  const themeOptions = [
    { value: 'light', label: language === 'ar' ? 'الوضع الفاتح' : 'Light Mode', icon: Sun },
    { value: 'dark', label: language === 'ar' ? 'الوضع الداكن' : 'Dark Mode', icon: Moon },
    { value: 'system', label: language === 'ar' ? 'إعدادات النظام' : 'System Default', icon: Monitor },
  ];

  // Currency options
  const currencyOptions = [
    { value: 'AED', label: language === 'ar' ? 'درهم إماراتي' : 'UAE Dirham (AED)' },
    { value: 'SAR', label: language === 'ar' ? 'ريال سعودي' : 'Saudi Riyal (SAR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'EGP', label: language === 'ar' ? 'جنيه مصري' : 'Egyptian Pound (EGP)' },
  ];

  // Timezone options
  const timezoneOptions = [
    { value: 'Asia/Dubai', label: language === 'ar' ? 'دبي (GMT+4)' : 'Dubai (GMT+4)' },
    { value: 'Asia/Riyadh', label: language === 'ar' ? 'الرياض (GMT+3)' : 'Riyadh (GMT+3)' },
    { value: 'Africa/Cairo', label: language === 'ar' ? 'القاهرة (GMT+2)' : 'Cairo (GMT+2)' },
    { value: 'UTC', label: 'UTC (GMT+0)' },
  ];

  // Working days options
  const workingDaysOptions = [
    { value: 'sunday', label: language === 'ar' ? 'الأحد' : 'Sunday' },
    { value: 'monday', label: language === 'ar' ? 'الاثنين' : 'Monday' },
    { value: 'tuesday', label: language === 'ar' ? 'الثلاثاء' : 'Tuesday' },
    { value: 'wednesday', label: language === 'ar' ? 'الأربعاء' : 'Wednesday' },
    { value: 'thursday', label: language === 'ar' ? 'الخميس' : 'Thursday' },
    { value: 'friday', label: language === 'ar' ? 'الجمعة' : 'Friday' },
    { value: 'saturday', label: language === 'ar' ? 'السبت' : 'Saturday' },
  ];

  // Handlers
  const handleSaveCompanySettings = () => {
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم حفظ إعدادات الشركة' : 'Company settings saved successfully',
    });
  };

  const handleSaveAppearance = () => {
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم حفظ إعدادات المظهر' : 'Appearance settings saved successfully',
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم حفظ إعدادات الإشعارات' : 'Notification settings saved successfully',
    });
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully',
    });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleToggleTwoFactor = () => {
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorEnabled: !prev.twoFactorEnabled,
    }));
    toast({
      title: t.successSave,
      description: securitySettings.twoFactorEnabled
        ? (language === 'ar' ? 'تم تعطيل المصادقة الثنائية' : 'Two-factor authentication disabled')
        : (language === 'ar' ? 'تم تفعيل المصادقة الثنائية' : 'Two-factor authentication enabled'),
    });
  };

  const handleRevokeSession = (sessionId: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId),
    }));
    toast({
      title: t.successDelete,
      description: language === 'ar' ? 'تم إنهاء الجلسة' : 'Session revoked',
    });
  };

  const handleCreateApiKey = () => {
    if (!newApiKeyName.trim()) return;
    
    const newKey = {
      id: Date.now().toString(),
      name: newApiKeyName,
      key: `bp_live_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: new Date().toISOString(),
    };
    
    setSecuritySettings(prev => ({
      ...prev,
      apiKeys: [...prev.apiKeys, newKey],
    }));
    
    setNewApiKeyName('');
    setIsCreateApiDialogOpen(false);
    
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم إنشاء مفتاح API جديد' : 'New API key created',
    });
  };

  const handleDeleteApiKey = (keyId: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.filter(k => k.id !== keyId),
    }));
    toast({
      title: t.successDelete,
      description: language === 'ar' ? 'تم حذف مفتاح API' : 'API key deleted',
    });
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: t.success,
      description: language === 'ar' ? 'تم نسخ المفتاح' : 'Key copied to clipboard',
    });
  };

  const handleToggleWorkingDay = (day: string) => {
    setCompanySettings(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const handleToggleIntegration = (_integrationId: string) => {
    toast({
      title: t.successSave,
      description: language === 'ar' ? 'تم تحديث التكامل' : 'Integration updated',
    });
  };

  // Translations
  const texts = {
    companySettings: language === 'ar' ? 'إعدادات الشركة' : 'Company Settings',
    appearance: language === 'ar' ? 'المظهر' : 'Appearance',
    notifications: language === 'ar' ? 'الإشعارات' : 'Notifications',
    security: language === 'ar' ? 'الأمان' : 'Security',
    billing: language === 'ar' ? 'الفوترة' : 'Billing',
    integrations: language === 'ar' ? 'التكاملات' : 'Integrations',
    companyName: language === 'ar' ? 'اسم الشركة' : 'Company Name',
    companyLogo: language === 'ar' ? 'شعار الشركة' : 'Company Logo',
    uploadLogo: language === 'ar' ? 'رفع شعار' : 'Upload Logo',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
    phone: language === 'ar' ? 'الهاتف' : 'Phone',
    address: language === 'ar' ? 'العنوان' : 'Address',
    taxNumber: language === 'ar' ? 'الرقم الضريبي' : 'Tax Number',
    website: language === 'ar' ? 'الموقع الإلكتروني' : 'Website',
    defaultCurrency: language === 'ar' ? 'العملة الافتراضية' : 'Default Currency',
    timezone: language === 'ar' ? 'المنطقة الزمنية' : 'Timezone',
    workingDays: language === 'ar' ? 'أيام العمل' : 'Working Days',
    workingHours: language === 'ar' ? 'ساعات العمل' : 'Working Hours',
    start: language === 'ar' ? 'البداية' : 'Start',
    end: language === 'ar' ? 'النهاية' : 'End',
    theme: language === 'ar' ? 'السمة' : 'Theme',
    language: language === 'ar' ? 'اللغة' : 'Language',
    arabic: language === 'ar' ? 'العربية' : 'Arabic',
    english: language === 'ar' ? 'الإنجليزية' : 'English',
    textDirection: language === 'ar' ? 'اتجاه النص' : 'Text Direction',
    rtl: language === 'ar' ? 'من اليمين لليسار' : 'Right to Left (RTL)',
    ltr: language === 'ar' ? 'من اليسار لليمين' : 'Left to Right (LTR)',
    colorScheme: language === 'ar' ? 'نظام الألوان' : 'Color Scheme',
    emailNotifications: language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications',
    pushNotifications: language === 'ar' ? 'الإشعارات الفورية' : 'Push Notifications',
    projects: language === 'ar' ? 'المشاريع' : 'Projects',
    tasks: language === 'ar' ? 'المهام' : 'Tasks',
    invoices: language === 'ar' ? 'الفواتير' : 'Invoices',
    reports: language === 'ar' ? 'التقارير' : 'Reports',
    marketing: language === 'ar' ? 'التسويق' : 'Marketing',
    changePassword: language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password',
    currentPassword: language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password',
    newPassword: language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password',
    confirmPassword: language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password',
    twoFactorAuth: language === 'ar' ? 'المصادقة الثنائية' : 'Two-Factor Authentication',
    twoFactorDesc: language === 'ar' ? 'أضف طبقة أمان إضافية لحسابك' : 'Add an extra layer of security to your account',
    activeSessions: language === 'ar' ? 'الجلسات النشطة' : 'Active Sessions',
    currentSession: language === 'ar' ? 'الجلسة الحالية' : 'Current Session',
    lastActive: language === 'ar' ? 'آخر نشاط' : 'Last Active',
    revoke: language === 'ar' ? 'إنهاء' : 'Revoke',
    apiKeys: language === 'ar' ? 'مفاتيح API' : 'API Keys',
    createApiKey: language === 'ar' ? 'إنشاء مفتاح API' : 'Create API Key',
    keyName: language === 'ar' ? 'اسم المفتاح' : 'Key Name',
    created: language === 'ar' ? 'تاريخ الإنشاء' : 'Created',
    lastUsed: language === 'ar' ? 'آخر استخدام' : 'Last Used',
    never: language === 'ar' ? 'أبداً' : 'Never',
    currentPlan: language === 'ar' ? 'الخطة الحالية' : 'Current Plan',
    usage: language === 'ar' ? 'الاستخدام' : 'Usage',
    storage: language === 'ar' ? 'التخزين' : 'Storage',
    users: language === 'ar' ? 'المستخدمين' : 'Users',
    unlimited: language === 'ar' ? 'غير محدود' : 'Unlimited',
    upgradePlan: language === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan',
    downgradePlan: language === 'ar' ? 'تخفيض الخطة' : 'Downgrade Plan',
    paymentHistory: language === 'ar' ? 'سجل المدفوعات' : 'Payment History',
    downloadInvoice: language === 'ar' ? 'تحميل الفاتورة' : 'Download Invoice',
    paid: language === 'ar' ? 'مدفوعة' : 'Paid',
    pending: language === 'ar' ? 'معلقة' : 'Pending',
    failed: language === 'ar' ? 'فشلت' : 'Failed',
    availableIntegrations: language === 'ar' ? 'التكاملات المتاحة' : 'Available Integrations',
    connectedServices: language === 'ar' ? 'الخدمات المتصلة' : 'Connected Services',
    connect: language === 'ar' ? 'اتصال' : 'Connect',
    disconnect: language === 'ar' ? 'قطع الاتصال' : 'Disconnect',
    webhooks: language === 'ar' ? 'خطافات الويب' : 'Webhooks',
    addWebhook: language === 'ar' ? 'إضافة Webhook' : 'Add Webhook',
    save: language === 'ar' ? 'حفظ' : 'Save',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    delete: language === 'ar' ? 'حذف' : 'Delete',
    create: language === 'ar' ? 'إنشاء' : 'Create',
    per: language === 'ar' ? 'شهرياً' : 'per month',
    of: language === 'ar' ? 'من' : 'of',
    gb: language === 'ar' ? 'جيجابايت' : 'GB',
  };

  // Render helper for section header
  const renderSectionHeader = (title: string, description: string) => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="text-sm text-slate-400 mt-1">{description}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t.settings}</h1>
        <p className="text-slate-400 mt-1">
          {language === 'ar' ? 'إدارة إعدادات حسابك وشركتك' : 'Manage your account and company settings'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="company" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Building2 className="w-4 h-4 me-2" />
            {texts.companySettings}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Palette className="w-4 h-4 me-2" />
            {texts.appearance}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Bell className="w-4 h-4 me-2" />
            {texts.notifications}
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Shield className="w-4 h-4 me-2" />
            {texts.security}
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <CreditCard className="w-4 h-4 me-2" />
            {texts.billing}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Plug className="w-4 h-4 me-2" />
            {texts.integrations}
          </TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company" className="space-y-6">
          {renderSectionHeader(
            texts.companySettings,
            language === 'ar' ? 'معلومات الشركة الأساسية' : 'Basic company information'
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info Card */}
            <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">{language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">{texts.companyName}</Label>
                    <Input
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">{texts.email}</Label>
                    <Input
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">{texts.phone}</Label>
                    <Input
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">{texts.website}</Label>
                    <Input
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{texts.address}</Label>
                  <Textarea
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{texts.taxNumber}</Label>
                  <Input
                    value={companySettings.taxNumber}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, taxNumber: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Logo & Settings Card */}
            <div className="space-y-6">
              {/* Logo Upload */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">{texts.companyLogo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-lg bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center relative overflow-hidden">
                      {companySettings.logo ? (
                        <Image src={companySettings.logo} alt="Logo" fill className="object-cover rounded-lg" />
                      ) : (
                        <Building2 className="w-12 h-12 text-slate-500" />
                      )}
                    </div>
                    <Button variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                      <Upload className="w-4 h-4 me-2" />
                      {texts.uploadLogo}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Currency & Timezone */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">{texts.defaultCurrency}</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-700">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">{texts.timezone}</Label>
                    <Select value={companySettings.timezone} onValueChange={(v) => setCompanySettings(prev => ({ ...prev, timezone: v }))}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {timezoneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-700">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Working Days & Hours */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">{texts.workingDays} & {texts.workingHours}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-slate-300">{texts.workingDays}</Label>
                <div className="flex flex-wrap gap-2">
                  {workingDaysOptions.map((day) => (
                    <Button
                      key={day.value}
                      variant={companySettings.workingDays.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleWorkingDay(day.value)}
                      className={companySettings.workingDays.includes(day.value)
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="space-y-2">
                  <Label className="text-slate-300">{texts.start}</Label>
                  <Input
                    type="time"
                    value={companySettings.workingHours.start}
                    onChange={(e) => setCompanySettings(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, start: e.target.value }
                    }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{texts.end}</Label>
                  <Input
                    type="time"
                    value={companySettings.workingHours.end}
                    onChange={(e) => setCompanySettings(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, end: e.target.value }
                    }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-800 pt-4">
              <Button onClick={handleSaveCompanySettings} className="bg-blue-600 hover:bg-blue-700">
                <Check className="w-4 h-4 me-2" />
                {texts.save}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          {renderSectionHeader(
            texts.appearance,
            language === 'ar' ? 'تخصيص مظهر التطبيق' : 'Customize the application appearance'
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theme Selection */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">{texts.theme}</CardTitle>
                <CardDescription className="text-slate-400">
                  {language === 'ar' ? 'اختر السمة المفضلة' : 'Choose your preferred theme'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                        ${theme === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }
                      `}
                    >
                      <option.icon className={`w-6 h-6 ${theme === option.value ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span className={`text-sm ${theme === option.value ? 'text-white' : 'text-slate-400'}`}>
                        {option.label}
                      </span>
                      {theme === option.value && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Language Selection */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">{texts.language}</CardTitle>
                <CardDescription className="text-slate-400">
                  {language === 'ar' ? 'اختر لغة الواجهة' : 'Choose the interface language'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white w-full">
                    <Globe className="w-4 h-4 me-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ar" className="text-white hover:bg-slate-700">
                      🇸🇦 {texts.arabic}
                    </SelectItem>
                    <SelectItem value="en" className="text-white hover:bg-slate-700">
                      🇺🇸 {texts.english}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-white">{texts.textDirection}</p>
                    <p className="text-xs text-slate-400">{isRTL ? texts.rtl : texts.ltr}</p>
                  </div>
                  <Badge variant="secondary" className="bg-slate-700">
                    {isRTL ? 'RTL' : 'LTR'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Color Scheme Preview */}
            <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">{texts.colorScheme}</CardTitle>
                <CardDescription className="text-slate-400">
                  {language === 'ar' ? 'معاينة نظام الألوان' : 'Color scheme preview'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Primary', color: 'bg-blue-500', textColor: 'text-blue-400' },
                    { name: 'Success', color: 'bg-green-500', textColor: 'text-green-400' },
                    { name: 'Warning', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
                    { name: 'Danger', color: 'bg-red-500', textColor: 'text-red-400' },
                  ].map((scheme) => (
                    <div key={scheme.name} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className={`w-full h-12 rounded-lg ${scheme.color} mb-3`} />
                      <p className={`text-sm font-medium ${scheme.textColor}`}>{scheme.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-slate-800 pt-4">
                <Button onClick={handleSaveAppearance} className="bg-blue-600 hover:bg-blue-700">
                  <Check className="w-4 h-4 me-2" />
                  {texts.save}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {renderSectionHeader(
            texts.notifications,
            language === 'ar' ? 'إدارة تفضيلات الإشعارات' : 'Manage your notification preferences'
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Notifications */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  {texts.emailNotifications}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'projects', label: texts.projects, icon: Building2 },
                  { key: 'tasks', label: texts.tasks, icon: CheckCircle },
                  { key: 'invoices', label: texts.invoices, icon: FileText },
                  { key: 'reports', label: texts.reports, icon: FileText },
                  { key: 'marketing', label: texts.marketing, icon: Zap },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{item.label}</span>
                    </div>
                    <Switch
                      checked={notificationSettings.email[item.key as keyof typeof notificationSettings.email]}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, [item.key]: checked }
                      }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  {texts.pushNotifications}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'projects', label: texts.projects, icon: Building2 },
                  { key: 'tasks', label: texts.tasks, icon: CheckCircle },
                  { key: 'invoices', label: texts.invoices, icon: FileText },
                  { key: 'reports', label: texts.reports, icon: FileText },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{item.label}</span>
                    </div>
                    <Switch
                      checked={notificationSettings.push[item.key as keyof typeof notificationSettings.push]}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({
                        ...prev,
                        push: { ...prev.push, [item.key]: checked }
                      }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications} className="bg-blue-600 hover:bg-blue-700">
              <Check className="w-4 h-4 me-2" />
              {texts.save}
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {renderSectionHeader(
            texts.security,
            language === 'ar' ? 'إدارة أمان حسابك' : 'Manage your account security'
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Change Password */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-yellow-400" />
                  {texts.changePassword}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{texts.currentPassword}</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{texts.newPassword}</Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{texts.confirmPassword}</Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-800 pt-4">
                <Button onClick={handlePasswordChange} className="bg-blue-600 hover:bg-blue-700">
                  {texts.save}
                </Button>
              </CardFooter>
            </Card>

            {/* Two-Factor Auth */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-green-400" />
                  {texts.twoFactorAuth}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <div>
                    <p className="text-white font-medium">{texts.twoFactorAuth}</p>
                    <p className="text-sm text-slate-400">{texts.twoFactorDesc}</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={handleToggleTwoFactor}
                  />
                </div>
                {securitySettings.twoFactorEnabled && (
                  <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">{language === 'ar' ? 'المصادقة الثنائية مفعلة' : 'Two-factor authentication is enabled'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Sessions */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-400" />
                {texts.activeSessions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-3">
                  {securitySettings.sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {session.device}
                            {session.current && (
                              <Badge variant="secondary" className="ms-2 bg-green-500/20 text-green-400">
                                {texts.currentSession}
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-slate-400">
                            {session.browser} • {session.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="text-xs text-slate-400">{texts.lastActive}</p>
                        <p className="text-sm text-slate-300">
                          {new Date(session.lastActive).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                        {!session.current && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeSession(session.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-1"
                          >
                            {texts.revoke}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-orange-400" />
                {texts.apiKeys}
              </CardTitle>
              <Dialog open={isCreateApiDialogOpen} onOpenChange={setIsCreateApiDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 me-2" />
                    {texts.createApiKey}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">{texts.createApiKey}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {language === 'ar' ? 'أدخل اسماً لمفتاح API الجديد' : 'Enter a name for your new API key'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label className="text-slate-300">{texts.keyName}</Label>
                    <Input
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                      placeholder={language === 'ar' ? 'مثال: مفتاح الإنتاج' : 'e.g., Production Key'}
                      className="mt-2 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateApiDialogOpen(false)} className="bg-slate-800 border-slate-700">
                      {texts.cancel}
                    </Button>
                    <Button onClick={handleCreateApiKey} className="bg-blue-600 hover:bg-blue-700">
                      {texts.create}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-3">
                  {securitySettings.apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{apiKey.name}</p>
                          <Badge variant="secondary" className="bg-slate-700">Active</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyApiKey(apiKey.key)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-slate-800">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">{t.confirmDelete}</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  {language === 'ar'
                                    ? 'سيؤدي هذا إلى حذف مفتاح API بشكل دائم. لا يمكن التراجع عن هذا الإجراء.'
                                    : 'This will permanently delete the API key. This action cannot be undone.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-800 border-slate-700">{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteApiKey(apiKey.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t.delete}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <code className="flex-1 px-2 py-1 rounded bg-slate-900 text-slate-300 font-mono text-xs overflow-hidden">
                          {showApiKey === apiKey.id ? apiKey.key : '••••••••••••••••••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {showApiKey === apiKey.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span>{texts.created}: {apiKey.createdAt}</span>
                        <span>{texts.lastUsed}: {texts.never}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          {renderSectionHeader(
            texts.billing,
            language === 'ar' ? 'إدارة اشتراكك ومدفوعاتك' : 'Manage your subscription and payments'
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Plan */}
            <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white">{texts.currentPlan}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{billingSettings.plan.name}</h3>
                  <p className="text-3xl font-bold text-white mt-2">
                    ${billingSettings.plan.price}
                    <span className="text-sm text-slate-400">/{texts.per}</span>
                  </p>
                  <div className="mt-4 space-y-2">
                    {billingSettings.plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 border-t border-blue-500/20 pt-4">
                <Button variant="outline" className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-700">
                  {texts.downgradePlan}
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {texts.upgradePlan}
                </Button>
              </CardFooter>
            </Card>

            {/* Usage Stats */}
            <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">{texts.usage}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Storage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300">{texts.storage}</span>
                    </div>
                    <span className="text-sm text-slate-400">
                      {billingSettings.usage.storage.used} {texts.gb} {texts.of} {billingSettings.usage.storage.total} {texts.gb}
                    </span>
                  </div>
                  <Progress value={(billingSettings.usage.storage.used / billingSettings.usage.storage.total) * 100} className="h-2" />
                </div>

                {/* Projects */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300">{texts.projects}</span>
                    </div>
                    <span className="text-sm text-slate-400">
                      {billingSettings.usage.projects.used} {texts.of} {billingSettings.usage.projects.total === 999 ? texts.unlimited : billingSettings.usage.projects.total}
                    </span>
                  </div>
                  <Progress value={(billingSettings.usage.projects.used / billingSettings.usage.projects.total) * 100} className="h-2" />
                </div>

                {/* Users */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-300">{texts.users}</span>
                    </div>
                    <span className="text-sm text-slate-400">
                      {billingSettings.usage.users.used} {texts.of} {billingSettings.usage.users.total}
                    </span>
                  </div>
                  <Progress value={(billingSettings.usage.users.used / billingSettings.usage.users.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                {texts.paymentHistory}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-start py-3 px-4 text-sm font-medium text-slate-400">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-slate-400">{language === 'ar' ? 'الفاتورة' : 'Invoice'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-slate-400">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-slate-400">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-slate-400">{language === 'ar' ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingSettings.history.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-slate-300">{payment.date}</td>
                        <td className="py-3 px-4 text-slate-300">{payment.invoice}</td>
                        <td className="py-3 px-4 text-white font-medium">${payment.amount}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className={
                              payment.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                              payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }
                          >
                            {payment.status === 'paid' ? texts.paid : payment.status === 'pending' ? texts.pending : texts.failed}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                            <Download className="w-4 h-4 me-2" />
                            {texts.downloadInvoice}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {renderSectionHeader(
            texts.integrations,
            language === 'ar' ? 'ربط التطبيقات والخدمات الخارجية' : 'Connect external apps and services'
          )}

          {/* Connected Services */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-green-400" />
                {texts.connectedServices}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.filter(i => i.connected).map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-green-400">
                        {integration.icon}
                      </div>
                      <div>
                        <p className="text-white font-medium">{integration.name}</p>
                        <p className="text-sm text-slate-400">{integration.description}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20">
                      {texts.disconnect}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Integrations */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plug className="w-5 h-5 text-blue-400" />
                {texts.availableIntegrations}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.filter(i => !i.connected).map((integration) => (
                  <div key={integration.id} className="flex flex-col p-4 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                        {integration.icon}
                      </div>
                      <div>
                        <p className="text-white font-medium">{integration.name}</p>
                        <Badge variant="secondary" className="bg-slate-700 text-xs">
                          {integration.category}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">{integration.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-auto bg-slate-800 border-slate-600 hover:bg-slate-700"
                      onClick={() => handleToggleIntegration(integration.id)}
                    >
                      {texts.connect}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Webhook className="w-5 h-5 text-purple-400" />
                {texts.webhooks}
              </CardTitle>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 me-2" />
                {texts.addWebhook}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Webhook className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{webhook.name}</p>
                        <code className="text-xs text-slate-400">{webhook.url}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={webhook.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}>
                        {webhook.active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </Badge>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
