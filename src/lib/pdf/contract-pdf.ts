'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
interface ContractParty {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  representative?: string;
}

interface ContractData {
  contractNumber: string;
  title: string;
  contractType: 'lump_sum' | 'unit_price' | 'cost_plus' | 'time_materials';
  client: ContractParty;
  contractor: ContractParty;
  project?: {
    name: string;
    location?: string;
    description?: string;
  };
  contractValue: number;
  startDate?: string | Date;
  endDate?: string | Date;
  advancePayment?: number;
  retentionPercentage?: number;
  terms: string[];
  specifications?: string[];
  signatures?: {
    clientSigned?: boolean;
    contractorSigned?: boolean;
    clientSignedAt?: Date;
    contractorSignedAt?: Date;
  };
}

interface OrganizationInfo {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  licenseNumber?: string;
}

// Colors
const COLORS = {
  primary: [37, 99, 235] as [number, number, number],
  secondary: [71, 85, 105] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],
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
    month: 'long',
    year: 'numeric',
  });
};

// Contract type labels
const CONTRACT_TYPE_LABELS = {
  lump_sum: { ar: 'مقاولة بسعر إجمالي', en: 'Lump Sum Contract' },
  unit_price: { ar: 'مقاولة بأسعار الوحدات', en: 'Unit Price Contract' },
  cost_plus: { ar: 'مقاولة بالتكلفة بالإضافة إلى نسبة', en: 'Cost Plus Contract' },
  time_materials: { ar: 'مقاولة بالوقت والمواد', en: 'Time & Materials Contract' },
};

export function generateContractPDF(
  contract: ContractData,
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
    contract: isRTL ? 'عقد' : 'CONTRACT',
    contractNumber: isRTL ? 'رقم العقد' : 'Contract No.',
    contractType: isRTL ? 'نوع العقد' : 'Contract Type',
    contractDate: isRTL ? 'تاريخ العقد' : 'Contract Date',
    parties: isRTL ? 'أطراف العقد' : 'Contract Parties',
    firstParty: isRTL ? 'الطرف الأول (المالك)' : 'First Party (Owner)',
    secondParty: isRTL ? 'الطرف الثاني (المقاول)' : 'Second Party (Contractor)',
    projectDetails: isRTL ? 'تفاصيل المشروع' : 'Project Details',
    projectName: isRTL ? 'اسم المشروع' : 'Project Name',
    projectLocation: isRTL ? 'موقع المشروع' : 'Project Location',
    contractValue: isRTL ? 'قيمة العقد' : 'Contract Value',
    contractPeriod: isRTL ? 'مدة العقد' : 'Contract Period',
    startDate: isRTL ? 'تاريخ البدء' : 'Start Date',
    endDate: isRTL ? 'تاريخ الانتهاء' : 'End Date',
    advancePayment: isRTL ? 'الدفع المقدم' : 'Advance Payment',
    retention: isRTL ? 'الاحتفاظ' : 'Retention',
    terms: isRTL ? 'الشروط والأحكام' : 'Terms & Conditions',
    specifications: isRTL ? 'المواصفات' : 'Specifications',
    signatures: isRTL ? 'التوقيعات' : 'Signatures',
    clientSignature: isRTL ? 'توقيع المالك' : 'Client Signature',
    contractorSignature: isRTL ? 'توقيع المقاول' : 'Contractor Signature',
    date: isRTL ? 'التاريخ' : 'Date',
    name: isRTL ? 'الاسم' : 'Name',
    page: isRTL ? 'صفحة' : 'Page',
    of: isRTL ? 'من' : 'of',
  };

  // ===== HEADER =====
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Organization name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const orgName = organization?.name || 'BluePrint Engineering';
  doc.text(orgName, isRTL ? pageWidth - margin : margin, 15, {
    align: isRTL ? 'right' : 'left'
  });

  // Organization details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const orgDetails = [organization?.licenseNumber, organization?.taxNumber].filter(Boolean).join(' | ');
  if (orgDetails) {
    doc.text(orgDetails, isRTL ? pageWidth - margin : margin, 25, {
      align: isRTL ? 'right' : 'left'
    });
  }

  yPos = 45;

  // ===== CONTRACT TITLE =====
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(t.contract, pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;

  // Contract title
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.text(contract.title, pageWidth / 2, yPos, { align: 'center' });

  yPos += 6;

  // Contract number and type
  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const typeLabel = CONTRACT_TYPE_LABELS[contract.contractType]?.[lang] || contract.contractType;
  doc.text(`${t.contractNumber}: ${contract.contractNumber}`, pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;

  // ===== PARTIES SECTION =====
  // Background
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 50, 'F');

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.parties, margin + 5, yPos + 8);

  // First Party
  yPos += 15;
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.firstParty, margin + 5, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondary);
  doc.text(contract.client.name, margin + 5, yPos);
  if (contract.client.address) {
    yPos += 4;
    doc.setFontSize(9);
    doc.text(contract.client.address.substring(0, 50), margin + 5, yPos);
  }

  // Second Party (right side)
  let rightY = yPos - 9;
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.secondParty, pageWidth - margin - 5, rightY, { align: 'right' });
  rightY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondary);
  doc.text(contract.contractor.name, pageWidth - margin - 5, rightY, { align: 'right' });
  if (contract.contractor.address) {
    rightY += 4;
    doc.setFontSize(9);
    doc.text(contract.contractor.address.substring(0, 50), pageWidth - margin - 5, rightY, { align: 'right' });
  }

  yPos = Math.max(yPos, rightY) + 15;

  // ===== CONTRACT DETAILS =====
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.projectDetails, margin, yPos);

  yPos += 8;

  // Details grid
  const detailsData = [
    [t.contractValue, formatCurrency(contract.contractValue)],
    [t.startDate, formatDate(contract.startDate)],
    [t.endDate, formatDate(contract.endDate)],
  ];

  if (contract.project?.name) {
    detailsData.unshift([t.projectName, contract.project.name]);
  }

  if (contract.project?.location) {
    detailsData.push([t.projectLocation, contract.project.location]);
  }

  if (contract.advancePayment) {
    detailsData.push([t.advancePayment, formatCurrency(contract.advancePayment)]);
  }

  if (contract.retentionPercentage) {
    detailsData.push([t.retention, `${contract.retentionPercentage}%`]);
  }

  autoTable(doc, {
    startY: yPos,
    body: detailsData,
    theme: 'plain',
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: COLORS.secondary },
      1: { cellWidth: 'auto', textColor: COLORS.text },
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable?.finalY || yPos + 30;
  yPos += 10;

  // ===== TERMS SECTION =====
  if (contract.terms && contract.terms.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(t.terms, margin, yPos);

    yPos += 8;

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    contract.terms.forEach((term, index) => {
      const termText = `${index + 1}. ${term}`;
      const lines = doc.splitTextToSize(termText, pageWidth - 2 * margin);
      
      if (yPos + lines.length * 4 > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
      }

      doc.text(lines, margin, yPos);
      yPos += lines.length * 4 + 3;
    });

    yPos += 10;
  }

  // ===== SIGNATURES SECTION =====
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.signatures, margin, yPos);

  yPos += 15;

  // Signature boxes
  const sigWidth = 70;
  const sigHeight = 35;
  const leftSigX = margin;
  const rightSigX = pageWidth - margin - sigWidth;

  // Left signature (Client)
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.rect(leftSigX, yPos, sigWidth, sigHeight);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.clientSignature, leftSigX + sigWidth / 2, yPos + 5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondary);
  doc.text(contract.client.representative || contract.client.name, leftSigX + sigWidth / 2, yPos + sigHeight - 8, { align: 'center' });

  // Right signature (Contractor)
  doc.setDrawColor(...COLORS.border);
  doc.rect(rightSigX, yPos, sigWidth, sigHeight);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.contractorSignature, rightSigX + sigWidth / 2, yPos + 5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondary);
  doc.text(contract.contractor.representative || contract.contractor.name, rightSigX + sigWidth / 2, yPos + sigHeight - 8, { align: 'center' });

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Page number
    doc.setTextColor(...COLORS.secondary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const footerText = `${t.page} ${i} ${t.of} ${pageCount}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Organization info
    if (organization?.name) {
      doc.text(organization.name, margin, pageHeight - 10);
    }
  }

  return doc;
}

// Download contract PDF
export function downloadContractPDF(
  contract: ContractData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'ar'
): void {
  const doc = generateContractPDF(contract, organization, lang);
  doc.save(`Contract-${contract.contractNumber}.pdf`);
}

// Preview contract PDF
export function previewContractPDF(
  contract: ContractData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'ar'
): void {
  const doc = generateContractPDF(contract, organization, lang);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}

export default generateContractPDF;
