'use client';

import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const ProjectsPage = lazy(() =>
  import('@/components/projects/projects-page').then((m) => ({
    default: m.ProjectsPage,
  }))
);

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ProjectsRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProjectsPage />
    </Suspense>
  );
}
