'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowRight, SearchX, Globe } from 'lucide-react';
import Image from 'next/image';

/**
 * 404 Not Found page - runs inside root layout which has NO providers.
 * MUST NOT use useApp/useAuth - uses local state instead.
 */
export default function NotFound() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('blueprint_language');
      if (saved === 'en' || saved === 'ar') setLanguage(saved);
      else if (navigator.language.startsWith('ar')) setLanguage('ar');
      else setLanguage('en');
    } catch { /* silent */ }
  }, []);

  const isAr = language === 'ar';
  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="max-w-lg w-full bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6 p-0.5">
            <Image src="/logo.png" alt="BluePrint" width={48} height={48} className="rounded-xl object-contain" />
          </div>

          {/* Error Code */}
          <div className="inline-flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1 mb-4">
            <SearchX className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400">404</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {isAr ? 'الصفحة غير موجودة' : 'Page Not Found'}
          </h1>
          <h2 className="text-lg text-slate-400 mb-6">
            {isAr
              ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'
              : 'Sorry, the page you\'re looking for doesn\'t exist or has been moved.'}
          </h2>

          <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
            {isAr
              ? 'يرجى التحقق من الرابط أو العودة للصفحة الرئيسية.'
              : 'Please check the URL or navigate back to the main page.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25">
              <Link href="/dashboard">
                <Home className="w-4 h-4 rtl:ml-2 rtl:rotate-180" />
                {isAr ? 'الرئيسية' : 'Home'}
              </Link>
            </Button>
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white" asChild>
              <Link href="/login">
                <ArrowRight className="w-4 h-4 rtl:ml-2 rtl:rotate-180" />
                {isAr ? 'تسجيل الدخول' : 'Login'}
              </Link>
            </Button>
          </div>

          {/* Language toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = language === 'ar' ? 'en' : 'ar';
              setLanguage(next);
              try { localStorage.setItem('blueprint_language', next); } catch { /* silent */ }
            }}
            className="mt-4 text-slate-500 hover:text-slate-300 gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'ar' ? 'English' : 'العربية'}
          </Button>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-sm text-slate-500">
              {isAr ? 'هل تحتاج مساعدة؟ ' : 'Need help? '}
              <Link href="/dashboard/help" className="text-blue-400 hover:text-blue-300 hover:underline">
                {isAr ? 'الدعم الفني' : 'Support'}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
