'use client';

import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Inner component that checks auth
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { language } = useApp();
  const { t } = useTranslation(language || 'ar');

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect after mounting and auth check is complete
    if (mounted && !isLoading && !isAuthenticated) {
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        router.push('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Show loading while mounting or checking auth
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-slate-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-slate-400">{language === 'ar' ? 'جاري التحويل...' : 'Redirecting...'}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed, isRTL } = useApp();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <main 
          className={cn(
            "transition-all duration-300 min-h-screen flex flex-col",
            sidebarCollapsed 
              ? (isRTL ? "mr-20" : "ml-20")
              : (isRTL ? "mr-64" : "ml-64")
          )}
        >
          {/* Header */}
          <Header />
          
          {/* Page Content - extra bottom padding for mobile bottom nav */}
          <div className="p-4 md:p-6 pb-20 md:pb-6 flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
          
          {/* Footer - sticky to bottom */}
          <Footer />
        </main>
        
        {/* Mobile Bottom Navigation - hidden on desktop */}
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
