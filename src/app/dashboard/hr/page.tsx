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
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-7 h-7 text-emerald-400" />
          {isAr ? 'الموارد البشرية' : 'Human Resources'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr ? 'إدارة الموظفين، الفريق، والأحمال' : 'Manage employees, team, and workload'}
        </p>
      </div>

      <Tabs defaultValue="hr" className="space-y-6">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="hr" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-foreground">
            <Users className="w-4 h-4 me-2" />
            {isAr ? 'الموارد البشرية' : 'HR'}
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground">
            <UserCog className="w-4 h-4 me-2" />
            {isAr ? 'الفريق' : 'Team'}
          </TabsTrigger>
          <TabsTrigger value="workload" className="data-[state=active]:bg-violet-600 data-[state=active]:text-foreground">
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
