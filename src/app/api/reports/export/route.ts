import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { getDb, DEMO_USERS } from '@/app/api/utils/db';
import { errorResponse } from '@/app/api/utils/response';

// PDF and Excel generators
import {
  generateFinancialReportPDF,
  generateProjectReportPDF,
  generateTaskReportPDF,
  generateClientReportPDF,
  generateInvoiceReportPDF,
  type FinancialReportData,
  type ProjectReportData,
  type TaskReportData,
  type ClientReportData,
  type InvoiceReportData,
} from '@/lib/pdf-generator';

import {
  generateFinancialReportExcel,
  generateProjectReportExcel,
  generateTaskReportExcel,
  generateClientReportExcel,
  generateInvoiceReportExcel,
  type FinancialExcelData,
  type ProjectExcelData,
  type TaskExcelData,
  type ClientExcelData,
  type InvoiceExcelData,
} from '@/lib/excel-generator';

// JWT secret
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

// Get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    
    // Check demo users
    const demoUser = DEMO_USERS.find(u => u.id === userId);
    if (demoUser) {
      return { ...demoUser, organization: demoUser.organization };
    }
    
    // Try database
    const database = await getDb();
    if (database) {
      const user = await database.user.findUnique({
        where: { id: userId },
        include: { organization: true }
      });
      return user;
    }
    
    return null;
  } catch {
    return null;
  }
}

// Get date range from query params
function getDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();
  
  if (!startDate) {
    start.setFullYear(start.getFullYear() - 1);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  
  if (!endDate) {
    end.setHours(23, 59, 59, 999);
  }
  
  return { start, end };
}

// Format date range for display
function formatDateRange(start: Date, end: Date, language: 'ar' | 'en'): string {
  const months = language === 'ar' 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return language === 'ar'
    ? `${months[start.getMonth()]} ${start.getFullYear()} - ${months[end.getMonth()]} ${end.getFullYear()}`
    : `${months[start.getMonth()]} ${start.getFullYear()} - ${months[end.getMonth()]} ${end.getFullYear()}`;
}

// Generate month labels
function generateMonthLabels(start: Date, end: Date, language: 'ar' | 'en'): string[] {
  const labels: string[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endDate = new Date(end.getFullYear(), end.getMonth(), 1);
  
  while (current <= endDate) {
    if (language === 'ar') {
      labels.push(`${monthsAr[current.getMonth()]} ${current.getFullYear()}`);
    } else {
      labels.push(`${months[current.getMonth()]} ${current.getFullYear()}`);
    }
    current.setMonth(current.getMonth() + 1);
  }
  
  return labels;
}

// Demo data generators
function getDemoFinancialData(start: Date, end: Date, language: 'ar' | 'en', currency: string): FinancialReportData {
  const labels = generateMonthLabels(start, end, language);
  const rows = labels.map(date => ({
    date,
    invoiced: Math.floor(Math.random() * 150000) + 50000,
    paid: Math.floor(Math.random() * 120000) + 40000,
    pending: Math.floor(Math.random() * 50000) + 5000,
  }));
  
  return {
    title: language === 'ar' ? 'التقرير المالي' : 'Financial Report',
    dateRange: formatDateRange(start, end, language),
    summary: {
      totalInvoiced: rows.reduce((sum, r) => sum + r.invoiced, 0),
      totalPaid: rows.reduce((sum, r) => sum + r.paid, 0),
      totalPending: rows.reduce((sum, r) => sum + r.pending, 0),
      totalOverdue: Math.floor(Math.random() * 100000) + 20000,
    },
    rows,
    currency,
    language,
  };
}

function getDemoProjectData(language: 'ar' | 'en'): ProjectReportData {
  const projects = [
    { name: 'Dubai Tower Project', client: 'ABC Construction', status: 'active', progress: 75, budget: 2500000 },
    { name: 'Marina Residence', client: 'XYZ Developers', status: 'active', progress: 45, budget: 1800000 },
    { name: 'Business Bay Complex', client: 'Gulf Properties', status: 'completed', progress: 100, budget: 3500000 },
    { name: 'Palm Villa Development', client: 'Modern Architecture', status: 'pending', progress: 15, budget: 950000 },
    { name: 'Hospital Project', client: 'Healthcare Group', status: 'active', progress: 60, budget: 5000000 },
    { name: 'Shopping Mall', client: 'Retail Holdings', status: 'on-hold', progress: 30, budget: 8000000 },
  ];
  
  return {
    title: language === 'ar' ? 'تقرير المشاريع' : 'Project Report',
    dateRange: '',
    summary: {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      pending: projects.filter(p => p.status === 'pending').length,
      onHold: projects.filter(p => p.status === 'on-hold').length,
    },
    projects: projects.map(p => ({ ...p, startDate: '2024-01-01', endDate: '2024-12-31' })),
    language,
  };
}

function getDemoTaskData(language: 'ar' | 'en'): TaskReportData {
  const tasks = [
    { title: 'Complete foundation design', project: 'Dubai Tower', status: 'done', priority: 'high', dueDate: '2024-02-15', assignee: 'Ahmed Ali' },
    { title: 'Review structural drawings', project: 'Marina Residence', status: 'in-progress', priority: 'critical', dueDate: '2024-02-20', assignee: 'Sara Hassan' },
    { title: 'Submit permit application', project: 'Business Bay', status: 'todo', priority: 'medium', dueDate: '2024-02-25', assignee: 'Mohammed Omar' },
    { title: 'Client meeting preparation', project: 'Palm Villa', status: 'done', priority: 'high', dueDate: '2024-02-10', assignee: 'Fatima Khan' },
    { title: 'Budget review and approval', project: 'Hospital', status: 'in-progress', priority: 'critical', dueDate: '2024-02-18', assignee: 'Khalid Ibrahim' },
    { title: 'Material procurement', project: 'Shopping Mall', status: 'todo', priority: 'low', dueDate: '2024-03-01', assignee: 'Noura Ahmed' },
  ];
  
  return {
    title: language === 'ar' ? 'تقرير المهام' : 'Task Report',
    dateRange: '',
    summary: {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: 2,
    },
    tasks,
    language,
  };
}

function getDemoClientData(language: 'ar' | 'en', currency: string): ClientReportData {
  const clients = [
    { name: 'ABC Construction', email: 'info@abc-construction.ae', phone: '+971 4 123 4567', contactPerson: 'Ahmed Al Maktoum', totalInvoiced: 2500000, totalPaid: 2200000 },
    { name: 'XYZ Developers', email: 'contact@xyz-dev.ae', phone: '+971 4 234 5678', contactPerson: 'Sara Al Rashid', totalInvoiced: 1800000, totalPaid: 1500000 },
    { name: 'Gulf Properties', email: 'info@gulf-properties.ae', phone: '+971 4 345 6789', contactPerson: 'Mohammed Al Nahyan', totalInvoiced: 3500000, totalPaid: 3000000 },
    { name: 'Modern Architecture', email: 'hello@modern-arch.ae', phone: '+971 4 456 7890', contactPerson: 'Fatima Al Suwaidi', totalInvoiced: 950000, totalPaid: 850000 },
    { name: 'Healthcare Group', email: 'contact@healthcare.ae', phone: '+971 4 567 8901', contactPerson: 'Khalid Al Qassimi', totalInvoiced: 5000000, totalPaid: 4500000 },
  ];
  
  return {
    title: language === 'ar' ? 'تقرير العملاء' : 'Client Report',
    dateRange: '',
    summary: {
      total: clients.length,
      active: clients.filter(c => c.totalInvoiced > 0).length,
      totalRevenue: clients.reduce((sum, c) => sum + c.totalInvoiced, 0),
    },
    clients,
    currency,
    language,
  };
}

function getDemoInvoiceData(language: 'ar' | 'en', currency: string): InvoiceReportData {
  const invoices = [
    { invoiceNumber: 'INV-2024-001', client: 'ABC Construction', project: 'Dubai Tower', total: 500000, paidAmount: 450000, status: 'paid', issueDate: '2024-01-15', dueDate: '2024-02-15' },
    { invoiceNumber: 'INV-2024-002', client: 'XYZ Developers', project: 'Marina Residence', total: 350000, paidAmount: 200000, status: 'pending', issueDate: '2024-01-20', dueDate: '2024-02-20' },
    { invoiceNumber: 'INV-2024-003', client: 'Gulf Properties', project: 'Business Bay', total: 750000, paidAmount: 750000, status: 'paid', issueDate: '2024-01-25', dueDate: '2024-02-25' },
    { invoiceNumber: 'INV-2024-004', client: 'Modern Architecture', project: 'Palm Villa', total: 200000, paidAmount: 0, status: 'overdue', issueDate: '2023-12-01', dueDate: '2024-01-01' },
    { invoiceNumber: 'INV-2024-005', client: 'Healthcare Group', project: 'Hospital', total: 1000000, paidAmount: 600000, status: 'pending', issueDate: '2024-02-01', dueDate: '2024-03-01' },
  ];
  
  return {
    title: language === 'ar' ? 'تقرير الفواتير' : 'Invoice Report',
    dateRange: '',
    summary: {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => i.status === 'pending').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
    },
    invoices,
    currency,
    language,
  };
}

// GET handler for export
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'pdf' | 'excel';
    const report = searchParams.get('report') as 'financial' | 'projects' | 'tasks' | 'clients' | 'invoices';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const language = (searchParams.get('language') as 'ar' | 'en') || 'ar';
    
    // Validate parameters
    if (!type || !['pdf', 'excel'].includes(type)) {
      return errorResponse('Invalid export type. Use "pdf" or "excel".', 'INVALID_TYPE', 400);
    }
    
    if (!report || !['financial', 'projects', 'tasks', 'clients', 'invoices'].includes(report)) {
      return errorResponse('Invalid report type. Use: financial, projects, tasks, clients, invoices', 'INVALID_REPORT', 400);
    }
    
    // Get user
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    const currency = user.organization?.currency || 'AED';
    const { start, end } = getDateRange(startDate, endDate);
    
    let buffer: Buffer;
    let contentType: string;
    let filename: string;
    
    if (type === 'pdf') {
      // Generate PDF
      contentType = 'application/pdf';
      filename = `${report}-report.pdf`;
      
      switch (report) {
        case 'financial': {
          const data = getDemoFinancialData(start, end, language, currency);
          buffer = generateFinancialReportPDF(data);
          break;
        }
        case 'projects': {
          const data = getDemoProjectData(language);
          buffer = generateProjectReportPDF(data);
          break;
        }
        case 'tasks': {
          const data = getDemoTaskData(language);
          buffer = generateTaskReportPDF(data);
          break;
        }
        case 'clients': {
          const data = getDemoClientData(language, currency);
          buffer = generateClientReportPDF(data);
          break;
        }
        case 'invoices': {
          const data = getDemoInvoiceData(language, currency);
          buffer = generateInvoiceReportPDF(data);
          break;
        }
        default:
          return errorResponse('Invalid report type', 'INVALID_REPORT', 400);
      }
    } else {
      // Generate Excel
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `${report}-report.xlsx`;
      
      switch (report) {
        case 'financial': {
          const data = getDemoFinancialData(start, end, language, currency);
          const excelData: FinancialExcelData = {
            summary: data.summary,
            monthlyData: data.rows.map(r => ({
              date: r.date,
              invoiced: r.invoiced,
              paid: r.paid,
              pending: r.pending,
            })),
            currency,
            language,
          };
          buffer = generateFinancialReportExcel(excelData);
          break;
        }
        case 'projects': {
          const data = getDemoProjectData(language);
          const excelData: ProjectExcelData = {
            summary: data.summary,
            projects: data.projects.map(p => ({
              name: p.name,
              client: p.client,
              status: p.status,
              progress: p.progress,
              budget: p.budget,
              startDate: '2024-01-01',
              endDate: '2024-12-31',
            })),
            language,
          };
          buffer = generateProjectReportExcel(excelData);
          break;
        }
        case 'tasks': {
          const data = getDemoTaskData(language);
          const excelData: TaskExcelData = {
            summary: data.summary,
            tasks: data.tasks,
            language,
          };
          buffer = generateTaskReportExcel(excelData);
          break;
        }
        case 'clients': {
          const data = getDemoClientData(language, currency);
          const excelData: ClientExcelData = {
            summary: data.summary,
            clients: data.clients,
            currency,
            language,
          };
          buffer = generateClientReportExcel(excelData);
          break;
        }
        case 'invoices': {
          const data = getDemoInvoiceData(language, currency);
          const excelData: InvoiceExcelData = {
            summary: data.summary,
            invoices: data.invoices,
            currency,
            language,
          };
          buffer = generateInvoiceReportExcel(excelData);
          break;
        }
        default:
          return errorResponse('Invalid report type', 'INVALID_REPORT', 400);
      }
    }
    
    // Return file response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
    
  } catch (error: unknown) {
    console.error('Export API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
    return errorResponse(errorMessage, 'EXPORT_ERROR', 500);
  }
}
