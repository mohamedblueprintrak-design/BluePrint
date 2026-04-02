'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Clock,
  Circle,
  Play,
  Check,
  Lock,
} from 'lucide-react';
import {
  type WorkflowPhase,
  type DependencyInfo,
  categoryConfig,
  phaseTypeLabels,
} from '../config';

interface MatrixTabProps {
  phasesByCategory: Record<string, WorkflowPhase[]>;
  phaseDependencyMap: Record<string, DependencyInfo>;
  canManage: boolean;
  isAr: boolean;
  onStatusChange: (phaseId: string, newStatus: string) => void;
}

export default function MatrixTab({
  phasesByCategory,
  phaseDependencyMap,
  canManage,
  isAr,
  onStatusChange,
}: MatrixTabProps) {
  return (
    <div className="space-y-4">
      {/* Matrix Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">
            {isAr ? 'نظرة شاملة على كل الأقسام' : 'All Departments Overview'}
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          {isAr ? 'مثل شيت الإكسل - كل الأقسام في صف واحد' : 'Like Excel - all departments in one view'}
        </span>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(categoryConfig).map(([catKey, catInfo]) => {
          const catPhases = phasesByCategory[catKey] || [];
          if (catPhases.length === 0) return null;
          const completed = catPhases.filter(p => p.status === 'COMPLETED').length;
          const inProgress = catPhases.filter(p => p.status === 'IN_PROGRESS').length;
          const rejected = catPhases.reduce((sum, p) => sum + (p.rejectionCount || 0), 0);
          const total = catPhases.length;
          const pct = Math.round((completed / total) * 100);

          return (
            <Card key={catKey} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {catInfo.icon}
                    <CardTitle className="text-sm font-semibold text-white">{catInfo.ar}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {rejected > 0 && (
                      <Badge variant="secondary" className="bg-red-500/10 text-red-400 text-xs">
                        {rejected} {isAr ? 'رفض' : 'rej'}
                      </Badge>
                    )}
                    <span className="text-slate-400">{completed}/{total}</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-slate-700'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-500">
                      {pct}% {isAr ? 'مكتمل' : 'done'}
                    </span>
                    {inProgress > 0 && (
                      <span className="text-xs text-blue-400">
                        {inProgress} {isAr ? 'قيد التنفيذ' : 'active'}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {catPhases.map(phase => {
                    const label = phaseTypeLabels[phase.phaseType] || { ar: phase.phaseType, en: phase.phaseType };
                    const isBlocked = phaseDependencyMap[phase.id]?.blocked;
                    return (
                      <div key={phase.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-800/50 group">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {phase.status === 'COMPLETED' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : phase.status === 'IN_PROGRESS' ? (
                            <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          ) : phase.status === 'REJECTED' ? (
                            <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                          )}
                          <span className={`text-xs truncate ${phase.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                            {isAr ? label.ar : label.en}
                          </span>
                          {isBlocked && (
                            <Lock className="h-3 w-3 text-slate-600 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {phase.rejectionCount > 0 && (
                            <span className="text-xs text-red-400">{phase.rejectionCount}</span>
                          )}
                          {/* Quick Action Buttons */}
                          {canManage && phase.status !== 'COMPLETED' && !isBlocked && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {phase.status === 'NOT_STARTED' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onStatusChange(phase.id, 'IN_PROGRESS'); }}
                                  className="p-0.5 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-400"
                                  title={isAr ? 'ابدأ' : 'Start'}
                                >
                                  <Play className="h-3 w-3" />
                                </button>
                              )}
                              {phase.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onStatusChange(phase.id, 'COMPLETED'); }}
                                  className="p-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400"
                                  title={isAr ? 'إنهاء' : 'Complete'}
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                          {isBlocked && (
                            <span className="text-xs text-slate-600" title={phaseDependencyMap[phase.id]?.blockedBy.join(', ')}>
                              {isAr ? 'مقفل' : 'Locked'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
