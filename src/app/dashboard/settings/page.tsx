'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Zap } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
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

  const isManagerOrAdmin = [UserRole.ADMIN, UserRole.MANAGER].includes(user?.role as UserRole);

  useEffect(() => {
    if (tabParam) {
      // Only accept valid tab values
      if (['settings', 'automations'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      // Backward compat: if someone navigates to ?tab=admin, redirect to /dashboard/admin
      if (tabParam === 'admin') {
        router.replace('/dashboard/admin');
      }
    }
  }, [tabParam, router]);

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
    </Tabs>
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
