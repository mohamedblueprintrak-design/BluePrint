'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { LoginPage } from '@/components/auth/login-page';

// Inner component that checks if already logged in
// Uses window.location.href for redirect to ensure cookies are sent with the request
function LoginGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only redirect if already authenticated (e.g., user navigated to /login while logged in)
    // Don't redirect during login flow - let handleLogin in LoginPage handle it
    if (!isLoading && isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      // Use window.location.href to ensure cookies are sent with the request
      // This is critical for the middleware to receive the auth token cookie
      window.location.href = '/dashboard';
    }
  }, [isLoading, isAuthenticated, isRedirecting]);

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-slate-400">
            {isRedirecting ? 'جاري التحويل...' : 'جاري التحميل...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render children if authenticated (prevents flash of login form)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-slate-400">جاري التحويل...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function LoginRoute() {
  return (
    <LoginGuard>
      <LoginPage />
    </LoginGuard>
  );
}
