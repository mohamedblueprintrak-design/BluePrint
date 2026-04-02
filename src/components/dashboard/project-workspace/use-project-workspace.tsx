'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import {
  type ProjectData,
  type WorkflowPhase,
  type ClientInteraction,
  type InvoiceData,
  type TaskData,
  type SiteReportData,
  type DefectData,
  type BOQItemData,
  type DependencyInfo,
  computePhaseDependencies,
} from './config';

// ===== Hook return type =====
export interface BOQVarianceItem {
  boqItemId: string;
  itemNumber: string | null;
  description: string;
  category: string | null;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
  isOverBudget: boolean;
  flagged: boolean;
}

export interface BOQVarianceData {
  items: BOQVarianceItem[];
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercent: number;
  flaggedCount: number;
  overBudgetCount: number;
}

export interface UseProjectWorkspaceReturn {
  // Context
  isAr: boolean;
  user: ReturnType<typeof useAuth>['user'];
  t: ReturnType<typeof useTranslation>['t'];
  formatCurrency: ReturnType<typeof useTranslation>['formatCurrency'];
  formatDate: ReturnType<typeof useTranslation>['formatDate'];
  formatDateTime: ReturnType<typeof useTranslation>['formatDateTime'];
  isRTL: ReturnType<typeof useTranslation>['isRTL'];

  // Data states
  project: ProjectData | null;
  phases: WorkflowPhase[];
  interactions: ClientInteraction[];
  invoices: InvoiceData[];
  tasks: TaskData[];
  siteReports: SiteReportData[];
  defects: DefectData[];
  boqVariance: BOQVarianceData | null;
  boqItems: BOQItemData[];
  loading: boolean;
  error: string | null;

  // UI states
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Interaction dialog state
  interactionDialogOpen: boolean;
  setInteractionDialogOpen: (open: boolean) => void;
  interactionForm: {
    phaseId: string;
    interactionType: string;
    content: string;
    responseContent: string;
  };
  setInteractionForm: React.Dispatch<React.SetStateAction<{
    phaseId: string;
    interactionType: string;
    content: string;
    responseContent: string;
  }>>;
  submittingInteraction: boolean;

  // Interaction filter & rejection dialog state
  interactionFilter: string;
  setInteractionFilter: (filter: string) => void;
  rejectDialogOpen: boolean;
  setRejectDialogOpen: (open: boolean) => void;
  rejectTarget: ClientInteraction | null;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  submittingAction: boolean;

  // Handlers
  handleSubmitInteraction: () => Promise<void>;
  handleQuickApprove: (interaction: ClientInteraction) => Promise<void>;
  handleQuickReject: (interaction: ClientInteraction) => void;
  handleSubmitRejection: () => Promise<void>;
  handleRequestChange: (interaction: ClientInteraction) => Promise<void>;
  handlePhaseStatusChange: (phaseId: string, newStatus: string) => Promise<void>;

  // Computed values
  phasesByCategory: Record<string, WorkflowPhase[]>;
  phaseDependencyMap: Record<string, DependencyInfo>;
  totalPaid: number;
  totalInvoiced: number;
  totalBOQ: number;
  completedPhases: number;
  totalPhases: number;
  boqByCategory: Record<string, BOQItemData[]>;
  taskStats: { total: number; done: number; inProgress: number };
  filteredInteractions: ClientInteraction[];
}

// ===== Custom Hook =====
export function useProjectWorkspace(projectId: string): UseProjectWorkspaceReturn {
  const { language } = useApp();
  const { user } = useAuth();
  const { t, formatCurrency, formatDate, formatDateTime, isRTL } = useTranslation(language);
  const isAr = language === 'ar';

  // Data states
  const [project, setProject] = useState<ProjectData | null>(null);
  const [phases, setPhases] = useState<WorkflowPhase[]>([]);
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [siteReports, setSiteReports] = useState<SiteReportData[]>([]);
  const [defects, setDefects] = useState<DefectData[]>([]);
  const [boqVariance, setBoqVariance] = useState<BOQVarianceData | null>(null);
  const [boqItems, setBoqItems] = useState<BOQItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Interaction form state
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    phaseId: '',
    interactionType: 'COMMENT',
    content: '',
    responseContent: '',
  });
  const [submittingInteraction, setSubmittingInteraction] = useState(false);

  // Interaction filter & rejection dialog state
  const [interactionFilter, setInteractionFilter] = useState<string>('ALL');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ClientInteraction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch all data
  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const getAuthHeaders = () => {
          const token = localStorage.getItem('blueprint-auth-token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        };

        const endpoints = [
          `/api/projects/${projectId}`,
          `/api/workflow?projectId=${projectId}`,
          `/api/interactions?projectId=${projectId}`,
          `/api/invoices?projectId=${projectId}`,
          `/api/tasks?projectId=${projectId}`,
          `/api/boq?projectId=${projectId}`,
          `/api/site-reports?projectId=${projectId}`,
          `/api/defects?projectId=${projectId}`,
        ];
        const responses = await Promise.allSettled(
          endpoints.map((url) =>
            fetch(url, {
              headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
              } as Record<string, string>,
            })
          )
        );

        // Project
        if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
          const data = await responses[0].value.json();
          setProject(data.project || data.projects?.[0] || data.data?.project || null);
        }

        // Workflow
        if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
          const data = await responses[1].value.json();
          setPhases(data.data?.phases || data.phases || []);
        }

        // Interactions
        if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
          const data = await responses[2].value.json();
          setInteractions(data.data?.interactions || data.interactions || []);
        }

        // Invoices
        if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
          const data = await responses[3].value.json();
          setInvoices(data.data?.invoices || data.invoices || []);
        }

        // Tasks
        if (responses[4].status === 'fulfilled' && responses[4].value.ok) {
          const data = await responses[4].value.json();
          setTasks(data.data?.tasks || data.tasks || []);
        }

        // BOQ
        if (responses[5].status === 'fulfilled' && responses[5].value.ok) {
          const data = await responses[5].value.json();
          setBoqItems(data.data || data.boqItems || []);
        }

        // Site Reports
        if (responses[6].status === 'fulfilled' && responses[6].value.ok) {
          const data = await responses[6].value.json();
          setSiteReports(data.data || data.reports || []);
        }

        // Defects
        if (responses[7].status === 'fulfilled' && responses[7].value.ok) {
          const data = await responses[7].value.json();
          setDefects(data.data || data.defects || []);
        }

        // BOQ Cost Variance
        try {
          const costRes = await fetch(`/api/projects/${projectId}/cost-summary`, {
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } as Record<string, string>,
          });
          if (costRes.ok) {
            const costData = await costRes.json();
            setBoqVariance(costData.data || null);
          }
        } catch {
          // Silently fail - variance is optional
        }
      } catch (err) {
        console.error('Failed to fetch workspace data:', err);
        setError(isAr ? 'فشل في تحميل البيانات' : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, isAr]);

  // Submit interaction
  const handleSubmitInteraction = async () => {
    if (!interactionForm.content.trim() || !projectId) return;
    setSubmittingInteraction(true);
    try {
      const token = localStorage.getItem('blueprint-auth-token');
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          phaseId: interactionForm.phaseId || null,
          interactionType: interactionForm.interactionType,
          content: interactionForm.content,
          responseContent: interactionForm.responseContent || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newInteraction = data.data?.interaction || data.interaction;
        if (newInteraction) setInteractions((prev) => [newInteraction, ...prev]);
        setInteractionDialogOpen(false);
        setInteractionForm({
          phaseId: '',
          interactionType: 'COMMENT',
          content: '',
          responseContent: '',
        });
      }
    } catch (err) {
      console.error('Failed to create interaction:', err);
    } finally {
      setSubmittingInteraction(false);
    }
  };

  // Quick action: Approve interaction
  const handleQuickApprove = useCallback(
    async (interaction: ClientInteraction) => {
      setSubmittingAction(true);
      try {
        const token = localStorage.getItem('blueprint-auth-token');
        const res = await fetch('/api/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            projectId,
            phaseId: interaction.phaseId || null,
            interactionType: 'APPROVAL',
            content: isAr
              ? `تمت الموافقة على: ${interaction.content.substring(0, 80)}`
              : `Approved: ${interaction.content.substring(0, 80)}`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const newInteraction = data.data?.interaction || data.interaction;
          if (newInteraction) setInteractions((prev) => [newInteraction, ...prev]);
          // Mark original as responded
          setInteractions((prev) =>
            prev.map((i) =>
              i.id === interaction.id
                ? {
                    ...i,
                    responseContent: isAr ? 'تمت الموافقة' : 'Approved',
                    responseDate: new Date().toISOString(),
                  }
                : i
            )
          );
        }
      } catch (err) {
        console.error('Failed to approve:', err);
      } finally {
        setSubmittingAction(false);
      }
    },
    [projectId, isAr]
  );

  // Quick action: Reject interaction (opens dialog)
  const handleQuickReject = useCallback((interaction: ClientInteraction) => {
    setRejectTarget(interaction);
    setRejectReason('');
    setRejectDialogOpen(true);
  }, []);

  // Submit rejection
  const handleSubmitRejection = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setSubmittingAction(true);
    try {
      const token = localStorage.getItem('blueprint-auth-token');
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          phaseId: rejectTarget.phaseId || null,
          interactionType: 'REJECTION',
          content: rejectReason,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newInteraction = data.data?.interaction || data.interaction;
        if (newInteraction) setInteractions((prev) => [newInteraction, ...prev]);
        setInteractions((prev) =>
          prev.map((i) =>
            i.id === rejectTarget.id
              ? { ...i, responseContent: rejectReason, responseDate: new Date().toISOString() }
              : i
          )
        );
        setRejectDialogOpen(false);
        setRejectTarget(null);
        setRejectReason('');
      }
    } catch (err) {
      console.error('Failed to reject:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Quick action: Request Change
  const handleRequestChange = useCallback(
    async (interaction: ClientInteraction) => {
      setSubmittingAction(true);
      try {
        const token = localStorage.getItem('blueprint-auth-token');
        const res = await fetch('/api/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            projectId,
            phaseId: interaction.phaseId || null,
            interactionType: 'REQUEST_CHANGE',
            content: isAr
              ? `طلب تعديل على: ${interaction.content.substring(0, 80)}`
              : `Change requested on: ${interaction.content.substring(0, 80)}`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const newInteraction = data.data?.interaction || data.interaction;
          if (newInteraction) setInteractions((prev) => [newInteraction, ...prev]);
        }
      } catch (err) {
        console.error('Failed to request change:', err);
      } finally {
        setSubmittingAction(false);
      }
    },
    [projectId, isAr]
  );

  // Computed values
  const phasesByCategory = useMemo(() => {
    const grouped: Record<string, WorkflowPhase[]> = {};
    for (const p of phases) {
      const cat = p.phaseCategory || 'OTHER';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    }
    return grouped;
  }, [phases]);

  // Phase dependency map
  const phaseDependencyMap = useMemo(() => {
    const map: Record<string, DependencyInfo> = {};
    for (const p of phases) {
      map[p.id] = computePhaseDependencies(p, phases, project);
    }
    return map;
  }, [phases, project]);

  const totalPaid = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
    [invoices]
  );
  const totalInvoiced = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
    [invoices]
  );
  const totalBOQ = useMemo(
    () => boqItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
    [boqItems]
  );
  const completedPhases = useMemo(
    () => phases.filter((p) => p.status === 'COMPLETED').length,
    [phases]
  );
  const totalPhases = phases.length;

  // BOQ by category
  const boqByCategory = useMemo(() => {
    const map: Record<string, BOQItemData[]> = {};
    for (const item of boqItems) {
      const cat = item.category || 'uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return map;
  }, [boqItems]);

  const taskStats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'DONE' || t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    return { total: tasks.length, done, inProgress };
  }, [tasks]);

  // Filtered interactions
  const filteredInteractions = useMemo(() => {
    if (interactionFilter === 'ALL') return interactions;
    return interactions.filter((i) => i.interactionType === interactionFilter);
  }, [interactions, interactionFilter]);

  // Phase status change
  const handlePhaseStatusChange = async (phaseId: string, newStatus: string) => {
    // Check if phase is blocked before allowing IN_PROGRESS
    const depInfo = phaseDependencyMap[phaseId];
    if (depInfo && depInfo.blocked && newStatus === 'IN_PROGRESS') return;

    try {
      const token = localStorage.getItem('blueprint-auth-token');
      const res = await fetch('/api/workflow', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: phaseId, status: newStatus }),
      });
      if (res.ok) {
        setPhases((prev) =>
          prev.map((p) => (p.id === phaseId ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error('Failed to update phase:', err);
    }
  };

  return {
    // Context
    isAr,
    user,
    t,
    formatCurrency,
    formatDate,
    formatDateTime,
    isRTL,

    // Data states
    project,
    phases,
    interactions,
    invoices,
    tasks,
    siteReports,
    defects,
    boqVariance,
    boqItems,
    loading,
    error,

    // UI states
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,

    // Interaction dialog state
    interactionDialogOpen,
    setInteractionDialogOpen,
    interactionForm,
    setInteractionForm,
    submittingInteraction,

    // Interaction filter & rejection dialog state
    interactionFilter,
    setInteractionFilter,
    rejectDialogOpen,
    setRejectDialogOpen,
    rejectTarget,
    rejectReason,
    setRejectReason,
    submittingAction,

    // Handlers
    handleSubmitInteraction,
    handleQuickApprove,
    handleQuickReject,
    handleSubmitRejection,
    handleRequestChange,
    handlePhaseStatusChange,

    // Computed values
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
  };
}
