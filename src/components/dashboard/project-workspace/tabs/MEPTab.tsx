'use client';

import React from 'react';
import { Zap, Droplets, Waves, Wifi, Fan, Flame, Wrench } from 'lucide-react';
import {
  type WorkflowPhase,
  type DependencyInfo,
} from '../config';
import PhaseTable from './PhaseTable';

interface MEPTabProps {
  phasesByCategory: Record<string, WorkflowPhase[]>;
  phaseDependencyMap: Record<string, DependencyInfo>;
  canManage: boolean;
  isAr: boolean;
  onStatusChange: (phaseId: string, newStatus: string) => void;
  formatDate: (date: string) => string;
  t: { status: string; actions: string; noData: string };
}

const mepSubGroups = [
  {
    key: 'electrical' as const,
    label: { ar: 'الكهرباء', en: 'Electrical' },
    icon: <Zap className="h-5 w-5 text-red-400" />,
    types: ['NOC', 'ELECTRICAL', 'AC_CALCULATIONS', 'SOLAR_HEATING', 'LOAD_SCHEDULE', 'PANEL_SCHEDULE', 'ELEC_SPECIFICATIONS', 'LIGHTING'],
  },
  {
    key: 'drainage' as const,
    label: { ar: 'الصرف الصحي', en: 'Drainage' },
    icon: <Droplets className="h-5 w-5 text-blue-400" />,
    types: ['DRAINAGE', 'SITE_DRAINAGE', 'RAIN_DRAINAGE', 'TANK_DETAILS'],
  },
  {
    key: 'water' as const,
    label: { ar: 'امدادات المياه', en: 'Water Supply' },
    icon: <Waves className="h-5 w-5 text-cyan-400" />,
    types: ['WATER_SUPPLY', 'SITE_WATER', 'GROUND_FLOOR_WATER', 'ROOF_WATER'],
  },
  {
    key: 'etisalat' as const,
    label: { ar: 'الاتصالات', en: 'Etisalat' },
    icon: <Wifi className="h-5 w-5 text-emerald-400" />,
    types: ['ETISALAT', 'ETISALAT_GF'],
  },
  {
    key: 'hvac' as const,
    label: { ar: 'التكييف', en: 'HVAC' },
    icon: <Fan className="h-5 w-5 text-violet-400" />,
    types: ['HVAC'],
  },
  {
    key: 'civildefense' as const,
    label: { ar: 'الدفاع المدني', en: 'Civil Defense' },
    icon: <Flame className="h-5 w-5 text-red-500" />,
    types: ['CD_FIRE_SYSTEM', 'CD_EMERGENCY_LIGHTING', 'CD_FIRE_FITTING', 'CD_SCHEMATIC'],
  },
  {
    key: 'coordination' as const,
    label: { ar: 'تنسيق MEP', en: 'MEP Coordination' },
    icon: <Wrench className="h-5 w-5 text-teal-400" />,
    types: ['MEP_COORDINATION'],
  },
];

export default function MEPTab({
  phasesByCategory,
  phaseDependencyMap,
  canManage,
  isAr,
  onStatusChange,
  formatDate,
  t,
}: MEPTabProps) {
  const mepPhases = phasesByCategory['MEP'] || [];

  return (
    <div className="space-y-6">
      {mepSubGroups.map((group) => {
        const filteredPhases = mepPhases.filter(p =>
          group.types.includes(p.phaseType)
        );
        if (filteredPhases.length === 0) return null;
        return (
          <div key={group.key} className="bg-muted rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              {group.icon}
              <h3 className="text-sm font-semibold text-foreground">
                {isAr ? group.label.ar : group.label.en}
              </h3>
            </div>
            <PhaseTable
              categoryPhases={filteredPhases}
              isAr={isAr}
              phaseDependencyMap={phaseDependencyMap}
              canManage={canManage}
              onStatusChange={onStatusChange}
              formatDate={formatDate}
              t={t}
            />
          </div>
        );
      })}
    </div>
  );
}
