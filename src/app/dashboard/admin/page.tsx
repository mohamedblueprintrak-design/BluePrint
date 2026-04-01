'use client';

import { useApp } from '@/context/app-context';
import { AdminPage } from '@/components/admin/admin-page';
import { ActivitiesPage } from '@/components/activities/activities-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Zap } from 'lucide-react';

export default function AdminRoute() {
  const { language } = useApp();
  const isAr = language === 'ar';

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-7 h-7 text-blue-400" />
          {isAr ? 'لوحة الإدارة' : 'Admin Panel'}
        </h1>
        <p className="text-slate-400 mt-1">
          {isAr ? 'إدارة النظام والأنشطة' : 'System administration and activities'}
        </p>
      </div>

      <Tabs defaultValue="admin" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="admin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Shield className="w-4 h-4 me-2" />
            {isAr ? 'لوحة الإدارة' : 'Admin Panel'}
          </TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Zap className="w-4 h-4 me-2" />
            {isAr ? 'الأنشطة' : 'Activities'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <AdminPage />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitiesPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
