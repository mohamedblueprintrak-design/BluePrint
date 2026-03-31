'use client';

import { useApp } from '@/context/app-context';
import { SiteDiaryPage } from '@/components/site-diary/site-diary-page';
import { DefectsPage } from '@/components/defects/defects-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, AlertTriangle } from 'lucide-react';

export default function SiteManagementPage() {
  const { language } = useApp();
  const isRTL = language === 'ar';

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-blue-400" />
          {isRTL ? 'إدارة الموقع' : 'Site Management'}
        </h1>
        <p className="text-slate-400 mt-1">{isRTL ? 'تقارير الموقع والعيوب والمخالفات' : 'Site diary, defects and snag tracking'}</p>
      </div>
      <Tabs defaultValue="diary" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="bg-slate-800 w-full sm:w-auto">
          <TabsTrigger value="diary" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <ClipboardList className="w-4 h-4" />
            {isRTL ? 'يومية الموقع' : 'Site Diary'}
          </TabsTrigger>
          <TabsTrigger value="defects" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <AlertTriangle className="w-4 h-4" />
            {isRTL ? 'العيوب' : 'Defects'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="diary" className="mt-4">
          <SiteDiaryPage />
        </TabsContent>
        <TabsContent value="defects" className="mt-4">
          <DefectsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
