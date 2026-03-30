'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
interface ProposalItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  total: number;
}

interface ProposalData {
  proposalNumber: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  projectName?: string;
  issueDate?: string | Date;
  validUntil?: string | Date;
  items: ProposalItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  introduction?: string;
  scope?: string[];
  exclusions?: string[];
  terms: string[];
  validityDays?: number;
}

interface OrganizationInfo {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
}

// Colors
const COLORS = {
  primary: [37, 99, 235] as [number, number, number],
  secondary: [71, 85, 105] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],
  accent: [99, 102, 241] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
};

// Format currency
const formatCurrency = (amount: number, currency: string = 'AED'): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
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

export function generateProposalPDF(
  proposal: ProposalData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'ar'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  const isRTL = lang === 'ar';

  // Translations
  const t = {
    proposal: isRTL ? 'عرض سعر' : 'PROPOSAL',
    quotation: isRTL ? 'عرض أسعار' : 'QUOTATION',
    proposalNumber: isRTL ? 'رقم العرض' : 'Proposal No.',
    date: isRTL ? 'التاريخ' : 'Date',
    validUntil: isRTL ? 'صالح حتى' : 'Valid Until',
    to: isRTL ? 'إلى' : 'To',
    project: isRTL ? 'المشروع' : 'Project',
    introduction: isRTL ? 'مقدمة' : 'Introduction',
    scopeOfWork: isRTL ? 'نطاق العمل' : 'Scope of Work',
    exclusions: isRTL ? 'الاستثناءات' : 'Exclusions',
    description: isRTL ? 'الوصف' : 'Description',
    quantity: isRTL ? 'الكمية' : 'Qty',
    unit: isRTL ? 'الوحدة' : 'Unit',
    unitPrice: isRTL ? 'سعر الوحدة' : 'Unit Price',
    total: isRTL ? 'الإجمالي' : 'Total',
    subtotal: isRTL ? 'المجموع الفرعي' : 'Subtotal',
    tax: isRTL ? 'الضريبة' : 'Tax',
    discount: isRTL ? 'الخصم' : 'Discount',
    grandTotal: isRTL ? 'الإجمالي الكلي' : 'Grand Total',
    terms: isRTL ? 'الشروط والأحكام' : 'Terms & Conditions',
    thankYou: isRTL ? 'شكراً لاهتمامكم بعرضنا' : 'Thank you for considering our proposal',
    contactUs: isRTL ? 'للاستفسارات يرجى التواصل معنا' : 'For inquiries, please contact us',
    page: isRTL ? 'صفحة' : 'Page',
    of: isRTL ? 'من' : 'of',
    days: isRTL ? 'يوم' : 'days',
    validity: isRTL ? 'صلاحية العرض' : 'Proposal Validity',
  };

  // ===== HEADER =====
  // Gradient-like header with accent color
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Organization name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const orgName = organization?.name || 'BluePrint Engineering';
  doc.text(orgName, isRTL ? pageWidth - margin : margin, 18, {
    align: isRTL ? 'right' : 'left'
  });

  // Organization details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const orgContact = [organization?.phone, organization?.email].filter(Boolean).join(' | ');
  if (orgContact) {
    doc.text(orgContact, isRTL ? pageWidth - margin : margin, 28, {
      align: isRTL ? 'right' : 'left'
    });
  }

  yPos = 50;

  // ===== PROPOSAL TITLE =====
  doc.setTextColor(...COLORS.accent);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(t.proposal, pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;

  // Proposal title
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.text(proposal.title, pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;

  // Proposal number badge
  doc.setFillColor(...COLORS.lightGray);
  const badgeWidth = 50;
  doc.roundedRect((pageWidth - badgeWidth) / 2, yPos - 4, badgeWidth, 8, 2, 2, 'F');
  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(10);
  doc.text(`#${proposal.proposalNumber}`, pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;

  // ===== CLIENT & DATE INFO =====
  // Two column layout
  const leftCol = margin;
  const rightCol = pageWidth / 2 + 10;

  // Left: Client info
  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.to + ':', leftCol, yPos);

  yPos += 5;
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(11);
  doc.text(proposal.clientName, leftCol, yPos);

  if (proposal.clientEmail) {
    yPos += 4;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.secondary);
    doc.text(proposal.clientEmail, leftCol, yPos);
  }

  if (proposal.clientPhone) {
    yPos += 4;
    doc.text(proposal.clientPhone, leftCol, yPos);
  }

  // Right: Date info
  let rightY = yPos - 9;
  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.date + ':', rightCol, rightY);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(proposal.issueDate), rightCol + 25, rightY);

  rightY += 5;
  doc.setTextColor(...COLORS.secondary);
  doc.setFont('helvetica', 'bold');
  doc.text(t.validUntil + ':', rightCol, rightY);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(proposal.validUntil), rightCol + 25, rightY);

  if (proposal.projectName) {
    rightY += 5;
    doc.setTextColor(...COLORS.secondary);
    doc.setFont('helvetica', 'bold');
    doc.text(t.project + ':', rightCol, rightY);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.text(proposal.projectName.substring(0, 25), rightCol + 25, rightY);
  }

  yPos = Math.max(yPos, rightY) + 15;

  // ===== INTRODUCTION =====
  if (proposal.introduction) {
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(t.introduction, margin, yPos);

    yPos += 5;
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const introLines = doc.splitTextToSize(proposal.introduction, pageWidth - 2 * margin);
    doc.text(introLines.slice(0, 4), margin, yPos);
    yPos += introLines.slice(0, 4).length * 4 + 8;
  }

  // ===== ITEMS TABLE =====
  const tableColumns = [
    { header: '#', dataKey: 'index' },
    { header: t.description, dataKey: 'description' },
    { header: t.unit, dataKey: 'unit' },
    { header: t.quantity, dataKey: 'quantity' },
    { header: t.unitPrice, dataKey: 'unitPrice' },
    { header: t.total, dataKey: 'total' },
  ];

  const tableRows = proposal.items.map((item, index) => ({
    index: (index + 1).toString(),
    description: item.description,
    unit: item.unit || '-',
    quantity: item.quantity.toLocaleString(),
    unitPrice: formatCurrency(item.unitPrice),
    total: formatCurrency(item.total),
  }));

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns.map(col => col.header)],
    body: tableRows.map(row => tableColumns.map(col => row[col.dataKey as keyof typeof row])),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      textColor: COLORS.text,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 32, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable?.finalY || yPos + 30;
  yPos += 10;

  // ===== TOTALS SECTION =====
  const totalsX = pageWidth - margin - 65;
  const totalsWidth = 60;

  // Totals background
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(totalsX - 5, yPos - 5, totalsWidth + 10, 50, 3, 3, 'F');

  const addTotalLine = (label: string, value: string, isBold = false, isHighlight = false) => {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(label + ':', totalsX, yPos);
    doc.setTextColor(...(isHighlight ? COLORS.primary : COLORS.text));
    doc.text(value, totalsX + totalsWidth, yPos, { align: 'right' });
    yPos += 6;
  };

  yPos += 2;
  addTotalLine(t.subtotal, formatCurrency(proposal.subtotal));

  if (proposal.discountAmount && proposal.discountAmount > 0) {
    addTotalLine(t.discount, formatCurrency(proposal.discountAmount));
  }

  addTotalLine(`${t.tax} (${proposal.taxRate}%)`, formatCurrency(proposal.taxAmount));

  // Grand total
  yPos += 2;
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(t.grandTotal + ':', totalsX, yPos);
  doc.text(formatCurrency(proposal.totalAmount), totalsX + totalsWidth, yPos, { align: 'right' });

  // Validity note
  if (proposal.validityDays) {
    yPos += 8;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont('helvetica', 'italic');
    doc.text(`${t.validity}: ${proposal.validityDays} ${t.days}`, totalsX, yPos);
  }

  yPos += 15;

  // ===== SCOPE OF WORK =====
  if (proposal.scope && proposal.scope.length > 0) {
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(t.scopeOfWork, margin, yPos);

    yPos += 5;
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    proposal.scope.forEach((item, index) => {
      const bullet = isRTL ? `${index + 1}.` : `${index + 1}.`;
      const text = `${bullet} ${item}`;
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - 5);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 4 + 2;
    });

    yPos += 8;
  }

  // ===== TERMS =====
  if (proposal.terms && proposal.terms.length > 0) {
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(t.terms, margin, yPos);

    yPos += 5;
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    proposal.terms.slice(0, 8).forEach((term, index) => {
      const text = `${index + 1}. ${term}`;
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - 5);
      
      if (yPos + lines.length * 4 > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.text(lines, margin + 3, yPos);
      yPos += lines.length * 4 + 2;
    });
  }

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer background
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');

    // Thank you message
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(t.thankYou, pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Contact
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    if (organization?.email) {
      doc.text(`${t.contactUs}: ${organization.email}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    // Page number
    doc.setFontSize(8);
    doc.text(`${t.page} ${i} ${t.of} ${pageCount}`, margin, pageHeight - 8);
  }

  return doc;
}

// Download proposal PDF
export function downloadProposalPDF(
  proposal: ProposalData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'ar'
): void {
  const doc = generateProposalPDF(proposal, organization, lang);
  doc.save(`Proposal-${proposal.proposalNumber}.pdf`);
}

// Preview proposal PDF
export function previewProposalPDF(
  proposal: ProposalData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'ar'
): void {
  const doc = generateProposalPDF(proposal, organization, lang);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}

export default generateProposalPDF;
