/**
 * @module components/common/loading-states
 * @description Comprehensive loading skeleton components for the BluePrint SaaS platform.
 * Provides animated skeleton placeholders for all common UI patterns using shadcn/ui Skeleton,
 * Framer Motion for smooth transitions, and RTL support.
 *
 * All components accept an optional `className` prop for customization.
 * All animations use Framer Motion for smooth enter/exit transitions.
 *
 * @example
 * ```tsx
 * // Page-level loading
 * <PageLoader />
 *
 * // Table loading
 * <TableSkeleton rows={10} columns={5} />
 *
 * // Dashboard loading
 * <DashboardSkeleton />
 * ```
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Animation Variants ──────────────────────────────────────────────────────

/** Fade-in animation for skeleton containers */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/** Individual skeleton item animation */
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── PageLoader ──────────────────────────────────────────────────────────────

/**
 * Full page loading state with a progress bar indicator.
 * Use at the page level to indicate that the entire page content is loading.
 *
 * @example
 * ```tsx
 * if (isLoading) return <PageLoader message="Loading projects..." />;
 * ```
 */
export function PageLoader({
  message,
  className,
  progress,
}: {
  /** Optional loading message displayed below the progress bar */
  message?: string;
  /** Optional progress percentage (0-100). If not provided, shows indeterminate bar. */
  progress?: number;
  /** Additional CSS classes */
  className?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8',
        className
      )}
      role="status"
      aria-label={message ?? 'Loading'}
    >
      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn('h-full rounded-full bg-primary')}
            initial={{ width: '0%' }}
            animate={
              progress !== undefined
                ? { width: `${progress}%` }
                : {
                    width: ['0%', '60%', '100%'],
                    transition: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
            }
            style={
              progress !== undefined ? undefined : { marginLeft: '-100%' }
            }
          />
        </div>
      </div>

      {/* Skeleton content */}
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-4 w-48" />
        {message && (
          <motion.p
            variants={itemVariants}
            className="text-muted-foreground text-sm"
          >
            {message}
          </motion.p>
        )}
      </div>

      {/* Screen reader text */}
      <span className="sr-only">{message ?? 'Loading, please wait...'}</span>
    </motion.div>
  );
}

// ─── TableSkeleton ───────────────────────────────────────────────────────────

/**
 * Data table skeleton placeholder.
 * Mimics the appearance of a data table with header and row placeholders.
 *
 * @example
 * ```tsx
 * <TableSkeleton rows={8} columns={5} />
 * ```
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  /** Number of table rows to show (default: 5) */
  rows?: number;
  /** Number of table columns (default: 4) */
  columns?: number;
  /** Additional CSS classes */
  className?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('w-full space-y-3', className)}
      role="status"
      aria-label="Loading table data"
    >
      {/* Header row */}
      <motion.div variants={itemVariants} className="flex gap-4 px-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`header-${i}`}
            className={cn(
              'h-4 flex-1',
              i === 0 && 'max-w-[60px] flex-none', // Checkbox column
              i === columns - 1 && 'max-w-[80px] flex-none' // Actions column
            )}
          />
        ))}
      </motion.div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div
          key={`row-${rowIndex}`}
          variants={itemVariants}
          className="flex items-center gap-4 rounded-lg border px-4 py-3"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                'h-4 flex-1',
                colIndex === 0 && 'max-w-[60px] flex-none',
                colIndex === columns - 1 && 'max-w-[80px] flex-none'
              )}
            />
          ))}
        </motion.div>
      ))}

      <span className="sr-only">Loading table data...</span>
    </motion.div>
  );
}

// ─── CardSkeleton ────────────────────────────────────────────────────────────

/**
 * Card content skeleton placeholder.
 * Mimics a card with header, description, and optional content area.
 *
 * @example
 * ```tsx
 * <CardSkeleton />
 * <CardSkeleton lines={4} showAvatar />
 * ```
 */
export function CardSkeleton({
  lines = 3,
  showAvatar = false,
  className,
}: {
  /** Number of text lines in the card body (default: 3) */
  lines?: number;
  /** Whether to show an avatar circle (default: false) */
  showAvatar?: boolean;
  /** Additional CSS classes */
  className?: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'rounded-xl border bg-card py-6 shadow-sm',
        className
      )}
      role="status"
      aria-label="Loading card content"
    >
      <div className="flex items-start gap-6 px-6">
        {/* Avatar */}
        {showAvatar && (
          <Skeleton className="size-10 shrink-0 rounded-full" />
        )}

        {/* Content */}
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={`line-${i}`}
              className={cn(
                'h-3.5',
                i === lines - 1 ? 'w-2/3' : 'w-full'
              )}
            />
          ))}
        </div>
      </div>

      {/* Optional footer */}
      {lines > 2 && (
        <div className="mt-4 flex items-center gap-2 px-6 pt-4">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      )}

      <span className="sr-only">Loading card content...</span>
    </motion.div>
  );
}

// ─── FormSkeleton ────────────────────────────────────────────────────────────

/**
 * Form fields skeleton placeholder.
 * Shows input field placeholders with labels, mimicking a form layout.
 *
 * @example
 * ```tsx
 * <FormSkeleton fields={6} />
 * ```
 */
export function FormSkeleton({
  fields = 4,
  className,
}: {
  /** Number of form fields to show (default: 4) */
  fields?: number;
  /** Additional CSS classes */
  className?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('space-y-6', className)}
      role="status"
      aria-label="Loading form"
    >
      {Array.from({ length: fields }).map((_, i) => (
        <motion.div
          key={`field-${i}`}
          variants={itemVariants}
          className="space-y-2"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
          {/* Every 3rd field gets a hint text */}
          {i % 3 === 0 && <Skeleton className="h-3 w-64" />}
        </motion.div>
      ))}

      {/* Submit button */}
      <motion.div variants={itemVariants} className="flex gap-3 pt-2">
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </motion.div>

      <span className="sr-only">Loading form...</span>
    </motion.div>
  );
}

// ─── ChartSkeleton ───────────────────────────────────────────────────────────

/**
 * Chart placeholder skeleton.
 * Mimics a chart area with axes, grid lines, and a legend.
 *
 * @example
 * ```tsx
 * <ChartSkeleton />
 * ```
 */
export function ChartSkeleton({
  className,
  showLegend = true,
}: {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show a legend row (default: true) */
  showLegend?: boolean;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('rounded-xl border p-6', className)}
      role="status"
      aria-label="Loading chart"
    >
      {/* Title */}
      <Skeleton className="mb-6 h-5 w-40" />

      {/* Chart area */}
      <div className="flex items-end gap-2" style={{ height: '200px' }}>
        {/* Y-axis labels */}
        <div className="flex h-full flex-col justify-between pr-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>

        {/* Bars / chart content */}
        <div className="flex flex-1 items-end justify-between gap-2 border-b border-l border-muted-foreground/20 pb-1 pl-1">
          {Array.from({ length: 7 }).map((_, i) => {
            const heights = [60, 85, 45, 90, 70, 55, 80];
            return (
              <motion.div
                key={`bar-${i}`}
                variants={itemVariants}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <Skeleton
                  className="w-full rounded-t-sm"
                  style={{ height: `${heights[i]}%`, minHeight: '20px' }}
                />
                <Skeleton className="h-3 w-6" />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Skeleton className="size-3 rounded-sm" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-3 rounded-sm" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      )}

      <span className="sr-only">Loading chart data...</span>
    </motion.div>
  );
}

// ─── DashboardSkeleton ───────────────────────────────────────────────────────

/**
 * Full dashboard loading state.
 * Shows a realistic dashboard layout with stat cards, chart, and table.
 *
 * @example
 * ```tsx
 * if (isLoading) return <DashboardSkeleton />;
 * ```
 */
export function DashboardSkeleton({
  className,
}: {
  /** Additional CSS classes */
  className?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('space-y-6', className)}
      role="status"
      aria-label="Loading dashboard"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </motion.div>

      {/* Stats cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`stat-${i}`}
            variants={itemVariants}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-8 rounded-md" />
            </div>
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton showLegend={false} />
      </div>

      {/* Table section */}
      <div className="space-y-3">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </motion.div>
        <TableSkeleton rows={5} columns={4} />
      </div>

      <span className="sr-only">Loading dashboard content...</span>
    </motion.div>
  );
}

// ─── ListSkeleton ────────────────────────────────────────────────────────────

/**
 * List item skeleton placeholder.
 * Shows a list of items with optional avatars and metadata.
 *
 * @example
 * ```tsx
 * <ListSkeleton items={8} showAvatar />
 * ```
 */
export function ListSkeleton({
  items = 5,
  showAvatar = false,
  className,
}: {
  /** Number of list items (default: 5) */
  items?: number;
  /** Whether each item shows an avatar (default: false) */
  showAvatar?: boolean;
  /** Additional CSS classes */
  className?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('divide-y rounded-lg border', className)}
      role="status"
      aria-label="Loading list"
    >
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={`item-${i}`}
          variants={itemVariants}
          className="flex items-center gap-4 p-4"
        >
          {/* Avatar */}
          {showAvatar && (
            <Skeleton className="size-10 shrink-0 rounded-full" />
          )}

          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>

          {/* Metadata / action */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </motion.div>
      ))}

      <span className="sr-only">Loading list items...</span>
    </motion.div>
  );
}

// ─── TextSkeleton ────────────────────────────────────────────────────────────

/**
 * Text block skeleton placeholder.
 * Shows multiple lines of varying widths to mimic paragraph text.
 *
 * @example
 * ```tsx
 * <TextSkeleton lines={4} />
 * ```
 */
export function TextSkeleton({
  lines = 3,
  className,
  lineClassName,
}: {
  /** Number of text lines (default: 3) */
  lines?: number;
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for each line */
  lineClassName?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('space-y-2', className)}
      role="status"
      aria-label="Loading text content"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={`text-line-${i}`}
          variants={itemVariants}
          className={cn('flex gap-2')}
        >
          <Skeleton
            className={cn(
              'h-3.5',
              i === lines - 1 ? 'w-2/3' : 'w-full',
              lineClassName
            )}
          />
        </motion.div>
      ))}

      <span className="sr-only">Loading text...</span>
    </motion.div>
  );
}

// ─── ImageSkeleton ───────────────────────────────────────────────────────────

/**
 * Image placeholder skeleton.
 * Shows a placeholder where an image will eventually load.
 *
 * @example
 * ```tsx
 * <ImageSkeleton aspectRatio="16/9" />
 * ```
 */
export function ImageSkeleton({
  aspectRatio,
  className,
}: {
  /** CSS aspect ratio value (e.g., '16/9', '4/3', '1/1') */
  aspectRatio?: string;
  /** Additional CSS classes */
  className?: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="status"
      aria-label="Loading image"
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-lg bg-muted',
        aspectRatio && 'aspect-auto',
        className
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Default height if no aspect ratio specified */}
      {!aspectRatio && (
        <div className="flex h-48 w-full items-center justify-center">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto size-10 rounded-full" />
            <Skeleton className="mx-auto h-3 w-20" />
          </div>
        </div>
      )}

      {aspectRatio && (
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto size-10 rounded-full" />
          <Skeleton className="mx-auto h-3 w-20" />
        </div>
      )}

      <span className="sr-only">Loading image...</span>
    </motion.div>
  );
}

// ─── ButtonSkeleton ──────────────────────────────────────────────────────────

/**
 * Button skeleton placeholder.
 * Mimics the size of different button variants.
 *
 * @example
 * ```tsx
 * <ButtonSkeleton variant="default" />
 * <ButtonSkeleton variant="icon" />
 * ```
 */
export function ButtonSkeleton({
  variant = 'default',
  className,
}: {
  /** Button variant to mimic: 'default' | 'sm' | 'lg' | 'icon' (default: 'default') */
  variant?: 'default' | 'sm' | 'lg' | 'icon';
  /** Additional CSS classes */
  className?: string;
}) {
  const sizeClasses: Record<string, string> = {
    default: 'h-9 w-24',
    sm: 'h-8 w-20',
    lg: 'h-10 w-32',
    icon: 'size-9',
  };

  return (
    <Skeleton
      className={cn('rounded-md', sizeClasses[variant], className)}
      role="status"
      aria-label="Loading button"
    >
      <span className="sr-only">Loading button...</span>
    </Skeleton>
  );
}

// ─── LoadingOverlay ──────────────────────────────────────────────────────────

/**
 * Overlay loading component for inline content areas.
 * Shows a centered spinner/indicator on top of existing content.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <MyContent />
 *   {isUpdating && <LoadingOverlay />}
 * </div>
 * ```
 */
export function LoadingOverlay({
  className,
  message,
}: {
  /** Additional CSS classes */
  className?: string;
  /** Optional loading message */
  message?: string;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/80 backdrop-blur-sm',
          className
        )}
        role="status"
        aria-label={message ?? 'Loading'}
      >
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        {message && (
          <span className="text-muted-foreground text-sm">{message}</span>
        )}
        <span className="sr-only">{message ?? 'Loading...'}</span>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── SectionSkeleton ─────────────────────────────────────────────────────────

/**
 * Generic section skeleton for content areas.
 * Shows a header with title and optional actions.
 *
 * @example
 * ```tsx
 * <SectionSkeleton titleWidth="w-48" showAction />
 * ```
 */
export function SectionSkeleton({
  titleWidth = 'w-48',
  showAction = false,
  contentLines = 4,
  className,
}: {
  /** Width class for the title skeleton (default: 'w-48') */
  titleWidth?: string;
  /** Whether to show an action button in the header (default: false) */
  showAction?: boolean;
  /** Number of content lines (default: 4) */
  contentLines?: number;
  /** Additional CSS classes */
  className?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('space-y-4', className)}
      role="status"
      aria-label="Loading section"
    >
      {/* Section header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <Skeleton className={cn('h-6', titleWidth)} />
        {showAction && <Skeleton className="h-9 w-28 rounded-md" />}
      </motion.div>

      {/* Section content */}
      <TextSkeleton lines={contentLines} />

      <span className="sr-only">Loading section content...</span>
    </motion.div>
  );
}
