'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ── Shared skeleton fill class for dark theme ──
const SK = 'bg-muted animate-pulse rounded-md';

// ── PageSkeleton ──
// Full page skeleton with a header bar and a content area.
interface PageSkeletonProps {
  /** Number of rows in the content area (default 5) */
  rows?: number;
  /** Include a stat-cards row at the top (default true) */
  showStats?: boolean;
  className?: string;
}

export function PageSkeleton({
  rows = 5,
  showStats = true,
  className,
}: PageSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page title + action row */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className={cn('h-8 w-48', SK)} />
          <Skeleton className={cn('h-4 w-72', SK)} />
        </div>
        <Skeleton className={cn('h-10 w-36', SK)} />
      </div>

      {/* Stats row */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Content rows */}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ── StatSkeleton ──
// Single stat card (icon + value + label) matching dashboard stat layout.
interface StatSkeletonProps {
  className?: string;
}

export function StatSkeleton({ className }: StatSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <Skeleton className={cn('h-10 w-10 rounded-xl', SK)} />
        <Skeleton className={cn('h-4 w-12', SK)} />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className={cn('h-7 w-24', SK)} />
        <Skeleton className={cn('h-4 w-32', SK)} />
      </div>
    </div>
  );
}

// ── CardSkeleton ──
// Skeleton card (horizontal layout: avatar + text lines).
interface CardSkeletonProps {
  /** Include an avatar circle on the left (default true) */
  showAvatar?: boolean;
  /** Number of text lines (default 2) */
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  showAvatar = true,
  lines = 2,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-4',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {showAvatar && <Skeleton className={cn('h-10 w-10 rounded-lg shrink-0', SK)} />}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'h-4',
                i === 0 ? 'w-3/4' : 'w-1/2',
                SK,
              )}
            />
          ))}
        </div>
        <Skeleton className={cn('h-6 w-16 shrink-0', SK)} />
      </div>
    </div>
  );
}

// ── TableSkeleton ──
// Skeleton table with header + body rows.
interface TableSkeletonProps {
  /** Number of body rows (default 5) */
  rows?: number;
  /** Number of columns (default 5) */
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="grid gap-4 border-b border-border px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
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
  );
}

// ── FormSkeleton ──
// Skeleton form with label + input pairs.
interface FormSkeletonProps {
  /** Number of field rows (default 4) */
  fields?: number;
  /** Columns for the last row (default 1) */
  lastRowCols?: number;
  className?: string;
}

export function FormSkeleton({
  fields = 4,
  lastRowCols = 1,
  className,
}: FormSkeletonProps) {
  const rows = Math.max(1, fields - 1);
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className={cn('h-4 w-24', SK)} />
            <Skeleton className={cn('h-10 w-full', SK)} />
          </div>
          <div className="space-y-2">
            <Skeleton className={cn('h-4 w-24', SK)} />
            <Skeleton className={cn('h-10 w-full', SK)} />
          </div>
        </div>
      ))}
      {/* Last row with custom column count */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${lastRowCols}, minmax(0, 1fr))` }}>
        {Array.from({ length: lastRowCols }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className={cn('h-4 w-24', SK)} />
            <Skeleton className={cn('h-10 w-full', SK)} />
          </div>
        ))}
      </div>
      {/* Submit button */}
      <div className="flex justify-end gap-3 pt-2">
        <Skeleton className={cn('h-10 w-24', SK)} />
        <Skeleton className={cn('h-10 w-32', SK)} />
      </div>
    </div>
  );
}

// ── ChartSkeleton ──
// Skeleton chart placeholder with an axis and bars/lines area.
interface ChartSkeletonProps {
  /** Chart height in px (default 300) */
  height?: number;
  className?: string;
}

export function ChartSkeleton({ height = 300, className }: ChartSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-6 space-y-4',
        className,
      )}
    >
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className={cn('h-5 w-40', SK)} />
        <Skeleton className={cn('h-3 w-56', SK)} />
      </div>

      {/* Chart area */}
      <div className="flex items-end gap-2" style={{ height: `${height - 80}px` }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn('flex-1 rounded-t-sm', SK)}
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3 flex-1', SK)} />
        ))}
      </div>
    </div>
  );
}

// ── GridSkeleton ──
// A responsive grid of CardSkeletons (useful for project / client grids).
interface GridSkeletonProps {
  /** Number of cards (default 6) */
  count?: number;
  /** Responsive columns classes (default "md:grid-cols-2 lg:grid-cols-3") */
  columns?: string;
  className?: string;
}

export function GridSkeleton({
  count = 6,
  columns = 'md:grid-cols-2 lg:grid-cols-3',
  className,
}: GridSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-6', columns, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className={cn('h-4 w-16', SK)} />
              <Skeleton className={cn('h-5 w-48', SK)} />
            </div>
            <Skeleton className={cn('h-6 w-20', SK)} />
          </div>
          {/* Detail lines */}
          <div className="space-y-2">
            <Skeleton className={cn('h-4 w-36', SK)} />
            <Skeleton className={cn('h-4 w-28', SK)} />
          </div>
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className={cn('h-3 w-16', SK)} />
              <Skeleton className={cn('h-3 w-8', SK)} />
            </div>
            <Skeleton className={cn('h-2 w-full', SK)} />
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <Skeleton className={cn('h-3 w-24', SK)} />
            <div className="flex gap-1">
              <Skeleton className={cn('h-8 w-8 rounded-md', SK)} />
              <Skeleton className={cn('h-8 w-8 rounded-md', SK)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
