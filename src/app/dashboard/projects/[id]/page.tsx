'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectWorkspace from '@/components/dashboard/project-workspace';
import { Loader2 } from 'lucide-react';

function ProjectWorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const handleBack = () => {
    router.push('/dashboard/projects');
  };

  const handleNavigate = (page: string) => {
    router.push(`/dashboard/${page}`);
  };

  return (
    <ProjectWorkspace
      projectId={projectId}
      onBack={handleBack}
      onNavigate={handleNavigate}
    />
  );
}

function ProjectWorkspaceFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-slate-400 text-sm">Loading project workspace...</p>
      </div>
    </div>
  );
}

export default function ProjectWorkspacePage() {
  return (
    <Suspense fallback={<ProjectWorkspaceFallback />}>
      <ProjectWorkspaceContent />
    </Suspense>
  );
}
