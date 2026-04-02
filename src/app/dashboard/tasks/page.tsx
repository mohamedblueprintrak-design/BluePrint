'use client';

import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

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

export default function TasksRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TasksPage />
    </Suspense>
  );
}
