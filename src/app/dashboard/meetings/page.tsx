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
  Calendar, Plus, Clock, MapPin, Users, Video, FileText,
  ChevronLeft, ChevronRight, CheckCircle
} from 'lucide-react';

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

const STATUS_MAP: Record<string, { ar: string; en: string; color: string }> = {
  confirmed: { ar: 'مؤكد', en: 'Confirmed', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  pending: { ar: 'قيد التأكيد', en: 'Pending', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  completed: { ar: 'مكتمل', en: 'Completed', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

export default function MeetingsPage() {
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
              {Object.entries(STATUS_MAP).map(([key, val]) => (
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
              const statusInfo = STATUS_MAP[meeting.status];
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
