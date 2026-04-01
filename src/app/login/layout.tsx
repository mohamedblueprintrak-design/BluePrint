'use client';

import { AuthProvider } from "@/context/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from 'react';

/**
 * Minimal providers for login page - only auth + query client needed.
 * No AI/WebSocket providers to avoid unnecessary module loading.
 */
function LoginProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoginProviders>
      {children}
    </LoginProviders>
  );
}
