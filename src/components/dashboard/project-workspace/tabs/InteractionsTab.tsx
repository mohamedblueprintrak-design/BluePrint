'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Filter,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Ban,
  Send,
  Loader2,
  Users,
} from 'lucide-react';
import ClientInteractionPanel from '@/components/clients/client-interaction-panel';
import {
  type ClientInteraction,
  type WorkflowPhase,
  interactionTypeConfig,
  phaseTypeLabels,
} from '../config';

interface InteractionFormState {
  phaseId: string;
  interactionType: string;
  content: string;
  responseContent: string;
}

interface InteractionsTabProps {
  projectId: string;
  clientId?: string | null;
  phases: WorkflowPhase[];
  filteredInteractions: ClientInteraction[];
  isAr: boolean;
  formatDateTime: (date: string) => string;
  t: { noData: string; cancel: string; submit: string };

  // Filter state
  interactionFilter: string;
  setInteractionFilter: (filter: string) => void;

  // Dialog state
  interactionDialogOpen: boolean;
  setInteractionDialogOpen: (open: boolean) => void;
  interactionForm: InteractionFormState;
  setInteractionForm: React.Dispatch<React.SetStateAction<InteractionFormState>>;
  submittingInteraction: boolean;

  // Reject dialog state
  rejectDialogOpen: boolean;
  setRejectDialogOpen: (open: boolean) => void;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  submittingAction: boolean;

  // Handlers
  handleSubmitInteraction: () => Promise<void>;
  handleQuickApprove: (interaction: ClientInteraction) => Promise<void>;
  handleQuickReject: (interaction: ClientInteraction) => void;
  handleSubmitRejection: () => Promise<void>;
  handleRequestChange: (interaction: ClientInteraction) => Promise<void>;
}

export default function InteractionsTab({
  projectId,
  clientId,
  phases,
  filteredInteractions,
  isAr,
  formatDateTime,
  t,
  interactionFilter,
  setInteractionFilter,
  interactionDialogOpen,
  setInteractionDialogOpen,
  interactionForm,
  setInteractionForm,
  submittingInteraction,
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
}: InteractionsTabProps) {
  return (
    <>
      <div className="space-y-6">
        {/* Header with filter and add button */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
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
          <Button
            onClick={() => setInteractionDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-foreground gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            {isAr ? 'إضافة تفاعل' : 'Add Interaction'}
          </Button>
        </div>

        {/* Interactions List */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {filteredInteractions.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t.noData}</p>
              </CardContent>
            </Card>
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

              return (
                <Card
                  key={interaction.id}
                  className={`bg-card ${itype.border}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
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
                              className="bg-secondary text-muted-foreground text-[10px]"
                            >
                              {isAr ? ptl.ar : ptl.en}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground ms-auto">
                            {formatDateTime(interaction.createdAt)}
                          </span>
                        </div>

                        {/* Client message */}
                        <div className="bg-muted/60 rounded-lg p-3 mb-2">
                          <p className="text-sm text-foreground">
                            {interaction.content}
                          </p>
                        </div>

                        {/* Response */}
                        {interaction.responseContent && (
                          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 ms-6">
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
                            </div>
                            <p className="text-sm text-foreground/80">
                              {interaction.responseContent}
                            </p>
                          </div>
                        )}

                        {!interaction.responseContent && (
                          <p className="text-xs text-muted-foreground italic ms-6">
                            {isAr
                              ? 'لا يوجد رد بعد'
                              : 'No response yet'}
                          </p>
                        )}
                      </div>

                      {/* Quick Actions */}
                      {!interaction.responseContent && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                onClick={() =>
                                  handleQuickApprove(interaction)
                                }
                                disabled={submittingAction}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-muted border-border text-xs">
                              {isAr ? 'موافقة' : 'Approve'}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                onClick={() =>
                                  handleQuickReject(interaction)
                                }
                                disabled={submittingAction}
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-muted border-border text-xs">
                              {isAr ? 'رفض' : 'Reject'}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                                onClick={() =>
                                  handleRequestChange(interaction)
                                }
                                disabled={submittingAction}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-muted border-border text-xs">
                              {isAr
                                ? 'طلب تعديل'
                                : 'Request Change'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {/* Already responded indicators */}
                      {interaction.responseContent && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {interaction.interactionType === 'APPROVAL' && (
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/10">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            </div>
                          )}
                          {interaction.interactionType === 'REJECTION' && (
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-red-500/10">
                              <XCircle className="h-4 w-4 text-red-400" />
                            </div>
                          )}
                          {interaction.interactionType === 'REQUEST_CHANGE' && (
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-amber-500/10">
                              <RotateCcw className="h-4 w-4 text-amber-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Client Interaction Enhancement Panel */}
        <Separator className="my-6 bg-muted" />
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isAr ? 'لوحة تفاعلات العميل' : 'Client Interaction Panel'}
          </h3>
          <ClientInteractionPanel projectId={projectId} clientId={clientId} />
        </div>
      </div>

      {/* ===== Add Interaction Dialog ===== */}
      <Dialog
        open={interactionDialogOpen}
        onOpenChange={setInteractionDialogOpen}
      >
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg">
              {isAr ? 'إضافة تفاعل عميل' : 'Add Client Interaction'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-foreground/80">
                {isAr ? 'المرحلة' : 'Phase'}
              </Label>
              <Select
                value={interactionForm.phaseId}
                onValueChange={(val) =>
                  setInteractionForm({ ...interactionForm, phaseId: val })
                }
              >
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue
                    placeholder={
                      isAr
                        ? 'اختر مرحلة (اختياري)'
                        : 'Select phase (optional)'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border max-h-60">
                  {phases.map((p) => {
                    const ptl =
                      phaseTypeLabels[p.phaseType] || {
                        ar: p.phaseType,
                        en: p.phaseType,
                      };
                    return (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="text-foreground/80"
                      >
                        {isAr ? ptl.ar : ptl.en}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">
                {isAr ? 'نوع التفاعل' : 'Interaction Type'}
              </Label>
              <Select
                value={interactionForm.interactionType}
                onValueChange={(val) =>
                  setInteractionForm({
                    ...interactionForm,
                    interactionType: val,
                  })
                }
              >
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem
                    value="COMMENT"
                    className="text-blue-400"
                  >
                    {isAr ? 'تعليق' : 'Comment'}
                  </SelectItem>
                  <SelectItem
                    value="APPROVAL"
                    className="text-emerald-400"
                  >
                    {isAr ? 'موافقة' : 'Approve'}
                  </SelectItem>
                  <SelectItem value="REJECTION" className="text-red-400">
                    {isAr ? 'رفض' : 'Reject'}
                  </SelectItem>
                  <SelectItem
                    value="REQUEST_CHANGE"
                    className="text-amber-400"
                  >
                    {isAr ? 'طلب تعديل' : 'Request Change'}
                  </SelectItem>
                  <SelectItem
                    value="QUESTION"
                    className="text-purple-400"
                  >
                    {isAr ? 'سؤال' : 'Question'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">
                {isAr ? 'المحتوى' : 'Content'} *
              </Label>
              <Textarea
                value={interactionForm.content}
                onChange={(e) =>
                  setInteractionForm({
                    ...interactionForm,
                    content: e.target.value,
                  })
                }
                placeholder={
                  isAr ? 'محتوى التفاعل...' : 'Interaction content...'
                }
                rows={3}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">
                {isAr ? 'الرد (اختياري)' : 'Response (optional)'}
              </Label>
              <Textarea
                value={interactionForm.responseContent}
                onChange={(e) =>
                  setInteractionForm({
                    ...interactionForm,
                    responseContent: e.target.value,
                  })
                }
                placeholder={
                  isAr ? 'رد على التفاعل...' : 'Response to interaction...'
                }
                rows={2}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setInteractionDialogOpen(false)}
              className="border-border text-foreground/80"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleSubmitInteraction}
              disabled={
                !interactionForm.content.trim() || submittingInteraction
              }
              className="bg-blue-600 hover:bg-blue-700 text-foreground"
            >
              {submittingInteraction && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {t.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Rejection Reason Dialog ===== */}
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
    </>
  );
}
