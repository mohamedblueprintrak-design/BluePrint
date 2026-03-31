// Server-side PDF generation
// This file should only be imported in server components/API routes

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { NextRequest } from 'next/server';

// Types for report data
export interface FinancialReportData {
  title: string;
  dateRange: string;
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
  };
  rows: Array<{
    date: string;
    invoiced: number;
    paid: number;
    pending: number;
  }>;
  currency: string;
  language: 'ar' | 'en';
}

export interface ProjectReportData {
  title: string;
  dateRange: string;
  summary: {
    total: number;
    active: number;
    completed: number;
    pending: number;
    onHold: number;
  };
  projects: Array<{
    name: string;
    client: string;
    status: string;
    progress: number;
    budget: number;
  }>;
  language: 'ar' | 'en';
}

export interface TaskReportData {
  title: string;
  dateRange: string;
  summary: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
  tasks: Array<{
    title: string;
    project: string;
    status: string;
    priority: string;
    dueDate: string;
    assignee?: string;
  }>;
  language: 'ar' | 'en';
}

export interface ClientReportData {
  title: string;
  dateRange: string;
  summary: {
    total: number;
    active: number;
    totalRevenue: number;
  };
  clients: Array<{
    name: string;
    email: string;
    phone: string;
    contactPerson?: string;
    totalInvoiced: number;
    totalPaid: number;
  }>;
  currency: string;
  language: 'ar' | 'en';
}

export interface InvoiceReportData {
  title: string;
  dateRange: string;
  summary: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  invoices: Array<{
    invoiceNumber: string;
    client: string;
    project?: string;
    total: number;
    paidAmount?: number;
    status: string;
    issueDate?: string;
    dueDate: string;
  }>;
  currency: string;
  language: 'ar' | 'en';
}

// Cache for loaded modules
let jspdfCache: {
  jsPDF: any;
  autoTable: any;
} | null = null;

// Dynamic import for server-side only with caching
async function getJsPDF() {
  if (jspdfCache) {
    return jspdfCache;
  }
  
  // Use Function constructor to prevent static analysis
  // This tells bundlers to not try to analyze this import
  const dynamicImport = new Function('modulePath', 'return import(modulePath)');
  
  const jspdfModule = await dynamicImport('jspdf');
  const autotableModule = await dynamicImport('jspdf-autotable');
  
  jspdfCache = {
    jsPDF: jspdfModule.default,
    autoTable: autotableModule.default,
  };
  
  return jspdfCache;
}

// Format number with thousand separators
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

// Format currency
function formatCurrency(amount: number, currency: string): string {
  return `${formatNumber(amount)} ${currency}`;
}

// Get status label in appropriate language
function getStatusLabel(status: string, language: 'ar' | 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    active: { ar: 'نشط', en: 'Active' },
    completed: { ar: 'مكتمل', en: 'Completed' },
    pending: { ar: 'معلق', en: 'Pending' },
    'on-hold': { ar: 'متوقف', en: 'On Hold' },
    'in-progress': { ar: 'قيد التنفيذ', en: 'In Progress' },
    todo: { ar: 'للتنفيذ', en: 'To Do' },
    done: { ar: 'منجز', en: 'Done' },
    paid: { ar: 'مدفوع', en: 'Paid' },
    overdue: { ar: 'متأخر', en: 'Overdue' },
    draft: { ar: 'مسودة', en: 'Draft' },
  };
  return labels[status]?.[language] || status;
}

// Get priority label
function getPriorityLabel(priority: string, language: 'ar' | 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    critical: { ar: 'حرج', en: 'Critical' },
    high: { ar: 'عالي', en: 'High' },
    medium: { ar: 'متوسط', en: 'Medium' },
    low: { ar: 'منخفض', en: 'Low' },
  };
  return labels[priority]?.[language] || priority;
}

// Generate Financial Report PDF
export async function generateFinancialReportPDF(data: FinancialReportData): Promise<Buffer> {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF('landscape');
  const isRTL = data.language === 'ar';
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Blue color
  
  if (isRTL) {
    doc.text(data.title, 280, 20, { align: 'right' });
  } else {
    doc.text(data.title, 14, 20);
  }
  
  // Date range
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  if (isRTL) {
    doc.text(data.dateRange, 280, 30, { align: 'right' });
  } else {
    doc.text(data.dateRange, 14, 30);
  }
  
  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  
  const summaryY = 45;
  const summaryItems = [
    { label: isRTL ? 'إجمالي الفواتير' : 'Total Invoiced', value: formatCurrency(data.summary.totalInvoiced, data.currency) },
    { label: isRTL ? 'المبالغ المحصلة' : 'Collected Amount', value: formatCurrency(data.summary.totalPaid, data.currency) },
    { label: isRTL ? 'المبالغ المعلقة' : 'Pending Amount', value: formatCurrency(data.summary.totalPending, data.currency) },
    { label: isRTL ? 'المبالغ المتأخرة' : 'Overdue Amount', value: formatCurrency(data.summary.totalOverdue, data.currency) },
  ];
  
  summaryItems.forEach((item, index) => {
    const x = isRTL ? 280 : 14;
    const xOffset = isRTL ? -(index * 70) : index * 70;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x + xOffset, summaryY, { align: isRTL ? 'right' : 'left' });
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(item.value, x + xOffset, summaryY + 6, { align: isRTL ? 'right' : 'left' });
  });
  
  // Table
  const tableHeaders = isRTL 
    ? [['التاريخ', 'الفواتير', 'المدفوعات', 'المتأخرات']]
    : [['Date', 'Invoiced', 'Paid', 'Pending']];
  
  const tableData = data.rows.map(row => [
    row.date,
    formatCurrency(row.invoiced, data.currency),
    formatCurrency(row.paid, data.currency),
    formatCurrency(row.pending, data.currency),
  ]);
  
  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: summaryY + 20,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 11,
      halign: isRTL ? 'right' : 'left',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [30, 41, 59],
      halign: isRTL ? 'right' : 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: isRTL ? {
      0: { halign: 'right' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    } : {},
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    const footerText = isRTL 
      ? `BluePrint - صفحة ${i} من ${pageCount}`
      : `BluePrint - Page ${i} of ${pageCount}`;
    doc.text(footerText, isRTL ? 280 : 14, doc.internal.pageSize.height - 10, { 
      align: isRTL ? 'right' : 'left' 
    });
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

// Generate Project Report PDF
export async function generateProjectReportPDF(data: ProjectReportData): Promise<Buffer> {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF('landscape');
  const isRTL = data.language === 'ar';
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  
  if (isRTL) {
    doc.text(data.title, 280, 20, { align: 'right' });
  } else {
    doc.text(data.title, 14, 20);
  }
  
  // Date range
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  if (isRTL) {
    doc.text(data.dateRange, 280, 30, { align: 'right' });
  } else {
    doc.text(data.dateRange, 14, 30);
  }
  
  // Summary
  const summaryY = 45;
  const summaryItems = [
    { label: isRTL ? 'إجمالي المشاريع' : 'Total Projects', value: data.summary.total.toString() },
    { label: isRTL ? 'نشط' : 'Active', value: data.summary.active.toString() },
    { label: isRTL ? 'مكتمل' : 'Completed', value: data.summary.completed.toString() },
    { label: isRTL ? 'معلق' : 'Pending', value: data.summary.pending.toString() },
  ];
  
  summaryItems.forEach((item, index) => {
    const x = isRTL ? 280 : 14;
    const xOffset = isRTL ? -(index * 70) : index * 70;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x + xOffset, summaryY, { align: isRTL ? 'right' : 'left' });
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(item.value, x + xOffset, summaryY + 6, { align: isRTL ? 'right' : 'left' });
  });
  
  // Table
  const tableHeaders = isRTL 
    ? [['المشروع', 'العميل', 'الحالة', 'التقدم', 'الميزانية']]
    : [['Project', 'Client', 'Status', 'Progress', 'Budget']];
  
  const tableData = data.projects.map(p => [
    p.name,
    p.client,
    getStatusLabel(p.status, data.language),
    `${p.progress}%`,
    formatCurrency(p.budget, 'AED'),
  ]);
  
  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: summaryY + 20,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 11,
      halign: isRTL ? 'right' : 'left',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [30, 41, 59],
      halign: isRTL ? 'right' : 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    const footerText = isRTL 
      ? `BluePrint - صفحة ${i} من ${pageCount}`
      : `BluePrint - Page ${i} of ${pageCount}`;
    doc.text(footerText, isRTL ? 280 : 14, doc.internal.pageSize.height - 10, { 
      align: isRTL ? 'right' : 'left' 
    });
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

// Generate Task Report PDF
export async function generateTaskReportPDF(data: TaskReportData): Promise<Buffer> {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF('landscape');
  const isRTL = data.language === 'ar';
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  
  if (isRTL) {
    doc.text(data.title, 280, 20, { align: 'right' });
  } else {
    doc.text(data.title, 14, 20);
  }
  
  // Date range
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  if (isRTL) {
    doc.text(data.dateRange, 280, 30, { align: 'right' });
  } else {
    doc.text(data.dateRange, 14, 30);
  }
  
  // Summary
  const summaryY = 45;
  const summaryItems = [
    { label: isRTL ? 'إجمالي المهام' : 'Total Tasks', value: data.summary.total.toString() },
    { label: isRTL ? 'للتنفيذ' : 'To Do', value: data.summary.todo.toString() },
    { label: isRTL ? 'قيد التنفيذ' : 'In Progress', value: data.summary.inProgress.toString() },
    { label: isRTL ? 'منجز' : 'Done', value: data.summary.done.toString() },
    { label: isRTL ? 'متأخر' : 'Overdue', value: data.summary.overdue.toString() },
  ];
  
  summaryItems.forEach((item, index) => {
    const x = isRTL ? 280 : 14;
    const xOffset = isRTL ? -(index * 55) : index * 55;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x + xOffset, summaryY, { align: isRTL ? 'right' : 'left' });
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(item.value, x + xOffset, summaryY + 6, { align: isRTL ? 'right' : 'left' });
  });
  
  // Table
  const tableHeaders = isRTL 
    ? [['المهمة', 'المشروع', 'الحالة', 'الأولوية', 'تاريخ الاستحقاق']]
    : [['Task', 'Project', 'Status', 'Priority', 'Due Date']];
  
  const tableData = data.tasks.map(t => [
    t.title,
    t.project,
    getStatusLabel(t.status, data.language),
    getPriorityLabel(t.priority, data.language),
    t.dueDate,
  ]);
  
  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: summaryY + 20,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 11,
      halign: isRTL ? 'right' : 'left',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [30, 41, 59],
      halign: isRTL ? 'right' : 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    const footerText = isRTL 
      ? `BluePrint - صفحة ${i} من ${pageCount}`
      : `BluePrint - Page ${i} of ${pageCount}`;
    doc.text(footerText, isRTL ? 280 : 14, doc.internal.pageSize.height - 10, { 
      align: isRTL ? 'right' : 'left' 
    });
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

// Generate Client Report PDF
export async function generateClientReportPDF(data: ClientReportData): Promise<Buffer> {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF('landscape');
  const isRTL = data.language === 'ar';
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  
  if (isRTL) {
    doc.text(data.title, 280, 20, { align: 'right' });
  } else {
    doc.text(data.title, 14, 20);
  }
  
  // Date range
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  if (isRTL) {
    doc.text(data.dateRange, 280, 30, { align: 'right' });
  } else {
    doc.text(data.dateRange, 14, 30);
  }
  
  // Summary
  const summaryY = 45;
  const summaryItems = [
    { label: isRTL ? 'إجمالي العملاء' : 'Total Clients', value: data.summary.total.toString() },
    { label: isRTL ? 'العملاء النشطون' : 'Active Clients', value: data.summary.active.toString() },
    { label: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue', value: formatCurrency(data.summary.totalRevenue, data.currency) },
  ];
  
  summaryItems.forEach((item, index) => {
    const x = isRTL ? 280 : 14;
    const xOffset = isRTL ? -(index * 90) : index * 90;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x + xOffset, summaryY, { align: isRTL ? 'right' : 'left' });
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(item.value, x + xOffset, summaryY + 6, { align: isRTL ? 'right' : 'left' });
  });
  
  // Table
  const tableHeaders = isRTL 
    ? [['الاسم', 'البريد الإلكتروني', 'الهاتف', 'إجمالي الفواتير', 'إجمالي المدفوعات']]
    : [['Name', 'Email', 'Phone', 'Total Invoiced', 'Total Paid']];
  
  const tableData = data.clients.map(c => [
    c.name,
    c.email || '-',
    c.phone || '-',
    formatCurrency(c.totalInvoiced, data.currency),
    formatCurrency(c.totalPaid, data.currency),
  ]);
  
  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: summaryY + 20,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 11,
      halign: isRTL ? 'right' : 'left',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [30, 41, 59],
      halign: isRTL ? 'right' : 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    const footerText = isRTL 
      ? `BluePrint - صفحة ${i} من ${pageCount}`
      : `BluePrint - Page ${i} of ${pageCount}`;
    doc.text(footerText, isRTL ? 280 : 14, doc.internal.pageSize.height - 10, { 
      align: isRTL ? 'right' : 'left' 
    });
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

// Generate Invoice Report PDF
export async function generateInvoiceReportPDF(data: InvoiceReportData): Promise<Buffer> {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF('landscape');
  const isRTL = data.language === 'ar';
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  
  if (isRTL) {
    doc.text(data.title, 280, 20, { align: 'right' });
  } else {
    doc.text(data.title, 14, 20);
  }
  
  // Date range
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  if (isRTL) {
    doc.text(data.dateRange, 280, 30, { align: 'right' });
  } else {
    doc.text(data.dateRange, 14, 30);
  }
  
  // Summary
  const summaryY = 45;
  const summaryItems = [
    { label: isRTL ? 'إجمالي الفواتير' : 'Total Invoices', value: data.summary.total.toString() },
    { label: isRTL ? 'مدفوعة' : 'Paid', value: data.summary.paid.toString() },
    { label: isRTL ? 'معلقة' : 'Pending', value: data.summary.pending.toString() },
    { label: isRTL ? 'متأخرة' : 'Overdue', value: data.summary.overdue.toString() },
  ];
  
  summaryItems.forEach((item, index) => {
    const x = isRTL ? 280 : 14;
    const xOffset = isRTL ? -(index * 70) : index * 70;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x + xOffset, summaryY, { align: isRTL ? 'right' : 'left' });
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(item.value, x + xOffset, summaryY + 6, { align: isRTL ? 'right' : 'left' });
  });
  
  // Table
  const tableHeaders = isRTL 
    ? [['رقم الفاتورة', 'العميل', 'المبلغ', 'الحالة', 'تاريخ الاستحقاق']]
    : [['Invoice #', 'Client', 'Amount', 'Status', 'Due Date']];
  
  const tableData = data.invoices.map(inv => [
    inv.invoiceNumber,
    inv.client,
    formatCurrency(inv.total, data.currency),
    getStatusLabel(inv.status, data.language),
    inv.dueDate,
  ]);
  
  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: summaryY + 20,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 11,
      halign: isRTL ? 'right' : 'left',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [30, 41, 59],
      halign: isRTL ? 'right' : 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    const footerText = isRTL 
      ? `BluePrint - صفحة ${i} من ${pageCount}`
      : `BluePrint - Page ${i} of ${pageCount}`;
    doc.text(footerText, isRTL ? 280 : 14, doc.internal.pageSize.height - 10, { 
      align: isRTL ? 'right' : 'left' 
    });
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}
