'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Zap } from 'lucide-react';

// Lazy load components
const SettingsPage = lazy(() =>
  import('@/components/settings/settings-page').then((m) => ({
    default: m.SettingsPage,
  }))
);
const AutomationsPage = lazy(
  () => import('@/components/automations/automations-page')
);

function SettingsTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'settings');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'settings') {
      router.replace('/dashboard/settings');
    } else {
      router.replace('/dashboard/settings?tab=automations');
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
        <TabsTrigger
          value="automations"
          className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
        >
          <Zap className="w-4 h-4 me-2" />
          الأتمتة
        </TabsTrigger>
      </TabsList>
      <TabsContent value="settings">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          }
        >
          <SettingsPage />
        </Suspense>
      </TabsContent>
      <TabsContent value="automations">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          }
        >
          <AutomationsPage />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}

export default function SettingsRoute() {
  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        }
      >
        <SettingsTabs />
      </Suspense>
    </div>
  );
}
