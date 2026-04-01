'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Globe } from 'lucide-react';
import Image from 'next/image';

/**
 * Global Error Boundary - runs OUTSIDE all layouts and providers.
 * MUST NOT use useApp/useAuth or any context hooks.
 * Uses local state instead.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const isAr = language === 'ar';

  useEffect(() => {
    console.error('Global error:', error);
    // Try to detect language from browser
    try {
      const saved = localStorage.getItem('blueprint_language');
      if (saved === 'en' || saved === 'ar') setLanguage(saved);
      else if (navigator.language.startsWith('ar')) setLanguage('ar');
      else setLanguage('en');
    } catch {
      // localStorage not available - use default language
    }
  }, [error]);

  return (
    <html lang={isAr ? 'ar' : 'en'} dir={isAr ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <title>{isAr ? 'خطأ' : 'Error'} | BluePrint</title>
      </head>
      <body className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans antialiased">
        <Card className="max-w-lg w-full bg-slate-900/80 border-red-500/30 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              {/* Logo */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-6 p-0.5">
                <Image src="/logo.png" alt="BluePrint" width={48} height={48} className="rounded-xl object-contain" />
              </div>

              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-red-400">
                  {isAr ? 'خطأ' : 'Error'}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                {isAr ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
              </h1>

              <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                {error.message || (isAr ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' : 'An unexpected error occurred. Please try again.')}
              </p>

              {error.digest && (
                <p className="text-xs text-slate-500 mb-4 font-mono">
                  {isAr ? 'معرف الخطأ:' : 'Error ID:'} {error.digest}
                </p>
              )}

              <div className="flex gap-3 mb-4">
                <Button
                  onClick={() => reset()}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {isAr ? 'إعادة المحاولة' : 'Try Again'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="border-slate-700 hover:bg-slate-800 text-white gap-2"
                >
                  <Home className="w-4 h-4" />
                  {isAr ? 'الرئيسية' : 'Home'}
                </Button>
              </div>

              {/* Language toggle - standalone, no context needed */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next = language === 'ar' ? 'en' : 'ar';
                  setLanguage(next);
                  try { localStorage.setItem('blueprint_language', next); } catch { /* silent */ }
                }}
                className="text-slate-500 hover:text-slate-300 gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                {language === 'ar' ? 'English' : 'العربية'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
