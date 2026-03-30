// Client-side PDF generation for site reports (site diary)
// Uses dynamic imports to handle jspdf
// IMPORTANT: This file should only be used in client components

// Check if running in browser
const isBrowser = typeof window !== 'undefined';

// Types
interface SiteReportData {
  id: string;
  projectId: string;
  projectName?: string;
  reportNumber?: string;
  reportDate?: string | Date;
  weather?: string | null;
  temperature?: number | null;
  workersCount?: number | null;
  workDescription?: string | null;
  workArea?: string | null;
  workProgress?: number | null;
  issues?: string | null;
  safetyIssues?: string | null;
  equipmentUsed?: string | null;
  materialsReceived?: string | null;
  nextSteps?: string | null;
  nextDayPlan?: string | null;
  summary?: string | null;
  status?: string;
  preparedBy?: string;
}

interface OrganizationInfo {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// Colors
const COLORS = {
  primary: [37, 99, 235] as [number, number, number], // blue-600
  secondary: [71, 85, 105] as [number, number, number], // slate-600
  text: [30, 41, 59] as [number, number, number], // slate-800
  lightGray: [241, 245, 249] as [number, number, number], // slate-100
  success: [34, 197, 94] as [number, number, number], // green-500
  warning: [234, 179, 8] as [number, number, number], // yellow-500
  danger: [239, 68, 68] as [number, number, number], // red-500
  info: [59, 130, 246] as [number, number, number], // blue-500
  orange: [249, 115, 22] as [number, number, number], // orange-500
};

// Format date
const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Get status color
const getStatusColor = (status: string): [number, number, number] => {
  switch (status.toUpperCase()) {
    case 'APPROVED':
    case 'SUBMITTED':
      return COLORS.success;
    case 'DRAFT':
      return COLORS.warning;
    default:
      return COLORS.secondary;
  }
};

// Dynamic import type
type JsPDFType = any;

// Cache for loaded modules
let jspdfCache: {
  jsPDF: any;
  autoTable: any;
} | null = null;

// Lazy load jspdf modules only when needed in browser
async function loadJsPDF() {
  if (!isBrowser) {
    throw new Error('PDF generation is only available in browser environment');
  }

  if (jspdfCache) {
    return jspdfCache;
  }

  // Use Function constructor to prevent static analysis by bundlers
  // This is necessary because jspdf has dependencies that don't work with bundlers
  const dynamicImport = new Function('modulePath', 'return import(modulePath)');

  const jspdfModule = await dynamicImport('jspdf');
  const autotableModule = await dynamicImport('jspdf-autotable');

  jspdfCache = {
    jsPDF: jspdfModule.default,
    autoTable: autotableModule.default,
  };

  return jspdfCache;
}

// Helper: check if we need a new page
function checkPageBreak(doc: any, yPos: number, pageHeight: number, needed: number, margin: number): number {
  if (yPos + needed > pageHeight - 30) {
    doc.addPage();
    // Add page footer on new page
    const currentPage = doc.internal.getNumberOfPages();
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, pageHeight - 15, doc.internal.pageSize.getWidth(), 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `BluePrint - Site Diary Report | Page ${currentPage}`,
      doc.internal.pageSize.getWidth() / 2,
      pageHeight - 6,
      { align: 'center' }
    );
    return margin + 10;
  }
  return yPos;
}

// Helper: draw a section with label and value (multiline support)
function drawSection(
  doc: any,
  label: string,
  value: string | null | undefined,
  yPos: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  maxWidth?: number,
  labelColor?: [number, number, number],
  valueColor?: [number, number, number]
): number {
  if (value === null || value === undefined || value.trim() === '') return yPos;

  const contentWidth = maxWidth || (pageWidth - 2 * margin);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(labelColor || COLORS.secondary));
  doc.text(label + ':', margin, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...(valueColor || COLORS.text));

  const lines = doc.splitTextToSize(value, contentWidth);
  const maxLines = 8; // limit lines per section
  const displayLines = lines.slice(0, maxLines);
  doc.text(displayLines, margin, yPos);
  yPos += displayLines.length * 4 + 3;

  return yPos;
}

export async function generateSiteReportPDF(
  report: SiteReportData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'en'
): Promise<JsPDFType> {
  // Ensure we're in browser
  if (!isBrowser) {
    throw new Error('PDF generation is only available in browser environment');
  }

  // Dynamic import for client-side
  const { jsPDF, autoTable } = await loadJsPDF();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Set RTL direction for Arabic
  const isRTL = lang === 'ar';

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

  // Status translation
  const statusTranslation: Record<string, string> = {
    draft: isRTL ? 'مسودة' : 'Draft',
    submitted: isRTL ? 'مقدم' : 'Submitted',
    approved: isRTL ? 'معتمد' : 'Approved',
    DRAFT: isRTL ? 'مسودة' : 'Draft',
    SUBMITTED: isRTL ? 'مقدم' : 'Submitted',
    APPROVED: isRTL ? 'معتمد' : 'Approved',
  };

  // ===== HEADER =====
  // Background header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Organization name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const orgName = organization?.name || 'BluePrint Engineering';
  doc.text(orgName, isRTL ? pageWidth - margin : margin, 18, {
    align: isRTL ? 'right' : 'left',
  });

  // Report subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(
    translations.siteDiaryReport,
    isRTL ? pageWidth - margin : margin,
    28,
    {
      align: isRTL ? 'right' : 'left',
    }
  );

  // Organization details (right side in LTR, left side in RTL)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let orgDetailsY = 18;
  const orgDetailsX = isRTL ? margin : pageWidth - margin;
  if (organization?.address) {
    doc.text(organization.address, orgDetailsX, orgDetailsY, {
      align: isRTL ? 'left' : 'right',
    });
    orgDetailsY += 4;
  }
  if (organization?.phone || organization?.email) {
    const contactInfo = [organization.phone, organization.email]
      .filter(Boolean)
      .join(' | ');
    doc.text(contactInfo, orgDetailsX, orgDetailsY, {
      align: isRTL ? 'left' : 'right',
    });
  }

  yPos = 50;

  // ===== REPORT INFO BOX =====
  // Info box background
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(margin, yPos - 5, pageWidth - 2 * margin, 30, 3, 3, 'F');

  // Report number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  const reportNumText = report.reportNumber || '-';
  doc.text(
    `${translations.reportNumber}: ${reportNumText}`,
    margin + 5,
    yPos + 3
  );

  // Report date
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${translations.reportDate}: ${formatDate(report.reportDate)}`,
    margin + 5,
    yPos + 10
  );

  // Project name
  doc.text(
    `${translations.projectName}: ${report.projectName || '-'}`,
    margin + 5,
    yPos + 17
  );

  // Status badge (right side)
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
  // Weather, Temperature, Workers Count
  const quickInfoData = [
    [
      translations.weatherConditions,
      report.weather || '-',
      translations.temperature,
      report.temperature !== null && report.temperature !== undefined
        ? `${report.temperature}°C`
        : '-',
    ],
    [
      translations.workersCount,
      report.workersCount !== null && report.workersCount !== undefined
        ? report.workersCount.toString()
        : '-',
      translations.workProgress,
      report.workProgress !== null && report.workProgress !== undefined
        ? `${report.workProgress}%`
        : '-',
    ],
    [
      translations.workArea,
      report.workArea || '-',
      translations.preparedBy,
      report.preparedBy || '-',
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: quickInfoData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: {
        cellWidth: 35,
        fontStyle: 'bold',
        textColor: COLORS.secondary,
        halign: 'right',
      },
      1: {
        cellWidth: 55,
        textColor: COLORS.text,
        halign: 'left',
      },
      2: {
        cellWidth: 35,
        fontStyle: 'bold',
        textColor: COLORS.secondary,
        halign: 'right',
      },
      3: {
        cellWidth: 55,
        textColor: COLORS.text,
        halign: 'left',
      },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data: any) => {
      // Alternate row background
      if (data.row.index % 2 === 0) {
        data.cell.styles.fillColor = COLORS.lightGray;
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ===== WORK DESCRIPTION =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 30, margin);
  yPos = drawSection(
    doc,
    translations.workDescription,
    report.workDescription,
    yPos,
    margin,
    pageWidth,
    pageHeight
  );

  // ===== SUMMARY =====
  if (report.summary) {
    yPos = checkPageBreak(doc, yPos, pageHeight, 25, margin);
    yPos = drawSection(
      doc,
      translations.summary,
      report.summary,
      yPos,
      margin,
      pageWidth,
      pageHeight
    );
  }

  // ===== ISSUES FOUND =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 25, margin);

  // Draw section with colored indicator
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
    const issueLines = doc.splitTextToSize(
      report.issues!,
      pageWidth - 2 * margin
    );
    const displayIssueLines = issueLines.slice(0, 6);
    doc.text(displayIssueLines, margin, yPos);
    yPos += displayIssueLines.length * 4 + 3;
  } else {
    doc.setTextColor(...COLORS.success);
    doc.text(
      `✓ ${translations.noIssues}`,
      margin,
      yPos
    );
    yPos += 6;
  }

  // ===== SAFETY ISSUES =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 25, margin);

  const hasSafetyIssues =
    report.safetyIssues && report.safetyIssues.trim() !== '';
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.danger);
  doc.text(translations.safetyIssues + ':', margin, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (hasSafetyIssues) {
    doc.setTextColor(...COLORS.text);
    const safetyLines = doc.splitTextToSize(
      report.safetyIssues!,
      pageWidth - 2 * margin
    );
    const displaySafetyLines = safetyLines.slice(0, 6);
    doc.text(displaySafetyLines, margin, yPos);
    yPos += displaySafetyLines.length * 4 + 3;
  } else {
    doc.setTextColor(...COLORS.success);
    doc.text(
      `✓ ${translations.noSafetyIssues}`,
      margin,
      yPos
    );
    yPos += 6;
  }

  // ===== EQUIPMENT USED =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 25, margin);
  yPos = drawSection(
    doc,
    translations.equipmentUsed,
    report.equipmentUsed,
    yPos,
    margin,
    pageWidth,
    pageHeight,
    undefined,
    COLORS.info,
    COLORS.text
  );

  // ===== MATERIALS RECEIVED =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 25, margin);
  yPos = drawSection(
    doc,
    translations.materialsReceived,
    report.materialsReceived,
    yPos,
    margin,
    pageWidth,
    pageHeight,
    undefined,
    COLORS.info,
    COLORS.text
  );

  // ===== NEXT STEPS / NEXT DAY PLAN =====
  yPos = checkPageBreak(doc, yPos, pageHeight, 30, margin);
  const nextPlanValue =
    report.nextDayPlan || report.nextSteps || null;
  if (nextPlanValue) {
    const nextPlanLabel = report.nextDayPlan
      ? translations.nextDayPlan
      : translations.nextSteps;
    yPos = drawSection(
      doc,
      nextPlanLabel,
      nextPlanValue,
      yPos,
      margin,
      pageWidth,
      pageHeight,
      undefined,
      COLORS.success,
      COLORS.text
    );
  }

  // ===== FOOTER =====
  // Footer background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

  // Page number and branding
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const footerText = `${orgName} - ${translations.siteDiaryReport} | ${translations.page} 1`;
  doc.text(footerText, pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Add page footers for all pages
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

  return doc;
}

// Generate and return PDF blob for a site report
export async function generateSiteReportPDFBlob(
  report: SiteReportData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'en'
): Promise<Blob> {
  const doc = await generateSiteReportPDF(report, organization, lang);
  return doc.output('blob');
}

// Generate and download site report PDF
export async function downloadSiteReportPDF(
  report: SiteReportData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'en'
): Promise<void> {
  const doc = await generateSiteReportPDF(report, organization, lang);
  const fileName = report.reportNumber
    ? `Site-Diary-${report.reportNumber}.pdf`
    : `Site-Diary-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// Generate and open site report PDF in new tab
export async function previewSiteReportPDF(
  report: SiteReportData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'en'
): Promise<void> {
  const doc = await generateSiteReportPDF(report, organization, lang);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}
