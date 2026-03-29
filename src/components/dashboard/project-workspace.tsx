'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
  BrainCircuit,
  MessageSquare,
  Send,
  HardHat,
  Wrench,
  CreditCard,
  ClipboardList,
  Timer,
  Eye,
  Play,
  Menu,
  X,
  CircleDot,
  TrendingUp,
  Receipt,
  Landmark,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

// ===== Types =====
interface ProjectWorkspaceProps {
  projectId: string;
  onBack: () => void;
}

interface ProjectData {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  type: string;
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
  progress: number;
  location?: string;
  currency: string;
  client?: { id: string; name: string; company?: string } | null;
  manager?: { id: string; name: string; avatar?: string } | null;
  _count?: { invoices: number; tasks: number; defects: number; siteReports: number; boqItems: number };
  plotNumber?: string | null;
  projectType?: string | null;
  visitDate?: string | null;
  paymentReceived?: number;
  remainingBalance?: number;
}

interface WorkflowPhase {
  id: string;
  projectId: string;
  phaseType: string;
  phaseCategory: string;
  status: string;
  startDate?: string;
  endDate?: string;
  slaDays: number;
  assignedToId?: string;
  assignedTo?: { id: string; name: string; avatar?: string } | null;
  notes?: string;
  order: number;
  dependsOnId?: string;
  rejectionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ClientInteraction {
  id: string;
  projectId: string;
  phaseId?: string;
  interactionType: string;
  content: string;
  respondedById?: string;
  responseContent?: string;
  responseDate?: string;
  createdAt: string;
  phase?: { id: string; phaseType: string; phaseCategory: string } | null;
  respondedBy?: { id: string; name: string; avatar?: string } | null;
}

interface InvoiceData {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  currency: string;
}

interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
}

interface SiteReportData {
  id: string;
  date: string;
  weatherConditions?: string;
  workCompleted?: string;
  workforceCount: number;
  notes?: string;
}

interface DefectData {
  id: string;
  title: string;
  severity: string;
  status: string;
  location?: string;
  createdAt: string;
  resolvedDate?: string;
  reportedBy?: { id: string; name: string } | null;
}

interface BOQItemData {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

// ===== Config Maps =====
const statusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  ACTIVE: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'نشط', labelEn: 'Active' },
  COMPLETED: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'مكتمل', labelEn: 'Completed' },
  PLANNING: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'تخطيط', labelEn: 'Planning' },
  ON_HOLD: { color: 'text-orange-400', bg: 'bg-orange-500/15', labelAr: 'معلق', labelEn: 'On Hold' },
  CANCELLED: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'ملغى', labelEn: 'Cancelled' },
};

const typeConfig: Record<string, { labelAr: string; labelEn: string }> = {
  CONSULTANCY: { labelAr: 'استشارات', labelEn: 'Consultancy' },
  CONSTRUCTION: { labelAr: 'بناء', labelEn: 'Construction' },
  DESIGN: { labelAr: 'تصميم', labelEn: 'Design' },
  SUPERVISION: { labelAr: 'إشراف', labelEn: 'Supervision' },
};

const phaseStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string; dot: string }> = {
  NOT_STARTED: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'لم يبدأ', labelEn: 'Not Started', dot: 'bg-slate-400' },
  IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'قيد التنفيذ', labelEn: 'In Progress', dot: 'bg-blue-400' },
  COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'مكتمل', labelEn: 'Completed', dot: 'bg-emerald-400' },
  ON_HOLD: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'معلق', labelEn: 'On Hold', dot: 'bg-amber-400' },
  DELAYED: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'متأخر', labelEn: 'Delayed', dot: 'bg-red-400' },
  REJECTED: { color: 'text-red-500', bg: 'bg-red-500/20', labelAr: 'مرفوض', labelEn: 'Rejected', dot: 'bg-red-500' },
};

const phaseTypeLabels: Record<string, { ar: string; en: string }> = {
  ARCHITECTURAL_SKETCH: { ar: 'المخطط المعماري', en: 'Architectural Sketch' },
  ARCHITECTURAL_CONCEPT: { ar: 'التصميم المفاهيمي', en: 'Concept Design' },
  CLIENT_APPROVAL: { ar: 'موافقة العميل', en: 'Client Approval' },
  MODIFICATIONS: { ar: 'التعديلات', en: 'Modifications' },
  PRELIMINARY: { ar: 'الرسومات الأولية', en: 'Preliminary Drawings' },
  THREE_D_MAX: { ar: 'ثري دي ماكس', en: '3D Max' },
  FINAL_DRAWINGS: { ar: 'الرسومات النهائية', en: 'Final Drawings' },
  SOIL_REPORT: { ar: 'تقرير التربة', en: 'Soil Report' },
  FOUNDATION: { ar: 'الأساسات', en: 'Foundation Details' },
  STRUCTURAL_CALC: { ar: 'الحسابات الإنشائية', en: 'Structural Calculations' },
  STRUCTURAL_DRAWINGS: { ar: 'الرسومات الإنشائية', en: 'Structural Drawings' },
  ELECTRICAL: { ar: 'الكهرباء', en: 'Electrical' },
  DRAINAGE: { ar: 'الصرف الصحي', en: 'Drainage' },
  WATER_SUPPLY: { ar: 'مياه الشرب', en: 'Water Supply' },
  HVAC: { ar: 'التكييف', en: 'HVAC' },
  ETISALAT: { ar: 'اتصالات', en: 'Etisalat' },
  MUN_SUBMISSION: { ar: 'تقديم البلدية', en: 'Municipality Submission' },
  MUN_APPROVAL: { ar: 'موافقة البلدية', en: 'Municipality Approval' },
  CIVIL_DEFENSE: { ar: 'الدفاع المدني', en: 'Civil Defense' },
  SEWA_DEWA: { ar: 'هيئة الكهرباء والماء', en: 'SEWA/DEWA' },
  CONTRACT_SIGNING: { ar: 'توقيع العقد', en: 'Contract Signing' },
};

const categoryConfig: Record<string, { ar: string; en: string; icon: React.ReactNode }> = {
  ARCHITECTURAL: { ar: 'المعماري', en: 'Architecture', icon: <Layers className="h-4 w-4" /> },
  STRUCTURAL: { ar: 'الإنشائي', en: 'Structural', icon: <Building2 className="h-4 w-4" /> },
  MEP: { ar: 'الخدمات', en: 'MEP', icon: <Wrench className="h-4 w-4" /> },
  GOVERNMENT: { ar: 'الموافقات', en: 'Government', icon: <Landmark className="h-4 w-4" /> },
  CONTRACTING: { ar: 'العقود', en: 'Contracting', icon: <FileText className="h-4 w-4" /> },
};

const invoiceStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  DRAFT: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'مسودة', labelEn: 'Draft' },
  SENT: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'مرسلة', labelEn: 'Sent' },
  PAID: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'مدفوعة', labelEn: 'Paid' },
  PARTIALLY_PAID: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'مدفوعة جزئياً', labelEn: 'Partially Paid' },
  OVERDUE: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'متأخرة', labelEn: 'Overdue' },
  CANCELLED: { color: 'text-slate-500', bg: 'bg-slate-500/15', labelAr: 'ملغاة', labelEn: 'Cancelled' },
};

const defectSeverityConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  LOW: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'طفيف', labelEn: 'Low' },
  MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'متوسط', labelEn: 'Medium' },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/15', labelAr: 'مرتفع', labelEn: 'High' },
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'حرج', labelEn: 'Critical' },
};

const defectStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  OPEN: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'مفتوح', labelEn: 'Open' },
  IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'قيد التنفيذ', labelEn: 'In Progress' },
  RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'تم الحل', labelEn: 'Resolved' },
  CLOSED: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'مغلق', labelEn: 'Closed' },
};

// ===== Role-based Tab Access =====
const ROLE_TABS: Record<string, string[]> = {
  ADMIN: ['overview', 'architectural', 'structural', 'mep', 'government', 'financial', 'site', 'timeline', 'interactions'],
  MANAGER: ['overview', 'architectural', 'structural', 'mep', 'government', 'financial', 'site', 'timeline', 'interactions'],
  PROJECT_MANAGER: ['overview', 'architectural', 'structural', 'mep', 'government', 'financial', 'site', 'timeline'],
  ENGINEER: ['overview', 'architectural', 'financial'],
  ACCOUNTANT: ['overview', 'financial'],
  HR: ['overview'],
  VIEWER: ['overview', 'timeline'],
};

// ===== SLA Helper =====
function calculateSLA(phase: WorkflowPhase, isAr: boolean): { text: string; color: string } {
  if (phase.status !== 'IN_PROGRESS' || !phase.startDate || !phase.slaDays) {
    return { text: '—', color: 'text-slate-500' };
  }
  const start = new Date(phase.startDate).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const remaining = phase.slaDays - diffDays;

  if (remaining < 0) {
    return {
      text: isAr ? `متأخر بـ ${Math.abs(remaining)} أيام` : `Delayed by ${Math.abs(remaining)} days`,
      color: 'text-red-400',
    };
  }
  if (remaining === 0) {
    return { text: isAr ? 'ينتهي اليوم' : 'Ends today', color: 'text-amber-400' };
  }
  if (remaining <= 2) {
    return {
      text: isAr ? `متبقي ${remaining} أيام` : `${remaining} days left`,
      color: 'text-amber-400',
    };
  }
  return {
    text: isAr ? `متبقي ${remaining} أيام` : `${remaining} days left`,
    color: 'text-emerald-400',
  };
}

// ===== Main Component =====
export default function ProjectWorkspace({ projectId, onBack }: ProjectWorkspaceProps) {
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
        ];
        const responses = await Promise.allSettled(
          endpoints.map((url) => fetch(url, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } as Record<string, string> }))
        );

        // Project
        if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
          const data = await responses[0].value.json();
          setProject(data.project || data.projects?.[0] || null);
        }

        // Workflow
        if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
          const data = await responses[1].value.json();
          setPhases(data.phases || []);
        }

        // Interactions
        if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
          const data = await responses[2].value.json();
          setInteractions(data.interactions || []);
        }

        // Invoices
        if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
          const data = await responses[3].value.json();
          setInvoices(data.invoices || []);
        }

        // Tasks
        if (responses[4].status === 'fulfilled' && responses[4].value.ok) {
          const data = await responses[4].value.json();
          setTasks(data.tasks || []);
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
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
        setInteractions((prev) => [data.interaction, ...prev]);
        setInteractionDialogOpen(false);
        setInteractionForm({ phaseId: '', interactionType: 'COMMENT', content: '', responseContent: '' });
      }
    } catch (err) {
      console.error('Failed to create interaction:', err);
    } finally {
      setSubmittingInteraction(false);
    }
  };

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

  const totalPaid = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0), [invoices]);
  const totalInvoiced = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.total || 0), 0), [invoices]);
  const totalBOQ = useMemo(() => boqItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0), [boqItems]);
  const completedPhases = useMemo(() => phases.filter((p) => p.status === 'COMPLETED').length, [phases]);
  const totalPhases = phases.length;

  const taskStats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'DONE' || t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    return { total: tasks.length, done, inProgress };
  }, [tasks]);

  // Phase status change
  const handlePhaseStatusChange = async (phaseId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('blueprint-auth-token');
      const res = await fetch('/api/workflow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id: phaseId, status: newStatus }),
      });
      if (res.ok) {
        setPhases((prev) => prev.map((p) => (p.id === phaseId ? { ...p, status: newStatus } : p)));
      }
    } catch (err) {
      console.error('Failed to update phase:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-slate-400 text-sm">{isAr ? 'جاري تحميل المشروع...' : 'Loading project...'}</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-slate-400">{error || (isAr ? 'لم يتم العثور على المشروع' : 'Project not found')}</p>
        <Button variant="outline" onClick={onBack} className="border-slate-700 text-slate-300">
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''} me-2`} />
          {t.back}
        </Button>
      </div>
    );
  }

  const sc = statusConfig[project.status] || statusConfig.PLANNING;
  const tc = typeConfig[project.type] || { labelAr: project.type, labelEn: project.type };

  // ===== SUB COMPONENTS =====

  // Phase Table Component
  const PhaseTable = ({ categoryPhases }: { categoryPhases: WorkflowPhase[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-start p-3 text-slate-400 font-medium">{isAr ? 'المرحلة' : 'Phase'}</th>
            <th className="text-start p-3 text-slate-400 font-medium">{t.status}</th>
            <th className="text-start p-3 text-slate-400 font-medium">{isAr ? 'المسؤول' : 'Assigned'}</th>
            <th className="text-start p-3 text-slate-400 font-medium">{isAr ? 'تاريخ البداية' : 'Start'}</th>
            <th className="text-start p-3 text-slate-400 font-medium">{isAr ? 'المتبقي' : 'SLA'}</th>
            <th className="text-start p-3 text-slate-400 font-medium">{isAr ? 'الرفض' : 'Rejections'}</th>
            <th className="text-center p-3 text-slate-400 font-medium">{t.actions}</th>
          </tr>
        </thead>
        <tbody>
          {categoryPhases.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-slate-500">
                {t.noData}
              </td>
            </tr>
          ) : (
            categoryPhases.map((phase) => {
              const ps = phaseStatusConfig[phase.status] || phaseStatusConfig.NOT_STARTED;
              const sla = calculateSLA(phase, isAr);
              const ptl = phaseTypeLabels[phase.phaseType] || { ar: phase.phaseType, en: phase.phaseType };
              return (
                <tr key={phase.id} className="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${ps.dot}`} />
                      <span className="text-white font-medium">{isAr ? ptl.ar : ptl.en}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className={`${ps.bg} ${ps.color} text-xs`}>
                      {isAr ? ps.labelAr : ps.labelEn}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {phase.assignedTo ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-blue-600/30 text-blue-300 text-[10px]">
                            {phase.assignedTo.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-300 text-xs">{phase.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400 text-xs">
                    {phase.startDate ? formatDate(phase.startDate) : '—'}
                  </td>
                  <td className="p-3">
                    {phase.status === 'IN_PROGRESS' ? (
                      <span className={`text-xs font-medium ${sla.color}`}>{sla.text}</span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {phase.rejectionCount > 0 ? (
                      <Badge variant="secondary" className="bg-red-500/10 text-red-400 text-xs">
                        {phase.rejectionCount}
                      </Badge>
                    ) : (
                      <span className="text-slate-600 text-xs">0</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {phase.status !== 'COMPLETED' && (
                      <Select
                        value={phase.status}
                        onValueChange={(val) => handlePhaseStatusChange(phase.id, val)}
                      >
                        <SelectTrigger className="h-7 w-auto border-slate-700 bg-slate-800 text-xs text-slate-300 px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="NOT_STARTED" className="text-slate-300">
                            {isAr ? 'لم يبدأ' : 'Not Started'}
                          </SelectItem>
                          <SelectItem value="IN_PROGRESS" className="text-slate-300">
                            {isAr ? 'قيد التنفيذ' : 'In Progress'}
                          </SelectItem>
                          <SelectItem value="COMPLETED" className="text-slate-300">
                            {isAr ? 'مكتمل' : 'Completed'}
                          </SelectItem>
                          <SelectItem value="ON_HOLD" className="text-slate-300">
                            {isAr ? 'معلق' : 'On Hold'}
                          </SelectItem>
                          <SelectItem value="DELAYED" className="text-slate-300">
                            {isAr ? 'متأخر' : 'Delayed'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  // Category Progress Card
  const CategoryProgressCard = ({ category, icon }: { category: string; icon?: React.ReactNode }) => {
    const catPhases = phasesByCategory[category] || [];
    if (catPhases.length === 0) return null;
    const catConfig = categoryConfig[category];
    const completed = catPhases.filter((p) => p.status === 'COMPLETED').length;
    const pct = Math.round((completed / catPhases.length) * 100);

    return (
      <div className="bg-slate-800/40 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          {icon || catConfig?.icon}
          <span className="text-sm font-medium text-white">
            {catConfig ? (isAr ? catConfig.ar : catConfig.en) : category}
          </span>
          <Badge variant="secondary" className="bg-slate-700 text-slate-400 text-[10px] ms-auto">
            {completed}/{catPhases.length}
          </Badge>
        </div>
        <Progress value={pct} className="h-1.5 bg-slate-700" />
        <p className="text-xs text-slate-500 mt-1.5">{pct}%</p>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-slate-950 text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== Left Sidebar ===== */}
      <aside
        className={`fixed lg:static inset-y-0 z-50 w-[260px] bg-slate-900 border-slate-800 border-e flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-400 hover:text-white h-8 w-8 p-0"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <span className="text-xs text-slate-500 font-medium">
              {isAr ? 'مساحة العمل' : 'Workspace'}
            </span>
          </div>
          <h2 className="font-bold text-lg text-white leading-tight">{project.name}</h2>
          <p className="text-xs text-slate-500 font-mono mt-1">{project.code}</p>
        </div>

        <ScrollArea className="flex-1 p-4 space-y-4">
          {/* Status Badge */}
          <Badge variant="secondary" className={`${sc.bg} ${sc.color} text-xs font-medium`}>
            {isAr ? sc.labelAr : sc.labelEn}
          </Badge>

          {/* Info rows */}
          <div className="space-y-3 text-sm">
            {project.location && (
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="text-xs">{project.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-400">
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{project.plotNumber || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{project.projectType || '—'}</span>
            </div>
            {project.client && (
              <div className="flex items-center gap-2 text-slate-400">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">{project.client.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{formatDate(project.startDate)}</span>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400">{t.progress}</span>
              <span className="text-white font-semibold">{Math.round(project.progress)}%</span>
            </div>
            <Progress value={project.progress} className="h-2 bg-slate-700" />
          </div>

          <Separator className="bg-slate-800" />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <DollarSign className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">{isAr ? 'الميزانية' : 'Budget'}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{formatCurrency(project.budget)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <TrendingUp className="h-4 w-4 text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">{isAr ? 'المصروف' : 'Spent'}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{formatCurrency(project.spent)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">{t.tasks}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{taskStats.total}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Layers className="h-4 w-4 text-violet-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">{isAr ? 'المراحل' : 'Phases'}</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {completedPhases}/{totalPhases}
              </p>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Ask Blue Button */}
          <Button
            variant="outline"
            className="w-full gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            onClick={() => {
              // Navigate to AI chat with project context (dispatch a custom event)
              const event = new CustomEvent('navigate', { detail: { page: 'ai-chat' } });
              window.dispatchEvent(event);
            }}
          >
            <BrainCircuit className="h-4 w-4" />
            {isAr ? 'اسأل بلو' : 'Ask Blue'}
          </Button>
        </ScrollArea>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="text-slate-400 h-8 w-8 p-0">
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-semibold text-white truncate">{project.name}</h2>
          <Badge variant="secondary" className={`${sc.bg} ${sc.color} text-[10px] ms-auto`}>
            {isAr ? sc.labelAr : sc.labelEn}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            {/* Tab List */}
            <div className="border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6 overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-0">
                {(() => {
                  const userRole = user?.role || 'VIEWER';
                  const allowedTabs = ROLE_TABS[userRole] || ROLE_TABS.VIEWER;
                  const allTabs = [
                    { key: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: <Eye className="h-3.5 w-3.5" /> },
                    { key: 'architectural', label: isAr ? 'المعماري' : 'Architecture', icon: <Layers className="h-3.5 w-3.5" /> },
                    { key: 'structural', label: isAr ? 'الإنشائي' : 'Structural', icon: <Building2 className="h-3.5 w-3.5" /> },
                    { key: 'mep', label: isAr ? 'الخدمات' : 'MEP', icon: <Wrench className="h-3.5 w-3.5" /> },
                    { key: 'government', label: isAr ? 'الموافقات' : 'Government', icon: <Landmark className="h-3.5 w-3.5" /> },
                    { key: 'financial', label: isAr ? 'المالية' : 'Financial', icon: <CreditCard className="h-3.5 w-3.5" /> },
                    { key: 'site', label: isAr ? 'الموقع' : 'Site', icon: <HardHat className="h-3.5 w-3.5" /> },
                    { key: 'timeline', label: isAr ? 'الجدول' : 'Timeline', icon: <Timer className="h-3.5 w-3.5" /> },
                    { key: 'interactions', label: isAr ? 'التفاعلات' : 'Interactions', icon: <MessageSquare className="h-3.5 w-3.5" /> },
                  ];
                  const filteredTabs = allTabs.filter(tab => allowedTabs.includes(tab.key));
                  return filteredTabs;
                })().map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="data-[state=active]:bg-transparent data-[state=active]:text-blue-400 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-slate-400 hover:text-white rounded-none px-3 py-3 gap-1.5 text-xs font-medium whitespace-nowrap"
                  >
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            <TabsContent value="overview" className="p-4 lg:p-6 space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Details Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">{isAr ? 'تفاصيل المشروع' : 'Project Details'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t.type}</p>
                        <p className="text-white">{isAr ? tc.labelAr : tc.labelEn}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t.projectStatus}</p>
                        <Badge variant="secondary" className={`${sc.bg} ${sc.color} text-xs`}>
                          {isAr ? sc.labelAr : sc.labelEn}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t.startDate}</p>
                        <p className="text-white">{formatDate(project.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t.endDate}</p>
                        <p className="text-white">{project.endDate ? formatDate(project.endDate) : '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{isAr ? 'المدير' : 'Manager'}</p>
                        <p className="text-white">{project.manager?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t.client}</p>
                        <p className="text-white">{project.client?.name || '—'}</p>
                      </div>
                      {project.location && (
                        <div className="col-span-2">
                          <p className="text-slate-500 text-xs mb-1">{t.projectLocation}</p>
                          <p className="text-white">{project.location}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Engineering Status Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">
                      {isAr ? 'حالة المراحل الهندسية' : 'Engineering Phase Status'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {['ARCHITECTURAL', 'STRUCTURAL', 'MEP', 'GOVERNMENT'].map((cat) => (
                      <CategoryProgressCard key={cat} category={cat} />
                    ))}
                    {totalPhases === 0 && (
                      <p className="text-slate-500 text-sm text-center py-4">{t.noData}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Summary Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">
                      {isAr ? 'الملخص المالي' : 'Financial Summary'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">{isAr ? 'قيمة العقد' : 'Contract Value'}</p>
                        <p className="text-lg font-bold text-white mt-1">{formatCurrency(project.budget)}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">{isAr ? 'المدفوع' : 'Paid'}</p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">{isAr ? 'الفواتير' : 'Invoiced'}</p>
                        <p className="text-lg font-bold text-blue-400 mt-1">{formatCurrency(totalInvoiced)}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">{isAr ? 'المتبقي' : 'Remaining'}</p>
                        <p className="text-lg font-bold text-amber-400 mt-1">{formatCurrency(Math.max(0, project.budget - totalPaid))}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Task Summary Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">
                      {isAr ? 'ملخص المهام' : 'Task Summary'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center bg-slate-800/50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-white">{taskStats.total}</p>
                        <p className="text-xs text-slate-500 mt-1">{isAr ? 'الكل' : 'Total'}</p>
                      </div>
                      <div className="text-center bg-blue-500/10 rounded-lg p-3">
                        <p className="text-2xl font-bold text-blue-400">{taskStats.inProgress}</p>
                        <p className="text-xs text-slate-500 mt-1">{isAr ? 'قيد التنفيذ' : 'In Progress'}</p>
                      </div>
                      <div className="text-center bg-emerald-500/10 rounded-lg p-3">
                        <p className="text-2xl font-bold text-emerald-400">{taskStats.done}</p>
                        <p className="text-xs text-slate-500 mt-1">{t.completed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ===== ARCHITECTURAL TAB ===== */}
            <TabsContent value="architectural" className="p-4 lg:p-6 mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-violet-400" />
                    <CardTitle className="text-base text-white">
                      {isAr ? 'المراحل المعمارية' : 'Architectural Phases'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <PhaseTable categoryPhases={phasesByCategory['ARCHITECTURAL'] || []} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== STRUCTURAL TAB ===== */}
            <TabsContent value="structural" className="p-4 lg:p-6 mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-400" />
                    <CardTitle className="text-base text-white">
                      {isAr ? 'المراحل الإنشائية' : 'Structural Phases'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <PhaseTable categoryPhases={phasesByCategory['STRUCTURAL'] || []} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== MEP TAB ===== */}
            <TabsContent value="mep" className="p-4 lg:p-6 mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-cyan-400" />
                    <CardTitle className="text-base text-white">
                      {isAr ? 'مراحل الخدمات (MEP)' : 'MEP Phases'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <PhaseTable categoryPhases={phasesByCategory['MEP'] || []} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== GOVERNMENT TAB ===== */}
            <TabsContent value="government" className="p-4 lg:p-6 mt-0">
              <div className="space-y-6">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-amber-400" />
                      <CardTitle className="text-base text-white">
                        {isAr ? 'مراحل الموافقات الحكومية' : 'Government Approval Phases'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PhaseTable categoryPhases={phasesByCategory['GOVERNMENT'] || []} />
                  </CardContent>
                </Card>

                {/* MUN Notes History */}
                {(phasesByCategory['GOVERNMENT'] || []).some((p) => p.notes) && (
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-white">
                        {isAr ? 'ملاحظات البلدية (MUN NOT)' : 'MUN Notes History'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(phasesByCategory['GOVERNMENT'] || [])
                        .filter((p) => p.notes)
                        .map((p) => {
                          const ptl = phaseTypeLabels[p.phaseType] || { ar: p.phaseType, en: p.phaseType };
                          return (
                            <div key={p.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 text-[10px]">
                                  {isAr ? ptl.ar : ptl.en}
                                </Badge>
                                <Badge variant="secondary" className="bg-red-500/10 text-red-400 text-[10px]">
                                  {p.rejectionCount}x {isAr ? 'رفض' : 'rejections'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">{p.notes}</p>
                            </div>
                          );
                        })}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ===== FINANCIAL TAB ===== */}
            <TabsContent value="financial" className="p-4 lg:p-6 mt-0">
              <div className="space-y-6">
                {/* Contract Value Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">{isAr ? 'قيمة العقد' : 'Contract Value'}</p>
                      <p className="text-xl font-bold text-white mt-1">{formatCurrency(project.budget)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-emerald-500/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">{isAr ? 'إجمالي المدفوع' : 'Total Paid'}</p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalPaid)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-red-500/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">{isAr ? 'المبلغ المتبقي' : 'Outstanding'}</p>
                      <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(Math.max(0, project.budget - totalPaid))}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-blue-500/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">{isAr ? 'نسبة التحصيل' : 'Collection Rate'}</p>
                      <p className="text-xl font-bold text-blue-400 mt-1">
                        {project.budget > 0 ? Math.round((totalPaid / project.budget) * 100) : 0}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Overview for Engineer */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-slate-900/50 border-blue-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-blue-400" />
                      <CardTitle className="text-base text-white">
                        {isAr ? 'نظرة مالية للمهندس' : 'Financial Overview for Engineer'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-xs text-slate-500">{isAr ? 'قيمة العقد' : 'Contract Value'}</p>
                        <p className="text-lg font-bold text-white mt-1">{formatCurrency(project.budget)}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-emerald-500/20">
                        <p className="text-xs text-slate-500">{isAr ? 'المدفوعات المستلمة' : 'Payments Received'}</p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(project.paymentReceived ?? totalPaid)}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-amber-500/20">
                        <p className="text-xs text-slate-500">{isAr ? 'الرصيد المتبقي' : 'Remaining Balance'}</p>
                        <p className="text-lg font-bold text-amber-400 mt-1">{formatCurrency(project.remainingBalance ?? Math.max(0, project.budget - (project.paymentReceived ?? totalPaid)))}</p>
                      </div>
                      {boqItems.length > 0 && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-violet-500/20">
                          <p className="text-xs text-slate-500">{isAr ? 'بنود قائمة الكميات' : 'BOQ Items'}</p>
                          <p className="text-lg font-bold text-violet-400 mt-1">{boqItems.length}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'إجمالي: ' : 'Total: '}{formatCurrency(totalBOQ)}</p>
                        </div>
                      )}
                    </div>
                    {boqItems.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-400 font-medium mb-2">{isAr ? 'ملخص بنود قائمة الكميات (BOQ)' : 'BOQ Items Summary'}</p>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {boqItems.slice(0, 10).map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-slate-800/40 rounded px-3 py-1.5 text-xs">
                              <span className="text-slate-300 truncate me-3">{item.code} - {item.description}</span>
                              <span className="text-slate-400 shrink-0">{formatCurrency(item.totalPrice)}</span>
                            </div>
                          ))}
                          {boqItems.length > 10 && (
                            <p className="text-xs text-slate-500 text-center pt-1">
                              {isAr ? `+ ${boqItems.length - 10} بنود أخرى` : `+ ${boqItems.length - 10} more items`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payments Table */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-emerald-400" />
                      <CardTitle className="text-base text-white">
                        {isAr ? 'الفواتير والمدفوعات' : 'Invoices & Payments'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {invoices.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">{t.noData}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700/50">
                              <th className="text-start p-3 text-slate-400 font-medium">{t.invoiceNumber}</th>
                              <th className="text-start p-3 text-slate-400 font-medium">{t.date}</th>
                              <th className="text-start p-3 text-slate-400 font-medium">{isAr ? 'الإجمالي' : 'Total'}</th>
                              <th className="text-start p-3 text-slate-400 font-medium">{t.paid}</th>
                              <th className="text-start p-3 text-slate-400 font-medium">{t.status}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map((inv) => {
                              const isc = invoiceStatusConfig[inv.status] || invoiceStatusConfig.DRAFT;
                              return (
                                <tr key={inv.id} className="border-b border-slate-700/30 hover:bg-slate-800/40">
                                  <td className="p-3 text-white font-mono text-xs">{inv.number}</td>
                                  <td className="p-3 text-slate-400 text-xs">{formatDate(inv.issueDate)}</td>
                                  <td className="p-3 text-white font-medium">{formatCurrency(inv.total)}</td>
                                  <td className="p-3 text-emerald-400">{formatCurrency(inv.paidAmount)}</td>
                                  <td className="p-3">
                                    <Badge variant="secondary" className={`${isc.bg} ${isc.color} text-xs`}>
                                      {isAr ? isc.labelAr : isc.labelEn}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ===== SITE TAB ===== */}
            <TabsContent value="site" className="p-4 lg:p-6 mt-0">
              <div className="space-y-6">
                {/* Site Reports */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-blue-400" />
                      <CardTitle className="text-base text-white">
                        {isAr ? 'يوميات الموقع' : 'Site Daily Logs'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {siteReports.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">{t.noData}</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {siteReports.map((report) => (
                          <div key={report.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">{formatDate(report.date)}</span>
                              {report.weatherConditions && (
                                <Badge variant="secondary" className="bg-sky-500/10 text-sky-400 text-[10px]">
                                  {report.weatherConditions}
                                </Badge>
                              )}
                            </div>
                            {report.workCompleted && (
                              <p className="text-xs text-slate-400 mb-1">
                                <span className="text-slate-500">{isAr ? 'المنجز: ' : 'Completed: '}</span>
                                {report.workCompleted}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-slate-500">
                                <Users className="h-3 w-3 inline me-1" />
                                {report.workforceCount} {isAr ? 'عامل' : 'workers'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Defects */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <CardTitle className="text-base text-white">
                        {isAr ? 'العيوب' : 'Defects'}
                      </CardTitle>
                      {defects.filter((d) => d.status === 'OPEN').length > 0 && (
                        <Badge variant="secondary" className="bg-red-500/15 text-red-400 text-xs ms-auto">
                          {defects.filter((d) => d.status === 'OPEN').length} {isAr ? 'مفتوح' : 'open'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {defects.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">{t.noData}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700/50">
                              <th className="text-start p-3 text-slate-400 font-medium">{isAr ? 'العنوان' : 'Title'}</th>
                              <th className="text-start p-3 text-slate-400 font-medium">{isAr ? 'الخطورة' : 'Severity'}</th>
                              <th className="text-start p-3 text-slate-400 font-medium">{t.status}</th>
                              <th className="text-start p-3 text-slate-400 font-medium">{t.date}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {defects.map((defect) => {
                              const sev = defectSeverityConfig[defect.severity] || defectSeverityConfig.MEDIUM;
                              const dst = defectStatusConfig[defect.status] || defectStatusConfig.OPEN;
                              return (
                                <tr key={defect.id} className="border-b border-slate-700/30 hover:bg-slate-800/40">
                                  <td className="p-3">
                                    <p className="text-white text-sm">{defect.title}</p>
                                    {defect.location && (
                                      <p className="text-slate-500 text-xs mt-0.5">{defect.location}</p>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <Badge variant="secondary" className={`${sev.bg} ${sev.color} text-xs`}>
                                      {isAr ? sev.labelAr : sev.labelEn}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    <Badge variant="secondary" className={`${dst.bg} ${dst.color} text-xs`}>
                                      {isAr ? dst.labelAr : dst.labelEn}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-slate-400 text-xs">{formatDate(defect.createdAt)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ===== TIMELINE TAB ===== */}
            <TabsContent value="timeline" className="p-4 lg:p-6 mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-blue-400" />
                    <CardTitle className="text-base text-white">
                      {isAr ? 'الجدول الزمني للمراحل' : 'Phase Timeline'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {phases.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">{t.noData}</p>
                  ) : (
                    <ScrollArea className="max-h-[600px]">
                      <div className="relative">
                        {/* Timeline line */}
                        <div className={`absolute top-0 bottom-0 w-0.5 ${isRTL ? 'right-[19px]' : 'left-[19px]'} bg-slate-700`} />

                        <div className="space-y-6">
                          {/* Category headers + phases */}
                          {Object.entries(phasesByCategory).map(([category, catPhases]) => {
                            const catConf = categoryConfig[category];
                            return (
                              <div key={category}>
                                {/* Category label */}
                                <div className="flex items-center gap-2 mb-3 ms-12">
                                  {catConf?.icon || <Layers className="h-4 w-4" />}
                                  <span className="text-sm font-semibold text-white">
                                    {catConf ? (isAr ? catConf.ar : catConf.en) : category}
                                  </span>
                                </div>

                                {/* Phase items */}
                                {catPhases.map((phase) => {
                                  const ps = phaseStatusConfig[phase.status] || phaseStatusConfig.NOT_STARTED;
                                  const ptl = phaseTypeLabels[phase.phaseType] || { ar: phase.phaseType, en: phase.phaseType };
                                  const sla = calculateSLA(phase, isAr);
                                  const hasDependent = catPhases.findIndex((p) => p.id === phase.id) > 0;

                                  return (
                                    <div key={phase.id} className="flex items-start gap-4 mb-4 group">
                                      {/* Connector */}
                                      {hasDependent && (
                                        <div className={`absolute top-0 ${isRTL ? 'right-[18px]' : 'left-[18px]'} w-0.5 h-6 bg-slate-700`} />
                                      )}

                                      {/* Dot */}
                                      <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                                        phase.status === 'COMPLETED'
                                          ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                          : phase.status === 'IN_PROGRESS'
                                          ? 'bg-blue-500/20 border-2 border-blue-500 animate-pulse'
                                          : phase.status === 'DELAYED' || phase.status === 'REJECTED'
                                          ? 'bg-red-500/20 border-2 border-red-500'
                                          : 'bg-slate-800 border-2 border-slate-600'
                                      }`}>
                                        {phase.status === 'COMPLETED' ? (
                                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                        ) : phase.status === 'IN_PROGRESS' ? (
                                          <Play className="h-3 w-3 text-blue-400" />
                                        ) : phase.status === 'DELAYED' || phase.status === 'REJECTED' ? (
                                          <AlertTriangle className="h-4 w-4 text-red-400" />
                                        ) : (
                                          <CircleDot className="h-3 w-3 text-slate-500" />
                                        )}
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 bg-slate-800/40 rounded-lg p-3 border border-slate-700/30 hover:border-slate-600/50 transition-colors min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-medium text-white">
                                            {isAr ? ptl.ar : ptl.en}
                                          </span>
                                          <Badge variant="secondary" className={`${ps.bg} ${ps.color} text-[10px]`}>
                                            {isAr ? ps.labelAr : ps.labelEn}
                                          </Badge>
                                          {phase.rejectionCount > 0 && (
                                            <Badge variant="secondary" className="bg-red-500/10 text-red-400 text-[10px]">
                                              {phase.rejectionCount}x {isAr ? 'رفض' : 'rej'}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                          {phase.assignedTo && (
                                            <span className="flex items-center gap-1">
                                              <Users className="h-3 w-3" />
                                              {phase.assignedTo.name}
                                            </span>
                                          )}
                                          {phase.startDate && (
                                            <span className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              {formatDate(phase.startDate)}
                                            </span>
                                          )}
                                          {phase.status === 'IN_PROGRESS' && (
                                            <span className={sla.color}>{sla.text}</span>
                                          )}
                                        </div>
                                        {phase.notes && (
                                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{phase.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== CLIENT INTERACTIONS TAB ===== */}
            <TabsContent value="interactions" className="p-4 lg:p-6 mt-0">
              <div className="space-y-6">
                {/* Add Interaction Button */}
                <div className="flex items-center justify-end">
                  <Button
                    onClick={() => setInteractionDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {isAr ? 'إضافة تفاعل' : 'Add Interaction'}
                  </Button>
                </div>

                {/* Interactions List */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {interactions.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardContent className="p-8 text-center">
                        <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500">{t.noData}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    interactions.map((interaction) => {
                      const typeConfig = interaction.interactionType === 'APPROVE'
                        ? { color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: isAr ? 'موافقة' : 'Approved', icon: <CheckCircle2 className="h-4 w-4" /> }
                        : interaction.interactionType === 'REJECT'
                        ? { color: 'text-red-400', bg: 'bg-red-500/15', label: isAr ? 'رفض' : 'Rejected', icon: <XCircle className="h-4 w-4" /> }
                        : { color: 'text-blue-400', bg: 'bg-blue-500/15', label: isAr ? 'تعليق' : 'Comment', icon: <MessageSquare className="h-4 w-4" /> };

                      const ptl = interaction.phase
                        ? phaseTypeLabels[interaction.phase.phaseType]
                        : null;

                      return (
                        <Card key={interaction.id} className="bg-slate-900/50 border-slate-800">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <Badge variant="secondary" className={`${typeConfig.bg} ${typeConfig.color} text-xs gap-1`}>
                                    {typeConfig.icon}
                                    {typeConfig.label}
                                  </Badge>
                                  {ptl && (
                                    <Badge variant="secondary" className="bg-slate-700 text-slate-400 text-[10px]">
                                      {isAr ? ptl.ar : ptl.en}
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-slate-500 ms-auto">
                                    {formatDateTime(interaction.createdAt)}
                                  </span>
                                </div>

                                {/* Client message */}
                                <div className="bg-slate-800/60 rounded-lg p-3 mb-2">
                                  <p className="text-sm text-slate-200">{interaction.content}</p>
                                </div>

                                {/* Response */}
                                {interaction.responseContent && (
                                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 ms-6">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Send className="h-3 w-3 text-blue-400" />
                                      <span className="text-xs text-blue-400 font-medium">
                                        {isAr ? 'الرد' : 'Response'}
                                      </span>
                                      {interaction.respondedBy && (
                                        <span className="text-[10px] text-slate-500 ms-1">
                                          — {interaction.respondedBy.name}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-300">{interaction.responseContent}</p>
                                  </div>
                                )}

                                {!interaction.responseContent && (
                                  <p className="text-xs text-slate-600 italic ms-6">
                                    {isAr ? 'لا يوجد رد بعد' : 'No response yet'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* ===== Add Interaction Dialog ===== */}
      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              {isAr ? 'إضافة تفاعل عميل' : 'Add Client Interaction'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">{isAr ? 'المرحلة' : 'Phase'}</Label>
              <Select value={interactionForm.phaseId} onValueChange={(val) => setInteractionForm({ ...interactionForm, phaseId: val })}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder={isAr ? 'اختر مرحلة (اختياري)' : 'Select phase (optional)'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                  {phases.map((p) => {
                    const ptl = phaseTypeLabels[p.phaseType] || { ar: p.phaseType, en: p.phaseType };
                    return (
                      <SelectItem key={p.id} value={p.id} className="text-slate-300">
                        {isAr ? ptl.ar : ptl.en}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{isAr ? 'نوع التفاعل' : 'Interaction Type'}</Label>
              <Select value={interactionForm.interactionType} onValueChange={(val) => setInteractionForm({ ...interactionForm, interactionType: val })}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="APPROVE" className="text-emerald-400">{isAr ? 'موافقة' : 'Approve'}</SelectItem>
                  <SelectItem value="REJECT" className="text-red-400">{isAr ? 'رفض' : 'Reject'}</SelectItem>
                  <SelectItem value="COMMENT" className="text-blue-400">{isAr ? 'تعليق' : 'Comment'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{isAr ? 'المحتوى' : 'Content'} *</Label>
              <Textarea
                value={interactionForm.content}
                onChange={(e) => setInteractionForm({ ...interactionForm, content: e.target.value })}
                placeholder={isAr ? 'محتوى التفاعل...' : 'Interaction content...'}
                rows={3}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{isAr ? 'الرد (اختياري)' : 'Response (optional)'}</Label>
              <Textarea
                value={interactionForm.responseContent}
                onChange={(e) => setInteractionForm({ ...interactionForm, responseContent: e.target.value })}
                placeholder={isAr ? 'رد على التفاعل...' : 'Response to interaction...'}
                rows={2}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInteractionDialogOpen(false)} className="border-slate-600 text-slate-300">
              {t.cancel}
            </Button>
            <Button
              onClick={handleSubmitInteraction}
              disabled={!interactionForm.content.trim() || submittingInteraction}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submittingInteraction && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
