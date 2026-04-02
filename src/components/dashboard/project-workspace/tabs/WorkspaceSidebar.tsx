'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Layers,
  FileSpreadsheet,
  FileText,
  BrainCircuit,
  Shield,
  TrendingUp,
  Zap,
  Droplets,
  Thermometer,
} from 'lucide-react';
import {
  type ProjectData,
  statusConfig,
  govApprovalConfig,
  mepStatusConfig,
} from '../config';

interface WorkspaceSidebarProps {
  project: ProjectData;
  isAr: boolean;
  isRTL: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onBack: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  completedPhases: number;
  totalPhases: number;
  taskStats: { total: number; done: number; inProgress: number };
  t: { back: string; progress: string; tasks: string };
}

export default function WorkspaceSidebar({
  project,
  isAr,
  isRTL,
  sidebarOpen,
  setSidebarOpen,
  onBack,
  formatCurrency,
  formatDate,
  completedPhases,
  totalPhases,
  taskStats,
  t,
}: WorkspaceSidebarProps) {
  const sc = statusConfig[project.status] || statusConfig.PLANNING;
  const govStatus = govApprovalConfig[project.governmentApprovalStatus || 'PENDING'];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 z-50 w-[260px] bg-slate-900 border-slate-800 border-e flex flex-col transition-transform duration-300 ${
          sidebarOpen
            ? 'translate-x-0'
            : isRTL
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
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
              <ArrowLeft
                className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`}
              />
            </Button>
            <span className="text-xs text-slate-500 font-medium">
              {isAr ? 'مساحة العمل' : 'Workspace'}
            </span>
          </div>
          <h2 className="font-bold text-lg text-white leading-tight">
            {project.name}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            {project.code}
          </p>
        </div>

        <ScrollArea className="flex-1 p-4 space-y-4">
          {/* Status Badge */}
          <Badge
            variant="secondary"
            className={`${sc.bg} ${sc.color} text-xs font-medium`}
          >
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
            {project.customerFileNumber && (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xs">{isAr ? 'رقم ملف العميل:' : 'Customer File No:'}</span>
                <span className="text-xs text-slate-200">{project.customerFileNumber}</span>
              </div>
            )}
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

          {/* Task 1C: Government Approval Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? 'الموافقة الحكومية' : 'Gov. Approval'}
              </span>
            </div>
            <Badge
              variant="secondary"
              className={`${govStatus.bg} ${govStatus.color} text-xs w-full justify-center py-1.5`}
            >
              {isAr ? govStatus.labelAr : govStatus.labelEn}
            </Badge>
            {project.licenseNumber && (
              <div className="flex items-center gap-2 text-slate-400">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="text-[10px] font-mono">
                  {project.licenseNumber}
                </span>
              </div>
            )}

            {/* MEP Status Indicators */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {isAr ? 'حالة الخدمات' : 'MEP Status'}
              </p>
              {[
                {
                  key: 'electricalStatus' as const,
                  label: isAr ? 'كهرباء' : 'Electrical',
                  icon: <Zap className="h-3 w-3" />,
                },
                {
                  key: 'plumbingStatus' as const,
                  label: isAr ? 'سباكة' : 'Plumbing',
                  icon: <Droplets className="h-3 w-3" />,
                },
                {
                  key: 'hvacStatus' as const,
                  label: 'HVAC',
                  icon: <Thermometer className="h-3 w-3" />,
                },
              ].map((mep) => {
                const statusVal = project[mep.key] || 'NOT_STARTED';
                const cfg = mepStatusConfig[statusVal] || mepStatusConfig.NOT_STARTED;
                return (
                  <div
                    key={mep.key}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 text-slate-400">
                      {mep.icon}
                      <span className="text-[11px]">{mep.label}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${cfg.bg} ${cfg.color} text-[10px]`}
                    >
                      {isAr ? cfg.labelAr : cfg.labelEn}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400">{t.progress}</span>
              <span className="text-white font-semibold">
                {Math.round(project.progress)}%
              </span>
            </div>
            <Progress value={project.progress} className="h-2 bg-slate-700" />
          </div>

          <Separator className="bg-slate-800" />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <DollarSign className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">
                {isAr ? 'الميزانية' : 'Budget'}
              </p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {formatCurrency(project.budget)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <TrendingUp className="h-4 w-4 text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">
                {isAr ? 'المصروف' : 'Spent'}
              </p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {formatCurrency(project.spent)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">{t.tasks}</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {taskStats.total}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Layers className="h-4 w-4 text-violet-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">
                {isAr ? 'المراحل' : 'Phases'}
              </p>
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
              const event = new CustomEvent('navigate', {
                detail: { page: 'ai-chat' },
              });
              window.dispatchEvent(event);
            }}
          >
            <BrainCircuit className="h-4 w-4" />
            {isAr ? 'اسأل بلو' : 'Ask Blue'}
          </Button>
        </ScrollArea>
      </aside>
    </>
  );
}
