'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SK = 'bg-muted animate-pulse rounded-md';

/**
 * ReportsSkeleton
 * Matches the reports page: summary cards, date range, report sections.
 */
interface ReportsSkeletonProps {
  className?: string;
}

export function ReportsSkeleton({ className }: ReportsSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className={cn('h-8 w-48', SK)} />
          <Skeleton className={cn('h-4 w-64', SK)} />
        </div>
        <Skeleton className={cn('h-10 w-40', SK)} />
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6">
            <div className="space-y-2">
              <Skeleton className={cn('h-10 w-10 rounded-xl', SK)} />
              <Skeleton className={cn('h-7 w-24', SK)} />
              <Skeleton className={cn('h-3 w-32', SK)} />
            </div>
          </div>
        ))}
      </div>

      {/* Date range selector */}
      <div className="flex gap-3">
        <Skeleton className={cn('h-10 w-40', SK)} />
        <Skeleton className={cn('h-10 w-40', SK)} />
        <Skeleton className={cn('h-10 w-32', SK)} />
      </div>

      {/* Report sections */}
      {/* Financial summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <Skeleton className={cn('h-5 w-48', SK)} />
          <Skeleton className={cn('h-3 w-64', SK)} />
          {/* Bar chart area */}
          <div className="flex items-end gap-3 pt-4" style={{ height: 200 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-1">
                <Skeleton className={cn('h-4 w-full', SK)} />
                <div
                  className="w-full rounded-t-sm bg-muted animate-pulse"
                  style={{ height: `${20 + Math.random() * 80}%` }}
                />
                <Skeleton className={cn('h-3 w-full', SK)} />
              </div>
            ))}
          </div>
        </div>

        {/* Donut / pie chart placeholder */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <Skeleton className={cn('h-5 w-40', SK)} />
          <Skeleton className={cn('h-3 w-56', SK)} />
          <div className="flex items-center justify-center py-4">
            <Skeleton className={cn('h-48 w-48 rounded-full', SK)} />
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className={cn('h-3 w-3 rounded-full', SK)} />
                <Skeleton className={cn('h-3 w-20', SK)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border space-y-2">
          <Skeleton className={cn('h-5 w-48', SK)} />
          <Skeleton className={cn('h-3 w-56', SK)} />
        </div>
        <div className="px-6 py-3 border-b border-border/50 grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={cn('h-4 w-full', SK)} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, r) => (
          <div key={r} className="px-6 py-3 border-b border-border/50 last:border-b-0 grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, c) => (
              <Skeleton key={c} className={cn('h-4 w-full', SK)} />
            ))}
          </div>
        ))}
      </div>

      {/* Export actions */}
      <div className="flex justify-end gap-3">
        <Skeleton className={cn('h-10 w-32', SK)} />
        <Skeleton className={cn('h-10 w-32', SK)} />
        <Skeleton className={cn('h-10 w-32', SK)} />
      </div>
    </div>
  );
}
