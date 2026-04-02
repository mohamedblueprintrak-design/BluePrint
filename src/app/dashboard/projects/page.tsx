'use client';

import { Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';

const ProjectsPage = lazy(() =>
  import('@/components/projects/projects-page').then((m) => ({
    default: m.ProjectsPage,
  }))
);
const TasksPage = lazy(() =>
  import('@/components/tasks/tasks-page').then((m) => ({
    default: m.TasksPage,
  }))
);

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function ProjectsTabContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { language } = useApp();
  const { t } = useTranslation(language);

  const defaultTab = tabParam === 'tasks' ? 'tasks' : 'projects';

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="projects">{t.projects}</TabsTrigger>
        <TabsTrigger value="tasks">{t.tasks}</TabsTrigger>
      </TabsList>
      <TabsContent value="projects">
        <Suspense fallback={<LoadingSpinner />}>
          <ProjectsPage />
        </Suspense>
      </TabsContent>
      <TabsContent value="tasks">
        <Suspense fallback={<LoadingSpinner />}>
          <TasksPage />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}

export default function ProjectsRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProjectsTabContent />
    </Suspense>
  );
}
