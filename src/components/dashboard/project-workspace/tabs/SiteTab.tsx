'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, AlertTriangle, Users } from 'lucide-react';
import {
  type SiteReportData,
  type DefectData,
  defectSeverityConfig,
  defectStatusConfig,
} from '../config';

interface SiteTabProps {
  siteReports: SiteReportData[];
  defects: DefectData[];
  isAr: boolean;
  formatDate: (date: string) => string;
  t: { noData: string; status: string; date: string };
}

export default function SiteTab({
  siteReports,
  defects,
  isAr,
  formatDate,
  t,
}: SiteTabProps) {
  return (
    <div className="space-y-6">
      {/* Site Reports */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-base text-foreground">
              {isAr ? 'يوميات الموقع' : 'Site Daily Logs'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {siteReports.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {t.noData}
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {siteReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-muted rounded-lg p-4 border border-border/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(report.date)}
                    </span>
                    {report.weatherConditions && (
                      <Badge
                        variant="secondary"
                        className="bg-sky-500/10 text-sky-400 text-[10px]"
                      >
                        {report.weatherConditions}
                      </Badge>
                    )}
                  </div>
                  {report.workCompleted && (
                    <p className="text-xs text-muted-foreground mb-1">
                      <span className="text-muted-foreground">
                        {isAr ? 'المنجز: ' : 'Completed: '}
                      </span>
                      {report.workCompleted}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3 inline me-1" />
                      {report.workforceCount}{' '}
                      {isAr ? 'عامل' : 'workers'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Defects */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <CardTitle className="text-base text-foreground">
              {isAr ? 'العيوب' : 'Defects'}
            </CardTitle>
            {defects.filter((d) => d.status === 'OPEN').length >
              0 && (
              <Badge
                variant="secondary"
                className="bg-red-500/15 text-red-400 text-xs ms-auto"
              >
                {defects.filter((d) => d.status === 'OPEN').length}{' '}
                {isAr ? 'مفتوح' : 'open'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {defects.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {t.noData}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-start p-3 text-muted-foreground font-medium">
                      {isAr ? 'العنوان' : 'Title'}
                    </th>
                    <th className="text-start p-3 text-muted-foreground font-medium">
                      {isAr ? 'الخطورة' : 'Severity'}
                    </th>
                    <th className="text-start p-3 text-muted-foreground font-medium">
                      {t.status}
                    </th>
                    <th className="text-start p-3 text-muted-foreground font-medium">
                      {t.date}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {defects.map((defect) => {
                    const sev =
                      defectSeverityConfig[defect.severity] ||
                      defectSeverityConfig.MEDIUM;
                    const dst =
                      defectStatusConfig[defect.status] ||
                      defectStatusConfig.OPEN;
                    return (
                      <tr
                        key={defect.id}
                        className="border-b border-border/30 hover:bg-accent/40"
                      >
                        <td className="p-3">
                          <p className="text-foreground text-sm">
                            {defect.title}
                          </p>
                          {defect.location && (
                            <p className="text-muted-foreground text-xs mt-0.5">
                              {defect.location}
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={`${sev.bg} ${sev.color} text-xs`}
                          >
                            {isAr ? sev.labelAr : sev.labelEn}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={`${dst.bg} ${dst.color} text-xs`}
                          >
                            {isAr ? dst.labelAr : dst.labelEn}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {formatDate(defect.createdAt)}
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
