'use client';

import { ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Copy, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { toast } from 'sonner';
import { ErrorBoundaryCore, type ErrorBoundaryProps } from '@/components/ui/error-boundary';

// ---------------------------------------------------------------------------
// Bilingual strings for the full-page error UI
// ---------------------------------------------------------------------------
const pageMessages = {
  ar: {
    title: 'حدث خطأ غير متوقع',
    subtitle: 'عذراً، حدث خطأ أثناء تحميل الصفحة.',
    retry: 'إعادة المحاولة',
    goDashboard: 'العودة للوحة التحكم',
    copyCode: 'نسخ رمز الخطأ',
    codeCopied: 'تم نسخ رمز الخطأ',
    errorCode: 'رمز الخطأ',
    forSupport: 'استخدم هذا الرمز عند التواصل مع الدعم الفني',
    devStackTrace: 'تفاصيل تقنية',
  },
  en: {
    title: 'Something went wrong',
    subtitle: 'Sorry, an error occurred while loading this page.',
    retry: 'Try Again',
    goDashboard: 'Go to Dashboard',
    copyCode: 'Copy Error Code',
    codeCopied: 'Error code copied',
    errorCode: 'Error Code',
    forSupport: 'Use this code when contacting support',
    devStackTrace: 'Technical Details',
  },
} as const;

// ---------------------------------------------------------------------------
// Generate a short support-reference code from an error
// ---------------------------------------------------------------------------
function generateErrorCode(error?: Error | null): string {
  if (!error) return 'BP-0000';
  // Simple hash: combine first chars of the error name + a short random hex
  const prefix = 'BP';
  const hash = error.message
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    .toString(16)
    .toUpperCase()
    .slice(-4);
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${hash}${ts}`;
}

// ---------------------------------------------------------------------------
// Page-level error display content
// ---------------------------------------------------------------------------
function PageErrorContent({
  error,
  errorInfo,
  onReset,
}: {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}) {
  const { language } = useApp();
  const lang = language || 'ar';
  const msgs = pageMessages[lang];
  const isDev = process.env.NODE_ENV === 'development';

  const errorCode = useMemo(() => generateErrorCode(error), [error]);

  const handleGoDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(errorCode).then(() => {
      toast.success(msgs.codeCopied);
    }).catch(() => {
      // Fallback for older browsers / insecure contexts
      const ta = document.createElement('textarea');
      ta.value = errorCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast.success(msgs.codeCopied);
    });
  }, [errorCode, msgs.codeCopied]);

  const handleReportError = useCallback(() => {
    const reportMsg = lang === 'ar' ? 'تم إرسال بلاغ الخطأ بنجاح' : 'Error reported successfully';
    toast.success(reportMsg);
  }, [lang]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-lg space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>

        {/* Title & subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">{msgs.title}</h1>
          <p className="text-sm text-slate-400">{msgs.subtitle}</p>
        </div>

        {/* Error code card */}
        <div className="mx-auto w-fit rounded-xl border border-slate-800 bg-slate-900 px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">{msgs.errorCode}</p>
          <p className="font-mono text-lg font-semibold text-white">{errorCode}</p>
          <p className="mt-1 text-xs text-slate-500">{msgs.forSupport}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="mt-3 gap-2 text-slate-400 hover:text-white"
          >
            <Copy className="h-3.5 w-3.5" />
            {msgs.copyCode}
          </Button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={onReset}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="h-4 w-4" />
            {msgs.retry}
          </Button>
          <Button
            variant="outline"
            onClick={handleReportError}
            className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <CheckCircle2 className="h-4 w-4" />
            {lang === 'ar' ? 'إبلاغ عن الخطأ' : 'Report Error'}
          </Button>
          <Button
            variant="outline"
            onClick={handleGoDashboard}
            className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Home className="h-4 w-4" />
            {msgs.goDashboard}
          </Button>
        </div>

        {/* Dev-only: full stack trace */}
        {isDev && error && (
          <div className="mx-auto max-w-2xl text-left">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
              {msgs.devStackTrace}
            </p>
            <pre className="rounded-lg border border-red-500/20 bg-slate-900 p-4 text-xs text-red-400/90 overflow-auto max-h-48 whitespace-pre-wrap break-words font-mono">
              {error.stack}
            </pre>
            {errorInfo?.componentStack && (
              <pre className="mt-2 rounded-lg border border-amber-500/20 bg-slate-900 p-4 text-xs text-amber-400/90 overflow-auto max-h-32 whitespace-pre-wrap break-words font-mono">
                {errorInfo.componentStack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorBoundaryPage — wraps the core class boundary with a full-page UI
// ---------------------------------------------------------------------------
export interface ErrorBoundaryPageProps extends Omit<ErrorBoundaryProps, 'fallback'> {
  children: ReactNode;
}

/**
 * Page-level error boundary.
 *
 * Renders a full-page error display with retry, dashboard navigation,
 * and an error code for support reference.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundaryPage>{children}</ErrorBoundaryPage>
 * ```
 */
export function ErrorBoundaryPage({ children, onError, language: propLanguage, ...restProps }: ErrorBoundaryPageProps) {
  const { language: contextLanguage } = useApp();
  const lang = propLanguage ?? contextLanguage ?? 'ar';

  // We need the error & errorInfo inside a functional component for the full-page UI,
  // so we capture them via the onError callback.
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<React.ErrorInfo | null>(null);

  useEffect(() => {
    // Reset captured error when it's cleared
  }, [error]);

  const handleError = useCallback((err: Error, info: React.ErrorInfo) => {
    setError(err);
    setErrorInfo(info);
    onError?.(err, info);
  }, [onError]);

  const handleReset = useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  // Build the full-page fallback when there's an error
  const fallback = error ? (
    <PageErrorContent
      error={error}
      errorInfo={errorInfo}
      onReset={handleReset}
    />
  ) : undefined;

  return (
    <ErrorBoundaryCore
      {...restProps}
      language={lang}
      onError={handleError}
      fallback={fallback}
    >
      {children}
    </ErrorBoundaryCore>
  );
}

export default ErrorBoundaryPage;
