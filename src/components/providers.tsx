'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AuthProvider } from "@/context/auth-context";
import { AppProvider } from "@/context/app-context";
import { AIProvider } from "@/lib/ai/ai-context";
import { WebSocketProvider } from "@/lib/websocket/websocket-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Error Boundary Component
 * مكون حدود الخطأ المحسن
 * 
 * Catches JavaScript errors in child component tree and displays
 * a fallback UI instead of crashing the entire app.
 * - Dev mode: shows stack trace for debugging
 * - Prod mode: shows user-friendly message
 * - Supports custom fallback via onError callback
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to optional error handler (e.g., Sentry)
    this.props.onError?.(error, errorInfo);
    
    // Only log full details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    } else {
      console.error('[ErrorBoundary]', error.message);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-background">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isDev ? 'Development Error' : 'حدث خطأ غير متوقع'}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {isDev
                ? (this.state.error?.message || 'An unexpected error occurred.')
                : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.'}
            </p>
          </div>

          {isDev && this.state.error && (
            <div className="max-w-2xl w-full rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
              <pre className="text-xs text-destructive overflow-auto max-h-40 whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
              {this.state.errorInfo && (
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-20 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              إعادة المحاولة
            </Button>
            <Button onClick={this.handleGoHome}>
              <Home className="mr-2 h-4 w-4" />
              الرئيسية
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
        refetchOnMount: true,
      },
      mutations: {
        retry: 0,
      },
    },
  }));

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <AIProvider>
              <WebSocketProvider>
                {children}
              </WebSocketProvider>
            </AIProvider>
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
