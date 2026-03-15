'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useLeaveRequests, useApproveLeaveRequest } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Calendar, Clock, UserCheck, UserX, AlertCircle,
  CheckCircle, XCircle, FileText, DollarSign, TrendingUp,
  Mail, Phone, Building2, Briefcase, Search, Plus,
  ChevronLeft, ChevronRight, Sun, CloudRain, PartyPopper
} from 'lucide-react';

// Leave Types Configuration
const LEAVE_TYPES = [
  { value: 'annual', labelAr: 'سنوية', labelEn: 'Annual', color: 'bg-blue-500' },
  { value: 'sick', labelAr: 'مرضية', labelEn: 'Sick', color: 'bg-red-500' },
  { value: 'emergency', labelAr: 'طارئة', labelEn: 'Emergency', color: 'bg-orange-500' },
  { value: 'maternity', labelAr: 'أمومة', labelEn: 'Maternity', color: 'bg-pink-500' },
  { value: 'unpaid', labelAr: 'غير مدفوعة', labelEn: 'Unpaid', color: 'bg-gray-500' },
];

// Leave Status Configuration
const LEAVE_STATUSES = [
  { value: 'pending', labelAr: 'قيد الانتظار', labelEn: 'Pending', color: 'bg-yellow-500' },
  { value: 'approved', labelAr: 'موافق', labelEn: 'Approved', color: 'bg-green-500' },
  { value: 'rejected', labelAr: 'مرفوض', labelEn: 'Rejected', color: 'bg-red-500' },
];

// Attendance Status Configuration
const ATTENDANCE_STATUSES = [
  { value: 'present', labelAr: 'حاضر', labelEn: 'Present', color: 'bg-green-500' },
  { value: 'absent', labelAr: 'غائب', labelEn: 'Absent', color: 'bg-red-500' },
  { value: 'late', labelAr: 'متأخر', labelEn: 'Late', color: 'bg-orange-500' },
  { value: 'leave', labelAr: 'إجازة', labelEn: 'On Leave', color: 'bg-blue-500' },
];

// Sample Employees Data
const SAMPLE_EMPLOYEES = [
  {
    id: '1',
    name: 'أحمد محمد علي',
    nameEn: 'Ahmed Mohamed Ali',
    position: 'مهندس مدني',
    positionEn: 'Civil Engineer',
    department: 'الهندسة',
    departmentEn: 'Engineering',
    email: 'ahmed@blueprint.com',
    phone: '+971 50 123 4567',
    status: 'active',
    avatar: '',
    salary: 25000,
  },
  {
    id: '2',
    name: 'فاطمة خالد',
    nameEn: 'Fatima Khaled',
    position: 'مهندسة معمارية',
    positionEn: 'Architect',
    department: 'التصميم',
    departmentEn: 'Design',
    email: 'fatima@blueprint.com',
    phone: '+971 50 234 5678',
    status: 'active',
    avatar: '',
    salary: 22000,
  },
  {
    id: '3',
    name: 'محمد سعيد',
    nameEn: 'Mohamed Saeed',
    position: 'مدير مشروع',
    positionEn: 'Project Manager',
    department: 'إدارة المشاريع',
    departmentEn: 'Project Management',
    email: 'mohamed@blueprint.com',
    phone: '+971 50 345 6789',
    status: 'leave',
    avatar: '',
    salary: 35000,
  },
  {
    id: '4',
    name: 'نورة عبدالله',
    nameEn: 'Noura Abdullah',
    position: 'محاسبة',
    positionEn: 'Accountant',
    department: 'المالية',
    departmentEn: 'Finance',
    email: 'noura@blueprint.com',
    phone: '+971 50 456 7890',
    status: 'active',
    avatar: '',
    salary: 18000,
  },
  {
    id: '5',
    name: 'خالد عمر',
    nameEn: 'Khaled Omar',
    position: 'مهندس كهربائي',
    positionEn: 'Electrical Engineer',
    department: 'الهندسة',
    departmentEn: 'Engineering',
    email: 'khaled@blueprint.com',
    phone: '+971 50 567 8901',
    status: 'active',
    avatar: '',
    salary: 23000,
  },
  {
    id: '6',
    name: 'سارة أحمد',
    nameEn: 'Sara Ahmed',
    position: 'موارد بشرية',
    positionEn: 'HR Specialist',
    department: 'الموارد البشرية',
    departmentEn: 'Human Resources',
    email: 'sara@blueprint.com',
    phone: '+971 50 678 9012',
    status: 'active',
    avatar: '',
    salary: 16000,
  },
];

// Sample Attendance Data
const SAMPLE_ATTENDANCE = [
  { id: '1', employeeId: '1', employeeName: 'أحمد محمد علي', date: new Date(), checkIn: '08:30', checkOut: '17:00', workHours: 8.5, status: 'present' },
  { id: '2', employeeId: '2', employeeName: 'فاطمة خالد', date: new Date(), checkIn: '09:15', checkOut: '17:30', workHours: 8.25, status: 'late' },
  { id: '3', employeeId: '4', employeeName: 'نورة عبدالله', date: new Date(), checkIn: '08:00', checkOut: '16:30', workHours: 8.5, status: 'present' },
  { id: '4', employeeId: '5', employeeName: 'خالد عمر', date: new Date(), checkIn: '-', checkOut: '-', workHours: 0, status: 'absent' },
  { id: '5', employeeId: '6', employeeName: 'سارة أحمد', date: new Date(), checkIn: '08:45', checkOut: '17:15', workHours: 8.5, status: 'present' },
  { id: '6', employeeId: '3', employeeName: 'محمد سعيد', date: new Date(), checkIn: '-', checkOut: '-', workHours: 0, status: 'leave' },
];

// Sample Salaries Data
const SAMPLE_SALARIES = [
  { id: '1', employeeId: '1', employeeName: 'أحمد محمد علي', basicSalary: 20000, allowances: 5000, deductions: 0, netSalary: 25000, status: 'paid' },
  { id: '2', employeeId: '2', employeeName: 'فاطمة خالد', basicSalary: 18000, allowances: 4000, deductions: 500, netSalary: 21500, status: 'paid' },
  { id: '3', employeeId: '3', employeeName: 'محمد سعيد', basicSalary: 28000, allowances: 7000, deductions: 0, netSalary: 35000, status: 'pending' },
  { id: '4', employeeId: '4', employeeName: 'نورة عبدالله', basicSalary: 15000, allowances: 3000, deductions: 0, netSalary: 18000, status: 'paid' },
  { id: '5', employeeId: '5', employeeName: 'خالد عمر', basicSalary: 19000, allowances: 4000, deductions: 200, netSalary: 22800, status: 'pending' },
  { id: '6', employeeId: '6', employeeName: 'سارة أحمد', basicSalary: 13000, allowances: 3000, deductions: 0, netSalary: 16000, status: 'paid' },
];

export function HRPage() {
  const { language } = useApp();
  const { t, formatCurrency, formatDate } = useTranslation(language);
  const { toast } = useToast();
  const isRTL = language === 'ar';

  // State
  const [activeTab, setActiveTab] = useState('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Hooks
  const { data: leaveRequestsData, isLoading: leaveLoading, refetch: refetchLeaves } = useLeaveRequests(statusFilter === 'all' ? undefined : statusFilter);
  const approveLeaveMutation = useApproveLeaveRequest();

  const leaveRequests = leaveRequestsData?.data || [];

  // Attendance Stats
  const attendanceStats = {
    presentToday: SAMPLE_ATTENDANCE.filter(a => a.status === 'present').length,
    onLeave: SAMPLE_ATTENDANCE.filter(a => a.status === 'leave').length,
    late: SAMPLE_ATTENDANCE.filter(a => a.status === 'late').length,
    absent: SAMPLE_ATTENDANCE.filter(a => a.status === 'absent').length,
  };

  // Employee Stats
  const employeeStats = {
    total: SAMPLE_EMPLOYEES.length,
    active: SAMPLE_EMPLOYEES.filter(e => e.status === 'active').length,
    onLeave: SAMPLE_EMPLOYEES.filter(e => e.status === 'leave').length,
  };

  // Salary Stats
  const salaryStats = {
    total: SAMPLE_SALARIES.reduce((sum, s) => sum + s.netSalary, 0),
    paid: SAMPLE_SALARIES.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.netSalary, 0),
    pending: SAMPLE_SALARIES.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.netSalary, 0),
  };

  // Filter Leave Requests
  const filteredLeaveRequests = useMemo(() => {
    let filtered = leaveRequests;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req: any) => req.status === statusFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter((req: any) => 
        req.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [leaveRequests, statusFilter, searchQuery]);

  // Handle Approve Leave
  const handleApproveLeave = async (requestId: string) => {
    try {
      await approveLeaveMutation.mutateAsync({ id: requestId, approve: true });
      toast({
        title: isRTL ? 'تمت الموافقة' : 'Approved',
        description: isRTL ? 'تم الموافقة على طلب الإجازة' : 'Leave request has been approved',
      });
      refetchLeaves();
    } catch (error) {
      toast({
        title: t.error,
        description: isRTL ? 'حدث خطأ أثناء الموافقة' : 'Failed to approve request',
        variant: 'destructive',
      });
    }
  };

  // Handle Reject Leave
  const handleRejectLeave = async () => {
    if (!selectedRequest) return;
    
    try {
      await approveLeaveMutation.mutateAsync({ 
        id: selectedRequest.id, 
        approve: false, 
        rejectionReason 
      });
      toast({
        title: isRTL ? 'تم الرفض' : 'Rejected',
        description: isRTL ? 'تم رفض طلب الإجازة' : 'Leave request has been rejected',
      });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      refetchLeaves();
    } catch (error) {
      toast({
        title: t.error,
        description: isRTL ? 'حدث خطأ أثناء الرفض' : 'Failed to reject request',
        variant: 'destructive',
      });
    }
  };

  // Get Leave Type Badge
  const getLeaveTypeBadge = (type: string) => {
    const leaveType = LEAVE_TYPES.find(lt => lt.value === type) || LEAVE_TYPES[0];
    return (
      <Badge variant="secondary" className={`${leaveType.color} text-white`}>
        {isRTL ? leaveType.labelAr : leaveType.labelEn}
      </Badge>
    );
  };

  // Get Leave Status Badge
  const getLeaveStatusBadge = (status: string) => {
    const statusConfig = LEAVE_STATUSES.find(s => s.value === status) || LEAVE_STATUSES[0];
    return (
      <Badge variant="secondary" className={`${statusConfig.color} text-white`}>
        {isRTL ? statusConfig.labelAr : statusConfig.labelEn}
      </Badge>
    );
  };

  // Get Attendance Status Badge
  const getAttendanceStatusBadge = (status: string) => {
    const statusConfig = ATTENDANCE_STATUSES.find(s => s.value === status) || ATTENDANCE_STATUSES[0];
    return (
      <Badge variant="secondary" className={`${statusConfig.color} text-white text-xs`}>
        {isRTL ? statusConfig.labelAr : statusConfig.labelEn}
      </Badge>
    );
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(selectedMonth);
  const monthNames = isRTL 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = isRTL 
    ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.hr}</h1>
          <p className="text-slate-400">
            {isRTL ? 'إدارة الموارد البشرية والحضور والرواتب' : 'Manage human resources, attendance, and salaries'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-xl bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="attendance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 me-2" />
            {t.attendance}
          </TabsTrigger>
          <TabsTrigger value="leaves" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <FileText className="w-4 h-4 me-2" />
            {t.leaves}
          </TabsTrigger>
          <TabsTrigger value="employees" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 me-2" />
            {t.employees}
          </TabsTrigger>
          <TabsTrigger value="salaries" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <DollarSign className="w-4 h-4 me-2" />
            {t.salaries}
          </TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6 mt-6">
          {/* Attendance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <UserCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{attendanceStats.presentToday}</p>
                    <p className="text-sm text-slate-400">{t.presentToday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <PartyPopper className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{attendanceStats.onLeave}</p>
                    <p className="text-sm text-slate-400">{t.onLeave}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{attendanceStats.late}</p>
                    <p className="text-sm text-slate-400">{isRTL ? 'متأخرين' : 'Late'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <UserX className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{attendanceStats.absent}</p>
                    <p className="text-sm text-slate-400">{isRTL ? 'غائبين' : 'Absent'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar and Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">
                    {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth('prev')}>
                      {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth('next')}>
                      {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, index) => (
                    <div key={index} className="text-center text-xs text-slate-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const isToday = new Date().getDate() === day && 
                                    new Date().getMonth() === selectedMonth.getMonth() &&
                                    new Date().getFullYear() === selectedMonth.getFullYear();
                    const isWeekend = (firstDayOfMonth + index) % 7 === 0 || (firstDayOfMonth + index) % 7 === 6;
                    
                    return (
                      <div
                        key={day}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm cursor-pointer transition-colors
                          ${isToday ? 'bg-blue-600 text-white' : 
                            isWeekend ? 'bg-slate-800/50 text-slate-400' : 
                            'bg-slate-800/30 text-slate-300 hover:bg-slate-800'}
                        `}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-600" />
                    <span className="text-xs text-slate-400">{isRTL ? 'اليوم' : 'Today'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-800/50" />
                    <span className="text-xs text-slate-400">{isRTL ? 'عطلة' : 'Weekend'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Table */}
            <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">{isRTL ? 'سجل الحضور' : 'Attendance Record'}</CardTitle>
                <CardDescription className="text-slate-400">
                  {isRTL ? `حضور اليوم - ${formatDate(new Date())}` : `Today's attendance - ${formatDate(new Date())}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-slate-800/50">
                        <TableHead className="text-slate-400">{t.employee}</TableHead>
                        <TableHead className="text-slate-400">{t.date}</TableHead>
                        <TableHead className="text-slate-400">{t.checkIn}</TableHead>
                        <TableHead className="text-slate-400">{t.checkOut}</TableHead>
                        <TableHead className="text-slate-400">{t.workHours}</TableHead>
                        <TableHead className="text-slate-400">{t.status}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SAMPLE_ATTENDANCE.map((record) => (
                        <TableRow key={record.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="text-white font-medium">{record.employeeName}</TableCell>
                          <TableCell className="text-slate-300">{formatDate(record.date)}</TableCell>
                          <TableCell className="text-slate-300">{record.checkIn}</TableCell>
                          <TableCell className="text-slate-300">{record.checkOut}</TableCell>
                          <TableCell className="text-slate-300">
                            {record.workHours > 0 ? `${record.workHours}h` : '-'}
                          </TableCell>
                          <TableCell>{getAttendanceStatusBadge(record.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leave Requests Tab */}
        <TabsContent value="leaves" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-1 gap-3 w-full md:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className={`absolute ${isRTL ? 'end-3' : 'start-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                <Input
                  placeholder={isRTL ? 'بحث عن موظف...' : 'Search employee...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pe-9' : 'ps-9'} bg-slate-800/50 border-slate-700 text-white`}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder={t.status} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">{t.all}</SelectItem>
                  {LEAVE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {isRTL ? status.labelAr : status.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Leave Requests List */}
          {leaveLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">{t.loading}</div>
            </div>
          ) : filteredLeaveRequests.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-slate-400">{t.noData}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredLeaveRequests.map((request: any) => (
                <Card key={request.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      {/* Employee Info */}
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.user?.avatar} />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {request.user?.fullName?.charAt(0) || request.user?.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{request.user?.fullName || request.user?.username || 'Unknown'}</p>
                          <p className="text-sm text-slate-400">{request.user?.jobTitle || request.user?.department || ''}</p>
                        </div>
                      </div>

                      {/* Leave Details */}
                      <div className="flex flex-wrap items-center gap-4">
                        {getLeaveTypeBadge(request.leaveType)}
                        
                        <div className="text-center">
                          <p className="text-sm text-slate-400">{isRTL ? 'من' : 'From'}</p>
                          <p className="text-white font-medium">{formatDate(request.startDate)}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-slate-400">{isRTL ? 'إلى' : 'To'}</p>
                          <p className="text-white font-medium">{formatDate(request.endDate)}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-slate-400">{t.daysCount}</p>
                          <p className="text-white font-medium">{request.daysCount}</p>
                        </div>
                        
                        {getLeaveStatusBadge(request.status)}
                      </div>

                      {/* Reason & Actions */}
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        {request.reason && (
                          <p className="text-sm text-slate-400 max-w-xs truncate">
                            {isRTL ? 'السبب: ' : 'Reason: '}{request.reason}
                          </p>
                        )}
                        
                        {request.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApproveLeave(request.id)}
                              disabled={approveLeaveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 me-1" />
                              {t.approve}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectDialog(true);
                              }}
                              disabled={approveLeaveMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 me-1" />
                              {t.reject}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {request.rejectionReason && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-sm text-red-400">
                          {isRTL ? `سبب الرفض: ${request.rejectionReason}` : `Rejection reason: ${request.rejectionReason}`}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6 mt-6">
          {/* Employee Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{employeeStats.total}</p>
                    <p className="text-sm text-slate-400">{t.totalEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <UserCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{employeeStats.active}</p>
                    <p className="text-sm text-slate-400">{t.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <PartyPopper className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{employeeStats.onLeave}</p>
                    <p className="text-sm text-slate-400">{t.onLeave}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className={`absolute ${isRTL ? 'end-3' : 'start-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <Input
              placeholder={isRTL ? 'بحث عن موظف...' : 'Search employee...'}
              className={`${isRTL ? 'pe-9' : 'ps-9'} bg-slate-800/50 border-slate-700 text-white`}
            />
          </div>

          {/* Employee Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_EMPLOYEES.map((employee) => (
              <Card key={employee.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={employee.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-lg">
                        {isRTL ? employee.name.charAt(0) : employee.nameEn.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white truncate">
                          {isRTL ? employee.name : employee.nameEn}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className={employee.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}
                        >
                          {employee.status === 'active' ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'إجازة' : 'On Leave')}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-400">{isRTL ? employee.position : employee.positionEn}</p>
                      <p className="text-sm text-slate-400">{isRTL ? employee.department : employee.departmentEn}</p>
                    </div>
                  </div>

                  <Separator className="my-4 bg-slate-800" />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span>{employee.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Building2 className="w-4 h-4" />
                      <span>{isRTL ? employee.department : employee.departmentEn}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Briefcase className="w-4 h-4" />
                      <span>{isRTL ? employee.position : employee.positionEn}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Salaries Tab */}
        <TabsContent value="salaries" className="space-y-6 mt-6">
          {/* Salary Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{formatCurrency(salaryStats.total)}</p>
                    <p className="text-sm text-slate-400">{t.totalSalaries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{formatCurrency(salaryStats.paid)}</p>
                    <p className="text-sm text-slate-400">{t.paid}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{formatCurrency(salaryStats.pending)}</p>
                    <p className="text-sm text-slate-400">{t.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salary Table */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">{isRTL ? 'سجل الرواتب' : 'Salary Record'}</CardTitle>
              <CardDescription className="text-slate-400">
                {isRTL ? 'رواتب الموظفين لهذا الشهر' : 'Employee salaries for this month'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                      <TableHead className="text-slate-400">{t.employee}</TableHead>
                      <TableHead className="text-slate-400">{isRTL ? 'الراتب الأساسي' : 'Basic Salary'}</TableHead>
                      <TableHead className="text-slate-400">{isRTL ? 'البدلات' : 'Allowances'}</TableHead>
                      <TableHead className="text-slate-400">{isRTL ? 'الخصومات' : 'Deductions'}</TableHead>
                      <TableHead className="text-slate-400">{isRTL ? 'صافي الراتب' : 'Net Salary'}</TableHead>
                      <TableHead className="text-slate-400">{t.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_SALARIES.map((salary) => (
                      <TableRow key={salary.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="text-white font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-blue-600 text-white text-xs">
                                {salary.employeeName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {salary.employeeName}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">{formatCurrency(salary.basicSalary)}</TableCell>
                        <TableCell className="text-green-400">+{formatCurrency(salary.allowances)}</TableCell>
                        <TableCell className="text-red-400">-{formatCurrency(salary.deductions)}</TableCell>
                        <TableCell className="text-white font-semibold">{formatCurrency(salary.netSalary)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={salary.status === 'paid' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}
                          >
                            {salary.status === 'paid' ? (isRTL ? 'مدفوع' : 'Paid') : (isRTL ? 'معلق' : 'Pending')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'رفض طلب الإجازة' : 'Reject Leave Request'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {isRTL ? 'يرجى إدخال سبب الرفض' : 'Please enter the reason for rejection'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white"
              placeholder={isRTL ? 'سبب الرفض...' : 'Rejection reason...'}
            />
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)} className="text-slate-400">
              {t.cancel}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectLeave}
              disabled={approveLeaveMutation.isPending || !rejectionReason}
            >
              {approveLeaveMutation.isPending ? t.loading : t.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
