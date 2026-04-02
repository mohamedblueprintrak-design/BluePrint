'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import {
  type WorkflowPhase,
  type DependencyInfo,
} from '../config';
import PhaseTable from './PhaseTable';

interface StructuralTabProps {
  phasesByCategory: Record<string, WorkflowPhase[]>;
  phaseDependencyMap: Record<string, DependencyInfo>;
  canManage: boolean;
  isAr: boolean;
  onStatusChange: (phaseId: string, newStatus: string) => void;
  formatDate: (date: string) => string;
  t: { status: string; actions: string; noData: string };
}

export default function StructuralTab({
  phasesByCategory,
  phaseDependencyMap,
  canManage,
  isAr,
  onStatusChange,
  formatDate,
  t,
}: StructuralTabProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-orange-400" />
          <CardTitle className="text-base text-foreground">
            {isAr ? 'المراحل الإنشائية' : 'Structural Phases'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <PhaseTable
          categoryPhases={phasesByCategory['STRUCTURAL'] || []}
          isAr={isAr}
          phaseDependencyMap={phaseDependencyMap}
          canManage={canManage}
          onStatusChange={onStatusChange}
          formatDate={formatDate}
          t={t}
        />
      </CardContent>
    </Card>
  );
}
