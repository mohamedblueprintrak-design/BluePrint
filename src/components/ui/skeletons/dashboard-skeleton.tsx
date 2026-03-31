'use client';

import { StatSkeleton, ChartSkeleton, CardSkeleton } from '@/components/ui/page-skeleton';

/**
 * DashboardSkeleton
 * Matches the main dashboard layout: welcome banner, stat cards, charts, recent items.
 */
interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-xl h-32 animate-pulse bg-slate-800" />

      {/* Stat cards row (4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      {/* Charts row 1 (2 charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height={300} />
        <ChartSkeleton height={300} />
      </div>

      {/* Charts row 2 (2 charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height={260} />
        <ChartSkeleton height={260} />
      </div>

      {/* Main content: recent list + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent list */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <div className="h-5 w-24 animate-pulse bg-slate-800 rounded-md" />
              <div className="h-3 w-40 animate-pulse bg-slate-800 rounded-md" />
            </div>
            <div className="h-8 w-20 animate-pulse bg-slate-800 rounded-md" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="h-5 w-28 animate-pulse bg-slate-800 rounded-md" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse bg-slate-800 rounded-md" />
              ))}
            </div>
          </div>

          {/* Defects card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="h-12 w-12 animate-pulse bg-slate-800 rounded-full mb-3" />
            <div className="h-8 w-16 animate-pulse bg-slate-800 rounded-md mb-2" />
            <div className="h-3 w-32 animate-pulse bg-slate-800 rounded-md" />
          </div>
        </div>
      </div>

      {/* Bottom row: pending tasks + invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-28 animate-pulse bg-slate-800 rounded-md" />
            <div className="h-8 w-20 animate-pulse bg-slate-800 rounded-md" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} showAvatar={false} lines={1} />
          ))}
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 animate-pulse bg-slate-800 rounded-md" />
            <div className="h-8 w-20 animate-pulse bg-slate-800 rounded-md" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      </div>
    </div>
  );
}
