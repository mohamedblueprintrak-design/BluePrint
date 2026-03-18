// Client-side PDF generation for invoices
// Uses dynamic imports to handle jspdf
// IMPORTANT: This file should only be used in client components

// Check if running in browser
const isBrowser = typeof window !== 'undefined';

// Types
interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  total: number;
}

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  projectName?: string;
  issueDate?: string | Date;
  dueDate?: string | Date;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount?: number;
  total: number;
  notes?: string;
  terms?: string;
  status?: string;
  paidAmount?: number;
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
  primary: [37, 99, 235] as [number, number, number], // blue-600
  secondary: [71, 85, 105] as [number, number, number], // slate-600
  text: [30, 41, 59] as [number, number, number], // slate-800
  lightGray: [241, 245, 249] as [number, number, number], // slate-100
  success: [34, 197, 94] as [number, number, number], // green-500
  warning: [234, 179, 8] as [number, number, number], // yellow-500
  danger: [239, 68, 68] as [number, number, number], // red-500
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

// Get status color
const getStatusColor = (status: string): [number, number, number] => {
  switch (status.toLowerCase()) {
    case 'paid':
      return COLORS.success;
    case 'partial':
      return COLORS.warning;
    case 'overdue':
      return COLORS.danger;
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

export async function generateInvoicePDF(
  invoice: InvoiceData,
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
    invoice: isRTL ? 'فاتورة' : 'INVOICE',
    invoiceNumber: isRTL ? 'رقم الفاتورة' : 'Invoice Number',
    date: isRTL ? 'التاريخ' : 'Date',
    dueDate: isRTL ? 'تاريخ الاستحقاق' : 'Due Date',
    billTo: isRTL ? 'فاتورة إلى' : 'Bill To',
    projectName: isRTL ? 'المشروع' : 'Project',
    description: isRTL ? 'الوصف' : 'Description',
    quantity: isRTL ? 'الكمية' : 'Qty',
    unit: isRTL ? 'الوحدة' : 'Unit',
    unitPrice: isRTL ? 'سعر الوحدة' : 'Unit Price',
    total: isRTL ? 'الإجمالي' : 'Total',
    subtotal: isRTL ? 'المجموع الفرعي' : 'Subtotal',
    tax: isRTL ? 'الضريبة' : 'Tax',
    discount: isRTL ? 'الخصم' : 'Discount',
    grandTotal: isRTL ? 'الإجمالي الكلي' : 'Grand Total',
    amountPaid: isRTL ? 'المبلغ المدفوع' : 'Amount Paid',
    balanceDue: isRTL ? 'المبلغ المستحق' : 'Balance Due',
    notes: isRTL ? 'ملاحظات' : 'Notes',
    terms: isRTL ? 'الشروط' : 'Terms & Conditions',
    thankYou: isRTL ? 'شكراً لتعاملكم معنا' : 'Thank you for your business!',
    page: isRTL ? 'صفحة' : 'Page',
    status: isRTL ? 'الحالة' : 'Status',
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
    align: isRTL ? 'right' : 'left' 
  });

  // Organization details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let orgDetailsY = 26;
  if (organization?.address) {
    doc.text(organization.address, isRTL ? pageWidth - margin : margin, orgDetailsY, { 
      align: isRTL ? 'right' : 'left' 
    });
    orgDetailsY += 4;
  }
  if (organization?.phone || organization?.email) {
    const contactInfo = [organization.phone, organization.email].filter(Boolean).join(' | ');
    doc.text(contactInfo, isRTL ? pageWidth - margin : margin, orgDetailsY, { 
      align: isRTL ? 'right' : 'left' 
    });
  }

  yPos = 50;

  // ===== INVOICE TITLE & NUMBER =====
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(translations.invoice, isRTL ? margin : pageWidth - margin, yPos, { 
    align: isRTL ? 'left' : 'right' 
  });
  
  yPos += 10;

  // Invoice number
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${invoice.invoiceNumber}`, isRTL ? margin : pageWidth - margin, yPos, { 
    align: isRTL ? 'left' : 'right' 
  });

  // Status badge
  if (invoice.status) {
    const statusColor = getStatusColor(invoice.status);
    const statusText = isRTL 
      ? { draft: 'مسودة', sent: 'مرسلة', partial: 'مدفوعة جزئياً', paid: 'مدفوعة', overdue: 'متأخرة' }[invoice.status] || invoice.status
      : invoice.status.toUpperCase();
    
    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(...statusColor);
    doc.text(statusText, isRTL ? margin : pageWidth - margin, yPos, { 
      align: isRTL ? 'left' : 'right' 
    });
  }

  yPos += 15;

  // ===== CLIENT & DATES SECTION =====
  // Left side - Client info
  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(translations.billTo + ':', margin, yPos);
  
  yPos += 6;
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(invoice.clientName, margin, yPos);

  if (invoice.clientEmail) {
    yPos += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondary);
    doc.text(invoice.clientEmail, margin, yPos);
  }

  if (invoice.clientPhone) {
    yPos += 4;
    doc.text(invoice.clientPhone, margin, yPos);
  }

  if (invoice.clientAddress) {
    yPos += 4;
    doc.text(invoice.clientAddress.substring(0, 40), margin, yPos);
  }

  // Right side - Dates
  let rightY = 70;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Issue date
  doc.setTextColor(...COLORS.secondary);
  doc.text(translations.date + ':', pageWidth - margin - 40, rightY);
  doc.setTextColor(...COLORS.text);
  doc.text(formatDate(invoice.issueDate), pageWidth - margin, rightY, { align: 'right' });

  rightY += 5;
  doc.setTextColor(...COLORS.secondary);
  doc.text(translations.dueDate + ':', pageWidth - margin - 40, rightY);
  doc.setTextColor(...COLORS.text);
  doc.text(formatDate(invoice.dueDate), pageWidth - margin, rightY, { align: 'right' });

  if (invoice.projectName) {
    rightY += 5;
    doc.setTextColor(...COLORS.secondary);
    doc.text(translations.projectName + ':', pageWidth - margin - 40, rightY);
    doc.setTextColor(...COLORS.text);
    doc.text(invoice.projectName.substring(0, 20), pageWidth - margin, rightY, { align: 'right' });
  }

  yPos = Math.max(yPos, rightY) + 15;

  // ===== ITEMS TABLE =====
  const tableColumns = [
    { header: '#', dataKey: 'index' },
    { header: translations.description, dataKey: 'description' },
    { header: translations.unit, dataKey: 'unit' },
    { header: translations.quantity, dataKey: 'quantity' },
    { header: translations.unitPrice, dataKey: 'unitPrice' },
    { header: translations.total, dataKey: 'total' },
  ];

  const tableRows = invoice.items.map((item, index) => ({
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
      1: { cellWidth: 'auto', halign: isRTL ? 'right' : 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // Get final Y position after table
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ===== TOTALS SECTION =====
  const totalsX = isRTL ? margin : pageWidth - margin - 60;
  const totalsWidth = 60;

  // Totals background
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(totalsX - 5, yPos - 5, totalsWidth + 10, 45, 3, 3, 'F');

  const addTotalLine = (label: string, value: string, isBold = false) => {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(label + ':', totalsX, yPos, { align: isRTL ? 'right' : 'left' });
    doc.setTextColor(...COLORS.text);
    doc.text(value, totalsX + totalsWidth, yPos, { align: isRTL ? 'left' : 'right' });
    yPos += 6;
  };

  yPos += 2;
  addTotalLine(translations.subtotal, formatCurrency(invoice.subtotal));

  if (invoice.discountAmount && invoice.discountAmount > 0) {
    addTotalLine(translations.discount, formatCurrency(invoice.discountAmount));
  }

  addTotalLine(`${translations.tax} (${invoice.taxRate}%)`, formatCurrency(invoice.taxAmount));

  // Grand total
  yPos += 2;
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(translations.grandTotal + ':', totalsX, yPos, { align: isRTL ? 'right' : 'left' });
  doc.text(formatCurrency(invoice.total), totalsX + totalsWidth, yPos, { align: isRTL ? 'left' : 'right' });

  // Paid amount and balance
  if (invoice.paidAmount && invoice.paidAmount > 0) {
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.success);
    doc.setFont('helvetica', 'normal');
    doc.text(translations.amountPaid + ':', totalsX, yPos, { align: isRTL ? 'right' : 'left' });
    doc.text(formatCurrency(invoice.paidAmount), totalsX + totalsWidth, yPos, { align: isRTL ? 'left' : 'right' });

    yPos += 5;
    const balance = invoice.total - invoice.paidAmount;
    doc.setTextColor(...(balance > 0 ? COLORS.warning : COLORS.success));
    doc.text(translations.balanceDue + ':', totalsX, yPos, { align: isRTL ? 'right' : 'left' });
    doc.text(formatCurrency(balance), totalsX + totalsWidth, yPos, { align: isRTL ? 'left' : 'right' });
  }

  yPos += 15;

  // ===== NOTES SECTION =====
  if (invoice.notes) {
    doc.setTextColor(...COLORS.secondary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(translations.notes + ':', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(notesLines.slice(0, 3), margin, yPos);
    yPos += notesLines.slice(0, 3).length * 4 + 5;
  }

  // ===== TERMS SECTION =====
  if (invoice.terms) {
    doc.setTextColor(...COLORS.secondary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(translations.terms + ':', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);
    const termsLines = doc.splitTextToSize(invoice.terms, pageWidth - 2 * margin);
    doc.text(termsLines.slice(0, 3), margin, yPos);
  }

  // ===== FOOTER =====
  // Footer background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

  // Thank you message
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(translations.thankYou, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Organization tax number if available
  if (organization?.taxNumber) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const taxLabel = isRTL ? 'الرقم الضريبي' : 'Tax No.';
    doc.text(`${taxLabel}: ${organization.taxNumber}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  }

  return doc;
}

// Generate and download invoice PDF
export async function downloadInvoicePDF(
  invoice: InvoiceData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'en'
): Promise<void> {
  const doc = await generateInvoicePDF(invoice, organization, lang);
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}

// Generate and open invoice PDF in new tab
export async function previewInvoicePDF(
  invoice: InvoiceData,
  organization?: OrganizationInfo,
  lang: 'ar' | 'en' = 'en'
): Promise<void> {
  const doc = await generateInvoicePDF(invoice, organization, lang);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}
