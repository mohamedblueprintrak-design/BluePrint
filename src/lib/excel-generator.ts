import { Workbook, Worksheet } from 'exceljs';

// Types for Excel export
export interface FinancialExcelData {
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
  };
  monthlyData: Array<{
    date: string;
    invoiced: number;
    paid: number;
    pending: number;
  }>;
  currency: string;
  language: 'ar' | 'en';
}

export interface ProjectExcelData {
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
    startDate: string;
    endDate: string;
  }>;
  language: 'ar' | 'en';
}

export interface TaskExcelData {
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

export interface ClientExcelData {
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

export interface InvoiceExcelData {
  summary: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount?: number;
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

// Get labels based on language
function getLabels(language: 'ar' | 'en') {
  if (language === 'ar') {
    return {
      // Financial
      financialReport: 'التقرير المالي',
      summary: 'الملخص',
      totalInvoiced: 'إجمالي الفواتير',
      totalPaid: 'المبالغ المحصلة',
      totalPending: 'المبالغ المعلقة',
      totalOverdue: 'المبالغ المتأخرة',
      date: 'التاريخ',
      invoiced: 'الفواتير',
      paid: 'المدفوعات',
      pending: 'المتأخرات',
      
      // Projects
      projectReport: 'تقرير المشاريع',
      totalProjects: 'إجمالي المشاريع',
      active: 'نشط',
      completed: 'مكتمل',
      onHold: 'متوقف',
      projectName: 'اسم المشروع',
      client: 'العميل',
      status: 'الحالة',
      progress: 'التقدم',
      budget: 'الميزانية',
      startDate: 'تاريخ البداية',
      endDate: 'تاريخ النهاية',
      
      // Tasks
      taskReport: 'تقرير المهام',
      totalTasks: 'إجمالي المهام',
      todo: 'للتنفيذ',
      inProgress: 'قيد التنفيذ',
      done: 'منجز',
      overdue: 'متأخر',
      taskTitle: 'المهمة',
      project: 'المشروع',
      priority: 'الأولوية',
      dueDate: 'تاريخ الاستحقاق',
      assignee: 'المسؤول',
      
      // Clients
      clientReport: 'تقرير العملاء',
      totalClients: 'إجمالي العملاء',
      activeClients: 'العملاء النشطون',
      totalRevenue: 'إجمالي الإيرادات',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      contactPerson: 'جهة الاتصال',
      
      // Invoices
      invoiceReport: 'تقرير الفواتير',
      totalInvoices: 'إجمالي الفواتير',
      invoiceNumber: 'رقم الفاتورة',
      amount: 'المبلغ',
      paidAmount: 'المبلغ المدفوع',
      issueDate: 'تاريخ الإصدار',
    };
  }
  
  return {
    // Financial
    financialReport: 'Financial Report',
    summary: 'Summary',
    totalInvoiced: 'Total Invoiced',
    totalPaid: 'Total Paid',
    totalPending: 'Total Pending',
    totalOverdue: 'Total Overdue',
    date: 'Date',
    invoiced: 'Invoiced',
    paid: 'Paid',
    pending: 'Pending',
    
    // Projects
    projectReport: 'Project Report',
    totalProjects: 'Total Projects',
    active: 'Active',
    completed: 'Completed',
    onHold: 'On Hold',
    projectName: 'Project Name',
    client: 'Client',
    status: 'Status',
    progress: 'Progress',
    budget: 'Budget',
    startDate: 'Start Date',
    endDate: 'End Date',
    
    // Tasks
    taskReport: 'Task Report',
    totalTasks: 'Total Tasks',
    todo: 'To Do',
    inProgress: 'In Progress',
    done: 'Done',
    overdue: 'Overdue',
    taskTitle: 'Task',
    project: 'Project',
    priority: 'Priority',
    dueDate: 'Due Date',
    assignee: 'Assignee',
    
    // Clients
    clientReport: 'Client Report',
    totalClients: 'Total Clients',
    activeClients: 'Active Clients',
    totalRevenue: 'Total Revenue',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    contactPerson: 'Contact Person',
    
    // Invoices
    invoiceReport: 'Invoice Report',
    totalInvoices: 'Total Invoices',
    invoiceNumber: 'Invoice #',
    amount: 'Amount',
    paidAmount: 'Paid Amount',
    issueDate: 'Issue Date',
  };
}

// Header style
const HEADER_STYLE = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF3B82F6' } },
  alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
};

// Apply header style to a row
function styleHeaderRow(worksheet: Worksheet, rowCount: number) {
  for (let col = 1; col <= rowCount; col++) {
    const cell = worksheet.getRow(1).getCell(col);
    Object.assign(cell, HEADER_STYLE);
  }
}

// Generate Financial Report Excel
export async function generateFinancialReportExcel(data: FinancialExcelData): Promise<Buffer> {
  const workbook = new Workbook();
  const labels = getLabels(data.language);
  
  // Summary sheet
  const summarySheet = workbook.addWorksheet(labels.summary);
  summarySheet.columns = [
    { width: 25 },
    { width: 20 },
  ];
  
  summarySheet.addRow([labels.financialReport]);
  summarySheet.addRow([]);
  summarySheet.addRow([labels.summary]);
  summarySheet.addRow([labels.totalInvoiced, `${data.summary.totalInvoiced} ${data.currency}`]);
  summarySheet.addRow([labels.totalPaid, `${data.summary.totalPaid} ${data.currency}`]);
  summarySheet.addRow([labels.totalPending, `${data.summary.totalPending} ${data.currency}`]);
  summarySheet.addRow([labels.totalOverdue, `${data.summary.totalOverdue} ${data.currency}`]);
  
  // Monthly data sheet
  const monthlySheet = workbook.addWorksheet(data.language === 'ar' ? 'البيانات الشهرية' : 'Monthly Data');
  monthlySheet.columns = [
    { key: 'date', width: 15 },
    { key: 'invoiced', width: 15 },
    { key: 'paid', width: 15 },
    { key: 'pending', width: 15 },
  ];
  
  monthlySheet.addRow([labels.date, labels.invoiced, labels.paid, labels.pending]);
  styleHeaderRow(monthlySheet, 4);
  
  data.monthlyData.forEach(row => {
    monthlySheet.addRow([row.date, row.invoiced, row.paid, row.pending]);
  });
  
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// Generate Project Report Excel
export async function generateProjectReportExcel(data: ProjectExcelData): Promise<Buffer> {
  const workbook = new Workbook();
  const labels = getLabels(data.language);
  
  // Summary sheet
  const summarySheet = workbook.addWorksheet(labels.summary);
  summarySheet.columns = [
    { width: 25 },
    { width: 15 },
  ];
  
  summarySheet.addRow([labels.projectReport]);
  summarySheet.addRow([]);
  summarySheet.addRow([labels.summary]);
  summarySheet.addRow([labels.totalProjects, data.summary.total]);
  summarySheet.addRow([labels.active, data.summary.active]);
  summarySheet.addRow([labels.completed, data.summary.completed]);
  summarySheet.addRow([labels.pending, data.summary.pending]);
  summarySheet.addRow([labels.onHold, data.summary.onHold]);
  
  // Projects sheet
  const projectSheet = workbook.addWorksheet(data.language === 'ar' ? 'المشاريع' : 'Projects');
  projectSheet.columns = [
    { key: 'name', width: 30 },
    { key: 'client', width: 25 },
    { key: 'status', width: 12 },
    { key: 'progress', width: 10 },
    { key: 'budget', width: 15 },
    { key: 'startDate', width: 12 },
    { key: 'endDate', width: 12 },
  ];
  
  projectSheet.addRow([
    labels.projectName,
    labels.client,
    labels.status,
    labels.progress,
    labels.budget,
    labels.startDate,
    labels.endDate,
  ]);
  styleHeaderRow(projectSheet, 7);
  
  data.projects.forEach(p => {
    projectSheet.addRow([
      p.name,
      p.client,
      p.status,
      `${p.progress}%`,
      p.budget,
      p.startDate,
      p.endDate,
    ]);
  });
  
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// Generate Task Report Excel
export async function generateTaskReportExcel(data: TaskExcelData): Promise<Buffer> {
  const workbook = new Workbook();
  const labels = getLabels(data.language);
  
  // Summary sheet
  const summarySheet = workbook.addWorksheet(labels.summary);
  summarySheet.columns = [
    { width: 25 },
    { width: 15 },
  ];
  
  summarySheet.addRow([labels.taskReport]);
  summarySheet.addRow([]);
  summarySheet.addRow([labels.summary]);
  summarySheet.addRow([labels.totalTasks, data.summary.total]);
  summarySheet.addRow([labels.todo, data.summary.todo]);
  summarySheet.addRow([labels.inProgress, data.summary.inProgress]);
  summarySheet.addRow([labels.done, data.summary.done]);
  summarySheet.addRow([labels.overdue, data.summary.overdue]);
  
  // Tasks sheet
  const taskSheet = workbook.addWorksheet(data.language === 'ar' ? 'المهام' : 'Tasks');
  taskSheet.columns = [
    { key: 'title', width: 35 },
    { key: 'project', width: 25 },
    { key: 'status', width: 12 },
    { key: 'priority', width: 10 },
    { key: 'dueDate', width: 12 },
    { key: 'assignee', width: 20 },
  ];
  
  taskSheet.addRow([
    labels.taskTitle,
    labels.project,
    labels.status,
    labels.priority,
    labels.dueDate,
    labels.assignee,
  ]);
  styleHeaderRow(taskSheet, 6);
  
  data.tasks.forEach(t => {
    taskSheet.addRow([
      t.title,
      t.project,
      t.status,
      t.priority,
      t.dueDate,
      t.assignee || '',
    ]);
  });
  
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// Generate Client Report Excel
export async function generateClientReportExcel(data: ClientExcelData): Promise<Buffer> {
  const workbook = new Workbook();
  const labels = getLabels(data.language);
  
  // Summary sheet
  const summarySheet = workbook.addWorksheet(labels.summary);
  summarySheet.columns = [
    { width: 25 },
    { width: 20 },
  ];
  
  summarySheet.addRow([labels.clientReport]);
  summarySheet.addRow([]);
  summarySheet.addRow([labels.summary]);
  summarySheet.addRow([labels.totalClients, data.summary.total]);
  summarySheet.addRow([labels.activeClients, data.summary.active]);
  summarySheet.addRow([labels.totalRevenue, `${data.summary.totalRevenue} ${data.currency}`]);
  
  // Clients sheet
  const clientSheet = workbook.addWorksheet(data.language === 'ar' ? 'العملاء' : 'Clients');
  clientSheet.columns = [
    { key: 'name', width: 30 },
    { key: 'email', width: 25 },
    { key: 'phone', width: 18 },
    { key: 'contactPerson', width: 20 },
    { key: 'totalInvoiced', width: 15 },
    { key: 'totalPaid', width: 15 },
  ];
  
  clientSheet.addRow([
    labels.name,
    labels.email,
    labels.phone,
    labels.contactPerson,
    labels.totalInvoiced,
    labels.totalPaid,
  ]);
  styleHeaderRow(clientSheet, 6);
  
  data.clients.forEach(c => {
    clientSheet.addRow([
      c.name,
      c.email || '-',
      c.phone || '-',
      c.contactPerson || '-',
      c.totalInvoiced,
      c.totalPaid,
    ]);
  });
  
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// Generate Invoice Report Excel
export async function generateInvoiceReportExcel(data: InvoiceExcelData): Promise<Buffer> {
  const workbook = new Workbook();
  const labels = getLabels(data.language);
  
  // Summary sheet
  const summarySheet = workbook.addWorksheet(labels.summary);
  summarySheet.columns = [
    { width: 25 },
    { width: 20 },
  ];
  
  summarySheet.addRow([labels.invoiceReport]);
  summarySheet.addRow([]);
  summarySheet.addRow([labels.summary]);
  summarySheet.addRow([labels.totalInvoices, data.summary.total]);
  summarySheet.addRow([labels.paid, data.summary.paid]);
  summarySheet.addRow([labels.pending, data.summary.pending]);
  summarySheet.addRow([labels.overdue, data.summary.overdue]);
  summarySheet.addRow([labels.amount, `${data.summary.totalAmount} ${data.currency}`]);
  
  // Invoices sheet
  const invoiceSheet = workbook.addWorksheet(data.language === 'ar' ? 'الفواتير' : 'Invoices');
  invoiceSheet.columns = [
    { key: 'invoiceNumber', width: 18 },
    { key: 'client', width: 25 },
    { key: 'project', width: 25 },
    { key: 'total', width: 12 },
    { key: 'paidAmount', width: 12 },
    { key: 'status', width: 12 },
    { key: 'issueDate', width: 12 },
    { key: 'dueDate', width: 12 },
  ];
  
  invoiceSheet.addRow([
    labels.invoiceNumber,
    labels.client,
    labels.project,
    labels.amount,
    labels.paidAmount,
    labels.status,
    labels.issueDate,
    labels.dueDate,
  ]);
  styleHeaderRow(invoiceSheet, 8);
  
  data.invoices.forEach(inv => {
    invoiceSheet.addRow([
      inv.invoiceNumber,
      inv.client,
      inv.project || '',
      inv.total,
      inv.paidAmount,
      inv.status,
      inv.issueDate,
      inv.dueDate,
    ]);
  });
  
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
