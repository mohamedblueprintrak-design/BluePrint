'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, FileSpreadsheet } from 'lucide-react';
import {
  type ProjectData,
  type InvoiceData,
  type BOQItemData,
  invoiceStatusConfig,
} from '../config';

interface FinancialTabProps {
  project: ProjectData;
  invoices: InvoiceData[];
  boqItems: BOQItemData[];
  totalPaid: number;
  _totalInvoiced?: number;
  totalBOQ: number;
  isAr: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  t: { noData: string; invoiceNumber: string; date: string; paid: string; status: string };
}

export default function FinancialTab({
  project,
  invoices,
  boqItems,
  totalPaid,
  _totalInvoiced,
  totalBOQ,
  isAr,
  formatCurrency,
  formatDate,
  t,
}: FinancialTabProps) {
  return (
    <div className="space-y-6">
      {/* Contract Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {isAr ? 'قيمة العقد' : 'Contract Value'}
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {formatCurrency(project.budget)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-emerald-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {isAr ? 'إجمالي المدفوع' : 'Total Paid'}
            </p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-red-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {isAr ? 'المبلغ المتبقي' : 'Outstanding'}
            </p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {formatCurrency(
                Math.max(0, project.budget - totalPaid)
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-blue-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {isAr ? 'نسبة التحصيل' : 'Collection Rate'}
            </p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {project.budget > 0
                ? Math.round((totalPaid / project.budget) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview for Engineer */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-slate-900/50 border-blue-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-base text-foreground">
              {isAr
                ? 'نظرة مالية للمهندس'
                : 'Financial Overview for Engineer'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-3 border border-border/30">
              <p className="text-xs text-muted-foreground">
                {isAr ? 'قيمة العقد' : 'Contract Value'}
              </p>
              <p className="text-lg font-bold text-foreground mt-1">
                {formatCurrency(project.budget)}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? 'المدفوعات المستلمة'
                  : 'Payments Received'}
              </p>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                {formatCurrency(
                  project.paymentReceived ?? totalPaid
                )}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3 border border-amber-500/20">
              <p className="text-xs text-muted-foreground">
                {isAr ? 'الرصيد المتبقي' : 'Remaining Balance'}
              </p>
              <p className="text-lg font-bold text-amber-400 mt-1">
                {formatCurrency(
                  project.remainingBalance ??
                    Math.max(
                      0,
                      project.budget -
                        (project.paymentReceived ?? totalPaid)
                    )
                )}
              </p>
            </div>
            {boqItems.length > 0 && (
              <div className="bg-muted rounded-lg p-3 border border-violet-500/20">
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'بنود قائمة الكميات' : 'BOQ Items'}
                </p>
                <p className="text-lg font-bold text-violet-400 mt-1">
                  {boqItems.length}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isAr ? 'إجمالي: ' : 'Total: '}
                  {formatCurrency(totalBOQ)}
                </p>
              </div>
            )}
          </div>
          {boqItems.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground font-medium mb-2">
                {isAr
                  ? 'ملخص بنود قائمة الكميات (BOQ)'
                  : 'BOQ Items Summary'}
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {boqItems.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-muted rounded px-3 py-1.5 text-xs"
                  >
                    <span className="text-foreground/80 truncate me-3">
                      {item.code || item.itemNumber || '—'} -{' '}
                      {item.description}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
                {boqItems.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    {isAr
                      ? `+ ${boqItems.length - 10} بنود أخرى`
                      : `+ ${boqItems.length - 10} more items`}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-base text-foreground">
              {isAr ? 'الفواتير والمدفوعات' : 'Invoices & Payments'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {t.noData}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-start p-3 text-muted-foreground font-medium">
                      {t.invoiceNumber}
                    </th>
                    <th className="text-start p-3 text-muted-foreground font-medium">
                      {t.date}
                    </th>
                    <th className="text-start p-3 text-muted-foreground font-medium">
                      {isAr ? 'الإجمالي' : 'Total'}
                    </th>
                    <th className="text-start p-3 text-muted-foreground font-medium">
                      {t.paid}
                    </th>
                    <th className="text-start p-3 text-muted-foreground font-medium">
                      {t.status}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const isc =
                      invoiceStatusConfig[inv.status] ||
                      invoiceStatusConfig.DRAFT;
                    return (
                      <tr
                        key={inv.id}
                        className="border-b border-border/30 hover:bg-accent/40"
                      >
                        <td className="p-3 text-foreground font-mono text-xs">
                          {inv.number}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {formatDate(inv.issueDate)}
                        </td>
                        <td className="p-3 text-foreground font-medium">
                          {formatCurrency(inv.total)}
                        </td>
                        <td className="p-3 text-emerald-400">
                          {formatCurrency(inv.paidAmount)}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={`${isc.bg} ${isc.color} text-xs`}
                          >
                            {isAr ? isc.labelAr : isc.labelEn}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
