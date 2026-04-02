'use client';

import { useApp } from '@/context/app-context';

export function Footer() {
  const { language } = useApp();
  const isRTL = language === 'ar';

  return (
    <footer
      className="border-t border-border bg-background mt-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="px-4 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
          <p className="text-xs text-muted-foreground">
            {isRTL
              ? `© ${new Date().getFullYear()} BluePrint. جميع الحقوق محفوظة.`
              : `© ${new Date().getFullYear()} BluePrint. All rights reserved.`}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRTL
              ? 'بدعم من منصة BluePrint للهندسة بالذكاء الاصطناعي'
              : 'Powered by BluePrint AI Engineering Platform'}
          </p>
        </div>
      </div>
    </footer>
  );
}
