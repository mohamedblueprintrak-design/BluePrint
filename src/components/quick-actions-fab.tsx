'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ListPlus, FileUp, BarChart3, Bot, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';

interface QuickAction {
  icon: typeof Camera;
  label: string;
  labelEn: string;
  href: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Camera,
    label: 'تسجيل عيب',
    labelEn: 'Report Defect',
    href: '/dashboard/site-management?tab=defects&action=create',
    bgColor: 'bg-red-600',
  },
  {
    icon: ListPlus,
    label: 'مهمة جديدة',
    labelEn: 'New Task',
    href: '/dashboard/projects?tab=tasks&action=create',
    bgColor: 'bg-amber-600',
  },
  {
    icon: FileUp,
    label: 'رفع مستند',
    labelEn: 'Upload Document',
    href: '/dashboard/documents',
    bgColor: 'bg-green-600',
  },
  {
    icon: BarChart3,
    label: 'تقرير سريع',
    labelEn: 'Quick Report',
    href: '/dashboard/reports',
    bgColor: 'bg-blue-600',
  },
  {
    icon: Bot,
    label: 'مساعد بلو',
    labelEn: 'Ask Blue AI',
    href: '/dashboard/ai-chat',
    bgColor: 'bg-emerald-600',
  },
];

// Calculate positions for semi-circle arc layout
// Buttons fan out upward with slight horizontal spread
function getActionPosition(index: number, total: number) {
  // Angle from 0 (right) going counter-clockwise for LTR
  // Start from -30deg and spread to -150deg (upward arc)
  const startAngle = -150;
  const endAngle = -30;
  const angleStep = (endAngle - startAngle) / (total - 1);
  const angle = startAngle + angleStep * index;
  const radius = 100;
  const rad = (angle * Math.PI) / 180;

  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
}

export function QuickActionsFab() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { language, isRTL, isDark } = useApp();

  const handleActionClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  // RTL-aware positioning: mirror the horizontal positions
  const transformX = isRTL ? -1 : 1;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[34] md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action buttons container */}
      <div className="fixed z-[35] md:hidden bottom-24 px-4"
        style={{
          [isRTL ? 'left' : 'right']: '1rem',
        }}
      >
        <AnimatePresence>
          {isOpen && quickActions.map((action, index) => {
            const Icon = action.icon;
            const pos = getActionPosition(index, quickActions.length);
            const adjustedX = pos.x * transformX;

            return (
              <motion.button
                key={action.labelEn}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: adjustedX,
                  y: pos.y,
                }}
                exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                  delay: index * 0.05,
                }}
                onClick={() => handleActionClick(action.href)}
                className="absolute bottom-0 group flex items-center gap-2"
                style={{
                  [isRTL ? 'right' : 'left']: '50%',
                }}
              >
                {/* Label tooltip */}
                <span
                  className={cn(
                    'absolute whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium shadow-lg',
                    'bg-slate-800 text-slate-200 border border-slate-700',
                    'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
                    isRTL ? 'right-12' : 'left-12'
                  )}
                >
                  {language === 'ar' ? action.label : action.labelEn}
                </span>

                {/* Action button */}
                <div className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center shadow-lg',
                  'transition-transform active:scale-90',
                  isDark ? action.bgColor : `${action.bgColor}/90`
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Main FAB button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed z-[35] md:hidden w-14 h-14 rounded-full shadow-2xl',
          'flex items-center justify-center',
          'bg-gradient-to-br from-slate-800 to-slate-900',
          'border border-slate-700',
          'transition-shadow active:scale-95',
          isOpen ? 'shadow-blue-500/20' : 'shadow-slate-900/50'
        )}
        style={{
          bottom: '6rem',
          [isRTL ? 'left' : 'right']: '1rem',
        }}
        aria-label={language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </motion.div>
      </motion.button>
    </>
  );
}
