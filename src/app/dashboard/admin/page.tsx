'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, Activity } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { UserRole } from '@/types';

// Lazy load components
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

function AdminTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useApp();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'admin');
  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (tabParam) {
      if (['admin', 'activities'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'admin') {
      router.replace('/dashboard/admin');
    } else {
      router.replace(`/dashboard/admin?tab=${value}`);
    }
  };

  if (!isAdmin) return null;

  const isAr = language === 'ar';

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            {isAr ? 'الإدارة' : 'Administration'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isAr ? 'إدارة النظام والنشاطات' : 'System administration and activities'}
          </p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="admin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground">
            <Shield className="w-4 h-4 me-2" />
            {isAr ? 'لوحة الإدارة' : 'Admin Panel'}
          </TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-amber-600 data-[state=active]:text-foreground">
            <Activity className="w-4 h-4 me-2" />
            {isAr ? 'النشاطات' : 'Activities'}
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

export default function AdminRoute() {
  return (
    <div className="p-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }>
        <AdminTabs />
      </Suspense>
    </div>
  );
}
