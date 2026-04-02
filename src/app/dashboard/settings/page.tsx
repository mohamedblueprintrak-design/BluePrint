'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Zap, Shield } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { UserRole } from '@/types';

// Lazy load components
const SettingsPage = lazy(() =>
  import('@/components/settings/settings-page').then((m) => ({
    default: m.SettingsPage,
  }))
);
const AutomationsPage = lazy(
  () => import('@/components/automations/automations-page')
);
const AdminPageWrapper = lazy(
  () => import('@/components/admin/admin-page').then((m) => ({
    default: function AdminTab() {
      return <m.AdminPage />;
    },
  }))
);
const ActivitiesPage = lazy(
  () => import('@/components/activities/activities-page').then((m) => ({
    default: m.ActivitiesPage,
  }))
);

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}

function SettingsTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'settings');

  const isAdmin = user?.role === UserRole.ADMIN;
  const isManagerOrAdmin = [UserRole.ADMIN, UserRole.MANAGER].includes(user?.role as UserRole);

  useEffect(() => {
    if (tabParam) {
      // Only accept valid tab values
      if (['settings', 'automations', 'admin'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'settings') {
      router.replace('/dashboard/settings');
    } else {
      router.replace(`/dashboard/settings?tab=${value}`);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-auto">
        <TabsTrigger
          value="settings"
          className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
        >
          <Settings className="w-4 h-4 me-2" />
          الإعدادات
        </TabsTrigger>
        {isManagerOrAdmin && (
          <TabsTrigger
            value="automations"
            className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
          >
            <Zap className="w-4 h-4 me-2" />
            الأتمتة
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger
            value="admin"
            className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
          >
            <Shield className="w-4 h-4 me-2" />
            إدارة النظام
          </TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="settings">
        <Suspense fallback={<LoadingFallback />}>
          <SettingsPage />
        </Suspense>
      </TabsContent>
      <TabsContent value="automations">
        <Suspense fallback={<LoadingFallback />}>
          <AutomationsPage />
        </Suspense>
      </TabsContent>
      <TabsContent value="admin">
        <Suspense fallback={<LoadingFallback />}>
          <AdminTabs />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}

/** Inner admin tabs: Admin Panel + Activities */
function AdminTabs() {
  const { user } = useAuth();
  const { language } = useApp();
  const isAdmin = user?.role === UserRole.ADMIN;

  if (!isAdmin) return null;

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            {language === 'ar' ? 'إدارة النظام' : 'System Admin'}
          </h2>
          <p className="text-slate-400 mt-1">
            {language === 'ar' ? 'إدارة النظام والأنشطة' : 'System administration and activities'}
          </p>
        </div>
      </div>
      <Tabs defaultValue="admin" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="admin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Shield className="w-4 h-4 me-2" />
            {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
          </TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Zap className="w-4 h-4 me-2" />
            {language === 'ar' ? 'النشاطات' : 'Activities'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="admin">
          <Suspense fallback={<LoadingFallback />}>
            <AdminPageWrapper />
          </Suspense>
        </TabsContent>
        <TabsContent value="activities">
          <Suspense fallback={<LoadingFallback />}>
            <ActivitiesPage />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsRoute() {
  return (
    <div className="p-6">
      <Suspense fallback={<LoadingFallback />}>
        <SettingsTabs />
      </Suspense>
    </div>
  );
}
