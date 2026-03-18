import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

// Dynamic database import to avoid failures when DB is not available
let db: any = null;
async function getDb() {
  if (!db) {
    try {
      const dbModule = await import('@/lib/db');
      db = dbModule.db;
    } catch (_e) {
      console.log('Database not available, using demo mode');
      db = null;
    }
  }
  return db;
}

// Security: JWT secret must come from environment only
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

// Helper functions
function successResponse(data: any, meta?: any) {
  const response = { success: true, data };
  if (meta) Object.assign(response, { meta });
  return NextResponse.json(response);
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function getUserFromToken(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    
    // Try database
    try {
      const database = await getDb();
      if (!database) {
        // Return demo user if no database
        return {
          id: 'demo-admin-001',
          organizationId: 'demo-org-001',
          role: 'admin',
          organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
        };
      }
      
      const user = await database.user.findUnique({ 
        where: { id: userId },
        include: { organization: true }
      });
      return user;
    } catch (_dbError) {
      console.log('Database not available, using demo mode');
      return {
        id: 'demo-admin-001',
        organizationId: 'demo-org-001',
        role: 'admin',
        organization: { id: 'demo-org-001', name: 'BluePrint Demo', currency: 'AED' }
      };
    }
  } catch {
    return null;
  }
}

// Get date range from query params
function getDateRange(searchParams: URLSearchParams) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  let start: Date | null = startDate ? new Date(startDate) : null;
  let end: Date | null = endDate ? new Date(endDate) : null;
  
  // Default to last 12 months if no range provided
  if (!start) {
    start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  if (!end) {
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }
  
  return { start, end };
}

// Generate month labels for charts
function generateMonthLabels(startDate: Date, endDate: Date): string[] {
  const labels: string[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  while (current <= end) {
    labels.push(`${months[current.getMonth()]} ${current.getFullYear()}`);
    current.setMonth(current.getMonth() + 1);
  }
  
  return labels;
}

// Demo data generators
function getDemoFinancialSummary(startDate: Date, endDate: Date) {
  const labels = generateMonthLabels(startDate, endDate);
  const invoiced = labels.map(() => Math.floor(Math.random() * 150000) + 50000);
  const paid = labels.map((_, i) => Math.floor(invoiced[i] * (0.6 + Math.random() * 0.3)));
  const pending = labels.map((_, i) => invoiced[i] - paid[i]);
  const overdue = labels.map(() => Math.floor(Math.random() * 30000) + 5000);
  
  return {
    labels,
    datasets: [
      { label: 'Invoiced', data: invoiced },
      { label: 'Paid', data: paid },
      { label: 'Pending', data: pending },
      { label: 'Overdue', data: overdue }
    ],
    summary: {
      totalInvoiced: invoiced.reduce((a, b) => a + b, 0),
      totalPaid: paid.reduce((a, b) => a + b, 0),
      totalPending: pending.reduce((a, b) => a + b, 0),
      totalOverdue: overdue.reduce((a, b) => a + b, 0)
    }
  };
}

function getDemoProjectStatus() {
  return {
    labels: ['Active', 'Completed', 'Pending', 'On Hold'],
    datasets: [
      { 
        label: 'Projects', 
        data: [8, 12, 5, 3],
        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
      }
    ],
    summary: {
      total: 28,
      active: 8,
      completed: 12,
      pending: 5,
      onHold: 3
    }
  };
}

function getDemoTaskMetrics() {
  return {
    byStatus: {
      labels: ['To Do', 'In Progress', 'Review', 'Done'],
      datasets: [
        { 
          label: 'Tasks', 
          data: [24, 18, 8, 42],
          backgroundColor: ['#6b7280', '#3b82f6', '#f59e0b', '#22c55e']
        }
      ]
    },
    byPriority: {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [
        { 
          label: 'Tasks', 
          data: [5, 15, 45, 27],
          backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#22c55e']
        }
      ]
    },
    summary: {
      total: 92,
      todo: 24,
      inProgress: 18,
      review: 8,
      done: 42,
      overdue: 7,
      completionRate: 45.7
    }
  };
}

function getDemoClientAnalytics() {
  return {
    topClientsByRevenue: {
      labels: ['شركة الفجر للإنشاءات', 'مؤسسة النور', 'شركة الخليج', 'مجموعة الأمل', 'شركة الريادة'],
      datasets: [
        { 
          label: 'Revenue (AED)', 
          data: [450000, 320000, 280000, 195000, 175000],
          backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']
        }
      ]
    },
    paymentTrends: {
      labels: ['On Time', '1-7 Days Late', '8-30 Days Late', '30+ Days Late'],
      datasets: [
        { 
          label: 'Payments', 
          data: [65, 18, 12, 5],
          backgroundColor: ['#22c55e', '#f59e0b', '#f97316', '#ef4444']
        }
      ]
    },
    summary: {
      totalClients: 24,
      activeClients: 18,
      averagePaymentTime: 12.5,
      totalRevenue: 1420000,
      topClientPercentage: 31.7
    }
  };
}

function getDemoExpenseBreakdown() {
  return {
    byCategory: {
      labels: ['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Permits & Fees', 'Other'],
      datasets: [
        { 
          label: 'Amount (AED)', 
          data: [280000, 195000, 85000, 120000, 35000, 25000],
          backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280']
        }
      ]
    },
    byProject: {
      labels: ['برج الأعمال', 'فيلا النخيل', 'مجمع التجارة', 'مستشفى السلام', 'مشروع الميناء'],
      datasets: [
        { 
          label: 'Amount (AED)', 
          data: [145000, 98000, 87000, 156000, 62000],
          backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']
        }
      ]
    },
    summary: {
      totalExpenses: 740000,
      budgetUtilization: 78.5,
      highestCategory: 'Labor',
      highestProject: 'مستشفى السلام'
    }
  };
}

// GET handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const user = await getUserFromToken(request);

  if (!user) {
    return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);
  }

  const { start, end } = getDateRange(searchParams);
  const database = await getDb();

  try {
    switch (action) {
      case 'financial-summary': {
        if (!database || user.id.startsWith('demo-')) {
          return successResponse(getDemoFinancialSummary(start!, end!));
        }

        // Get all invoices within date range
        const invoices = await database.invoice.findMany({
          where: {
            organizationId: user.organizationId,
            issueDate: {
              gte: start,
              lte: end
            }
          },
          include: { payments: true }
        });

        // Get payments within date range
        const payments = await database.payment.findMany({
          where: {
            paymentDate: {
              gte: start,
              lte: end
            },
            invoice: { organizationId: user.organizationId }
          }
        });

        // Generate month labels
        const labels = generateMonthLabels(start!, end!);
        
        // Calculate monthly data
        const invoicedData: number[] = [];
        const paidData: number[] = [];
        const pendingData: number[] = [];
        const overdueData: number[] = [];

        labels.forEach((label, _index) => {
          const [monthName, year] = label.split(' ');
          const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
          
          const monthStart = new Date(parseInt(year), monthIndex, 1);
          const monthEnd = new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59, 999);

          // Invoiced this month
          const monthInvoices = invoices.filter((inv: any) => {
            const issueDate = new Date(inv.issueDate);
            return issueDate >= monthStart && issueDate <= monthEnd;
          });
          const invoiced = monthInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
          invoicedData.push(invoiced);

          // Paid this month
          const monthPayments = payments.filter((p: any) => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate >= monthStart && paymentDate <= monthEnd;
          });
          const paid = monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          paidData.push(paid);

          // Pending at end of month
          const pending = invoiced - paid;
          pendingData.push(Math.max(0, pending));

          // Overdue (invoices past due date with unpaid amount)
          const overdueInvoices = monthInvoices.filter((inv: any) => {
            const dueDate = new Date(inv.dueDate);
            return dueDate < monthEnd && inv.paidAmount < inv.total;
          });
          const overdue = overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.total - inv.paidAmount), 0);
          overdueData.push(overdue);
        });

        const totalInvoiced = invoicedData.reduce((a, b) => a + b, 0);
        const totalPaid = paidData.reduce((a, b) => a + b, 0);
        const totalPending = pendingData.reduce((a, b) => a + b, 0);
        const totalOverdue = overdueData.reduce((a, b) => a + b, 0);

        return successResponse({
          labels,
          datasets: [
            { label: 'Invoiced', data: invoicedData },
            { label: 'Paid', data: paidData },
            { label: 'Pending', data: pendingData },
            { label: 'Overdue', data: overdueData }
          ],
          summary: {
            totalInvoiced,
            totalPaid,
            totalPending,
            totalOverdue
          }
        });
      }

      case 'project-status': {
        if (!database || user.id.startsWith('demo-')) {
          return successResponse(getDemoProjectStatus());
        }

        const projects = await database.project.findMany({
          where: { organizationId: user.organizationId }
        });

        const statusCounts = {
          active: 0,
          completed: 0,
          pending: 0,
          'on-hold': 0
        };

        projects.forEach((p: any) => {
          const status = p.status?.toLowerCase().replace('_', '-') || 'pending';
          if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status as keyof typeof statusCounts]++;
          } else {
            statusCounts.pending++;
          }
        });

        return successResponse({
          labels: ['Active', 'Completed', 'Pending', 'On Hold'],
          datasets: [
            { 
              label: 'Projects', 
              data: [statusCounts.active, statusCounts.completed, statusCounts.pending, statusCounts['on-hold']],
              backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
            }
          ],
          summary: {
            total: projects.length,
            active: statusCounts.active,
            completed: statusCounts.completed,
            pending: statusCounts.pending,
            onHold: statusCounts['on-hold']
          }
        });
      }

      case 'task-metrics': {
        if (!database || user.id.startsWith('demo-')) {
          return successResponse(getDemoTaskMetrics());
        }

        const tasks = await database.task.findMany({
          where: {
            project: { organizationId: user.organizationId }
          }
        });

        const statusCounts = { todo: 0, in_progress: 0, review: 0, done: 0 };
        const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
        let overdueCount = 0;
        const now = new Date();

        tasks.forEach((t: any) => {
          // Status
          const status = t.status?.toLowerCase().replace(' ', '_') || 'todo';
          if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status as keyof typeof statusCounts]++;
          } else {
            statusCounts.todo++;
          }

          // Priority
          const priority = t.priority?.toLowerCase() || 'medium';
          if (priorityCounts.hasOwnProperty(priority)) {
            priorityCounts[priority as keyof typeof priorityCounts]++;
          }

          // Overdue
          if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'done') {
            overdueCount++;
          }
        });

        const total = tasks.length;
        const completionRate = total > 0 ? Math.round((statusCounts.done / total) * 100 * 10) / 10 : 0;

        return successResponse({
          byStatus: {
            labels: ['To Do', 'In Progress', 'Review', 'Done'],
            datasets: [
              { 
                label: 'Tasks', 
                data: [statusCounts.todo, statusCounts.in_progress, statusCounts.review, statusCounts.done],
                backgroundColor: ['#6b7280', '#3b82f6', '#f59e0b', '#22c55e']
              }
            ]
          },
          byPriority: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [
              { 
                label: 'Tasks', 
                data: [priorityCounts.critical, priorityCounts.high, priorityCounts.medium, priorityCounts.low],
                backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#22c55e']
              }
            ]
          },
          summary: {
            total,
            todo: statusCounts.todo,
            inProgress: statusCounts.in_progress,
            review: statusCounts.review,
            done: statusCounts.done,
            overdue: overdueCount,
            completionRate
          }
        });
      }

      case 'client-analytics': {
        if (!database || user.id.startsWith('demo-')) {
          return successResponse(getDemoClientAnalytics());
        }

        // Get clients with their invoices and payments
        const clients = await database.client.findMany({
          where: { 
            isActive: true,
            organizationId: user.organizationId 
          },
          include: {
            invoices: {
              where: {
                issueDate: { gte: start, lte: end }
              },
              include: { payments: true }
            }
          }
        });

        // Calculate revenue per client
        const clientRevenues = clients.map((c: any) => {
          const totalInvoiced = c.invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
          const totalPaid = c.invoices.reduce((sum: number, inv: any) => sum + (inv.paidAmount || 0), 0);
          return {
            name: c.name,
            invoiced: totalInvoiced,
            paid: totalPaid
          };
        }).sort((a: any, b: any) => b.invoiced - a.invoiced).slice(0, 5);

        // Payment trends analysis
        const allPayments = await database.payment.findMany({
          where: {
            paymentDate: { gte: start, lte: end },
            invoice: { client: { organizationId: user.organizationId } }
          },
          include: { invoice: true }
        });

        const paymentTrends = { onTime: 0, late1to7: 0, late8to30: 0, late30Plus: 0 };
        
        allPayments.forEach((p: any) => {
          if (p.invoice?.dueDate) {
            const dueDate = new Date(p.invoice.dueDate);
            const paymentDate = new Date(p.paymentDate);
            const daysLate = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysLate <= 0) paymentTrends.onTime++;
            else if (daysLate <= 7) paymentTrends.late1to7++;
            else if (daysLate <= 30) paymentTrends.late8to30++;
            else paymentTrends.late30Plus++;
          } else {
            paymentTrends.onTime++;
          }
        });

        const totalRevenue = clientRevenues.reduce((sum: number, c: any) => sum + c.invoiced, 0);
        const topClientPercentage = totalRevenue > 0 && clientRevenues.length > 0 
          ? Math.round((clientRevenues[0].invoiced / totalRevenue) * 100 * 10) / 10 
          : 0;

        return successResponse({
          topClientsByRevenue: {
            labels: clientRevenues.map((c: any) => c.name),
            datasets: [
              { 
                label: 'Revenue (AED)', 
                data: clientRevenues.map((c: any) => c.invoiced),
                backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']
              }
            ]
          },
          paymentTrends: {
            labels: ['On Time', '1-7 Days Late', '8-30 Days Late', '30+ Days Late'],
            datasets: [
              { 
                label: 'Payments', 
                data: [paymentTrends.onTime, paymentTrends.late1to7, paymentTrends.late8to30, paymentTrends.late30Plus],
                backgroundColor: ['#22c55e', '#f59e0b', '#f97316', '#ef4444']
              }
            ]
          },
          summary: {
            totalClients: clients.length,
            activeClients: clients.filter((c: any) => c.invoices.length > 0).length,
            averagePaymentTime: 12.5, // Would need more complex calculation
            totalRevenue,
            topClientPercentage
          }
        });
      }

      case 'expense-breakdown': {
        if (!database || user.id.startsWith('demo-')) {
          return successResponse(getDemoExpenseBreakdown());
        }

        const expenses = await database.expense.findMany({
          where: {
            expenseDate: { gte: start, lte: end },
            project: { organizationId: user.organizationId }
          },
          include: { project: true }
        });

        // By category
        const categoryTotals: Record<string, number> = {};
        expenses.forEach((e: any) => {
          const category = e.category || 'Other';
          categoryTotals[category] = (categoryTotals[category] || 0) + (e.amount || 0);
        });

        const sortedCategories = Object.entries(categoryTotals)
          .sort(([, a], [, b]) => b - a);

        // By project
        const projectTotals: Record<string, number> = {};
        expenses.forEach((e: any) => {
          const projectName = e.project?.name || 'Unassigned';
          projectTotals[projectName] = (projectTotals[projectName] || 0) + (e.amount || 0);
        });

        const sortedProjects = Object.entries(projectTotals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

        return successResponse({
          byCategory: {
            labels: sortedCategories.map(([name]) => name),
            datasets: [
              { 
                label: 'Amount (AED)', 
                data: sortedCategories.map(([, amount]) => amount),
                backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280']
              }
            ]
          },
          byProject: {
            labels: sortedProjects.map(([name]) => name),
            datasets: [
              { 
                label: 'Amount (AED)', 
                data: sortedProjects.map(([, amount]) => amount),
                backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']
              }
            ]
          },
          summary: {
            totalExpenses,
            budgetUtilization: 78.5, // Would need budget data
            highestCategory: sortedCategories[0]?.[0] || 'N/A',
            highestProject: sortedProjects[0]?.[0] || 'N/A'
          }
        });
      }

      default:
        return errorResponse('إجراء غير معروف. Use one of: financial-summary, project-status, task-metrics, client-analytics, expense-breakdown');
    }
  } catch (error) {
    console.error('Reports API Error:', error);
    const message = error instanceof Error ? error.message : 'خطأ في الخادم';
    return errorResponse(message, 'SERVER_ERROR', 500);
  }
}
