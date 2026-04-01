/**
 * @module components/common/empty-state
 * @description Empty state components for the BluePrint SaaS platform.
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Building2, ClipboardList, FileText, Users, SearchX, BellOff, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmptyStateMessages {
  title: string;
  description: string;
  actionLabel: string;
}

export interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  illustration?: React.ReactNode;
  dir?: 'rtl' | 'ltr';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CONFIG = {
  sm: { container: 'py-8 px-4', icon: 'size-10', title: 'text-base', description: 'text-xs', gap: 'gap-3' },
  md: { container: 'py-12 px-6', icon: 'size-14', title: 'text-lg', description: 'text-sm', gap: 'gap-4' },
  lg: { container: 'py-16 px-8', icon: 'size-18', title: 'text-xl', description: 'text-sm', gap: 'gap-5' },
};

const emptyStateVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], staggerChildren: 0.08, delayChildren: 0.1 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── Base Component ──────────────────────────────────────────────────────────

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
      className={cn('flex flex-col items-center justify-center text-center', config.container, config.gap, className)}
      role="status"
    >
      {illustration && (
        <motion.div variants={childVariants} className="mb-2">
          {illustration}
        </motion.div>
      )}
      <motion.div variants={childVariants} className="flex size-16 items-center justify-center rounded-full bg-muted/50">
        <Icon className={cn('text-muted-foreground', config.icon)} />
      </motion.div>
      <motion.h3 variants={childVariants} className={cn('font-semibold tracking-tight', config.title)}>
        {title}
      </motion.h3>
      {description && (
        <motion.p variants={childVariants} className={cn('text-muted-foreground max-w-sm', config.description)}>
          {description}
        </motion.p>
      )}
      {action && <motion.div variants={childVariants}>{action}</motion.div>}
    </motion.div>
  );
}

// ─── Pre-built Variants ──────────────────────────────────────────────────────

export function NoProjects({ onCreate, locale = 'en', className }: { onCreate?: () => void; locale?: 'en' | 'ar'; className?: string }) {
  const messages = {
    en: { title: 'No projects yet', description: 'Start managing your construction projects by creating your first project.', actionLabel: 'Create Project' },
    ar: { title: 'لا توجد مشاريع بعد', description: 'ابدأ بإدارة مشاريع البناء الخاصة بك من خلال إنشاء مشروعك الأول.', actionLabel: 'إنشاء مشروع' },
  };
  const msg = messages[locale];
  return (
    <EmptyState icon={Building2} title={msg.title} description={msg.description} dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={onCreate ? <Button onClick={onCreate}>{msg.actionLabel}</Button> : undefined} className={className} />
  );
}

export function NoTasks({ onCreate, locale = 'en', className }: { onCreate?: () => void; locale?: 'en' | 'ar'; className?: string }) {
  const messages = {
    en: { title: 'No tasks yet', description: 'Add tasks to track work items and keep your team organized.', actionLabel: 'Add Task' },
    ar: { title: 'لا توجد مهام بعد', description: 'أضف مهام لتتبع عناصر العمل والحفاظ على تنظيم فريقك.', actionLabel: 'إضافة مهمة' },
  };
  const msg = messages[locale];
  return (
    <EmptyState icon={ClipboardList} title={msg.title} description={msg.description} dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={onCreate ? <Button onClick={onCreate}>{msg.actionLabel}</Button> : undefined} className={className} />
  );
}

export function NoInvoices({ onCreate, locale = 'en', className }: { onCreate?: () => void; locale?: 'en' | 'ar'; className?: string }) {
  const messages = {
    en: { title: 'No invoices yet', description: 'Create your first invoice to start billing clients for your work.', actionLabel: 'Create Invoice' },
    ar: { title: 'لا توجد فواتير بعد', description: 'أنشئ فاتورتك الأولى لبدء فوترة العملاء مقابل عملك.', actionLabel: 'إنشاء فاتورة' },
  };
  const msg = messages[locale];
  return (
    <EmptyState icon={FileText} title={msg.title} description={msg.description} dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={onCreate ? <Button onClick={onCreate}>{msg.actionLabel}</Button> : undefined} className={className} />
  );
}

export function NoClients({ onCreate, locale = 'en', className }: { onCreate?: () => void; locale?: 'en' | 'ar'; className?: string }) {
  const messages = {
    en: { title: 'No clients yet', description: 'Add your first client to start managing relationships and projects.', actionLabel: 'Add Client' },
    ar: { title: 'لا يوجد عملاء بعد', description: 'أضف عميلك الأول لبدء إدارة العلاقات والمشاريع.', actionLabel: 'إضافة عميل' },
  };
  const msg = messages[locale];
  return (
    <EmptyState icon={Users} title={msg.title} description={msg.description} dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={onCreate ? <Button onClick={onCreate}>{msg.actionLabel}</Button> : undefined} className={className} />
  );
}

export function NoSearchResults({ query, onClearSearch, locale = 'en', className }: { query?: string; onClearSearch?: () => void; locale?: 'en' | 'ar'; className?: string }) {
  const messages = {
    en: { title: 'No results found', description: query ? `No results for "${query}". Try adjusting your search.` : 'Try adjusting your search terms.', clearLabel: 'Clear Search' },
    ar: { title: 'لم يتم العثور على نتائج', description: query ? `لا توجد نتائج لـ "${query}". حاول تعديل البحث.` : 'حاول تعديل مصطلحات البحث.', clearLabel: 'مسح البحث' },
  };
  const msg = messages[locale];
  return (
    <EmptyState icon={SearchX} title={msg.title} description={msg.description} dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={onClearSearch ? <Button variant="outline" onClick={onClearSearch}>{msg.clearLabel}</Button> : undefined} className={className} />
  );
}

export function NoNotifications({ locale = 'en', className }: { locale?: 'en' | 'ar'; className?: string }) {
  const messages = {
    en: { title: 'No notifications', description: "You're all caught up! Check back later for updates." },
    ar: { title: 'لا توجد إشعارات', description: 'لقد أنهيت كل شيء! تحقق لاحقًا للتحديثات.' },
  };
  const msg = messages[locale];
  return (
    <EmptyState icon={BellOff} title={msg.title} description={msg.description} dir={locale === 'ar' ? 'rtl' : 'ltr'} size="sm" className={className} />
  );
}

export function NoDocuments({ onUpload, locale = 'en', className }: { onUpload?: () => void; locale?: 'en' | 'ar'; className?: string }) {
  const messages = {
    en: { title: 'No documents yet', description: 'Upload your first document to keep all project files organized.', actionLabel: 'Upload Document' },
    ar: { title: 'لا توجد مستندات بعد', description: 'قم بتحميل مستندك الأول لتنظيم ملفات المشروع.', actionLabel: 'تحميل مستند' },
  };
  const msg = messages[locale];
  return (
    <EmptyState icon={FolderOpen} title={msg.title} description={msg.description} dir={locale === 'ar' ? 'rtl' : 'ltr'}
      action={onUpload ? <Button onClick={onUpload}>{msg.actionLabel}</Button> : undefined} className={className} />
  );
}
