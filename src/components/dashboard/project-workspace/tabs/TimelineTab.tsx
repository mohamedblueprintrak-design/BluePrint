'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Timer,
  CheckCircle2,
  AlertTriangle,
  Play,
  CircleDot,
  Lock,
  Users,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  type WorkflowPhase,
  type DependencyInfo,
  categoryConfig,
  phaseStatusConfig,
  phaseTypeLabels,
  calculateSLA,
} from '../config';

interface TimelineTabProps {
  phasesByCategory: Record<string, WorkflowPhase[]>;
  phaseDependencyMap: Record<string, DependencyInfo>;
  phases: WorkflowPhase[];
  isAr: boolean;
  isRTL: boolean;
  formatDate: (date: string) => string;
  t: { noData: string };
}

export default function TimelineTab({
  phasesByCategory,
  phaseDependencyMap,
  phases,
  isAr,
  isRTL,
  formatDate,
  t,
}: TimelineTabProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-blue-400" />
          <CardTitle className="text-base text-white">
            {isAr
              ? 'الجدول الزمني للمراحل'
              : 'Phase Timeline'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {phases.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            {t.noData}
          </p>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="relative">
              {/* Timeline line */}
              <div
                className={`absolute top-0 bottom-0 w-0.5 ${
                  isRTL ? 'right-[19px]' : 'left-[19px]'
                } bg-slate-700`}
              />

              <div className="space-y-6">
                {/* Category headers + phases */}
                {Object.entries(phasesByCategory).map(
                  ([category, catPhases]) => {
                    const catConf = categoryConfig[category];
                    return (
                      <div key={category}>
                        {/* Category label */}
                        <div className="flex items-center gap-2 mb-3 ms-12">
                          {catConf?.icon || (
                            <Layers className="h-4 w-4" />
                          )}
                          <span className="text-sm font-semibold text-white">
                            {catConf
                              ? isAr
                                ? catConf.ar
                                : catConf.en
                              : category}
                          </span>
                        </div>

                        {/* Phase items */}
                        {catPhases.map((phase) => {
                          const ps =
                            phaseStatusConfig[phase.status] ||
                            phaseStatusConfig.NOT_STARTED;
                          const ptl =
                            phaseTypeLabels[phase.phaseType] || {
                              ar: phase.phaseType,
                              en: phase.phaseType,
                            };
                          const sla = calculateSLA(phase, isAr);
                          const hasDependent =
                            catPhases.findIndex(
                              (p) => p.id === phase.id
                            ) > 0;
                          const depInfo =
                            phaseDependencyMap[phase.id];
                          const isBlocked =
                            depInfo?.blocked &&
                            phase.status === 'NOT_STARTED';

                          return (
                            <div
                              key={phase.id}
                              className="flex items-start gap-4 mb-4 group"
                            >
                              {/* Connector */}
                              {hasDependent && (
                                <div
                                  className={`absolute top-0 ${
                                    isRTL
                                      ? 'right-[18px]'
                                      : 'left-[18px]'
                                  } w-0.5 h-6 bg-slate-700`}
                                />
                              )}

                              {/* Dot */}
                              <div
                                className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                                  phase.status === 'COMPLETED'
                                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                    : phase.status === 'IN_PROGRESS'
                                    ? 'bg-blue-500/20 border-2 border-blue-500 animate-pulse'
                                    : isBlocked
                                    ? 'bg-orange-500/20 border-2 border-orange-500'
                                    : phase.status === 'DELAYED' ||
                                      phase.status === 'REJECTED'
                                    ? 'bg-red-500/20 border-2 border-red-500'
                                    : 'bg-slate-800 border-2 border-slate-600'
                                }`}
                              >
                                {isBlocked ? (
                                  <Lock className="h-4 w-4 text-orange-400" />
                                ) : phase.status === 'COMPLETED' ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : phase.status === 'IN_PROGRESS' ? (
                                  <Play className="h-3 w-3 text-blue-400" />
                                ) : phase.status === 'DELAYED' ||
                                  phase.status === 'REJECTED' ? (
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
                                  <Badge
                                    variant="secondary"
                                    className={`${ps.bg} ${ps.color} text-[10px]`}
                                  >
                                    {isAr ? ps.labelAr : ps.labelEn}
                                  </Badge>
                                  {isBlocked && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-orange-500/10 text-orange-400 text-[10px]"
                                    >
                                      🔒{' '}
                                      {isAr ? 'محظور' : 'Blocked'}
                                    </Badge>
                                  )}
                                  {phase.rejectionCount > 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-red-500/10 text-red-400 text-[10px]"
                                    >
                                      {phase.rejectionCount}x{' '}
                                      {isAr ? 'رفض' : 'rej'}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                  {phase.assignedTo && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {phase.assignedTo.name ||
                                        phase.assignedTo.fullName}
                                    </span>
                                  )}
                                  {phase.startDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(phase.startDate)}
                                    </span>
                                  )}
                                  {phase.status === 'IN_PROGRESS' && (
                                    <span className={sla.color}>
                                      {sla.text}
                                    </span>
                                  )}
                                </div>
                                {isBlocked &&
                                  depInfo &&
                                  depInfo.blockedBy.length > 0 && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-400/80">
                                      <Lock className="h-3 w-3" />
                                      <span>
                                        {isAr
                                          ? `يعتمد على: ${depInfo.blockedBy.join(', ')}`
                                          : `Depends on: ${depInfo.blockedBy.join(', ')}`}
                                      </span>
                                    </div>
                                  )}
                                {phase.notes && (
                                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                    {phase.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
