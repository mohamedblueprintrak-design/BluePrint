'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SK = 'bg-muted animate-pulse rounded-md';

/**
 * InvoicesSkeleton
 * Matches the invoices page: stat cards, filter bar, full-width table.
 */
interface InvoicesSkeletonProps {
  /** Number of table rows (default 6) */
  rows?: number;
  /** Number of table columns (default 9) */
  columns?: number;
  className?: string;
}

export function InvoicesSkeleton({
  rows = 6,
  columns = 9,
  className,
}: InvoicesSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stat cards row – 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Skeleton className={cn('h-10 flex-1', SK)} />
          <Skeleton className={cn('h-10 w-[160px]', SK)} />
          <Skeleton className={cn('h-10 w-[180px]', SK)} />
          <Skeleton className={cn('h-10 w-[150px]', SK)} />
          <Skeleton className={cn('h-10 w-[150px]', SK)} />
        </div>
        <div className="flex justify-end">
          <Skeleton className={cn('h-10 w-36', SK)} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div
          className="grid gap-4 border-b border-border px-4 py-3"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className={cn('h-4 w-full', SK)} />
          ))}
        </div>
        {/* Body */}
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-4 border-b border-border/50 last:border-b-0 px-4 py-3"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className={cn('h-4 w-full', SK)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
