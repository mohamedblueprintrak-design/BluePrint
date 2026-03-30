/**
 * Site Report PDF Export API
 * GET /api/site-reports/[id]/pdf
 *
 * Generates a PDF for a specific site report and returns it as a downloadable file.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/api/utils/demo-config';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
  notFoundResponse,
} from '@/app/api/utils/response';
import { db } from '@/lib/db';

// Colors
const COLORS = {
  primary: [37, 99, 235] as [number, number, number],
  secondary: [71, 85, 105] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  info: [59, 130, 246] as [number, number, number],
};

// Format date
function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Get status color
function getStatusColor(status: string): [number, number, number] {
  switch (status.toUpperCase()) {
    case 'APPROVED':
    case 'SUBMITTED':
      return COLORS.success;
    case 'DRAFT':
      return COLORS.warning;
    default:
      return COLORS.secondary;
  }
}

// Lazy-load cache for jspdf modules (server-side)
let pdfModules: { jsPDF: any; autoTable: any } | null = null;

async function loadPdfModules() {
  if (pdfModules) return pdfModules;

  // Dynamic imports for server-side PDF generation
  const jspdfModule = await import('jspdf');
  const autotableModule = await import('jspdf-autotable');

  pdfModules = {
    jsPDF: jspdfModule.default || jspdfModule.jsPDF,
    autoTable: autotableModule.default || autotableModule,
  };

  return pdfModules;
}

// Helper: check page break and add new page with footer
function checkPageBreak(
  doc: any,
  yPos: number,
  pageHeight: number,
  needed: number,
  margin: number,
  pageWidth: number,
  orgName: string,
  isRTL: boolean
): number {
  if (yPos + needed > pageHeight - 30) {
    doc.addPage();
    // Add footer on new page
    const currentPage = doc.internal.getNumberOfPages();
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const label = isRTL ? 'صفحة' : 'Page';
    doc.text(
      `${orgName} | ${label} ${currentPage}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
    return margin + 10;
  }
  return yPos;
}

// Helper: draw a section with label and value
function drawSection(
  doc: any,
  label: string,
  value: string | null | undefined,
  yPos: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  orgName: string,
  isRTL: boolean,
  labelColor?: [number, number, number],
  valueColor?: [number, number, number]
): number {
  if (value === null || value === undefined || value.trim() === '') return yPos;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(labelColor || COLORS.secondary));
  doc.text(label + ':', margin, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...(valueColor || COLORS.text));

  const lines = doc.splitTextToSize(value, pageWidth - 2 * margin);
  const displayLines = lines.slice(0, 8);
  doc.text(displayLines, margin, yPos);
  yPos += displayLines.length * 4 + 3;

  return yPos;
}

async function buildPdfBlob(report: any, lang: string): Promise<Blob> {
  const { jsPDF, autoTable } = await loadPdfModules();

  const isRTL = lang === 'ar';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Organization info
  const orgName =
    report.project?.organization?.name || 'BluePrint Engineering';
  const orgAddress = report.project?.organization?.address;
  const orgPhone = report.project?.organization?.phone;
  const orgEmail = report.project?.organization?.email;

  // Translations
  const translations = {
    siteDiaryReport: isRTL ? 'تقرير يومية الموقع' : 'Site Diary Report',
    reportNumber: isRTL ? 'رقم التقرير' : 'Report Number',
    projectName: isRTL ? 'المشروع' : 'Project',
    reportDate: isRTL ? 'تاريخ التقرير' : 'Report Date',
    status: isRTL ? 'الحالة' : 'Status',
    weatherConditions: isRTL ? 'حالة الطقس' : 'Weather Conditions',
    temperature: isRTL ? 'درجة الحرارة' : 'Temperature',
    workersCount: isRTL ? 'عدد العمال' : 'Workers Count',
    workDescription: isRTL ? 'وصف العمل' : 'Work Description',
    workArea: isRTL ? 'منطقة العمل' : 'Work Area',
    workProgress: isRTL ? 'نسبة الإنجاز' : 'Work Progress',
    issuesFound: isRTL ? 'المشاكل المكتشفة' : 'Issues Found',
    safetyIssues: isRTL ? 'مشاكل السلامة' : 'Safety Issues',
    equipmentUsed: isRTL ? 'المعدات المستخدمة' : 'Equipment Used',
    materialsReceived: isRTL ? 'المواد المستلمة' : 'Materials Received',
    nextSteps: isRTL ? 'الخطوات التالية' : 'Next Steps',
    nextDayPlan: isRTL ? 'خطة اليوم التالي' : 'Next Day Plan',
    summary: isRTL ? 'ملخص' : 'Summary',
    preparedBy: isRTL ? 'أعد بواسطة' : 'Prepared By',
    page: isRTL ? 'صفحة' : 'Page',
    noIssues: isRTL ? 'لا توجد مشاكل' : 'No issues found',
    noSafetyIssues: isRTL ? 'لا توجد مشاكل سلامة' : 'No safety issues',
  };

  const statusTranslation: Record<string, string> = {
    draft: isRTL ? 'مسودة' : 'Draft',
    submitted: isRTL ? 'مقدم' : 'Submitted',
    approved: isRTL ? 'معتمد' : 'Approved',
    DRAFT: isRTL ? 'مسودة' : 'Draft',
    SUBMITTED: isRTL ? 'مقدم' : 'Submitted',
    APPROVED: isRTL ? 'معتمد' : 'Approved',
  };

  // ===== HEADER =====
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(orgName, isRTL ? pageWidth - margin : margin, 18, {
    align: isRTL ? 'right' : 'left',
  });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(translations.siteDiaryReport, isRTL ? pageWidth - margin : margin, 28, {
    align: isRTL ? 'right' : 'left',
  });

  // Organization details (right side in LTR)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let orgDetailsY = 18;
  const orgDetailsX = isRTL ? margin : pageWidth - margin;
  if (orgAddress) {
    doc.text(orgAddress, orgDetailsX, orgDetailsY, {
      align: isRTL ? 'left' : 'right',
    });
    orgDetailsY += 4;
  }
  if (orgPhone || orgEmail) {
    const contactInfo = [orgPhone, orgEmail].filter(Boolean).join(' | ');
    doc.text(contactInfo, orgDetailsX, orgDetailsY, {
      align: isRTL ? 'left' : 'right',
    });
  }

  yPos = 50;

  // ===== REPORT INFO BOX =====
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(margin, yPos - 5, pageWidth - 2 * margin, 30, 3, 3, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(
    `${translations.reportNumber}: ${report.reportNumber || '-'}`,
    margin + 5,
    yPos + 3
  );

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${translations.reportDate}: ${formatDate(report.reportDate)}`,
    margin + 5,
    yPos + 10
  );
  doc.text(
    `${translations.projectName}: ${report.project?.name || '-'}`,
    margin + 5,
    yPos + 17
  );

  if (report.status) {
    const statusColor = getStatusColor(report.status);
    const statusText =
      statusTranslation[report.status] || report.status.toUpperCase();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...statusColor);
    doc.text(
      `${translations.status}: ${statusText}`,
      pageWidth - margin - 5,
      yPos + 3,
      { align: 'right' }
    );
  }

  yPos += 35;

  // ===== QUICK INFO TABLE =====
  const quickInfoData = [
    [
      translations.weatherConditions,
      report.weather || '-',
      translations.temperature,
      report.temperature != null ? `${report.temperature}°C` : '-',
    ],
    [
      translations.workersCount,
      report.workersCount != null ? report.workersCount.toString() : '-',
      translations.workProgress,
      report.workProgress != null ? `${report.workProgress}%` : '-',
    ],
    [
      translations.workArea,
      report.workArea || '-',
      translations.preparedBy,
      report.preparedBy?.fullName || report.preparedById || '-',
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: quickInfoData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold', textColor: COLORS.secondary, halign: 'right' },
      1: { cellWidth: 55, textColor: COLORS.text, halign: 'left' },
      2: { cellWidth: 35, fontStyle: 'bold', textColor: COLORS.secondary, halign: 'right' },
      3: { cellWidth: 55, textColor: COLORS.text, halign: 'left' },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data: any) => {
      if (data.row.index % 2 === 0) {
        data.cell.styles.fillColor = COLORS.lightGray;
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ===== WORK DESCRIPTION =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 30, margin, pageWidth, orgName, isRTL);
  yPos = drawSection(
    doc, translations.workDescription, report.workDescription,
    yPos, margin, pageWidth, pageHeight, orgName, isRTL
  );

  // ===== SUMMARY =====
  if (report.summary) {
    yPos = checkPageBreak(doc, yPos, pageHeight, 25, margin, pageWidth, orgName, isRTL);
    yPos = drawSection(
      doc, translations.summary, report.summary,
      yPos, margin, pageWidth, pageHeight, orgName, isRTL
    );
  }

  // ===== ISSUES FOUND =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 25, margin, pageWidth, orgName, isRTL);

  const hasIssues = report.issues && report.issues.trim() !== '';
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.warning);
  doc.text(translations.issuesFound + ':', margin, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (hasIssues) {
    doc.setTextColor(...COLORS.text);
    const issueLines = doc.splitTextToSize(report.issues, pageWidth - 2 * margin);
    doc.text(issueLines.slice(0, 6), margin, yPos);
    yPos += issueLines.slice(0, 6).length * 4 + 3;
  } else {
    doc.setTextColor(...COLORS.success);
    doc.text(`${translations.noIssues}`, margin, yPos);
    yPos += 6;
  }

  // ===== SAFETY ISSUES =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 25, margin, pageWidth, orgName, isRTL);

  const hasSafetyIssues = report.safetyIssues && report.safetyIssues.trim() !== '';
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.danger);
  doc.text(translations.safetyIssues + ':', margin, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (hasSafetyIssues) {
    doc.setTextColor(...COLORS.text);
    const safetyLines = doc.splitTextToSize(report.safetyIssues, pageWidth - 2 * margin);
    doc.text(safetyLines.slice(0, 6), margin, yPos);
    yPos += safetyLines.slice(0, 6).length * 4 + 3;
  } else {
    doc.setTextColor(...COLORS.success);
    doc.text(`${translations.noSafetyIssues}`, margin, yPos);
    yPos += 6;
  }

  // ===== EQUIPMENT USED =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 25, margin, pageWidth, orgName, isRTL);
  yPos = drawSection(
    doc, translations.equipmentUsed, report.equipmentUsed,
    yPos, margin, pageWidth, pageHeight, orgName, isRTL,
    COLORS.info, COLORS.text
  );

  // ===== MATERIALS RECEIVED =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 25, margin, pageWidth, orgName, isRTL);
  yPos = drawSection(
    doc, translations.materialsReceived, report.materialsReceived,
    yPos, margin, pageWidth, pageHeight, orgName, isRTL,
    COLORS.info, COLORS.text
  );

  // ===== NEXT STEPS / NEXT DAY PLAN =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 30, margin, pageWidth, orgName, isRTL);
  const nextPlanValue = report.nextDayPlan || report.nextSteps || null;
  if (nextPlanValue) {
    const nextPlanLabel = report.nextDayPlan
      ? translations.nextDayPlan
      : translations.nextSteps;
    yPos = drawSection(
      doc, nextPlanLabel, nextPlanValue,
      yPos, margin, pageWidth, pageHeight, orgName, isRTL,
      COLORS.success, COLORS.text
    );
  }

  // ===== FOOTER =====
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${orgName} - ${translations.siteDiaryReport} | ${translations.page} 1`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  // Add footers for additional pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, h - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${orgName} - ${translations.siteDiaryReport} | ${translations.page} ${i} / ${totalPages}`,
      pageWidth / 2,
      h - 6,
      { align: 'center' }
    );
  }

  // Return as blob
  return doc.output('blob');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return unauthorizedResponse();

  try {
    if (!id) {
      return notFoundResponse('Site Report ID is required');
    }

    // Fetch site report with project and organization info
    let report: any;
    try {
      report = await db.siteReport.findFirst({
        where: {
          id,
          project: { organizationId: user.organizationId },
        },
        include: {
          project: true,
        },
      });
    } catch {
      return serverErrorResponse('Database not available');
    }

    if (!report) {
      return notFoundResponse('Site report not found');
    }

    // Determine language from user preferences
    const lang = (user.language || 'ar') as string;

    // Generate PDF
    const pdfBlob = await buildPdfBlob(report, lang);

    // Create filename
    const fileName = report.reportNumber
      ? `Site-Diary-${report.reportNumber}.pdf`
      : `Site-Diary-${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF as downloadable response
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': pdfBlob.size.toString(),
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Site Report PDF] Generation error:', errMsg);
    return serverErrorResponse(`Failed to generate PDF: ${errMsg}`);
  }
}
