'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark } from 'lucide-react';
import {
  type WorkflowPhase,
  phaseTypeLabels,
} from '../config';
import PhaseTable from './PhaseTable';

interface GovernmentTabProps {
  phasesByCategory: Record<string, WorkflowPhase[]>;
  phaseDependencyMap: Record<string, { blocked: boolean; blockedBy: string[]; canStart: boolean; dependencyChain: string[] }>;
  canManage: boolean;
  isAr: boolean;
  onStatusChange: (phaseId: string, newStatus: string) => void;
  formatDate: (date: string) => string;
  t: { status: string; actions: string; noData: string };
}

export default function GovernmentTab({
  phasesByCategory,
  phaseDependencyMap,
  canManage,
  isAr,
  onStatusChange,
  formatDate,
  t,
}: GovernmentTabProps) {
  const govPhases = phasesByCategory['GOVERNMENT'] || [];

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-base text-foreground">
              {isAr
                ? 'مراحل الموافقات الحكومية'
                : 'Government Approval Phases'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <PhaseTable
            categoryPhases={govPhases}
            isAr={isAr}
            phaseDependencyMap={phaseDependencyMap}
            canManage={canManage}
            onStatusChange={onStatusChange}
            formatDate={formatDate}
            t={t}
          />
        </CardContent>
      </Card>

      {/* MUN Notes History */}
      {govPhases.some((p) => p.notes) && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">
              {isAr
                ? 'ملاحظات البلدية (MUN NOT)'
                : 'MUN Notes History'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {govPhases
              .filter((p) => p.notes)
              .map((p) => {
                const ptl =
                  phaseTypeLabels[p.phaseType] || {
                    ar: p.phaseType,
                    en: p.phaseType,
                  };
                return (
                  <div
                    key={p.id}
                    className="bg-muted rounded-lg p-3 border border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className="bg-amber-500/10 text-amber-400 text-[10px]"
                      >
                        {isAr ? ptl.ar : ptl.en}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-red-500/10 text-red-400 text-[10px]"
                      >
                        {p.rejectionCount}x{' '}
                        {isAr ? 'رفض' : 'rejections'}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {p.notes}
                    </p>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
