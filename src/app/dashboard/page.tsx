'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { Loader2 } from 'lucide-react';

export default function DashboardPageRoute() {
  const { user } = useAuth();
  const router = useRouter();
  const role = user?.role;

  // Smart Default: Engineers go to Operations Center for task-focused view
  // Admin/Manager/Accountant stay on Dashboard for financial overview
  useEffect(() => {
    if (role === 'ENGINEER' || role === 'DRAFTSMAN') {
      router.replace('/dashboard/operations');
    }
  }, [role, router]);

  // Show loading while redirecting engineers
  if (role === 'ENGINEER' || role === 'DRAFTSMAN') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-slate-400 text-sm">
            {user?.language === 'ar' ? 'جاري التحويل لمركز العمليات...' : 'Redirecting to Operations Center...'}
          </p>
        </div>
      </div>
    );
  }

  return <DashboardPage />;
}
