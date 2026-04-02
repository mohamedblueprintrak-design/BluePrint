'use client';

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Lock, PenTool, Play, Check } from 'lucide-react';
import {
  type WorkflowPhase,
  type DependencyInfo,
  phaseStatusConfig,
  phaseTypeLabels,
  calculateSLA,
} from '../config';

interface PhaseTableProps {
  categoryPhases: WorkflowPhase[];
  isAr: boolean;
  phaseDependencyMap: Record<string, DependencyInfo>;
  canManage: boolean;
  onStatusChange: (phaseId: string, newStatus: string) => void;
  formatDate: (date: string) => string;
  t: { status: string; actions: string; noData: string };
}

export default function PhaseTable({
  categoryPhases,
  isAr,
  phaseDependencyMap,
  canManage,
  onStatusChange,
  formatDate,
  t,
}: PhaseTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-start p-3 text-muted-foreground font-medium">
              {isAr ? 'المرحلة' : 'Phase'}
            </th>
            <th className="text-start p-3 text-muted-foreground font-medium">{t.status}</th>
            <th className="text-start p-3 text-muted-foreground font-medium">
              {isAr ? 'المسؤول' : 'Assigned'}
            </th>
            <th className="text-start p-3 text-muted-foreground font-medium">
              {isAr ? 'تاريخ البداية' : 'Start'}
            </th>
            <th className="text-start p-3 text-muted-foreground font-medium">
              {isAr ? 'المتبقي' : 'SLA'}
            </th>
            <th className="text-start p-3 text-muted-foreground font-medium">
              {isAr ? 'الرفض' : 'Rejections'}
            </th>
            <th className="text-center p-3 text-muted-foreground font-medium">{t.actions}</th>
          </tr>
        </thead>
        <tbody>
          {categoryPhases.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-muted-foreground">
                {t.noData}
              </td>
            </tr>
          ) : (
            categoryPhases.map((phase) => {
              const ps =
                phaseStatusConfig[phase.status] || phaseStatusConfig.NOT_STARTED;
              const sla = calculateSLA(phase, isAr);
              const ptl =
                phaseTypeLabels[phase.phaseType] || {
                  ar: phase.phaseType,
                  en: phase.phaseType,
                };
              const depInfo = phaseDependencyMap[phase.id];
              const isBlocked = depInfo?.blocked && phase.status === 'NOT_STARTED';
              const assignedName = phase.assignedTo?.name || phase.assignedTo?.fullName;

              return (
                <tr
                  key={phase.id}
                  className={`border-b border-border/30 hover:bg-accent/40 transition-colors ${
                    isBlocked ? 'border-s-2 border-s-orange-500/60 bg-orange-500/5' : ''
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {isBlocked ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Lock className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-muted border-border text-foreground max-w-xs"
                          >
                            <p className="font-medium mb-1">
                              {isAr ? '🔒 مرحلة محظورة' : '🔒 Phase Blocked'}
                            </p>
                            <ul className="text-xs space-y-1">
                              {depInfo?.dependencyChain.map((chain, idx) => (
                                <li key={idx} className="text-orange-300">
                                  • {chain}
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div
                          className={`h-2 w-2 rounded-full shrink-0 ${ps.dot}`}
                        />
                      )}
                      <span className="text-foreground font-medium">
                        {isAr ? ptl.ar : ptl.en}
                      </span>
                      {isBlocked && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-500/10 text-orange-400 text-[10px]"
                        >
                          {isAr ? 'محظور' : 'Blocked'}
                        </Badge>
                      )}
                    </div>
                    {/* Dependency chain display */}
                    {isBlocked && depInfo && depInfo.blockedBy.length > 0 && (
                      <div className="mt-1.5 ms-5.5">
                        <p className="text-[10px] text-orange-400/80">
                          {isAr
                            ? `يعتمد على: ${depInfo.blockedBy.join(', ')}`
                            : `Depends on: ${depInfo.blockedBy.join(', ')}`}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge
                      variant="secondary"
                      className={`${ps.bg} ${ps.color} text-xs`}
                    >
                      {isAr ? ps.labelAr : ps.labelEn}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {assignedName ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-blue-600/30 text-blue-300 text-[10px]">
                              {assignedName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground/80 text-xs">{assignedName}</span>
                        </div>
                        {/* Draft Assignment */}
                        {phase.draftAssignedTo && (
                          <div className="flex items-center gap-1 text-xs text-purple-400 mt-0.5">
                            <PenTool className="h-3 w-3" />
                            <span>{phase.draftAssignedTo.name || phase.draftAssignedTo.fullName}</span>
                            {phase.draftStartDate && (
                              <span className="text-muted-foreground">
                                ({formatDate(phase.draftStartDate)} - {phase.draftEndDate ? formatDate(phase.draftEndDate) : '...'})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {phase.startDate ? formatDate(phase.startDate) : '—'}
                  </td>
                  <td className="p-3">
                    {phase.status === 'IN_PROGRESS' ? (
                      <span className={`text-xs font-medium ${sla.color}`}>
                        {sla.text}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {phase.rejectionCount > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-red-500/10 text-red-400 text-xs"
                      >
                        {phase.rejectionCount}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">0</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {/* Quick Action Buttons */}
                    {canManage && !isBlocked && phase.status !== 'COMPLETED' && (
                      <div className="flex gap-1 mb-1 justify-center">
                        {phase.status === 'NOT_STARTED' && (
                          <button
                            onClick={() => onStatusChange(phase.id, 'IN_PROGRESS')}
                            className="p-1.5 rounded-md bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 transition-colors"
                            title={isAr ? 'ابدأ المرحلة' : 'Start Phase'}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {phase.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => onStatusChange(phase.id, 'COMPLETED')}
                            className="p-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 transition-colors"
                            title={isAr ? 'إنهاء المرحلة' : 'Complete Phase'}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    {phase.status !== 'COMPLETED' && (
                      isBlocked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Select
                                value={phase.status}
                                onValueChange={(val) =>
                                  onStatusChange(phase.id, val)
                                }
                                disabled
                              >
                                <SelectTrigger className="h-7 w-auto border-border bg-muted text-xs text-muted-foreground px-2 opacity-50 cursor-not-allowed">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-muted border-border">
                                  <SelectItem value="NOT_STARTED" className="text-foreground/80">
                                    {isAr ? 'لم يبدأ' : 'Not Started'}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {phaseDependencyMap[phase.id]?.blocked && (
                                <span className="text-xs text-amber-400/70 block mt-1">
                                  {phaseDependencyMap[phase.id]?.blockedBy.join(', ')}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-muted border-border text-foreground max-w-xs"
                          >
                            {depInfo?.dependencyChain.map((chain, idx) => (
                              <p key={idx} className="text-xs text-orange-300">
                                🔒 {chain}
                              </p>
                            ))}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Select
                          value={phase.status}
                          onValueChange={(val) =>
                            onStatusChange(phase.id, val)
                          }
                        >
                          <SelectTrigger className="h-7 w-auto border-border bg-muted text-xs text-foreground/80 px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-muted border-border">
                            <SelectItem value="NOT_STARTED" className="text-foreground/80">
                              {isAr ? 'لم يبدأ' : 'Not Started'}
                            </SelectItem>
                            <SelectItem value="IN_PROGRESS" className="text-foreground/80">
                              {isAr ? 'قيد التنفيذ' : 'In Progress'}
                            </SelectItem>
                            <SelectItem value="COMPLETED" className="text-foreground/80">
                              {isAr ? 'مكتمل' : 'Completed'}
                            </SelectItem>
                            <SelectItem value="ON_HOLD" className="text-foreground/80">
                              {isAr ? 'معلق' : 'On Hold'}
                            </SelectItem>
                            <SelectItem value="DELAYED" className="text-foreground/80">
                              {isAr ? 'متأخر' : 'Delayed'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )
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
}
