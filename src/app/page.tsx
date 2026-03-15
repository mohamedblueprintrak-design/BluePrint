'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { AppProvider, useApp } from '@/context/app-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { LoginPage } from '@/components/auth/login-page';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { ProjectsPage } from '@/components/projects/projects-page';
import { ClientsPage } from '@/components/clients/clients-page';
import { InvoicesPage } from '@/components/invoices/invoices-page';
import { TasksPage } from '@/components/tasks/tasks-page';
import { HRPage } from '@/components/hr/hr-page';
import { SettingsPage } from '@/components/settings/settings-page';
import { KnowledgePage } from '@/components/knowledge/knowledge-page';
import { AIChatPage } from '@/components/ai-chat/ai-chat-page';
import { ReportsPage } from '@/components/reports/reports-page';
import { SuppliersPage } from '@/components/suppliers/suppliers-page';
import { InventoryPage } from '@/components/inventory/inventory-page';
import { ContractsPage } from '@/components/contracts/contracts-page';
import { SiteDiaryPage } from '@/components/site-diary/site-diary-page';
import { DocumentsPage } from '@/components/documents/documents-page';
import { Toaster } from '@/components/ui/toaster';
import { useTranslation } from '@/lib/translations';
import { Building2 } from 'lucide-react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Placeholder pages for sections under development
function PlaceholderPage({ title }: { title: string }) {
  const { language } = useApp();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
        <Building2 className="w-10 h-10 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 max-w-md">
        {language === 'ar' 
          ? 'هذه الصفحة قيد التطوير وستكون متاحة قريباً'
          : 'This page is under development and will be available soon'}
      </p>
    </div>
  );
}

// Main app content
function AppContent() {
  const { isAuthenticated, isLoading } = useApp();
  const { language, isRTL, currentPage, sidebarCollapsed } = useApp();
  const { t } = useTranslation(language);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render current page content
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'clients':
        return <ClientsPage />;
      case 'proposals':
        return <PlaceholderPage title={t.proposals} />;
      case 'invoices':
        return <InvoicesPage />;
      case 'tasks':
        return <TasksPage />;
      case 'hr':
        return <HRPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'contracts':
        return <ContractsPage />;
      case 'siteDiary':
        return <SiteDiaryPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'knowledge':
        return <KnowledgePage />;
      case 'aiChat':
        return <AIChatPage />;
      case 'modelTest':
        return <PlaceholderPage title={t.modelTest} />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <PlaceholderPage title={t.profile} />;
      case 'admin':
        return <PlaceholderPage title={t.admin} />;
      case 'activities':
        return <PlaceholderPage title={t.activities} />;
      default:
        return <DashboardPage />;
    }
  };

  // Authenticated - show main app
  return (
    <div 
      className={`min-h-screen bg-slate-950 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main 
        className={`
          min-h-screen transition-all duration-300
          ${sidebarCollapsed 
            ? (isRTL ? 'mr-20' : 'ml-20') 
            : (isRTL ? 'mr-64' : 'ml-64')
          }
        `}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <div className="p-6">
          {renderPageContent()}
        </div>
      </main>

      {/* Toaster for notifications */}
      <Toaster />
    </div>
  );
}

// Main page component
export default function BluePrintApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
