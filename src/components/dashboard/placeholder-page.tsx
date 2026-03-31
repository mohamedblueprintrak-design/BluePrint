'use client';

import React from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Construction, Sparkles } from 'lucide-react';

const pageInfo: Record<string, { icon: React.ReactNode; ar: string; en: string; descAr: string; descEn: string }> = {
  'finance': { icon: <Sparkles className="h-10 w-10" />, ar: 'المالية', en: 'Finance', descAr: 'إدارة الحسابات والتقارير المالية', descEn: 'Financial management and reporting' },
  'budgets': { icon: <Sparkles className="h-10 w-10" />, ar: 'الميزانيات', en: 'Budgets', descAr: 'تخطيط ومتابعة ميزانيات المشاريع', descEn: 'Project budget planning and tracking' },
  'vouchers': { icon: <Sparkles className="h-10 w-10" />, ar: 'السندات', en: 'Vouchers', descAr: 'إدارة السندات المالية', descEn: 'Financial voucher management' },
  'contracts': { icon: <Sparkles className="h-10 w-10" />, ar: 'العقود', en: 'Contracts', descAr: 'إدارة العقود والاتفاقيات', descEn: 'Contract and agreement management' },
  'quotations': { icon: <Sparkles className="h-10 w-10" />, ar: 'العروض', en: 'Quotations', descAr: 'إنشاء وإدارة العروض السعرية', descEn: 'Create and manage price quotations' },
  'purchase-requests': { icon: <Sparkles className="h-10 w-10" />, ar: 'طلبات الشراء', en: 'Purchase Requests', descAr: 'إدارة طلبات الشراء والمواد', descEn: 'Purchase requisition management' },
  'operations': { icon: <Sparkles className="h-10 w-10" />, ar: 'العمليات', en: 'Operations', descAr: 'إدارة العمليات التشغيلية', descEn: 'Operations management' },
  'boq': { icon: <Sparkles className="h-10 w-10" />, ar: 'جدول الكميات', en: 'BOQ', descAr: 'جدول البنود والكميات', descEn: 'Bill of Quantities management' },
  'site-logs': { icon: <Sparkles className="h-10 w-10" />, ar: 'يومية الموقع', en: 'Site Logs', descAr: 'تقارير يومية الموقع والمتابعة', descEn: 'Daily site logs and monitoring' },
  'defects': { icon: <Sparkles className="h-10 w-10" />, ar: 'العيوب', en: 'Defects', descAr: 'تتبع العيوب والمخالفات', descEn: 'Defect and violation tracking' },
  'admin': { icon: <Sparkles className="h-10 w-10" />, ar: 'الإدارة', en: 'Admin', descAr: 'إدارة النظام والمستخدمين', descEn: 'System and user administration' },
  'reports': { icon: <Sparkles className="h-10 w-10" />, ar: 'التقارير', en: 'Reports', descAr: 'التقارير التحليلية والإحصائية', descEn: 'Analytics and statistical reports' },
  'documents': { icon: <Sparkles className="h-10 w-10" />, ar: 'المستندات', en: 'Documents', descAr: 'إدارة المستندات والملفات', descEn: 'Document and file management' },
  'knowledge-base': { icon: <Sparkles className="h-10 w-10" />, ar: 'قاعدة المعرفة', en: 'Knowledge Base', descAr: 'المقالات والموارد المعرفية', descEn: 'Articles and knowledge resources' },
  'hr': { icon: <Sparkles className="h-10 w-10" />, ar: 'الموارد البشرية', en: 'HR', descAr: 'إدارة الموظفين والإجازات', descEn: 'Employee and leave management' },
  'profile': { icon: <Sparkles className="h-10 w-10" />, ar: 'الملف الشخصي', en: 'Profile', descAr: 'إعدادات الملف الشخصي', descEn: 'Personal profile settings' },
};

interface PlaceholderPageProps {
  pageKey: string;
}

export default function PlaceholderPage({ pageKey }: PlaceholderPageProps) {
  const { language } = useApp();
  const { isRTL } = useTranslation(language);
  const info = pageInfo[pageKey];

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/20 flex items-center justify-center mb-6">
          <Construction className="h-10 w-10 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {info ? (isRTL ? info.ar : info.en) : pageKey}
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          {info ? (isRTL ? info.descAr : info.descEn) : (isRTL ? 'قريباً...' : 'Coming soon...')}
        </p>
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isRTL ? 'هذه الصفحة قيد التطوير وستتوفر قريباً' : 'This page is under development and will be available soon'}</span>
        </div>
      </div>
    </div>
  );
}
