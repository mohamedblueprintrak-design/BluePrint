import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { db } from '@/lib/db';
import { getJWTSecret } from '../utils/auth';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { sendEmail } from '@/lib/email';

// Helper functions
function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret());
    return await db.user.findUnique({ 
      where: { id: payload.userId as string },
      include: { organization: true }
    });
  } catch {
    return null;
  }
}

// UAE Labor Law Constants
const UAE_LABOR_LAW = {
  GRATUITY: {
    FIRST_5_YEARS_DAYS: 21,
    AFTER_5_YEARS_DAYS: 30,
    MAX_YEARS: 365,
  },
  OVERTIME: {
    NORMAL_DAY: 1.25,
    WEEKEND_DAY: 1.50,
    PUBLIC_HOLIDAY: 2.50,
  },
  WORKING_HOURS_PER_DAY: 8,
};

// Calculate hourly rate
function calculateHourlyRate(monthlySalary: number): number {
  return monthlySalary / 30 / UAE_LABOR_LAW.WORKING_HOURS_PER_DAY;
}

// Calculate gratuity (End of Service Benefits)
function calculateGratuity(
  monthlySalary: number,
  yearsOfService: number,
  terminationReason: 'resignation' | 'termination' | 'end_of_contract'
): { gratuityAmount: number; breakdown: string } {
  const dailySalary = monthlySalary / 30;
  let gratuityDays = 0;
  let breakdown = '';

  if (terminationReason === 'resignation') {
    if (yearsOfService < 1) {
      gratuityDays = 0;
      breakdown = 'أقل من سنة: لا يستحق مكافأة نهاية الخدمة';
    } else if (yearsOfService < 3) {
      gratuityDays = yearsOfService * 7;
      breakdown = `1-3 سنوات: ثلث المكافأة (7 أيام/سنة × ${yearsOfService.toFixed(1)} سنوات)`;
    } else if (yearsOfService < 5) {
      gratuityDays = yearsOfService * 14;
      breakdown = `3-5 سنوات: ثلثي المكافأة (14 يوم/سنة × ${yearsOfService.toFixed(1)} سنوات)`;
    } else {
      gratuityDays = 5 * UAE_LABOR_LAW.GRATUITY.FIRST_5_YEARS_DAYS;
      gratuityDays += (yearsOfService - 5) * UAE_LABOR_LAW.GRATUITY.AFTER_5_YEARS_DAYS;
      breakdown = `5+ سنوات: كامل المكافأة (21 يوم × 5 + 30 يوم × ${(yearsOfService - 5).toFixed(1)})`;
    }
  } else {
    if (yearsOfService <= 5) {
      gratuityDays = yearsOfService * UAE_LABOR_LAW.GRATUITY.FIRST_5_YEARS_DAYS;
      breakdown = `${yearsOfService.toFixed(1)} سنوات × 21 يوم`;
    } else {
      gratuityDays = 5 * UAE_LABOR_LAW.GRATUITY.FIRST_5_YEARS_DAYS;
      gratuityDays += (yearsOfService - 5) * UAE_LABOR_LAW.GRATUITY.AFTER_5_YEARS_DAYS;
      breakdown = `21 يوم × 5 + 30 يوم × ${(yearsOfService - 5).toFixed(1)}`;
    }
  }

  if (gratuityDays > UAE_LABOR_LAW.GRATUITY.MAX_YEARS) {
    gratuityDays = UAE_LABOR_LAW.GRATUITY.MAX_YEARS;
  }

  return { gratuityAmount: dailySalary * gratuityDays, breakdown };
}

// Calculate deductions
function calculateDeductions(
  grossSalary: number,
  deductions: { absences?: number; lateArrivals?: number; unpaidLeave?: number; loans?: number; advances?: number; other?: number }
): { total: number; breakdown: Record<string, number> } {
  const dailySalary = grossSalary / 30;
  const hourlyRate = calculateHourlyRate(grossSalary);
  const breakdown: Record<string, number> = {};
  let total = 0;

  if (deductions.absences) {
    const amount = deductions.absences * dailySalary;
    breakdown['خصم الغياب'] = amount;
    total += amount;
  }
  if (deductions.lateArrivals) {
    const amount = deductions.lateArrivals * hourlyRate;
    breakdown['خصم التأخير'] = amount;
    total += amount;
  }
  if (deductions.unpaidLeave) {
    const amount = deductions.unpaidLeave * dailySalary;
    breakdown['إجازة غير مدفوعة'] = amount;
    total += amount;
  }
  if (deductions.loans) {
    breakdown['سداد سلفة'] = deductions.loans;
    total += deductions.loans;
  }
  if (deductions.advances) {
    breakdown['سداد مساعدة'] = deductions.advances;
    total += deductions.advances;
  }
  if (deductions.other) {
    breakdown['خصومات أخرى'] = deductions.other;
    total += deductions.other;
  }

  return { total, breakdown };
}

// Calculate overtime
function calculateOvertime(
  monthlySalary: number,
  overtime: { normalDays?: number; weekends?: number; publicHolidays?: number }
): { total: number; breakdown: Record<string, { hours: number; rate: number; amount: number }> } {
  const hourlyRate = calculateHourlyRate(monthlySalary);
  const breakdown: Record<string, { hours: number; rate: number; amount: number }> = {};
  let total = 0;

  if (overtime.normalDays) {
    const rate = hourlyRate * UAE_LABOR_LAW.OVERTIME.NORMAL_DAY;
    const amount = overtime.normalDays * rate;
    breakdown['أيام عادية'] = { hours: overtime.normalDays, rate, amount };
    total += amount;
  }
  if (overtime.weekends) {
    const rate = hourlyRate * UAE_LABOR_LAW.OVERTIME.WEEKEND_DAY;
    const amount = overtime.weekends * rate;
    breakdown['عطلة نهاية الأسبوع'] = { hours: overtime.weekends, rate, amount };
    total += amount;
  }
  if (overtime.publicHolidays) {
    const rate = hourlyRate * UAE_LABOR_LAW.OVERTIME.PUBLIC_HOLIDAY;
    const amount = overtime.publicHolidays * rate;
    breakdown['أعياد رسمية'] = { hours: overtime.publicHolidays, rate, amount };
    total += amount;
  }

  return { total, breakdown };
}

// POST handler
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  if (!['ADMIN', 'HR', 'MANAGER'].includes(user.role)) {
    return errorResponse('غير مصرح لك بالوصول لهذه الميزة', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'calculate_salary': {
        const { basicSalary, allowances = {}, deductions = {}, overtime = {}, bonus = 0 } = data;
        
        const totalAllowances = Object.values(allowances).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
        const grossSalary = basicSalary + totalAllowances;
        const { total: totalDeductions, breakdown: deductionBreakdown } = calculateDeductions(grossSalary, deductions);
        const { total: totalOvertime, breakdown: overtimeBreakdown } = calculateOvertime(basicSalary, overtime);
        const netSalary = grossSalary - totalDeductions + totalOvertime + bonus;

        return successResponse({
          basicSalary,
          allowances: { items: allowances, total: totalAllowances },
          grossSalary,
          deductions: { items: deductionBreakdown, total: totalDeductions },
          overtime: { items: overtimeBreakdown, total: totalOvertime },
          bonus,
          netSalary,
          currency: 'AED'
        });
      }

      case 'calculate_gratuity': {
        const { employeeId, terminationReason } = data;
        const employee = await db.user.findUnique({ where: { id: employeeId } });
        if (!employee) return errorResponse('الموظف غير موجود');

        const yearsOfService = (Date.now() - employee.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
        const monthlySalary = (employee as Record<string, unknown>).salary as number || 10000;
        const { gratuityAmount, breakdown } = calculateGratuity(monthlySalary, yearsOfService, terminationReason);

        return successResponse({
          employee: {
            id: employee.id,
            name: employee.fullName || employee.username,
            hireDate: employee.createdAt,
            yearsOfService: yearsOfService.toFixed(2),
            monthlySalary
          },
          terminationReason,
          gratuity: { amount: gratuityAmount, breakdown }
        });
      }

      case 'process_payroll': {
        const { month, year, employees } = data;
        const results: { employeeId: string; netSalary: number; status: string }[] = [];
        let totalPayroll = 0;

        for (const emp of employees) {
          const { basicSalary, allowances = {}, deductions = {}, overtime = {}, bonus = 0 } = emp;
          const totalAllowances = Object.values(allowances).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
          const grossSalary = basicSalary + totalAllowances;
          const { total: totalDeductions } = calculateDeductions(grossSalary, deductions);
          const { total: totalOvertime } = calculateOvertime(basicSalary, overtime);
          const netSalary = grossSalary - totalDeductions + totalOvertime + bonus;

          results.push({ employeeId: emp.employeeId, netSalary, status: 'processed' });
          totalPayroll += netSalary;
        }

        return successResponse({ month, year, processedAt: new Date().toISOString(), employeeCount: employees.length, totalPayroll, results });
      }

      default:
        return errorResponse(`الإجراء "${action}" غير معروف`);
    }
  } catch (error) {
    console.error('Payroll API Error:', error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg || 'حدث خطأ', 'SERVER_ERROR', 500);
  }
}

// GET handler
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'summary') {
      const employees = await db.user.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true, fullName: true, username: true, role: true, createdAt: true }
      });

      const totalEmployees = employees.length;
      const totalMonthlyPayroll = employees.length * 15000;

      return successResponse({
        totalEmployees,
        totalMonthlyPayroll,
        averageSalary: totalMonthlyPayroll / totalEmployees || 0,
        currency: 'AED'
      });
    }

    if (action === 'employee') {
      const employeeId = searchParams.get('employeeId');
      if (!employeeId) return errorResponse('معرف الموظف مطلوب');

      const employee = await db.user.findUnique({ where: { id: employeeId } });
      if (!employee) return errorResponse('الموظف غير موجود');

      const attendance = await db.attendance.findMany({
        where: { userId: employeeId },
        orderBy: { date: 'desc' },
        take: 30
      });

      return successResponse({
        employee: {
          id: employee.id,
          name: employee.fullName || employee.username,
          email: employee.email,
          role: employee.role,
          hireDate: employee.createdAt,
          yearsOfService: ((Date.now() - employee.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(2)
        },
        attendance: {
          present: attendance.filter(a => a.status === 'PRESENT').length,
          late: attendance.filter(a => a.status === 'LATE').length,
          absent: attendance.filter(a => a.status === 'ABSENT').length
        }
      });
    }

    return successResponse({
      laborLaw: UAE_LABOR_LAW,
      currencies: ['AED', 'SAR', 'USD', 'EUR']
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMsg || 'حدث خطأ', 'SERVER_ERROR', 500);
  }
}
