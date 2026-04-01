'use client';

import { AuthProvider } from "@/context/auth-context";
import { AppProvider } from "@/context/app-context";
import { AIProvider } from "@/lib/ai/ai-context";
import { WebSocketProvider } from "@/lib/websocket/websocket-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from 'react';

/**
 * Providers Component
 * wraps all app context providers (auth, app, AI, websocket, react-query)
 * Note: Error Boundary is handled by Next.js error.tsx files per route
 */
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
  );
}
