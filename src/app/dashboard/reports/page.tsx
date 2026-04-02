'use client';

import { Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const ReportsPage = lazy(() =>
  import('@/components/reports/reports-page').then((m) => ({
    default: m.ReportsPage,
  }))
);

const SecretarialPage = lazy(() =>
  import('@/app/dashboard/meetings/page').then((m) => ({
    default: m.default,
  }))
);

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function ReportsTabContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  if (tabParam === 'meetings') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <SecretarialPage />
      </Suspense>
    );
  }

  return (
    <div className="p-6">
      <Suspense fallback={<LoadingSpinner />}>
        <ReportsPage />
      </Suspense>
    </div>
  );
}

export default function ReportsRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ReportsTabContent />
    </Suspense>
  );
}
