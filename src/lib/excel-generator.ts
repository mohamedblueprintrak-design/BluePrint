import * as XLSX from 'xlsx';

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

// Style for header cells
function _styleHeaderCell(ws: XLSX.WorkSheet, rowIndex: number, colCount: number) {
  const _range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = 0; col < colCount; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }
}

// Generate Financial Report Excel
export function generateFinancialReportExcel(data: FinancialExcelData): Buffer {
  const wb = XLSX.utils.book_new();
  const labels = getLabels(data.language);
  
  // Summary sheet
  const summaryData = [
    [labels.financialReport],
    [],
    [labels.summary],
    [labels.totalInvoiced, `${data.summary.totalInvoiced} ${data.currency}`],
    [labels.totalPaid, `${data.summary.totalPaid} ${data.currency}`],
    [labels.totalPending, `${data.summary.totalPending} ${data.currency}`],
    [labels.totalOverdue, `${data.summary.totalOverdue} ${data.currency}`],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, labels.summary);
  
  // Monthly data sheet
  const monthlyHeaders = [labels.date, labels.invoiced, labels.paid, labels.pending];
  const monthlyRows = data.monthlyData.map(row => [
    row.date,
    row.invoiced,
    row.paid,
    row.pending,
  ]);
  const monthlySheet = XLSX.utils.aoa_to_sheet([monthlyHeaders, ...monthlyRows]);
  monthlySheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, monthlySheet, data.language === 'ar' ? 'البيانات الشهرية' : 'Monthly Data');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Generate Project Report Excel
export function generateProjectReportExcel(data: ProjectExcelData): Buffer {
  const wb = XLSX.utils.book_new();
  const labels = getLabels(data.language);
  
  // Summary sheet
  const summaryData = [
    [labels.projectReport],
    [],
    [labels.summary],
    [labels.totalProjects, data.summary.total],
    [labels.active, data.summary.active],
    [labels.completed, data.summary.completed],
    [labels.pending, data.summary.pending],
    [labels.onHold, data.summary.onHold],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, labels.summary);
  
  // Projects sheet
  const projectHeaders = [
    labels.projectName,
    labels.client,
    labels.status,
    labels.progress,
    labels.budget,
    labels.startDate,
    labels.endDate,
  ];
  const projectRows = data.projects.map(p => [
    p.name,
    p.client,
    p.status,
    `${p.progress}%`,
    p.budget,
    p.startDate,
    p.endDate,
  ]);
  const projectSheet = XLSX.utils.aoa_to_sheet([projectHeaders, ...projectRows]);
  projectSheet['!cols'] = [
    { wch: 30 },
    { wch: 25 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, projectSheet, data.language === 'ar' ? 'المشاريع' : 'Projects');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Generate Task Report Excel
export function generateTaskReportExcel(data: TaskExcelData): Buffer {
  const wb = XLSX.utils.book_new();
  const labels = getLabels(data.language);
  
  // Summary sheet
  const summaryData = [
    [labels.taskReport],
    [],
    [labels.summary],
    [labels.totalTasks, data.summary.total],
    [labels.todo, data.summary.todo],
    [labels.inProgress, data.summary.inProgress],
    [labels.done, data.summary.done],
    [labels.overdue, data.summary.overdue],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, labels.summary);
  
  // Tasks sheet
  const taskHeaders = [
    labels.taskTitle,
    labels.project,
    labels.status,
    labels.priority,
    labels.dueDate,
    labels.assignee,
  ];
  const taskRows = data.tasks.map(t => [
    t.title,
    t.project,
    t.status,
    t.priority,
    t.dueDate,
    t.assignee,
  ]);
  const taskSheet = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows]);
  taskSheet['!cols'] = [
    { wch: 35 },
    { wch: 25 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, taskSheet, data.language === 'ar' ? 'المهام' : 'Tasks');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Generate Client Report Excel
export function generateClientReportExcel(data: ClientExcelData): Buffer {
  const wb = XLSX.utils.book_new();
  const labels = getLabels(data.language);
  
  // Summary sheet
  const summaryData = [
    [labels.clientReport],
    [],
    [labels.summary],
    [labels.totalClients, data.summary.total],
    [labels.activeClients, data.summary.active],
    [labels.totalRevenue, `${data.summary.totalRevenue} ${data.currency}`],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, labels.summary);
  
  // Clients sheet
  const clientHeaders = [
    labels.name,
    labels.email,
    labels.phone,
    labels.contactPerson,
    labels.totalInvoiced,
    labels.totalPaid,
  ];
  const clientRows = data.clients.map(c => [
    c.name,
    c.email || '-',
    c.phone || '-',
    c.contactPerson || '-',
    c.totalInvoiced,
    c.totalPaid,
  ]);
  const clientSheet = XLSX.utils.aoa_to_sheet([clientHeaders, ...clientRows]);
  clientSheet['!cols'] = [
    { wch: 30 },
    { wch: 25 },
    { wch: 18 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, clientSheet, data.language === 'ar' ? 'العملاء' : 'Clients');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Generate Invoice Report Excel
export function generateInvoiceReportExcel(data: InvoiceExcelData): Buffer {
  const wb = XLSX.utils.book_new();
  const labels = getLabels(data.language);
  
  // Summary sheet
  const summaryData = [
    [labels.invoiceReport],
    [],
    [labels.summary],
    [labels.totalInvoices, data.summary.total],
    [labels.paid, data.summary.paid],
    [labels.pending, data.summary.pending],
    [labels.overdue, data.summary.overdue],
    [labels.amount, `${data.summary.totalAmount} ${data.currency}`],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, labels.summary);
  
  // Invoices sheet
  const invoiceHeaders = [
    labels.invoiceNumber,
    labels.client,
    labels.project,
    labels.amount,
    labels.paidAmount,
    labels.status,
    labels.issueDate,
    labels.dueDate,
  ];
  const invoiceRows = data.invoices.map(inv => [
    inv.invoiceNumber,
    inv.client,
    inv.project,
    inv.total,
    inv.paidAmount,
    inv.status,
    inv.issueDate,
    inv.dueDate,
  ]);
  const invoiceSheet = XLSX.utils.aoa_to_sheet([invoiceHeaders, ...invoiceRows]);
  invoiceSheet['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, invoiceSheet, data.language === 'ar' ? 'الفواتير' : 'Invoices');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
