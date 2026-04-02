'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Language } from '@/lib/translations';
import { clientLog } from '@/lib/client-logger';
import { useApp } from '@/context/app-context';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Bilingual error strings
// ---------------------------------------------------------------------------
const errorMessages = {
  ar: {
    title: 'حدث خطأ غير متوقع',
    description: 'عذراً، حدث خطأ أثناء تحميل هذا الجزء.',
    errorMessage: 'تفاصيل الخطأ',
    retry: 'إعادة المحاولة',
    reportError: 'إبلاغ عن الخطأ',
    showDetails: 'عرض التفاصيل',
    hideDetails: 'إخفاء التفاصيل',
    errorReported: 'تم إرسال بلاغ الخطأ بنجاح',
    goHome: 'العودة للوحة التحكم',
    stackTrace: 'تتبع المكدس',
    devNote: 'وضع التطوير — التفاصيل مرئية',
  },
  en: {
    title: 'Something went wrong',
    description: "Sorry, an error occurred while loading this section.",
    errorMessage: 'Error details',
    retry: 'Try Again',
    reportError: 'Report Error',
    showDetails: 'Show Details',
    hideDetails: 'Hide Details',
    errorReported: 'Error report sent successfully',
    goHome: 'Go to Dashboard',
    stackTrace: 'Stack trace',
    devNote: 'Development mode — details visible',
  },
} as const;

// ---------------------------------------------------------------------------
// Props & State
// ---------------------------------------------------------------------------
export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback UI — takes priority over the built-in UI */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Custom heading shown above the error (bilingual built-in heading used when omitted) */
  title?: string;
  /** Current UI language. When omitted the component defaults to Arabic. */
  language?: Language;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

// ---------------------------------------------------------------------------
// Core class component — the actual React error boundary
// ---------------------------------------------------------------------------
export class ErrorBoundaryCore extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;

    // Delegate to optional callback
    onError?.(error, errorInfo);

    // Structured client-side logging
    clientLog.error('[ErrorBoundary] Caught error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  // ---- handlers ----

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleToggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  handleReportError = () => {
    const { language = 'ar' } = this.props;
    const msgs = errorMessages[language];

    // For now, show a toast. In the future this could POST to an error-reporting API.
    toast.success(msgs.errorReported);

    clientLog.info('[ErrorBoundary] Error reported by user', {
      errorMessage: this.state.error?.message,
    });
  };

  // ---- render ----

  render() {
    const { language = 'ar' } = this.props;
    const msgs = errorMessages[language];

    if (this.state.hasError) {
      // Custom fallback takes priority
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === 'development';

      return (
        <Card className="border-red-500/30 bg-background shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              {/* Icon */}
              <div className="rounded-full bg-red-500/10 p-4">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>

              {/* Title */}
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {this.props.title || msgs.title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {msgs.description}
                </p>
                {this.state.error?.message && (
                  <p className="text-xs text-red-400/80 mt-1 font-mono break-all">
                    {this.state.error.message}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReset}
                  className="gap-2 border-border text-foreground/80 hover:bg-muted hover:text-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                  {msgs.retry}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReportError}
                  className="gap-2 border-border text-foreground/80 hover:bg-muted hover:text-foreground"
                >
                  <Bug className="h-4 w-4" />
                  {msgs.reportError}
                </Button>
              </div>

              {/* Dev-only: toggle stack trace */}
              {isDev && this.state.error && (
                <div className="w-full max-w-2xl">
                  <button
                    type="button"
                    onClick={this.handleToggleDetails}
                    className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-foreground/80 transition-colors"
                  >
                    {this.state.showDetails ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        {msgs.hideDetails}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        {msgs.showDetails}
                      </>
                    )}
                    <span className="text-muted-foreground">— {msgs.devNote}</span>
                  </button>

                  {this.state.showDetails && (
                    <div className="mt-3 rounded-lg border border-red-500/20 bg-card p-4 text-left">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                        {msgs.stackTrace}
                      </p>
                      <pre className="text-xs text-red-400/90 overflow-auto max-h-48 whitespace-pre-wrap break-words font-mono">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Functional wrapper — auto-detects language from AppContext
// ---------------------------------------------------------------------------
/**
 * ErrorBoundary
 *
 * Drop-in error boundary with bilingual support, structured logging,
 * report-error toast, and a dev-only stack-trace toggle.
 *
 * Usage:
 * ```tsx
 * // Auto-detects language from AppContext:
 * <ErrorBoundary>{children}</ErrorBoundary>
 *
 * // Explicit language:
 * <ErrorBoundary language="en">{children}</ErrorBoundary>
 *
 * // Custom fallback:
 * <ErrorBoundary fallback={<p>Oops</p>}>{children}</ErrorBoundary>
 * ```
 */
export function ErrorBoundary(props: Omit<ErrorBoundaryProps, 'language'> & { language?: Language }) {
  const { language: contextLanguage } = useApp();
  const language = props.language ?? contextLanguage ?? 'ar';

  return <ErrorBoundaryCore {...props} language={language} />;
}

export default ErrorBoundary;
