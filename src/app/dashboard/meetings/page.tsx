'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Plus, Clock, MapPin, Users, Video,
  CheckCircle, Landmark, Search, Send, Eye,
  XCircle, AlertTriangle, FileText, Building
} from 'lucide-react';

// ─── Meetings Data ───────────────────────────────────────────────

const MOCK_MEETINGS = [
  {
    id: '1',
    title: 'اجتماع متابعة مشروع الواحة',
    date: '2026-03-31',
    time: '10:00',
    duration: 60,
    location: 'قاعة الاجتماعات الرئيسية',
    type: 'onsite',
    status: 'confirmed',
    attendees: ['أحمد المدير', 'خالد الإنشائي', 'محمد الكهربائي'],
    project: 'مشروع الواحة السكني',
    agenda: 'مراجعة تقدم الأعمال - مناقشة التعديلات المعمارية - متابعة المخالفات',
    notes: '',
  },
  {
    id: '2',
    title: 'متابعة المراسلات البلدية',
    date: '2026-04-01',
    time: '09:00',
    duration: 30,
    location: 'Zoom',
    type: 'online',
    status: 'confirmed',
    attendees: ['أحمد المدير', 'نورا السكرتيرة'],
    project: '',
    agenda: 'متابعة طلبات التصاريح - الرد على ملاحظات البلدية',
    notes: '',
  },
  {
    id: '3',
    title: 'اجتماع مع العميل - مراجعة المخططات',
    date: '2026-04-02',
    time: '14:00',
    duration: 90,
    location: 'مكتب العميل - دبي',
    type: 'onsite',
    status: 'pending',
    attendees: ['أحمد المدير', 'المهندس المعماري', 'العميل خالد'],
    project: 'مشروع فيلا النخيل',
    agenda: 'عرض المخططات النهائية - أخذ موافقة العميل على التعديلات',
    notes: 'مطلوب تجهيز نسخة طباعة من المخططات',
  },
  {
    id: '4',
    title: 'اجتماع الفريق الأسبوعي',
    date: '2026-04-03',
    time: '08:30',
    duration: 45,
    location: 'Teams',
    type: 'online',
    status: 'confirmed',
    attendees: ['أحمد المدير', 'المهندس المعماري', 'خالد الإنشائي', 'محمد الكهربائي', 'نورا السكرتيرة'],
    project: '',
    agenda: 'متابعة المهام الأسبوعية - توزيع مهام جديدة - مناقشة المعوقات',
    notes: '',
  },
  {
    id: '5',
    title: 'فحص الموقع - مشروع البرج',
    date: '2026-04-05',
    time: '07:00',
    duration: 120,
    location: 'الموقع - منطقة الشارقة',
    type: 'onsite',
    status: 'pending',
    attendees: ['مهندس الموقع', 'خالد الإنشائي', 'أحمد المدير'],
    project: 'مشروع برج الأعمال',
    agenda: 'فحص أعمال الصب - مراجعة حديد التسليح - متابعة المقاول',
    notes: 'يجب ارتداء خوذة الأمان',
  },
];

const MEETINGS_STATUS_MAP: Record<string, { ar: string; en: string; color: string }> = {
  confirmed: { ar: 'مؤكد', en: 'Confirmed', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  pending: { ar: 'قيد التأكيد', en: 'Pending', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  completed: { ar: 'مكتمل', en: 'Completed', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

// ─── Correspondence Data ────────────────────────────────────────

const MOCK_CORRESPONDENCE = [
  {
    id: '1',
    reference: 'MC-2026-001',
    subject: 'طلب رخصة بناء فيلا - المنطقة الأولى',
    type: 'permit_request',
    municipality: 'بلدية الشارقة',
    status: 'pending',
    date: '2026-03-15',
    dueDate: '2026-04-15',
    notes: 'تم تقديم المخططات ومستندات الملكية',
  },
  {
    id: '2',
    reference: 'MC-2026-002',
    subject: 'مخالصة كهرباء - مشروع الواحة',
    type: 'clearance',
    municipality: 'بلدية دبي',
    status: 'approved',
    date: '2026-02-20',
    dueDate: '2026-03-20',
    notes: 'تمت الموافقة بعد التعديلات المطلوبة',
  },
  {
    id: '3',
    reference: 'MC-2026-003',
    subject: 'اعتراض على غرامة تأخير',
    type: 'objection',
    municipality: 'بلدية أبوظبي',
    status: 'rejected',
    date: '2026-01-10',
    dueDate: '2026-02-10',
    notes: 'تم رفض الاعتراض - الغرامة سارية',
  },
  {
    id: '4',
    reference: 'MC-2026-004',
    subject: 'تجديد رخصة البناء - برج النخيل',
    type: 'renewal',
    municipality: 'بلدية عجمان',
    status: 'in_progress',
    date: '2026-03-25',
    dueDate: '2026-06-25',
    notes: 'قيد المراجعة - مطلوب مخططات محدثة',
  },
  {
    id: '5',
    reference: 'MC-2026-005',
    subject: 'طلب فحص سلامة المبنى',
    type: 'inspection',
    municipality: 'بلدية الشارقة',
    status: 'pending',
    date: '2026-03-28',
    dueDate: '2026-04-28',
    notes: 'حجز موعد الفحص الأسبوع القادم',
  },
];

const TYPE_MAP: Record<string, { ar: string; en: string }> = {
  permit_request: { ar: 'طلب تصريح', en: 'Permit Request' },
  clearance: { ar: 'مخالصة', en: 'Clearance' },
  objection: { ar: 'اعتراض', en: 'Objection' },
  renewal: { ar: 'تجديد', en: 'Renewal' },
  inspection: { ar: 'فحص', en: 'Inspection' },
  amendment: { ar: 'تعديل', en: 'Amendment' },
  complaint: { ar: 'شكوى', en: 'Complaint' },
};

const CORR_STATUS_MAP: Record<string, { ar: string; en: string; color: string; icon: React.ElementType }> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  in_progress: { ar: 'جاري التنفيذ', en: 'In Progress', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Send },
  approved: { ar: 'تمت الموافقة', en: 'Approved', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  rejected: { ar: 'مرفوض', en: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  overdue: { ar: 'متأخر', en: 'Overdue', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
};

// ─── Meetings Content (Tab 1) ──────────────────────────────────

function MeetingsContent() {
  const { language } = useApp();
  const isAr = language === 'ar';
  const [createDialog, setCreateDialog] = useState(false);
  const [viewMeeting, setViewMeeting] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = filterStatus === 'all'
    ? MOCK_MEETINGS
    : MOCK_MEETINGS.filter(m => m.status === filterStatus);

  const upcoming = MOCK_MEETINGS.filter(m => m.status !== 'cancelled' && m.status !== 'completed');

  // Group by date
  const grouped = filtered.reduce((acc: Record<string, typeof MOCK_MEETINGS>, meeting) => {
    if (!acc[meeting.date]) acc[meeting.date] = [];
    acc[meeting.date].push(meeting);
    return acc;
  }, {});

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = isAr
      ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = isAr
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-400" />
            {isAr ? 'الاجتماعات' : 'Meetings'}
          </h1>
          <p className="text-slate-400 mt-1">
            {upcoming.length} {isAr ? 'اجتماع قادم' : 'upcoming meetings'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              {Object.entries(MEETINGS_STATUS_MAP).map(([key, val]) => (
                <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 me-2" />
            {isAr ? 'اجتماع جديد' : 'New Meeting'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? 'القادمة' : 'Upcoming', value: upcoming.length, color: 'text-indigo-400' },
          { label: isAr ? 'مؤكدة' : 'Confirmed', value: MOCK_MEETINGS.filter(m => m.status === 'confirmed').length, color: 'text-green-400' },
          { label: isAr ? 'قيد التأكيد' : 'Pending', value: MOCK_MEETINGS.filter(m => m.status === 'pending').length, color: 'text-amber-400' },
          { label: isAr ? 'هذا الأسبوع' : 'This Week', value: upcoming.filter(m => { const d = new Date(m.date); const now = new Date(); const week = 7 * 24 * 60 * 60 * 1000; return d.getTime() - now.getTime() <= week && d.getTime() >= now.getTime(); }).length, color: 'text-cyan-400' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Meetings Timeline */}
      {Object.entries(grouped).map(([date, meetings]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-400">{formatDate(date)}</h2>
            <div className="flex-1 h-px bg-slate-800" />
          </div>
          <div className="space-y-2">
            {meetings.map((meeting) => {
              const statusInfo = MEETINGS_STATUS_MAP[meeting.status];
              return (
                <Card
                  key={meeting.id}
                  className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                  onClick={() => setViewMeeting(meeting)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Time */}
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold text-indigo-400">{meeting.time}</p>
                        <p className="text-xs text-slate-500">{meeting.duration} {isAr ? 'دقيقة' : 'min'}</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium truncate">{meeting.title}</h3>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${statusInfo.color}`}>
                            {isAr ? statusInfo.ar : statusInfo.en}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {meeting.type === 'online' ? (
                            <span className="flex items-center gap-1"><Video className="w-3 h-3 text-blue-400" />{meeting.location}</span>
                          ) : (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-400" />{meeting.location}</span>
                          )}
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{meeting.attendees.length} {isAr ? 'حاضر' : 'attendees'}</span>
                          {meeting.project && (
                            <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">{meeting.project}</Badge>
                          )}
                        </div>

                        {meeting.agenda && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-1">{meeting.agenda}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-16 text-center text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>{isAr ? 'لا توجد اجتماعات' : 'No meetings found'}</p>
          </CardContent>
        </Card>
      )}

      {/* View Meeting Dialog */}
      <Dialog open={!!viewMeeting} onOpenChange={() => setViewMeeting(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              {viewMeeting?.title}
            </DialogTitle>
          </DialogHeader>
          {viewMeeting && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-400">{isAr ? 'الوقت' : 'Time'}</p>
                    <p className="text-white">{viewMeeting.time} ({viewMeeting.duration} {isAr ? 'دقيقة' : 'min'})</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {viewMeeting.type === 'online' ? <Video className="w-4 h-4 text-blue-400" /> : <MapPin className="w-4 h-4 text-amber-400" />}
                  <div>
                    <p className="text-xs text-slate-400">{isAr ? 'المكان' : 'Location'}</p>
                    <p className="text-white">{viewMeeting.location}</p>
                  </div>
                </div>
              </div>

              {viewMeeting.project && (
                <div>
                  <p className="text-xs text-slate-400">{isAr ? 'المشروع' : 'Project'}</p>
                  <Badge variant="outline" className="border-slate-600 text-slate-300 mt-1">{viewMeeting.project}</Badge>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-400 mb-2">{isAr ? 'الحضور' : 'Attendees'}</p>
                <div className="flex flex-wrap gap-2">
                  {viewMeeting.attendees.map((a: string, i: number) => (
                    <Badge key={i} variant="outline" className="border-slate-700 text-slate-300">
                      <Users className="w-3 h-3 me-1" />{a}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">{isAr ? 'جدول الأعمال' : 'Agenda'}</p>
                <div className="bg-slate-800/50 p-3 rounded-lg text-sm text-slate-300 space-y-1">
                  {viewMeeting.agenda.split(' - ').map((item: string, i: number) => (
                    <p key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              {viewMeeting.notes && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">{isAr ? 'ملاحظات' : 'Notes'}</p>
                  <p className="text-sm text-slate-300">{viewMeeting.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMeeting(null)} className="border-slate-700 text-slate-300">
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
            {viewMeeting?.status !== 'completed' && (
              <Button size="sm" onClick={() => setViewMeeting(null)} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 me-2" />
                {isAr ? 'تم الانعقاد' : 'Mark Complete'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              {isAr ? 'اجتماع جديد' : 'New Meeting'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? 'عنوان الاجتماع' : 'Meeting Title'}</Label>
              <Input placeholder={isAr ? 'مثال: اجتماع متابعة أسبوعي' : 'e.g. Weekly Follow-up'} className="bg-slate-800/50 border-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? 'التاريخ' : 'Date'}</Label>
                <Input type="date" className="bg-slate-800/50 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'الوقت' : 'Time'}</Label>
                <Input type="time" className="bg-slate-800/50 border-slate-700" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? 'المكان' : 'Location'}</Label>
                <Input placeholder={isAr ? 'قاعة / Zoom / Teams' : 'Room / Zoom / Teams'} className="bg-slate-800/50 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'المدة (دقيقة)' : 'Duration (min)'}</Label>
                <Input type="number" placeholder="60" className="bg-slate-800/50 border-slate-700" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'جدول الأعمال' : 'Agenda'}</Label>
              <Textarea placeholder={isAr ? 'نقاط جدول الأعمال (كل نقطة في سطر)' : 'Agenda items (one per line)'} className="bg-slate-800/50 border-slate-700" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الحضور' : 'Attendees'}</Label>
              <Input placeholder={isAr ? 'أسماء الحضور (مفصولة بفاصلة)' : 'Attendee names (comma separated)'} className="bg-slate-800/50 border-slate-700" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-slate-700 text-slate-300">
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={() => setCreateDialog(false)} className="bg-indigo-600 hover:bg-indigo-700">
              {isAr ? 'إنشاء الاجتماع' : 'Create Meeting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Correspondence Content (Tab 2) ────────────────────────────

function CorrespondenceContent() {
  const { language } = useApp();
  const isAr = language === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewDialog, setViewDialog] = useState<any>(null);
  const [createDialog, setCreateDialog] = useState(false);

  const filtered = MOCK_CORRESPONDENCE.filter((item) => {
    const matchSearch = item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || item.type === filterType;
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: MOCK_CORRESPONDENCE.length,
    pending: MOCK_CORRESPONDENCE.filter(i => i.status === 'pending').length,
    inProgress: MOCK_CORRESPONDENCE.filter(i => i.status === 'in_progress').length,
    approved: MOCK_CORRESPONDENCE.filter(i => i.status === 'approved').length,
    rejected: MOCK_CORRESPONDENCE.filter(i => i.status === 'rejected').length,
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Landmark className="w-7 h-7 text-amber-400" />
            {isAr ? 'المراسلات البلدية' : 'Municipality Correspondence'}
          </h1>
          <p className="text-slate-400 mt-1">
            {isAr ? 'تتبع المراسلات والتصاريح مع البلديات' : 'Track correspondence and permits with municipalities'}
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 me-2" />
          {isAr ? 'مراسلة جديدة' : 'New Correspondence'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: isAr ? 'الإجمالي' : 'Total', value: stats.total, color: 'text-white' },
          { label: isAr ? 'قيد المراجعة' : 'Pending', value: stats.pending, color: 'text-amber-400' },
          { label: isAr ? 'جاري التنفيذ' : 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
          { label: isAr ? 'تمت الموافقة' : 'Approved', value: stats.approved, color: 'text-green-400' },
          { label: isAr ? 'مرفوض' : 'Rejected', value: stats.rejected, color: 'text-red-400' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder={isAr ? 'بحث بالرقم أو الموضوع...' : 'Search by reference or subject...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-10 bg-slate-800/50 border-slate-700"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700">
            <SelectValue placeholder={isAr ? 'النوع' : 'Type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? 'كل الأنواع' : 'All Types'}</SelectItem>
            {Object.entries(TYPE_MAP).map(([key, val]) => (
              <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700">
            <SelectValue placeholder={isAr ? 'الحالة' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? 'كل الحالات' : 'All Statuses'}</SelectItem>
            {Object.entries(CORR_STATUS_MAP).map(([key, val]) => (
              <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead className="text-slate-400">{isAr ? 'الرقم المرجعي' : 'Reference'}</TableHead>
                <TableHead className="text-slate-400">{isAr ? 'الموضوع' : 'Subject'}</TableHead>
                <TableHead className="text-slate-400">{isAr ? 'النوع' : 'Type'}</TableHead>
                <TableHead className="text-slate-400">{isAr ? 'البلدية' : 'Municipality'}</TableHead>
                <TableHead className="text-slate-400">{isAr ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead className="text-slate-400">{isAr ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="text-slate-400 text-end">{isAr ? 'عرض' : 'View'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const statusInfo = CORR_STATUS_MAP[item.status];
                const typeInfo = TYPE_MAP[item.type];
                return (
                  <TableRow
                    key={item.id}
                    className="border-slate-800 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => setViewDialog(item)}
                  >
                    <TableCell className="text-blue-400 font-mono text-sm">{item.reference}</TableCell>
                    <TableCell className="text-white font-medium max-w-[250px] truncate">{item.subject}</TableCell>
                    <TableCell><Badge variant="outline" className="border-slate-600 text-slate-300">{isAr ? typeInfo.ar : typeInfo.en}</Badge></TableCell>
                    <TableCell className="text-slate-300 text-sm flex items-center gap-1"><Building className="w-3 h-3" />{item.municipality}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{item.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusInfo.color}>
                        {isAr ? statusInfo.ar : statusInfo.en}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setViewDialog(item); }}>
                        <Eye className="w-4 h-4 text-slate-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    {isAr ? 'لا توجد نتائج' : 'No results found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              {viewDialog?.reference}
            </DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">{isAr ? 'الموضوع' : 'Subject'}</Label>
                  <p className="text-white">{viewDialog.subject}</p>
                </div>
                <div>
                  <Label className="text-slate-400">{isAr ? 'النوع' : 'Type'}</Label>
                  <p className="text-white">{isAr ? TYPE_MAP[viewDialog.type]?.ar : TYPE_MAP[viewDialog.type]?.en}</p>
                </div>
                <div>
                  <Label className="text-slate-400">{isAr ? 'البلدية' : 'Municipality'}</Label>
                  <p className="text-white">{viewDialog.municipality}</p>
                </div>
                <div>
                  <Label className="text-slate-400">{isAr ? 'الحالة' : 'Status'}</Label>
                  <Badge variant="outline" className={CORR_STATUS_MAP[viewDialog.status]?.color}>
                    {isAr ? CORR_STATUS_MAP[viewDialog.status]?.ar : CORR_STATUS_MAP[viewDialog.status]?.en}
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-400">{isAr ? 'تاريخ التقديم' : 'Submit Date'}</Label>
                  <p className="text-white">{viewDialog.date}</p>
                </div>
                <div>
                  <Label className="text-slate-400">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</Label>
                  <p className="text-white">{viewDialog.dueDate}</p>
                </div>
              </div>
              <div>
                <Label className="text-slate-400">{isAr ? 'ملاحظات' : 'Notes'}</Label>
                <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg mt-1">{viewDialog.notes}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(null)} className="border-slate-700 text-slate-300">
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              {isAr ? 'مراسلة بلدية جديدة' : 'New Municipality Correspondence'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? 'البلدية' : 'Municipality'}</Label>
              <Input placeholder={isAr ? 'مثال: بلدية الشارقة' : 'e.g. Sharjah Municipality'} className="bg-slate-800/50 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'نوع المراسلة' : 'Type'}</Label>
              <Select>
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder={isAr ? 'اختر النوع...' : 'Select type...'} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_MAP).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الموضوع' : 'Subject'}</Label>
              <Input placeholder={isAr ? 'موضوع المراسلة' : 'Correspondence subject'} className="bg-slate-800/50 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</Label>
              <Input type="date" className="bg-slate-800/50 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'} className="bg-slate-800/50 border-slate-700" rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-slate-700 text-slate-300">
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={() => setCreateDialog(false)} className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 me-2" />
              {isAr ? 'إنشاء' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page Export (Tabs Wrapper) ─────────────────────────────────

export default function SecretarialPage() {
  const { language } = useApp();
  const isAr = language === 'ar';

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-7 h-7 text-indigo-400" />
          {isAr ? 'السكرتارية' : 'Secretarial'}
        </h1>
        <p className="text-slate-400 mt-1">
          {isAr ? 'إدارة الاجتماعات والمراسلات البلدية' : 'Manage meetings and municipality correspondence'}
        </p>
      </div>

      <Tabs defaultValue="meetings" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="meetings" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 me-2" />
            {isAr ? 'الاجتماعات' : 'Meetings'}
          </TabsTrigger>
          <TabsTrigger value="correspondence" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Landmark className="w-4 h-4 me-2" />
            {isAr ? 'المراسلات البلدية' : 'Municipality'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meetings">
          <MeetingsContent />
        </TabsContent>

        <TabsContent value="correspondence">
          <CorrespondenceContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
