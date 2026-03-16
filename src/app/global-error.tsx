'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-slate-900/80 border-red-500/50">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">
                حدث خطأ غير متوقع
              </h1>
              <h2 className="text-lg text-slate-400 mb-4">
                Something went wrong
              </h2>
              
              <p className="text-slate-400 mb-6">
                {error.message || 'An unexpected error occurred. Please try again.'}
              </p>
              
              {error.digest && (
                <p className="text-xs text-slate-500 mb-4">
                  Error ID: {error.digest}
                </p>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={() => reset()}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة المحاولة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="border-slate-700 gap-2"
                >
                  <Home className="w-4 h-4" />
                  الرئيسية
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
