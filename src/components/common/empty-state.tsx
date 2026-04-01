/**
 * @module components/common/empty-state
 * @description Empty state components for the BluePrint SaaS platform.
 * Provides a flexible `EmptyState` base component plus pre-built variants for
 * common scenarios (projects, tasks, invoices, clients, search, notifications,
 * documents). Supports Arabic (RTL) and English with animated entrances.
 *
 * @example
 * ```tsx
 * // Base usage
 * <EmptyState
 *   icon={FolderOpenIcon}
 *   title="No projects yet"
 *   description="Create your first project to get started."
 *   action={<Button onClick={onCreate}>New Project</Button>}
 * />
 *
 * // Pre-built variant
 * <NoProjects onCreate={handleCreateProject} />
 * ```
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Bilingual text for empty state messages */
interface EmptyStateMessages {
  title: string;
  description: string;
  actionLabel: string;
}

/** Props for the base EmptyState component */
export interface EmptyStateProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Primary title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action button or element */
  action?: React.ReactNode;
  /** Optional illustration element rendered above the icon */
  illustration?: React.ReactNode;
  /** Layout direction: 'rtl' | 'ltr' (default: 'ltr') */
  dir?: 'rtl' | 'ltr';
  /** Size variant: 'sm' | 'md' | 'lg' (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/** Size configurations for the empty state */
const SIZE_CONFIG = {
  sm: {
    container: 'py-8 px-4',
    icon: 'size-10',
    title: 'text-base',
    description: 'text-xs',
    gap: 'gap-3',
  },
  md: {
    container: 'py-12 px-6',
    icon: 'size-14',
    title: 'text-lg',
    description: 'text-sm',
    gap: 'gap-4',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'size-18',
    title: 'text-xl',
    description: 'text-sm',
    gap: 'gap-5',
  },
};

// ─── Animation Variants ──────────────────────────────────────────────────────

const emptyStateVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── EmptyState Base Component ───────────────────────────────────────────────

/**
 * Flexible empty state component with icon, title, description, and action.
 * Supports RTL layout, animated entrance via Framer Motion, and size variants.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={FileTextIcon}
 *   title="No invoices"
 *   description="Create your first invoice to start billing."
 *   action={<Button onClick={onCreate}>Create Invoice</Button>}
 *   dir="rtl"
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  dir = 'ltr',
  size = 'md',
  className,
}: EmptyStateProps) {
  const config = SIZE_CONFIG[size];

  return (
    <motion.div
      variants={emptyStateVariants}
      initial="hidden"
      animate="visible"
      dir={dir}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        config.container,
        config.gap,
        className
      )}
      role="status"
    >
      {/* Illustration (optional) */}
      {illustration && (
        <motion.div variants={childVariants} className="mb-2">
          {illustration}
        </motion.div>
      )}

      {/* Icon */}
      <motion.div
        variants={childVariants}
        className="flex size-16 items-center justify-center rounded-full bg-muted/50"
      >
        <Icon className={cn('text-muted-foreground', config.icon)} />
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={childVariants}
        className={cn('font-semibold tracking-tight', config.title)}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          variants={childVariants}
          className={cn('text-muted-foreground max-w-sm', config.description)}
        >
          {description}
        </motion.p>
      )}

      {/* Action */}
      {action && (
        <motion.div variants={childVariants}>{action}</motion.div>
      )}
    </motion.div>
  );
}

// ─── Pre-built Empty State Variants ──────────────────────────────────────────

/**
 * Empty state for when no projects exist.
 * Shows building/construction icon with project creation prompt.
 */
export function NoProjects({
  onCreate,
  locale = 'en',
  className,
}: {
  /** Handler for the "Create Project" action */
  onCreate?: () => void;
  /** Locale for bilingual text: 'en' | 'ar' */
  locale?: 'en' | 'ar';
  /** Additional CSS classes */
  className?: string;
}) {
  const messages: Record<'en' | 'ar', EmptyStateMessages> = {
    en: {
      title: 'No projects yet',
      description:
        'Start managing your construction projects by creating your first project.',
      actionLabel: 'Create Project',
    },
    ar: {
      title: 'لا توجد مشاريع بعد',
      description: 'ابدأ بإدارة مشاريع البناء الخاصة بك من خلال إنشاء مشروعك الأول.',
      actionLabel: 'إنشاء مشروع',
    },
  };

  const msg = messages[locale];

  return (
    <EmptyState
      icon={
        locale === 'ar'
          ? (() => {
              // Using Building2 as the project icon
              const { Building2 } = require('lucide-react');
              return Building2;
            })()
          : (() => {
              const { Building2 } = require('lucide-react');
              return Building2;
            })()
      }
      title={msg.title}
      description={msg.description}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={
        onCreate ? (
          <Button onClick={onCreate}>{msg.actionLabel}</Button>
        ) : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for when no tasks exist.
 * Shows checklist icon with task creation prompt.
 */
export function NoTasks({
  onCreate,
  locale = 'en',
  className,
}: {
  /** Handler for the "Create Task" action */
  onCreate?: () => void;
  /** Locale for bilingual text */
  locale?: 'en' | 'ar';
  /** Additional CSS classes */
  className?: string;
}) {
  const messages: Record<'en' | 'ar', EmptyStateMessages> = {
    en: {
      title: 'No tasks yet',
      description:
        'Add tasks to track work items and keep your team organized.',
      actionLabel: 'Add Task',
    },
    ar: {
      title: 'لا توجد مهام بعد',
      description: 'أضف مهام لتتبع عناصر العمل والحفاظ على تنظيم فريقك.',
      actionLabel: 'إضافة مهمة',
    },
  };

  const msg = messages[locale];

  return (
    <EmptyState
      icon={
        (() => {
          const { ClipboardList } = require('lucide-react');
          return ClipboardList;
        })()
      }
      title={msg.title}
      description={msg.description}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={
        onCreate ? (
          <Button onClick={onCreate}>{msg.actionLabel}</Button>
        ) : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for when no invoices exist.
 * Shows document/receipt icon with invoice creation prompt.
 */
export function NoInvoices({
  onCreate,
  locale = 'en',
  className,
}: {
  /** Handler for the "Create Invoice" action */
  onCreate?: () => void;
  /** Locale for bilingual text */
  locale?: 'en' | 'ar';
  /** Additional CSS classes */
  className?: string;
}) {
  const messages: Record<'en' | 'ar', EmptyStateMessages> = {
    en: {
      title: 'No invoices yet',
      description:
        'Create your first invoice to start billing clients for your work.',
      actionLabel: 'Create Invoice',
    },
    ar: {
      title: 'لا توجد فواتير بعد',
      description: 'أنشئ فاتورتك الأولى لبدء فوترة العملاء مقابل عملك.',
      actionLabel: 'إنشاء فاتورة',
    },
  };

  const msg = messages[locale];

  return (
    <EmptyState
      icon={
        (() => {
          const { FileText } = require('lucide-react');
          return FileText;
        })()
      }
      title={msg.title}
      description={msg.description}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={
        onCreate ? (
          <Button onClick={onCreate}>{msg.actionLabel}</Button>
        ) : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for when no clients exist.
 * Shows users/people icon with client creation prompt.
 */
export function NoClients({
  onCreate,
  locale = 'en',
  className,
}: {
  /** Handler for the "Add Client" action */
  onCreate?: () => void;
  /** Locale for bilingual text */
  locale?: 'en' | 'ar';
  /** Additional CSS classes */
  className?: string;
}) {
  const messages: Record<'en' | 'ar', EmptyStateMessages> = {
    en: {
      title: 'No clients yet',
      description:
        'Add your first client to start managing relationships and projects.',
      actionLabel: 'Add Client',
    },
    ar: {
      title: 'لا يوجد عملاء بعد',
      description: 'أضف عميلك الأول لبدء إدارة العلاقات والمشاريع.',
      actionLabel: 'إضافة عميل',
    },
  };

  const msg = messages[locale];

  return (
    <EmptyState
      icon={
        (() => {
          const { Users } = require('lucide-react');
          return Users;
        })()
      }
      title={msg.title}
      description={msg.description}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={
        onCreate ? (
          <Button onClick={onCreate}>{msg.actionLabel}</Button>
        ) : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for when no search results are found.
 * Shows search icon with helpful search suggestions.
 */
export function NoSearchResults({
  query,
  onClearSearch,
  locale = 'en',
  className,
}: {
  /** The search query that returned no results */
  query?: string;
  /** Handler to clear the search */
  onClearSearch?: () => void;
  /** Locale for bilingual text */
  locale?: 'en' | 'ar';
  /** Additional CSS classes */
  className?: string;
}) {
  const messages: Record<'en' | 'ar', { title: string; description: string; clearLabel: string }> = {
    en: {
      title: 'No results found',
      description: query
        ? `No results for "${query}". Try adjusting your search terms or filters.`
        : 'Try adjusting your search terms or filters.',
      clearLabel: 'Clear Search',
    },
    ar: {
      title: 'لم يتم العثور على نتائج',
      description: query
        ? `لا توجد نتائج لـ "${query}". حاول تعديل مصطلحات البحث أو عوامل التصفية.`
        : 'حاول تعديل مصطلحات البحث أو عوامل التصفية.',
      clearLabel: 'مسح البحث',
    },
  };

  const msg = messages[locale];

  return (
    <EmptyState
      icon={
        (() => {
          const { SearchX } = require('lucide-react');
          return SearchX;
        })()
      }
      title={msg.title}
      description={msg.description}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={
        onClearSearch ? (
          <Button variant="outline" onClick={onClearSearch}>
            {msg.clearLabel}
          </Button>
        ) : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for when there are no notifications.
 * Shows bell icon with informational message.
 */
export function NoNotifications({
  locale = 'en',
  className,
}: {
  /** Locale for bilingual text */
  locale?: 'en' | 'ar';
  /** Additional CSS classes */
  className?: string;
}) {
  const messages: Record<'en' | 'ar', { title: string; description: string }> = {
    en: {
      title: 'No notifications',
      description:
        "You're all caught up! Check back later for updates on your projects.",
    },
    ar: {
      title: 'لا توجد إشعارات',
      description: 'لقد أنهيت كل شيء! تحقق لاحقًا للحصول على تحديثات حول مشاريعك.',
    },
  };

  const msg = messages[locale];

  return (
    <EmptyState
      icon={
        (() => {
          const { BellOff } = require('lucide-react');
          return BellOff;
        })()
      }
      title={msg.title}
      description={msg.description}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      size="sm"
      className={className}
    />
  );
}

/**
 * Empty state for when no documents exist.
 * Shows folder/file icon with document upload prompt.
 */
export function NoDocuments({
  onUpload,
  locale = 'en',
  className,
}: {
  /** Handler for the "Upload Document" action */
  onUpload?: () => void;
  /** Locale for bilingual text */
  locale?: 'en' | 'ar';
  /** Additional CSS classes */
  className?: string;
}) {
  const messages: Record<'en' | 'ar', EmptyStateMessages> = {
    en: {
      title: 'No documents yet',
      description:
        'Upload your first document to keep all project files organized in one place.',
      actionLabel: 'Upload Document',
    },
    ar: {
      title: 'لا توجد مستندات بعد',
      description: 'قم بتحميل مستندك الأول للحفاظ على جميع ملفات المشروع منظمة في مكان واحد.',
      actionLabel: 'تحميل مستند',
    },
  };

  const msg = messages[locale];

  return (
    <EmptyState
      icon={
        (() => {
          const { FolderOpen } = require('lucide-react');
          return FolderOpen;
        })()
      }
      title={msg.title}
      description={msg.description}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={
        onUpload ? (
          <Button onClick={onUpload}>{msg.actionLabel}</Button>
        ) : undefined
      }
      className={className}
    />
  );
}
