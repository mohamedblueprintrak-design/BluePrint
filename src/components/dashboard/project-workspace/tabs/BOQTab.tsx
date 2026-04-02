'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileSpreadsheet, Layers, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  type ProjectData,
  type BOQItemData,
  boqCategoryConfig,
} from '../config';
import type { BOQVarianceData as BOQVarianceDataType } from '../use-project-workspace';

interface BOQTabProps {
  project: ProjectData;
  boqItems: BOQItemData[];
  boqVariance: BOQVarianceDataType | null;
  boqByCategory: Record<string, BOQItemData[]>;
  totalBOQ: number;
  isAr: boolean;
  formatCurrency: (amount: number) => string;
  t: { noData: string };
}

export default function BOQTab({
  project,
  boqItems,
  boqVariance,
  boqByCategory,
  totalBOQ,
  isAr,
  formatCurrency,
  t,
}: BOQTabProps) {
  return (
    <div className="space-y-6">
      {/* BOQ Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <FileSpreadsheet className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  {isAr ? 'إجمالي BOQ' : 'Total BOQ'}
                </p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(totalBOQ)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Layers className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  {isAr ? 'عدد البنود' : 'Items Count'}
                </p>
                <p className="text-xl font-bold text-white">
                  {boqItems.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  {isAr ? 'المصروف الفعلي' : 'Actual Spent'}
                </p>
                <p className="text-xl font-bold text-amber-400">
                  {formatCurrency(project.spent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BOQ Category Breakdown */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-violet-400" />
            <CardTitle className="text-base text-white">
              {isAr ? 'جدول الكميات (BOQ)' : 'Bill of Quantities'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {boqItems.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              {t.noData}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-start p-3 text-slate-400 font-medium">
                      {isAr ? '#' : '#'}
                    </th>
                    <th className="text-start p-3 text-slate-400 font-medium">
                      {isAr ? 'الوصف' : 'Description'}
                    </th>
                    <th className="text-start p-3 text-slate-400 font-medium">
                      {isAr ? 'الفئة' : 'Category'}
                    </th>
                    <th className="text-center p-3 text-slate-400 font-medium">
                      {isAr ? 'الوحدة' : 'Unit'}
                    </th>
                    <th className="text-center p-3 text-slate-400 font-medium">
                      {isAr ? 'الكمية' : 'Qty'}
                    </th>
                    <th className="text-end p-3 text-slate-400 font-medium">
                      {isAr ? 'سعر الوحدة' : 'Unit Price'}
                    </th>
                    <th className="text-end p-3 text-slate-400 font-medium">
                      {isAr ? 'الإجمالي' : 'Total'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {boqItems.map((item, idx) => {
                    const catCfg = boqCategoryConfig[item.category || ''] || {
                      color: 'text-slate-400',
                      bg: 'bg-slate-500/15',
                      labelAr: item.category || '—',
                      labelEn: item.category || '—',
                    };
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-700/30 hover:bg-slate-800/40"
                      >
                        <td className="p-3 text-slate-500 font-mono text-xs">
                          {item.code || item.itemNumber || idx + 1}
                        </td>
                        <td className="p-3 text-white text-xs">
                          {item.description}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={`${catCfg.bg} ${catCfg.color} text-[10px]`}
                          >
                            {isAr ? catCfg.labelAr : catCfg.labelEn}
                          </Badge>
                        </td>
                        <td className="p-3 text-center text-slate-300 text-xs">
                          {item.unit || '—'}
                        </td>
                        <td className="p-3 text-center text-white text-xs">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-end text-slate-300 text-xs">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-3 text-end text-white font-medium text-xs">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-600">
                    <td
                      colSpan={6}
                      className="p-3 text-end text-slate-400 font-semibold text-sm"
                    >
                      {isAr ? 'الإجمالي الكلي' : 'Grand Total'}
                    </td>
                    <td className="p-3 text-end text-emerald-400 font-bold">
                      {formatCurrency(totalBOQ)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget vs Actual Comparison */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-base text-white">
              {isAr ? 'الميزانية مقابل الفعلي' : 'Budget vs Actual'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <p className="text-xs text-slate-500">
                {isAr ? 'ميزانية BOQ' : 'BOQ Budget'}
              </p>
              <p className="text-lg font-bold text-violet-400 mt-1">
                {formatCurrency(totalBOQ)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <p className="text-xs text-slate-500">
                {isAr ? 'المصروف الفعلي' : 'Actual Spent'}
              </p>
              <p className="text-lg font-bold text-amber-400 mt-1">
                {formatCurrency(project.spent)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <p className="text-xs text-slate-500">
                {isAr ? 'الفرق' : 'Variance'}
              </p>
              <p
                className={`text-lg font-bold mt-1 ${
                  totalBOQ - project.spent >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {formatCurrency(totalBOQ - project.spent)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <p className="text-xs text-slate-500">
                {isAr ? 'نسبة الاستنفاذ' : 'Utilization'}
              </p>
              <p
                className={`text-lg font-bold mt-1 ${
                  totalBOQ > 0 &&
                  (project.spent / totalBOQ) * 100 > 90
                    ? 'text-red-400'
                    : totalBOQ > 0 &&
                      (project.spent / totalBOQ) * 100 > 70
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {totalBOQ > 0
                  ? Math.round(
                      (project.spent / totalBOQ) * 100
                    )
                  : 0}
                %
              </p>
              <Progress
                value={
                  totalBOQ > 0
                    ? Math.min(
                        100,
                        (project.spent / totalBOQ) * 100
                      )
                    : 0
                }
                className="h-1.5 bg-slate-700 mt-2"
              />
            </div>
          </div>

          {/* Category breakdown */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium">
              {isAr ? 'تفصيل حسب الفئة' : 'By Category'}
            </p>
            {Object.entries(boqByCategory).map(
              ([cat, items]) => {
                const catTotal = items.reduce(
                  (sum, i) => sum + (i.totalPrice || 0),
                  0
                );
                const catCfg =
                  boqCategoryConfig[cat] || boqCategoryConfig.civil;
                const pct =
                  totalBOQ > 0
                    ? Math.round((catTotal / totalBOQ) * 100)
                    : 0;
                return (
                  <div
                    key={cat}
                    className="flex items-center gap-3 bg-slate-800/30 rounded-lg px-3 py-2"
                  >
                    <Badge
                      variant="secondary"
                      className={`${catCfg.bg} ${catCfg.color} text-[10px] w-20 justify-center`}
                    >
                      {isAr ? catCfg.labelAr : catCfg.labelEn}
                    </Badge>
                    <div className="flex-1">
                      <Progress
                        value={pct}
                        className="h-2 bg-slate-700"
                      />
                    </div>
                    <span className="text-xs text-slate-300 font-medium w-12 text-end">
                      {pct}%
                    </span>
                    <span className="text-xs text-white font-medium w-24 text-end">
                      {formatCurrency(catTotal)}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* BOQ Cost Variance Analysis */}
      {boqVariance && boqVariance.items.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-rose-400" />
                <CardTitle className="text-base text-white">
                  {isAr ? 'تحليل تباين التكاليف' : 'Cost Variance Analysis'}
                </CardTitle>
              </div>
              {boqVariance.flaggedCount > 0 && (
                <Badge className="bg-red-500/15 text-red-400 text-xs gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {boqVariance.flaggedCount} {isAr ? 'بنود محذرة' : 'flagged'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Variance Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <p className="text-[10px] text-slate-500">{isAr ? 'إجمالي الميزانية' : 'Total Budget'}</p>
                <p className="text-sm font-bold text-violet-400 mt-1">{formatCurrency(boqVariance.totalBudget)}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <p className="text-[10px] text-slate-500">{isAr ? 'إجمالي الفعلي' : 'Total Actual'}</p>
                <p className="text-sm font-bold text-amber-400 mt-1">{formatCurrency(boqVariance.totalActual)}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <p className="text-[10px] text-slate-500">{isAr ? 'التباين الكلي' : 'Total Variance'}</p>
                <p className={`text-sm font-bold mt-1 ${boqVariance.totalVariance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(boqVariance.totalVariance)}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <p className="text-[10px] text-slate-500">{isAr ? 'نسبة التباين' : 'Variance %'}</p>
                <p className={`text-sm font-bold mt-1 ${Math.abs(boqVariance.totalVariancePercent) > 20 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {boqVariance.totalVariancePercent.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Variance Items Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-slate-700/50">
                    <th className="text-start p-2.5 text-slate-400 font-medium text-xs">
                      {isAr ? 'البنود' : 'Item'}
                    </th>
                    <th className="text-end p-2.5 text-slate-400 font-medium text-xs">
                      {isAr ? 'الميزانية' : 'Budget'}
                    </th>
                    <th className="text-end p-2.5 text-slate-400 font-medium text-xs">
                      {isAr ? 'الفعلي' : 'Actual'}
                    </th>
                    <th className="text-end p-2.5 text-slate-400 font-medium text-xs">
                      {isAr ? 'التباين' : 'Variance'}
                    </th>
                    <th className="text-end p-2.5 text-slate-400 font-medium text-xs">
                      %
                    </th>
                    <th className="text-center p-2.5 text-slate-400 font-medium text-xs">
                      {isAr ? 'الحالة' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {boqVariance.items.map((item) => {
                    const isFlagged = item.flagged;
                    const isOver = item.isOverBudget;
                    return (
                      <tr
                        key={item.boqItemId}
                        className={`border-b border-slate-700/30 ${
                          isFlagged ? 'bg-red-500/5 border-l-2 border-l-red-500/60' : ''
                        }`}
                      >
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            {isFlagged && (
                              <AlertTriangle className={`h-3 w-3 shrink-0 ${isOver ? 'text-red-400' : 'text-amber-400'}`} />
                            )}
                            <span className="text-white text-xs truncate max-w-[200px]" title={item.description}>
                              {item.description}
                            </span>
                          </div>
                        </td>
                        <td className="p-2.5 text-end text-slate-300 text-xs">
                          {formatCurrency(item.budget)}
                        </td>
                        <td className="p-2.5 text-end text-xs text-white">
                          {formatCurrency(item.actual)}
                        </td>
                        <td className={`p-2.5 text-end text-xs font-medium ${item.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(item.variance)}
                        </td>
                        <td className={`p-2.5 text-end text-xs font-medium ${isFlagged ? 'text-red-400' : 'text-emerald-400'}`}>
                          {item.variancePercent > 0 ? '+' : ''}{item.variancePercent}%
                        </td>
                        <td className="p-2.5 text-center">
                          {isFlagged ? (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-400 text-[10px]">
                              {isOver
                                ? (isAr ? 'تجاوز' : 'Over Budget')
                                : (isAr ? 'تحذير' : 'Warning')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px]">
                              {isAr ? 'مقبول' : 'OK'}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
