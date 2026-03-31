'use client';

/**
 * Provider-level Error Boundary
 * سياج الأخطاء على مستوى المزود
 *
 * This module re-exports the improved ErrorBoundary from @/components/ui/error-boundary
 * for backward compatibility. All new code should import directly from the UI module.
 *
 * The improved ErrorBoundary includes:
 * - Bilingual messages (Arabic + English) via AppContext language detection
 * - Structured client-side logging (@/lib/client-logger)
 * - Report Error toast button
 * - Dev-only stack trace toggle
 * - Custom fallback, onError callback, and title props
 */

export { ErrorBoundary, ErrorBoundaryCore, type ErrorBoundaryProps } from '@/components/ui/error-boundary';
export { ErrorBoundaryPage, type ErrorBoundaryPageProps } from '@/components/ui/error-boundary-page';
