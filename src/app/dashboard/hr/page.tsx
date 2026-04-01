'use client';

import { useApp } from '@/context/app-context';
import { HRPage } from '@/components/hr/hr-page';
import TeamPage from '@/components/team/team-page';
import WorkloadPage from '@/components/workload/workload-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCog, Briefcase } from 'lucide-react';

export default function HRRoute() {
  const { language } = useApp();
  const isAr = language === 'ar';

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-7 h-7 text-emerald-400" />
          {isAr ? 'الموارد البشرية' : 'Human Resources'}
        </h1>
        <p className="text-slate-400 mt-1">
          {isAr ? 'إدارة الموظفين، الفريق، والأحمال' : 'Manage employees, team, and workload'}
        </p>
      </div>

      <Tabs defaultValue="hr" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="hr" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 me-2" />
            {isAr ? 'الموارد البشرية' : 'HR'}
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <UserCog className="w-4 h-4 me-2" />
            {isAr ? 'الفريق' : 'Team'}
          </TabsTrigger>
          <TabsTrigger value="workload" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Briefcase className="w-4 h-4 me-2" />
            {isAr ? 'الأحمال والقدرات' : 'Workload'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hr">
          <HRPage />
        </TabsContent>

        <TabsContent value="team">
          <TeamPage />
        </TabsContent>

        <TabsContent value="workload">
          <WorkloadPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
