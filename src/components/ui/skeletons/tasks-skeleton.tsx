'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SK = 'bg-muted animate-pulse rounded-md';

/**
 * TasksSkeleton
 * Matches the tasks page: stats row, filter bar, task cards / board columns.
 */
interface TasksSkeletonProps {
  /** Number of task items (default 8) */
  count?: number;
  /** Display as kanban columns (default false) */
  columns?: boolean;
  className?: string;
}

export function TasksSkeleton({
  count = 8,
  columns: showColumns = false,
  className,
}: TasksSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Skeleton className={cn('h-10 w-10 rounded-lg', SK)} />
              <div className="space-y-2">
                <Skeleton className={cn('h-6 w-20', SK)} />
                <Skeleton className={cn('h-3 w-24', SK)} />
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
          <Skeleton className={cn('h-10 w-[140px] shrink-0', SK)} />
        </div>
        <div className="flex gap-2">
          <Skeleton className={cn('h-10 w-36 shrink-0', SK)} />
          <Skeleton className={cn('h-10 w-36 shrink-0', SK)} />
        </div>
      </div>

      {showColumns ? (
        /* Kanban-style columns */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['To Do', 'In Progress', 'Review', 'Done'].map((col) => (
            <div key={col} className="bg-card/50 border border-border rounded-xl p-4 space-y-3">
              {/* Column header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className={cn('h-3 w-3 rounded-full', SK)} />
                  <Skeleton className={cn('h-4 w-20', SK)} />
                </div>
                <Skeleton className={cn('h-5 w-6 rounded-full', SK)} />
              </div>
              {/* Cards */}
              {Array.from({ length: Math.ceil(count / 4) }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-3 space-y-2">
                  <Skeleton className={cn('h-4 w-full', SK)} />
                  <div className="flex gap-2">
                    <Skeleton className={cn('h-5 w-16', SK)} />
                    <Skeleton className={cn('h-5 w-14', SK)} />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className={cn('h-3 w-20', SK)} />
                    <Skeleton className={cn('h-6 w-6 rounded-full', SK)} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                {/* Priority dot */}
                <Skeleton className={cn('h-3 w-3 rounded-full shrink-0', SK)} />
                {/* Task info */}
                <div className="flex-1 space-y-1.5">
                  <Skeleton className={cn('h-4 w-3/4', SK)} />
                  <div className="flex gap-2">
                    <Skeleton className={cn('h-3 w-24', SK)} />
                    <Skeleton className={cn('h-3 w-20', SK)} />
                  </div>
                </div>
                {/* Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <Skeleton className={cn('h-5 w-16', SK)} />
                  <Skeleton className={cn('h-5 w-14', SK)} />
                  <Skeleton className={cn('h-4 w-16', SK)} />
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
