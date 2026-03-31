'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { StatSkeleton, GridSkeleton } from '@/components/ui/page-skeleton';
import { cn } from '@/lib/utils';

const SK = 'bg-slate-800 animate-pulse rounded-md';

/**
 * ProjectsSkeleton
 * Matches the projects page: stats row, filter bar, project card grid.
 */
interface ProjectsSkeletonProps {
  /** Number of project cards (default 6) */
  count?: number;
  className?: string;
}

export function ProjectsSkeleton({ count = 6, className }: ProjectsSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats row – 5 stat cards for projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>

      {/* Filter bar + action button */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full md:w-auto">
          {/* Search */}
          <Skeleton className={cn('h-10 flex-1 min-w-[200px]', SK)} />
          {/* Status filter */}
          <Skeleton className={cn('h-10 w-[140px] shrink-0', SK)} />
          {/* Type filter */}
          <Skeleton className={cn('h-10 w-[140px] shrink-0', SK)} />
        </div>
        <Skeleton className={cn('h-10 w-36 shrink-0', SK)} />
      </div>

      {/* Project cards grid */}
      <GridSkeleton count={count} columns="md:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}
