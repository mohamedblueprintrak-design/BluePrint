'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SK = 'bg-slate-800 animate-pulse rounded-md';

/**
 * ClientsSkeleton
 * Matches the clients page: stat cards, filter bar, client list/grid.
 */
interface ClientsSkeletonProps {
  /** Display mode (default "list") */
  view?: 'list' | 'grid';
  /** Number of items (default 6) */
  count?: number;
  className?: string;
}

export function ClientsSkeleton({
  view = 'list',
  count = 6,
  className,
}: ClientsSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Skeleton className={cn('h-10 w-10 rounded-lg', SK)} />
              <div className="space-y-2">
                <Skeleton className={cn('h-6 w-24', SK)} />
                <Skeleton className={cn('h-3 w-20', SK)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full md:w-auto">
          <Skeleton className={cn('h-10 flex-1 min-w-[200px]', SK)} />
          <Skeleton className={cn('h-10 w-[140px] shrink-0', SK)} />
        </div>
        <Skeleton className={cn('h-10 w-36 shrink-0', SK)} />
      </div>

      {/* Items */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <Skeleton className={cn('h-12 w-12 rounded-full shrink-0', SK)} />
                <div className="space-y-2 flex-1">
                  <Skeleton className={cn('h-5 w-36', SK)} />
                  <Skeleton className={cn('h-3 w-24', SK)} />
                </div>
              </div>
              {/* Contact info */}
              <div className="space-y-2">
                <Skeleton className={cn('h-4 w-40', SK)} />
                <Skeleton className={cn('h-4 w-32', SK)} />
                <Skeleton className={cn('h-4 w-48', SK)} />
              </div>
              {/* Stats */}
              <div className="flex gap-4 pt-2">
                <Skeleton className={cn('h-8 w-20', SK)} />
                <Skeleton className={cn('h-8 w-20', SK)} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <Skeleton className={cn('h-10 w-10 rounded-full shrink-0', SK)} />
                <div className="flex-1 space-y-2">
                  <Skeleton className={cn('h-4 w-48', SK)} />
                  <Skeleton className={cn('h-3 w-32', SK)} />
                </div>
                <Skeleton className={cn('h-4 w-24', SK)} />
                <Skeleton className={cn('h-4 w-24', SK)} />
                <Skeleton className={cn('h-6 w-20', SK)} />
                <div className="flex gap-1">
                  <Skeleton className={cn('h-8 w-8', SK)} />
                  <Skeleton className={cn('h-8 w-8', SK)} />
                  <Skeleton className={cn('h-8 w-8', SK)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
