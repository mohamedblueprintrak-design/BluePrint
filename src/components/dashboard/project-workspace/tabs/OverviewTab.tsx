'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type ProjectData } from '../config';
import CategoryProgressCard from './CategoryProgressCard';

interface OverviewTabProps {
  project: ProjectData;
  phasesByCategory: Record<string, { id: string; status: string }[]>;
  phaseDependencyMap: Record<string, { blocked: boolean; blockedBy: string[]; canStart: boolean; dependencyChain: string[] }>;
  totalPaid: number;
  totalInvoiced: number;
  _completedPhases?: number;
  totalPhases: number;
  taskStats: { total: number; done: number; inProgress: number };
  isAr: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  sc: { color: string; bg: string; labelAr: string; labelEn: string };
  tc: { labelAr: string; labelEn: string };
  t: {
    type: string;
    projectStatus: string;
    startDate: string;
    endDate: string;
    client: string;
    projectLocation: string;
    progress: string;
    tasks: string;
    noData: string;
    completed: string;
  };
}

export default function OverviewTab({
  project,
  phasesByCategory,
  phaseDependencyMap,
  totalPaid,
  totalInvoiced,
  _completedPhases,
  totalPhases,
  taskStats,
  isAr,
  formatCurrency,
  formatDate,
  sc,
  tc,
  t,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Details Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">
              {isAr ? 'تفاصيل المشروع' : 'Project Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">{t.type}</p>
                <p className="text-foreground">
                  {isAr ? tc.labelAr : tc.labelEn}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">
                  {t.projectStatus}
                </p>
                <Badge
                  variant="secondary"
                  className={`${sc.bg} ${sc.color} text-xs`}
                >
                  {isAr ? sc.labelAr : sc.labelEn}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">
                  {t.startDate}
                </p>
                <p className="text-foreground">
                  {formatDate(project.startDate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">
                  {t.endDate}
                </p>
                <p className="text-foreground">
                  {project.endDate
                    ? formatDate(project.endDate)
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">
                  {isAr ? 'المدير' : 'Manager'}
                </p>
                <p className="text-foreground">
                  {project.manager?.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">
                  {t.client}
                </p>
                <p className="text-foreground">
                  {project.client?.name || '—'}
                </p>
              </div>
              {project.location && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs mb-1">
                    {t.projectLocation}
                  </p>
                  <p className="text-foreground">{project.location}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Engineering Status Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">
              {isAr
                ? 'حالة المراحل الهندسية'
                : 'Engineering Phase Status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'ARCHITECTURAL',
              'STRUCTURAL',
              'MEP',
              'GOVERNMENT',
            ].map((cat) => (
              <CategoryProgressCard
                key={cat}
                category={cat}
                phasesByCategory={phasesByCategory}
                phaseDependencyMap={phaseDependencyMap}
                isAr={isAr}
              />
            ))}
            {totalPhases === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                {t.noData}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">
              {isAr ? 'الملخص المالي' : 'Financial Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">
                  {isAr ? 'قيمة العقد' : 'Contract Value'}
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatCurrency(project.budget)}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">
                  {isAr ? 'المدفوع' : 'Paid'}
                </p>
                <p className="text-lg font-bold text-emerald-400 mt-1">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">
                  {isAr ? 'الفواتير' : 'Invoiced'}
                </p>
                <p className="text-lg font-bold text-blue-400 mt-1">
                  {formatCurrency(totalInvoiced)}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">
                  {isAr ? 'المتبقي' : 'Remaining'}
                </p>
                <p className="text-lg font-bold text-amber-400 mt-1">
                  {formatCurrency(
                    Math.max(0, project.budget - totalPaid)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Summary Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">
              {isAr ? 'ملخص المهام' : 'Task Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-foreground">
                  {taskStats.total}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr ? 'الكل' : 'Total'}
                </p>
              </div>
              <div className="text-center bg-blue-500/10 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-400">
                  {taskStats.inProgress}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr ? 'قيد التنفيذ' : 'In Progress'}
                </p>
              </div>
              <div className="text-center bg-emerald-500/10 rounded-lg p-3">
                <p className="text-2xl font-bold text-emerald-400">
                  {taskStats.done}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.completed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
