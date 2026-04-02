'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
  Send,
  Loader2,
  Filter,
  Ban,
  Clock,
  MessageCircle,
  Layers,
} from 'lucide-react';

// ===== Types =====
interface ClientInteractionPanelProps {
  projectId: string;
  clientId?: string;
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
  respondedBy?: { id: string; name?: string; fullName?: string; avatar?: string } | null;
}

// ===== Config =====
const interactionTypeConfig: Record<
  string,
  {
    color: string;
    bg: string;
    border: string;
    labelAr: string;
    labelEn: string;
    icon: React.ReactNode;
  }
> = {
  COMMENT: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    labelAr: 'تعليق',
    labelEn: 'Comment',
    icon: <MessageCircle className="h-3.5 w-3.5" />,
  },
  APPROVAL: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    labelAr: 'موافقة',
    labelEn: 'Approval',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  REJECTION: {
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    labelAr: 'رفض',
    labelEn: 'Rejection',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  REQUEST_CHANGE: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    labelAr: 'طلب تعديل',
    labelEn: 'Request Change',
    icon: <RotateCcw className="h-3.5 w-3.5" />,
  },
  QUESTION: {
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    labelAr: 'سؤال',
    labelEn: 'Question',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
};

const phaseTypeLabels: Record<string, { ar: string; en: string }> = {
  ARCHITECTURAL_SKETCH: { ar: 'المخطط المعماري', en: 'Arch. Sketch' },
  ARCHITECTURAL_CONCEPT: { ar: 'التصميم المفاهيمي', en: 'Concept' },
  CLIENT_APPROVAL: { ar: 'موافقة العميل', en: 'Client Approval' },
  MODIFICATIONS: { ar: 'التعديلات', en: 'Modifications' },
  PRELIMINARY: { ar: 'الرسومات الأولية', en: 'Preliminary' },
  THREE_D_MAX: { ar: 'ثري دي ماكس', en: '3D Max' },
  FINAL_DRAWINGS: { ar: 'الرسومات النهائية', en: 'Final Drawings' },
  SOIL_REPORT: { ar: 'تقرير التربة', en: 'Soil Report' },
  FOUNDATION: { ar: 'الأساسات', en: 'Foundation' },
  STRUCTURAL_CALC: { ar: 'الحسابات الإنشائية', en: 'Structural Calc' },
  STRUCTURAL_DRAWINGS: { ar: 'الرسومات الإنشائية', en: 'Structural Draw.' },
  ELECTRICAL: { ar: 'الكهرباء', en: 'Electrical' },
  DRAINAGE: { ar: 'الصرف الصحي', en: 'Drainage' },
  WATER_SUPPLY: { ar: 'مياه الشرب', en: 'Water Supply' },
  HVAC: { ar: 'التكييف', en: 'HVAC' },
  ETISALAT: { ar: 'اتصالات', en: 'Etisalat' },
  MUN_SUBMISSION: { ar: 'تقديم البلدية', en: 'Mun. Submission' },
  MUN_APPROVAL: { ar: 'موافقة البلدية', en: 'Mun. Approval' },
  CIVIL_DEFENSE: { ar: 'الدفاع المدني', en: 'Civil Defense' },
  SEWA_DEWA: { ar: 'هيئة الكهرباء والماء', en: 'SEWA/DEWA' },
  CONTRACT_SIGNING: { ar: 'توقيع العقد', en: 'Contract Signing' },
};

// ===== Component =====
export default function ClientInteractionPanel({
  projectId,
  clientId: _clientId,
}: ClientInteractionPanelProps) {
  const { language } = useApp();
  const { t, formatDateTime, isRTL } = useTranslation(language);
  const isAr = language === 'ar';

  // States
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactionFilter, setInteractionFilter] = useState<string>('ALL');
  const [quickResponse, setQuickResponse] = useState('');
  const [quickResponseTarget, setQuickResponseTarget] =
    useState<ClientInteraction | null>(null);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ClientInteraction | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState('');

  // Fetch interactions
  useEffect(() => {
    if (!projectId) return;
    const fetchInteractions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('blueprint-auth-token');
        const res = await fetch(
          `/api/interactions?projectId=${projectId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setInteractions(
            data.data?.interactions || data.interactions || []
          );
        }
      } catch (err) {
        console.error('Failed to fetch interactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInteractions();
  }, [projectId]);

  // Filtered interactions
  const filteredInteractions = useMemo(() => {
    if (interactionFilter === 'ALL') return interactions;
    return interactions.filter((i) => i.interactionType === interactionFilter);
  }, [interactions, interactionFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = interactions.length;
    const pending = interactions.filter((i) => !i.responseContent).length;
    const approvals = interactions.filter(
      (i) => i.interactionType === 'APPROVAL'
    ).length;
    const rejections = interactions.filter(
      (i) => i.interactionType === 'REJECTION'
    ).length;
    return { total, pending, approvals, rejections };
  }, [interactions]);

  // Submit quick response
  const handleSubmitResponse = useCallback(
    async (interaction: ClientInteraction) => {
      if (!quickResponse.trim()) return;
      setSubmittingResponse(true);
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
            interactionType: 'COMMENT',
            content: quickResponse,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const newInteraction = data.data?.interaction || data.interaction;
          if (newInteraction)
            setInteractions((prev) => [newInteraction, ...prev]);
          // Mark original as responded
          setInteractions((prev) =>
            prev.map((i) =>
              i.id === interaction.id
                ? {
                    ...i,
                    responseContent: quickResponse,
                    responseDate: new Date().toISOString(),
                  }
                : i
            )
          );
          setQuickResponse('');
          setQuickResponseTarget(null);
        }
      } catch (err) {
        console.error('Failed to submit response:', err);
      } finally {
        setSubmittingResponse(false);
      }
    },
    [projectId, quickResponse]
  );

  // Quick approve
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
          if (newInteraction)
            setInteractions((prev) => [newInteraction, ...prev]);
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

  // Quick reject (opens dialog)
  const handleQuickReject = useCallback(
    (interaction: ClientInteraction) => {
      setRejectTarget(interaction);
      setRejectReason('');
      setRejectDialogOpen(true);
    },
    []
  );

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
        if (newInteraction)
          setInteractions((prev) => [newInteraction, ...prev]);
        setInteractions((prev) =>
          prev.map((i) =>
            i.id === rejectTarget.id
              ? {
                  ...i,
                  responseContent: rejectReason,
                  responseDate: new Date().toISOString(),
                }
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

  // Request change
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
          if (newInteraction)
            setInteractions((prev) => [newInteraction, ...prev]);
        }
      } catch (err) {
        console.error('Failed to request change:', err);
      } finally {
        setSubmittingAction(false);
      }
    },
    [projectId, isAr]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'إجمالي التفاعلات' : 'Total'}
          </p>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'بانتظار الرد' : 'Pending'}
          </p>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">
            {stats.approvals}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'موافقات' : 'Approved'}
          </p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-400">
            {stats.rejections}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'رفوض' : 'Rejected'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={interactionFilter}
          onValueChange={setInteractionFilter}
        >
          <SelectTrigger className="h-8 w-auto border-border bg-muted text-xs text-foreground/80 px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-muted border-border">
            <SelectItem value="ALL" className="text-foreground/80">
              {isAr ? 'الكل' : 'All'}
            </SelectItem>
            <SelectItem value="COMMENT" className="text-blue-400">
              {isAr ? 'تعليقات' : 'Comments'}
            </SelectItem>
            <SelectItem value="APPROVAL" className="text-emerald-400">
              {isAr ? 'موافقات' : 'Approvals'}
            </SelectItem>
            <SelectItem value="REJECTION" className="text-red-400">
              {isAr ? 'رفوض' : 'Rejections'}
            </SelectItem>
            <SelectItem value="REQUEST_CHANGE" className="text-amber-400">
              {isAr ? 'طلبات تعديل' : 'Changes'}
            </SelectItem>
            <SelectItem value="QUESTION" className="text-purple-400">
              {isAr ? 'أسئلة' : 'Questions'}
            </SelectItem>
          </SelectContent>
        </Select>
        <Badge
          variant="secondary"
          className="bg-secondary text-muted-foreground text-[10px]"
        >
          {filteredInteractions.length}
        </Badge>
      </div>

      {/* Timeline */}
      <div className="relative max-h-[500px] overflow-y-auto space-y-0">
        {/* Timeline line */}
        <div
          className={`absolute top-0 bottom-0 w-0.5 ${
            isRTL ? 'right-[15px]' : 'left-[15px]'
          } bg-secondary/50`}
        />

        {filteredInteractions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">{isAr ? 'لا توجد تفاعلات' : 'No interactions'}</p>
          </div>
        ) : (
          filteredInteractions.map((interaction) => {
            const itype =
              interactionTypeConfig[interaction.interactionType] ||
              interactionTypeConfig.COMMENT;
            const ptl = interaction.phase
              ? phaseTypeLabels[interaction.phase.phaseType]
              : null;
            const responderName =
              interaction.respondedBy?.name ||
              interaction.respondedBy?.fullName;
            const isPending = !interaction.responseContent;

            return (
              <div key={interaction.id} className="flex items-start gap-4 mb-4">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                    interaction.interactionType === 'APPROVAL'
                      ? 'bg-emerald-500/20 border-2 border-emerald-500'
                      : interaction.interactionType === 'REJECTION'
                      ? 'bg-red-500/20 border-2 border-red-500'
                      : interaction.interactionType === 'REQUEST_CHANGE'
                      ? 'bg-amber-500/20 border-2 border-amber-500'
                      : interaction.interactionType === 'QUESTION'
                      ? 'bg-purple-500/20 border-2 border-purple-500'
                      : 'bg-blue-500/20 border-2 border-blue-500'
                  }`}
                >
                  <span className={itype.color}>
                    {React.cloneElement(itype.icon as React.ReactElement<any>, {
                      className: 'h-3.5 w-3.5',
                    })}
                  </span>
                </div>

                {/* Content card */}
                <Card
                  className={`flex-1 bg-card ${itype.border} min-w-0`}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge
                        variant="secondary"
                        className={`${itype.bg} ${itype.color} text-xs gap-1`}
                      >
                        {itype.icon}
                        {isAr ? itype.labelAr : itype.labelEn}
                      </Badge>
                      {ptl && (
                        <Badge
                          variant="secondary"
                          className="bg-secondary text-muted-foreground text-[10px] gap-1"
                        >
                          <Layers className="h-3 w-3" />
                          {isAr ? ptl.ar : ptl.en}
                        </Badge>
                      )}
                      {isPending && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/10 text-amber-400 text-[10px]"
                        >
                          <Clock className="h-3 w-3 me-1" />
                          {isAr ? 'بانتظار الرد' : 'Pending'}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ms-auto">
                        {formatDateTime(interaction.createdAt)}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-foreground mb-3">
                      {interaction.content}
                    </p>

                    {/* Response */}
                    {interaction.responseContent && (
                      <div className="bg-muted/60 border border-border/30 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Send className="h-3 w-3 text-blue-400" />
                          <span className="text-xs text-blue-400 font-medium">
                            {isAr ? 'الرد' : 'Response'}
                          </span>
                          {responderName && (
                            <span className="text-[10px] text-muted-foreground ms-1">
                              — {responderName}
                            </span>
                          )}
                          {interaction.responseDate && (
                            <span className="text-[10px] text-muted-foreground ms-1">
                              {formatDateTime(interaction.responseDate)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/80">
                          {interaction.responseContent}
                        </p>
                      </div>
                    )}

                    {/* Quick Response Input */}
                    {isPending && (
                      <div className="mt-2">
                        {quickResponseTarget?.id === interaction.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={quickResponse}
                              onChange={(e) =>
                                setQuickResponse(e.target.value)
                              }
                              placeholder={
                                isAr
                                  ? 'اكتب ردك هنا...'
                                  : 'Type your response...'
                              }
                              className="flex-1 h-8 bg-muted border-border text-foreground text-xs placeholder:text-muted-foreground"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmitResponse(interaction);
                                }
                                if (e.key === 'Escape') {
                                  setQuickResponse('');
                                  setQuickResponseTarget(null);
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-foreground"
                              onClick={() =>
                                handleSubmitResponse(interaction)
                              }
                              disabled={
                                !quickResponse.trim() ||
                                submittingResponse
                              }
                            >
                              {submittingResponse ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-muted-foreground"
                              onClick={() => {
                                setQuickResponse('');
                                setQuickResponseTarget(null);
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-blue-400 hover:bg-blue-500/10 gap-1"
                            onClick={() => {
                              setQuickResponseTarget(interaction);
                              setQuickResponse('');
                            }}
                          >
                            <MessageSquare className="h-3 w-3" />
                            {isAr ? 'رد سريع' : 'Quick Reply'}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Action buttons for pending interactions */}
                    {isPending && quickResponseTarget?.id !== interaction.id && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/30">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] gap-1 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                              onClick={() => handleQuickApprove(interaction)}
                              disabled={submittingAction}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {isAr ? 'موافقة' : 'Approve'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-muted border-border text-xs">
                            {isAr ? 'الموافقة على هذا التفاعل' : 'Approve this interaction'}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] gap-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              onClick={() => handleQuickReject(interaction)}
                              disabled={submittingAction}
                            >
                              <Ban className="h-3 w-3" />
                              {isAr ? 'رفض' : 'Reject'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-muted border-border text-xs">
                            {isAr ? 'رفض مع ذكر السبب' : 'Reject with reason'}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] gap-1 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                              onClick={() =>
                                handleRequestChange(interaction)
                              }
                              disabled={submittingAction}
                            >
                              <RotateCcw className="h-3 w-3" />
                              {isAr ? 'طلب تعديل' : 'Change'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-muted border-border text-xs">
                            {isAr ? 'طلب تعديل' : 'Request Change'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {/* Responded status indicators */}
                    {!isPending && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/30">
                        {interaction.interactionType === 'APPROVAL' && (
                          <div className="flex items-center gap-1 text-emerald-400 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{isAr ? 'تمت الموافقة' : 'Approved'}</span>
                          </div>
                        )}
                        {interaction.interactionType === 'REJECTION' && (
                          <div className="flex items-center gap-1 text-red-400 text-xs">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>{isAr ? 'مرفوض' : 'Rejected'}</span>
                          </div>
                        )}
                        {interaction.interactionType === 'REQUEST_CHANGE' && (
                          <div className="flex items-center gap-1 text-amber-400 text-xs">
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>
                              {isAr ? 'تم طلب التعديل' : 'Change Requested'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })
        )}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-400" />
              {isAr ? 'سبب الرفض' : 'Rejection Reason'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'يرجى إدخال سبب الرفض. سيتم إرساله للعميل.'
                : 'Please enter the reason for rejection. It will be sent to the client.'}
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={
                isAr ? 'أدخل سبب الرفض...' : 'Enter rejection reason...'
              }
              rows={4}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              className="border-border text-foreground/80"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleSubmitRejection}
              disabled={!rejectReason.trim() || submittingAction}
              className="bg-red-600 hover:bg-red-700 text-foreground"
            >
              {submittingAction && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {isAr ? 'تأكيد الرفض' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
