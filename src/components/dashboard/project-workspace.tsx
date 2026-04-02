'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  XCircle,
  ArrowLeft,
  LayoutGrid,
  Eye,
  Layers,
  Building2,
  Wrench,
  Landmark,
  CreditCard,
  HardHat,
  FileSpreadsheet,
  Timer,
  MessageSquare,
  Menu,
} from 'lucide-react';

// Config and hook
import {
  ROLE_TABS,
  statusConfig,
  typeConfig,
} from './project-workspace/config';
import { useProjectWorkspace } from './project-workspace/use-project-workspace';

// Tab / sidebar components
import WorkspaceSidebar from './project-workspace/tabs/WorkspaceSidebar';
import MatrixTab from './project-workspace/tabs/MatrixTab';
import OverviewTab from './project-workspace/tabs/OverviewTab';
import ArchitecturalTab from './project-workspace/tabs/ArchitecturalTab';
import StructuralTab from './project-workspace/tabs/StructuralTab';
import MEPTab from './project-workspace/tabs/MEPTab';
import GovernmentTab from './project-workspace/tabs/GovernmentTab';
import FinancialTab from './project-workspace/tabs/FinancialTab';
import SiteTab from './project-workspace/tabs/SiteTab';
import BOQTab from './project-workspace/tabs/BOQTab';
import TimelineTab from './project-workspace/tabs/TimelineTab';
import InteractionsTab from './project-workspace/tabs/InteractionsTab';

// ===== Types =====
interface ProjectWorkspaceProps {
  projectId: string;
  onBack: () => void;
}

// ===== Tab definitions =====
const ALL_TABS = [
  { key: 'matrix', labelAr: 'المصفوفة', labelEn: 'Matrix', Icon: LayoutGrid },
  { key: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', Icon: Eye },
  { key: 'architectural', labelAr: 'المعماري', labelEn: 'Architecture', Icon: Layers },
  { key: 'structural', labelAr: 'الإنشائي', labelEn: 'Structural', Icon: Building2 },
  { key: 'mep', labelAr: 'الخدمات', labelEn: 'MEP', Icon: Wrench },
  { key: 'government', labelAr: 'الموافقات', labelEn: 'Government', Icon: Landmark },
  { key: 'financial', labelAr: 'المالية', labelEn: 'Financial', Icon: CreditCard },
  { key: 'site', labelAr: 'الموقع', labelEn: 'Site', Icon: HardHat },
  { key: 'boq', labelAr: 'جدول الكميات', labelEn: 'BOQ', Icon: FileSpreadsheet },
  { key: 'timeline', labelAr: 'الجدول', labelEn: 'Timeline', Icon: Timer },
  { key: 'interactions', labelAr: 'التفاعلات', labelEn: 'Interactions', Icon: MessageSquare },
] as const;

// ===== Main Component =====
export default function ProjectWorkspace({ projectId, onBack }: ProjectWorkspaceProps) {
  const { language } = useApp();
  const { user } = useAuth();
  const { t, formatCurrency, formatDate, formatDateTime, isRTL } = useTranslation(language);
  const isAr = language === 'ar';

  const workspace = useProjectWorkspace(projectId);
  const {
    loading,
    error,
    project,
    phases,
    invoices,
    siteReports,
    defects,
    boqItems,
    boqVariance,
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    interactionDialogOpen,
    setInteractionDialogOpen,
    interactionForm,
    setInteractionForm,
    submittingInteraction,
    interactionFilter,
    setInteractionFilter,
    rejectDialogOpen,
    setRejectDialogOpen,
    rejectReason,
    setRejectReason,
    submittingAction,
    handleSubmitInteraction,
    handleQuickApprove,
    handleQuickReject,
    handleSubmitRejection,
    handleRequestChange,
    handlePhaseStatusChange,
    phasesByCategory,
    phaseDependencyMap,
    totalPaid,
    totalInvoiced,
    totalBOQ,
    completedPhases,
    totalPhases,
    boqByCategory,
    taskStats,
    filteredInteractions,
  } = workspace;

  const canManagePhases = ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'ENGINEER'].includes(
    user?.role || ''
  );

  // ===== Role-based tab filtering =====
  const visibleTabs = useMemo(() => {
    const userRole = user?.role || 'VIEWER';
    const userDept = ((user as Record<string, unknown>)?.department as string || '').toUpperCase();
    let allowedTabs = ROLE_TABS[userRole] || ROLE_TABS.VIEWER;

    // Engineer department-based tab access
    if (userRole === 'ENGINEER' && userDept) {
      const base = ['matrix', 'overview', 'boq'];
      if (userDept.includes('ARCH') || userDept.includes('معمار')) allowedTabs = [...base, 'architectural'];
      else if (userDept.includes('STRUCT') || userDept.includes('إنشائ') || userDept.includes('هيكلي')) allowedTabs = [...base, 'structural'];
      else if (userDept.includes('ELEC') || userDept.includes('كهربائ')) allowedTabs = [...base, 'mep'];
      else if (userDept.includes('MEP')) allowedTabs = [...base, 'mep'];
      else if (userDept.includes('MECH') || userDept.includes('HVAC') || userDept.includes('ميكانيك') || userDept.includes('تكييف')) allowedTabs = [...base, 'mep'];
      else if (userDept.includes('PLUMB') || userDept.includes('سباك') || userDept.includes('صرف')) allowedTabs = [...base, 'mep'];
      else if (userDept.includes('CIVIL') || userDept.includes('مدني')) allowedTabs = [...base, 'structural'];
    }

    return ALL_TABS.filter((tab) => allowedTabs.includes(tab.key));
  }, [user]);

  // ===== Loading state =====
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-slate-400 text-sm">
            {isAr ? 'جاري تحميل المشروع...' : 'Loading project...'}
          </p>
        </div>
      </div>
    );
  }

  // ===== Error / Not found state =====
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-slate-400">
          {error || (isAr ? 'لم يتم العثور على المشروع' : 'Project not found')}
        </p>
        <Button
          variant="outline"
          onClick={onBack}
          className="border-slate-700 text-slate-300"
        >
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''} me-2`} />
          {t.back}
        </Button>
      </div>
    );
  }

  // ===== Derived config values =====
  const sc = statusConfig[project.status] || statusConfig.PLANNING;
  const tc = typeConfig[project.type] || { labelAr: project.type, labelEn: project.type };

  // ===== Render tab content =====
  const renderTab = (tabKey: string) => {
    switch (tabKey) {
      case 'matrix':
        return (
          <MatrixTab
            phasesByCategory={phasesByCategory}
            phaseDependencyMap={phaseDependencyMap}
            canManage={canManagePhases}
            isAr={isAr}
            onStatusChange={handlePhaseStatusChange}
          />
        );
      case 'overview':
        return (
          <OverviewTab
            project={project}
            phasesByCategory={phasesByCategory}
            phaseDependencyMap={phaseDependencyMap}
            totalPaid={totalPaid}
            totalInvoiced={totalInvoiced}
            totalPhases={totalPhases}
            taskStats={taskStats}
            isAr={isAr}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            sc={sc}
            tc={tc}
            t={t as typeof t & { completed: string }}
          />
        );
      case 'architectural':
        return (
          <ArchitecturalTab
            phasesByCategory={phasesByCategory}
            phaseDependencyMap={phaseDependencyMap}
            canManage={canManagePhases}
            isAr={isAr}
            onStatusChange={handlePhaseStatusChange}
            formatDate={formatDate}
            t={t as { status: string; actions: string; noData: string }}
          />
        );
      case 'structural':
        return (
          <StructuralTab
            phasesByCategory={phasesByCategory}
            phaseDependencyMap={phaseDependencyMap}
            canManage={canManagePhases}
            isAr={isAr}
            onStatusChange={handlePhaseStatusChange}
            formatDate={formatDate}
            t={t as { status: string; actions: string; noData: string }}
          />
        );
      case 'mep':
        return (
          <MEPTab
            phasesByCategory={phasesByCategory}
            phaseDependencyMap={phaseDependencyMap}
            canManage={canManagePhases}
            isAr={isAr}
            onStatusChange={handlePhaseStatusChange}
            formatDate={formatDate}
            t={t as { status: string; actions: string; noData: string }}
          />
        );
      case 'government':
        return (
          <GovernmentTab
            phasesByCategory={phasesByCategory}
            phaseDependencyMap={phaseDependencyMap}
            canManage={canManagePhases}
            isAr={isAr}
            onStatusChange={handlePhaseStatusChange}
            formatDate={formatDate}
            t={t as { status: string; actions: string; noData: string }}
          />
        );
      case 'financial':
        return (
          <FinancialTab
            project={project}
            invoices={invoices}
            boqItems={boqItems}
            totalPaid={totalPaid}
            totalBOQ={totalBOQ}
            isAr={isAr}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            t={t as { noData: string; invoiceNumber: string; date: string; paid: string; status: string }}
          />
        );
      case 'site':
        return (
          <SiteTab
            siteReports={siteReports}
            defects={defects}
            isAr={isAr}
            formatDate={formatDate}
            t={t as { noData: string; status: string; date: string }}
          />
        );
      case 'boq':
        return (
          <BOQTab
            project={project}
            boqItems={boqItems}
            boqVariance={boqVariance}
            boqByCategory={boqByCategory}
            totalBOQ={totalBOQ}
            isAr={isAr}
            formatCurrency={formatCurrency}
            t={t as { noData: string }}
          />
        );
      case 'timeline':
        return (
          <TimelineTab
            phasesByCategory={phasesByCategory}
            phaseDependencyMap={phaseDependencyMap}
            phases={phases}
            isAr={isAr}
            isRTL={isRTL}
            formatDate={formatDate}
            t={t as { noData: string }}
          />
        );
      case 'interactions':
        return (
          <InteractionsTab
            projectId={projectId}
            clientId={project.client?.id}
            phases={phases}
            filteredInteractions={filteredInteractions}
            isAr={isAr}
            formatDateTime={formatDateTime}
            t={t as { noData: string; cancel: string; submit: string }}
            interactionFilter={interactionFilter}
            setInteractionFilter={setInteractionFilter}
            interactionDialogOpen={interactionDialogOpen}
            setInteractionDialogOpen={setInteractionDialogOpen}
            interactionForm={interactionForm}
            setInteractionForm={setInteractionForm}
            submittingInteraction={submittingInteraction}
            rejectDialogOpen={rejectDialogOpen}
            setRejectDialogOpen={setRejectDialogOpen}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            submittingAction={submittingAction}
            handleSubmitInteraction={handleSubmitInteraction}
            handleQuickApprove={handleQuickApprove}
            handleQuickReject={handleQuickReject}
            handleSubmitRejection={handleSubmitRejection}
            handleRequestChange={handleRequestChange}
          />
        );
      default:
        return null;
    }
  };

  // ===== Main render =====
  return (
    <div
      className="flex h-full bg-slate-950 text-white"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Sidebar (handles overlay + aside internally) */}
      <WorkspaceSidebar
        project={project}
        isAr={isAr}
        isRTL={isRTL}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onBack={onBack}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        completedPhases={completedPhases}
        totalPhases={totalPhases}
        taskStats={taskStats}
        t={{ back: t.back, progress: t.progress, tasks: t.tasks }}
      />

      {/* ===== Main Content ===== */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 h-8 w-8 p-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-semibold text-white truncate">
            {project.name}
          </h2>
          <Badge
            variant="secondary"
            className={`${sc.bg} ${sc.color} text-[10px] ms-auto`}
          >
            {isAr ? sc.labelAr : sc.labelEn}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full"
          >
            {/* Tab List */}
            <div className="border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6 overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-0">
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="data-[state=active]:bg-transparent data-[state=active]:text-blue-400 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-slate-400 hover:text-white rounded-none px-3 py-3 gap-1.5 text-xs font-medium whitespace-nowrap"
                  >
                    <tab.Icon className="h-3.5 w-3.5" />
                    {isAr ? tab.labelAr : tab.labelEn}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab Contents */}
            {visibleTabs.map((tab) => (
              <TabsContent
                key={tab.key}
                value={tab.key}
                className="p-4 lg:p-6 mt-0"
              >
                {renderTab(tab.key)}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
