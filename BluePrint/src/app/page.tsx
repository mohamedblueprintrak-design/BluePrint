'use client';

import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { AppProvider, useApp } from '@/context/app-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { LoginPage } from '@/components/auth/login-page';
import { ErrorBoundary } from '@/components/ui/error-boundary';

import { Building2, Loader2 } from 'lucide-react';

// Lazy load page components (all use named exports)
const DashboardPage = lazy(() => 
  import('@/components/dashboard/dashboard-page').then(mod => ({ default: mod.DashboardPage }))
);
const ProjectsPage = lazy(() => 
  import('@/components/projects/projects-page').then(mod => ({ default: mod.ProjectsPage }))
);
const ClientsPage = lazy(() => 
  import('@/components/clients/clients-page').then(mod => ({ default: mod.ClientsPage }))
);
const InvoicesPage = lazy(() => 
  import('@/components/invoices/invoices-page').then(mod => ({ default: mod.InvoicesPage }))
);
const TasksPage = lazy(() => 
  import('@/components/tasks/tasks-page').then(mod => ({ default: mod.TasksPage }))
);
const HRPage = lazy(() => 
  import('@/components/hr/hr-page').then(mod => ({ default: mod.HRPage }))
);
const SettingsPage = lazy(() => 
  import('@/components/settings/settings-page').then(mod => ({ default: mod.SettingsPage }))
);
const KnowledgePage = lazy(() => 
  import('@/components/knowledge/knowledge-page').then(mod => ({ default: mod.KnowledgePage }))
);
const AIChatPage = lazy(() => 
  import('@/components/ai-chat/ai-chat-page').then(mod => ({ default: mod.AIChatPage }))
);
const ReportsPage = lazy(() => 
  import('@/components/reports/reports-page').then(mod => ({ default: mod.ReportsPage }))
);
const SuppliersPage = lazy(() => 
  import('@/components/suppliers/suppliers-page').then(mod => ({ default: mod.SuppliersPage }))
);
const InventoryPage = lazy(() => 
  import('@/components/inventory/inventory-page').then(mod => ({ default: mod.InventoryPage }))
);
const ContractsPage = lazy(() => 
  import('@/components/contracts/contracts-page').then(mod => ({ default: mod.ContractsPage }))
);
const SiteDiaryPage = lazy(() => 
  import('@/components/site-diary/site-diary-page').then(mod => ({ default: mod.SiteDiaryPage }))
);
const DocumentsPage = lazy(() => 
  import('@/components/documents/documents-page').then(mod => ({ default: mod.DocumentsPage }))
);
const ProposalsPage = lazy(() => 
  import('@/components/proposals/proposals-page').then(mod => ({ default: mod.ProposalsPage }))
);
const ProfilePage = lazy(() => 
  import('@/components/profile/profile-page').then(mod => ({ default: mod.ProfilePage }))
);
const AdminPage = lazy(() => 
  import('@/components/admin/admin-page').then(mod => ({ default: mod.AdminPage }))
);
const ActivitiesPage = lazy(() => 
  import('@/components/activities/activities-page').then(mod => ({ default: mod.ActivitiesPage }))
);
const BOQPage = lazy(() => 
  import('@/components/boq/boq-page').then(mod => ({ default: mod.BOQPage }))
);
const PurchaseOrdersPage = lazy(() => 
  import('@/components/purchase-orders/purchase-orders-page').then(mod => ({ default: mod.PurchaseOrdersPage }))
);
const DefectsPage = lazy(() => 
  import('@/components/defects/defects-page').then(mod => ({ default: mod.DefectsPage }))
);
const BudgetsPage = lazy(() => 
  import('@/components/budgets/budgets-page').then(mod => ({ default: mod.BudgetsPage }))
);
const VouchersPage = lazy(() => 
  import('@/components/vouchers/vouchers-page').then(mod => ({ default: mod.VouchersPage }))
);

// Create a single QueryClient instance outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Page Loader Component for Suspense fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Loading Skeleton Component for initial app load
function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    </div>
  );
}

// Main app content
function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isRTL, currentPage, sidebarCollapsed } = useApp();

  // Loading state
  if (authLoading) {
    return <LoadingSkeleton />;
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render current page content with Suspense for lazy loading
  const renderPageContent = () => {
    return (
      <Suspense fallback={<PageLoader />}>
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'projects' && <ProjectsPage />}
        {currentPage === 'clients' && <ClientsPage />}
        {currentPage === 'proposals' && <ProposalsPage />}
        {currentPage === 'invoices' && <InvoicesPage />}
        {currentPage === 'tasks' && <TasksPage />}
        {currentPage === 'hr' && <HRPage />}
        {currentPage === 'suppliers' && <SuppliersPage />}
        {currentPage === 'inventory' && <InventoryPage />}
        {currentPage === 'contracts' && <ContractsPage />}
        {currentPage === 'siteDiary' && <SiteDiaryPage />}
        {currentPage === 'documents' && <DocumentsPage />}
        {currentPage === 'knowledge' && <KnowledgePage />}
        {currentPage === 'aiChat' && <AIChatPage />}
        {currentPage === 'reports' && <ReportsPage />}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'admin' && <AdminPage />}
        {currentPage === 'activities' && <ActivitiesPage />}
        {currentPage === 'boq' && <BOQPage />}
        {currentPage === 'purchaseOrders' && <PurchaseOrdersPage />}
        {currentPage === 'defects' && <DefectsPage />}
        {currentPage === 'budgets' && <BudgetsPage />}
        {currentPage === 'vouchers' && <VouchersPage />}
        {currentPage === undefined && <DashboardPage />}
      </Suspense>
    );
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
          md:${sidebarCollapsed 
            ? (isRTL ? 'mr-20' : 'ml-20') 
            : (isRTL ? 'mr-64' : 'ml-64')
          }
          mr-0 ml-0 md:mr-0 md:ml-0
        `}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {renderPageContent()}
        </div>
      </main>
    </div>
  );
}

// Main page component
export default function BluePrintApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
