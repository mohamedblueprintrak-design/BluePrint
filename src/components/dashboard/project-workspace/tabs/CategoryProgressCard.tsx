'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  type WorkflowPhase,
  type DependencyInfo,
  categoryConfig,
} from '../config';

interface CategoryProgressCardProps {
  category: string;
  icon?: React.ReactNode;
  phasesByCategory: Record<string, WorkflowPhase[]>;
  phaseDependencyMap: Record<string, DependencyInfo>;
  isAr: boolean;
}

export default function CategoryProgressCard({
  category,
  icon,
  phasesByCategory,
  phaseDependencyMap,
  isAr,
}: CategoryProgressCardProps) {
  const catPhases = phasesByCategory[category] || [];
  if (catPhases.length === 0) return null;
  const catConfig = categoryConfig[category];
  const completed = catPhases.filter((p) => p.status === 'COMPLETED').length;
  const pct = Math.round((completed / catPhases.length) * 100);
  const blockedCount = catPhases.filter(
    (p) => phaseDependencyMap[p.id]?.blocked && p.status === 'NOT_STARTED'
  ).length;

  return (
    <div className="bg-slate-800/40 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon || catConfig?.icon}
        <span className="text-sm font-medium text-white">
          {catConfig ? (isAr ? catConfig.ar : catConfig.en) : category}
        </span>
        <Badge
          variant="secondary"
          className="bg-slate-700 text-slate-400 text-[10px] ms-auto"
        >
          {completed}/{catPhases.length}
        </Badge>
        {blockedCount > 0 && (
          <Badge
            variant="secondary"
            className="bg-orange-500/10 text-orange-400 text-[10px]"
          >
            🔒 {blockedCount}
          </Badge>
        )}
      </div>
      <Progress value={pct} className="h-1.5 bg-slate-700" />
      <p className="text-xs text-slate-500 mt-1.5">{pct}%</p>
    </div>
  );
}
