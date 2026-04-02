'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
import CalendarPage from '@/components/calendar/calendar-page';
import {
  useMeetings, useCreateMeeting, useUpdateMeeting, useProjects,
  useCorrespondence, useCreateCorrespondence,
  type Meeting, type CorrespondenceRecord, type CorrespondenceType,
} from '@/hooks/api';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, Plus, Clock, MapPin, Users, Video,
  CheckCircle, Landmark, Search, Send, Eye,
  XCircle, AlertTriangle, FileText,
  CalendarDays, Loader2
} from 'lucide-react';

// ─── Status / Type Maps ─────────────────────────────────────────

const MEETINGS_STATUS_MAP: Record<string, { ar: string; en: string; color: string }> = {
  confirmed: { ar: 'مؤكد', en: 'Confirmed', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  pending: { ar: 'قيد التأكيد', en: 'Pending', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  completed: { ar: 'مكتمل', en: 'Completed', color: 'bg-muted text-muted-foreground border-border' },
};

// ─── Helpers ─────────────────────────────────────────────────────

/** Normalize API status (CONFIRMED) → UI status (confirmed) */
function normalizeStatus(status: string): string {
  return (status || 'pending').toLowerCase();
}

/** Convert API date to YYYY-MM-DD string */
function toDateStr(date: string | Date): string {
  if (!date) return '';
  if (typeof date === 'string') {
    // Already ISO string – extract date portion
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

/** Parse attendees JSON string → string[] */
function parseAttendees(attendees: string | null | undefined): string[] {
  if (!attendees) return [];
  try {
    return JSON.parse(attendees);
  } catch {
    return [];
  }
}

// ─── Correspondence Type & Status Maps (API-aligned) ────────

const CORR_TYPE_MAP: Record<string, { ar: string; en: string }> = {
  SUBMISSION: { ar: 'تقديم', en: 'Submission' },
  RESPONSE:   { ar: 'رد', en: 'Response' },
  REJECTION:  { ar: 'رفض', en: 'Rejection' },
  APPROVAL:   { ar: 'موافقة', en: 'Approval' },
  INQUIRY:    { ar: 'استفسار', en: 'Inquiry' },
  AMENDMENT:  { ar: 'تعديل', en: 'Amendment' },
};

const CORR_STATUS_MAP: Record<string, { ar: string; en: string; color: string; icon: React.ElementType }> = {
  pending:            { ar: 'قيد الانتظار', en: 'Pending', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  under_review:       { ar: 'قيد المراجعة', en: 'Under Review', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Send },
  approved:           { ar: 'تمت الموافقة', en: 'Approved', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  rejected:           { ar: 'مرفوض', en: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  amendment_required: { ar: 'يتطلب تعديل', en: 'Amendment Required', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle },
};

/** Helper: safely look up type label, falling back to the raw key */
function getTypeLabel(type: string, isAr: boolean) {
  const info = CORR_TYPE_MAP[type];
  return info ? (isAr ? info.ar : info.en) : type;
}

/** Helper: safely look up status info, falling back to defaults */
function getStatusInfo(status: string) {
  return CORR_STATUS_MAP[status] ?? { ar: status, en: status, color: 'bg-muted text-muted-foreground border-border', icon: Clock };
}

// ─── Meetings Content (Tab 1) ──────────────────────────────────

function MeetingsContent() {
  const { language } = useApp();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [createDialog, setCreateDialog] = useState(false);
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState('60');
  const [formLocation, setFormLocation] = useState('');
  const [formAgenda, setFormAgenda] = useState('');
  const [formAttendees, setFormAttendees] = useState('');
  const [formType, setFormType] = useState('ONLINE');

  // API hooks
  const { data: meetingsData, isLoading } = useMeetings();
  const createMutation = useCreateMeeting();
  const updateMutation = useUpdateMeeting();

  // Normalize API data to UI format
  const meetings: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    duration: number;
    location: string;
    type: 'onsite' | 'online';
    status: string;
    attendees: string[];
    project: string;
    agenda: string;
    notes: string;
  }> = useMemo(() => {
    if (!meetingsData?.data) return [];
    return (meetingsData.data as Meeting[]).map((m) => ({
      id: m.id,
      title: m.title,
      date: toDateStr(m.date),
      time: m.time,
      duration: m.duration,
      location: m.location,
      type: (m.type || 'online').toLowerCase() as 'onsite' | 'online',
      status: normalizeStatus(m.status),
      attendees: parseAttendees(m.attendees),
      project: (m as any).projectName || '',
      agenda: m.agenda || '',
      notes: m.notes || '',
    }));
  }, [meetingsData]);

  const filtered = filterStatus === 'all'
    ? meetings
    : meetings.filter(m => m.status === filterStatus);

  const upcoming = meetings.filter(m => m.status !== 'cancelled' && m.status !== 'completed');

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof meetings>>((acc, meeting) => {
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

  // Reset form
  const resetForm = () => {
    setFormTitle('');
    setFormDate('');
    setFormTime('');
    setFormDuration('60');
    setFormLocation('');
    setFormAgenda('');
    setFormAttendees('');
    setFormType('ONLINE');
  };

  // Create handler
  const handleCreate = () => {
    if (!formTitle.trim()) {
      toast({ title: isAr ? 'عنوان الاجتماع مطلوب' : 'Meeting title is required', variant: 'destructive' });
      return;
    }
    if (!formDate) {
      toast({ title: isAr ? 'التاريخ مطلوب' : 'Date is required', variant: 'destructive' });
      return;
    }
    if (!formTime) {
      toast({ title: isAr ? 'الوقت مطلوب' : 'Time is required', variant: 'destructive' });
      return;
    }

    const attendeesStr = formAttendees
      ? JSON.stringify(formAttendees.split(',').map(s => s.trim()).filter(Boolean))
      : undefined;

    createMutation.mutate(
      {
        title: formTitle.trim(),
        date: formDate,
        time: formTime,
        duration: Number(formDuration) || 60,
        location: formLocation.trim(),
        type: formType,
        agenda: formAgenda.trim() || undefined,
        attendees: attendeesStr,
      },
      {
        onSuccess: () => {
          toast({ title: isAr ? 'تم إنشاء الاجتماع بنجاح' : 'Meeting created successfully' });
          resetForm();
          setCreateDialog(false);
        },
        onError: () => {
          toast({ title: isAr ? 'فشل إنشاء الاجتماع' : 'Failed to create meeting', variant: 'destructive' });
        },
      }
    );
  };

  // Status change handler
  const handleStatusChange = (meeting: Meeting, newStatus: string) => {
    updateMutation.mutate(
      { id: meeting.id, status: newStatus.toUpperCase() },
      {
        onSuccess: () => {
          toast({
            title: isAr ? 'تم تحديث حالة الاجتماع' : 'Meeting status updated',
          });
          setViewMeeting(null);
        },
        onError: () => {
          toast({
            title: isAr ? 'فشل تحديث الحالة' : 'Failed to update status',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // ─── Loading skeleton ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32 ms-auto" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-7 h-7 text-blue-400" />
            {isAr ? 'الاجتماعات' : 'Meetings'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {upcoming.length} {isAr ? 'اجتماع قادم' : 'upcoming meetings'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 bg-muted border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              {Object.entries(MEETINGS_STATUS_MAP).map(([key, val]) => (
                <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 me-2" />
            {isAr ? 'اجتماع جديد' : 'New Meeting'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? 'القادمة' : 'Upcoming', value: upcoming.length, color: 'text-blue-400' },
          { label: isAr ? 'مؤكدة' : 'Confirmed', value: meetings.filter(m => m.status === 'confirmed').length, color: 'text-green-400' },
          { label: isAr ? 'قيد التأكيد' : 'Pending', value: meetings.filter(m => m.status === 'pending').length, color: 'text-amber-400' },
          { label: isAr ? 'هذا الأسبوع' : 'This Week', value: upcoming.filter(m => { const d = new Date(m.date); const now = new Date(); const week = 7 * 24 * 60 * 60 * 1000; return d.getTime() - now.getTime() <= week && d.getTime() >= now.getTime(); }).length, color: 'text-cyan-400' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Meetings Timeline */}
      {Object.entries(grouped).map(([date, dateMeetings]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground">{formatDate(date)}</h2>
            <div className="flex-1 h-px bg-muted" />
          </div>
          <div className="space-y-2">
            {dateMeetings.map((meeting) => {
              const statusInfo = MEETINGS_STATUS_MAP[meeting.status];
              return (
                <Card
                  key={meeting.id}
                  className="bg-card border-border hover:border-border transition-all cursor-pointer"
                  onClick={() => setViewMeeting(meetingsData?.data?.find((m: any) => m.id === meeting.id) || null)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Time */}
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold text-blue-400">{meeting.time}</p>
                        <p className="text-xs text-muted-foreground">{meeting.duration} {isAr ? 'دقيقة' : 'min'}</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-foreground font-medium truncate">{meeting.title}</h3>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${statusInfo.color}`}>
                            {isAr ? statusInfo.ar : statusInfo.en}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {meeting.type === 'online' ? (
                            <span className="flex items-center gap-1"><Video className="w-3 h-3 text-blue-400" />{meeting.location}</span>
                          ) : (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-400" />{meeting.location}</span>
                          )}
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{meeting.attendees.length} {isAr ? 'حاضر' : 'attendees'}</span>
                          {meeting.project && (
                            <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{meeting.project}</Badge>
                          )}
                        </div>

                        {meeting.agenda && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{meeting.agenda}</p>
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

      {filtered.length === 0 && !isLoading && (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>{isAr ? 'لا توجد اجتماعات' : 'No meetings found'}</p>
          </CardContent>
        </Card>
      )}

      {/* View Meeting Dialog */}
      <Dialog open={!!viewMeeting} onOpenChange={() => setViewMeeting(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              {viewMeeting?.title}
            </DialogTitle>
          </DialogHeader>
          {viewMeeting && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? 'الوقت' : 'Time'}</p>
                    <p className="text-foreground">{viewMeeting.time} ({viewMeeting.duration} {isAr ? 'دقيقة' : 'min'})</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(viewMeeting.type || 'online').toUpperCase() === 'ONLINE'
                    ? <Video className="w-4 h-4 text-blue-400" />
                    : <MapPin className="w-4 h-4 text-amber-400" />}
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? 'المكان' : 'Location'}</p>
                    <p className="text-foreground">{viewMeeting.location}</p>
                  </div>
                </div>
              </div>

              {(viewMeeting as any).projectName && (
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? 'المشروع' : 'Project'}</p>
                  <Badge variant="outline" className="border-border text-foreground/80 mt-1">{(viewMeeting as any).projectName}</Badge>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">{isAr ? 'الحضور' : 'Attendees'}</p>
                <div className="flex flex-wrap gap-2">
                  {parseAttendees(viewMeeting.attendees).map((a: string, i: number) => (
                    <Badge key={i} variant="outline" className="border-border text-foreground/80">
                      <Users className="w-3 h-3 me-1" />{a}
                    </Badge>
                  ))}
                  {(!viewMeeting.attendees || parseAttendees(viewMeeting.attendees).length === 0) && (
                    <p className="text-sm text-muted-foreground">{isAr ? 'لا يوجد حاضرين' : 'No attendees'}</p>
                  )}
                </div>
              </div>

              {viewMeeting.agenda && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{isAr ? 'جدول الأعمال' : 'Agenda'}</p>
                  <div className="bg-muted p-3 rounded-lg text-sm text-foreground/80 space-y-1">
                    {viewMeeting.agenda.split(' - ').map((item: string, i: number) => (
                      <p key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {viewMeeting.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{isAr ? 'ملاحظات' : 'Notes'}</p>
                  <p className="text-sm text-foreground/80">{viewMeeting.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMeeting(null)} className="border-border text-foreground/80">
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
            {viewMeeting && normalizeStatus(viewMeeting.status) !== 'completed' && (
              <Button
                size="sm"
                disabled={updateMutation.isPending}
                onClick={() => handleStatusChange(viewMeeting, 'completed')}
                className="bg-green-600 hover:bg-green-700"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                <CheckCircle className="w-4 h-4 me-2" />
                {isAr ? 'تم الانعقاد' : 'Mark Complete'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={(open) => { if (!open) resetForm(); setCreateDialog(open); }}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              {isAr ? 'اجتماع جديد' : 'New Meeting'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? 'عنوان الاجتماع' : 'Meeting Title'}</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={isAr ? 'مثال: اجتماع متابعة أسبوعي' : 'e.g. Weekly Follow-up'}
                className="bg-muted border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? 'التاريخ' : 'Date'}</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="bg-muted border-border" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'الوقت' : 'Time'}</Label>
                <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="bg-muted border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? 'المكان' : 'Location'}</Label>
                <Input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder={isAr ? 'قاعة / Zoom / Teams' : 'Room / Zoom / Teams'}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'نوع الاجتماع' : 'Type'}</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">{isAr ? 'عن بُعد' : 'Online'}</SelectItem>
                    <SelectItem value="ONSITE">{isAr ? 'حضوري' : 'On-site'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'المدة (دقيقة)' : 'Duration (min)'}</Label>
              <Input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="60" className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'جدول الأعمال' : 'Agenda'}</Label>
              <Textarea
                value={formAgenda}
                onChange={(e) => setFormAgenda(e.target.value)}
                placeholder={isAr ? 'نقاط جدول الأعمال (كل نقطة في سطر)' : 'Agenda items (one per line)'}
                className="bg-muted border-border"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الحضور' : 'Attendees'}</Label>
              <Input
                value={formAttendees}
                onChange={(e) => setFormAttendees(e.target.value)}
                placeholder={isAr ? 'أسماء الحضور (مفصولة بفاصلة)' : 'Attendee names (comma separated)'}
                className="bg-muted border-border"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { resetForm(); setCreateDialog(false); }} className="border-border text-foreground/80">
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              disabled={createMutation.isPending}
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
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
  const [viewDialog, setViewDialog] = useState<CorrespondenceRecord | null>(null);
  const [createDialog, setCreateDialog] = useState(false);

  // ── Create form state ──
  const [formProjectId, setFormProjectId] = useState('');
  const [formType, setFormType] = useState('');
  const [formReference, setFormReference] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formSubmissionDate, setFormSubmissionDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // ── API hooks ──
  const { data: records = [], isLoading } = useCorrespondence();
  const createMutation = useCreateCorrespondence();
  const { data: projectsData } = useProjects();
  const projects = useMemo(() => (projectsData?.data as any[]) ?? [], [projectsData]);

  // ── Client-side filtering ──
  const filtered = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return records.filter((item) => {
      const matchSearch =
        (item.subject ?? '').toLowerCase().includes(lowerSearch) ||
        (item.referenceNumber ?? '').toLowerCase().includes(lowerSearch);
      const matchType = filterType === 'all' || item.correspondenceType === filterType;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [records, searchTerm, filterType, filterStatus]);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: records.length,
    pending: records.filter(i => i.status === 'pending').length,
    underReview: records.filter(i => i.status === 'under_review').length,
    approved: records.filter(i => i.status === 'approved').length,
    rejected: records.filter(i => i.status === 'rejected').length,
  }), [records]);

  // ── Create handler ──
  const handleCreate = () => {
    if (!formProjectId || !formType) return;
    createMutation.mutate({
      projectId: formProjectId,
      correspondenceType: formType as CorrespondenceType,
      referenceNumber: formReference || undefined,
      subject: formSubject || undefined,
      submissionDate: formSubmissionDate || undefined,
      notes: formNotes || undefined,
    }, {
      onSuccess: () => {
        setCreateDialog(false);
        setFormProjectId('');
        setFormType('');
        setFormReference('');
        setFormSubject('');
        setFormSubmissionDate('');
        setFormNotes('');
      },
    });
  };

  // ── Reset form when dialog opens ──
  const handleOpenCreate = () => {
    setFormProjectId('');
    setFormType('');
    setFormReference('');
    setFormSubject('');
    setFormSubmissionDate('');
    setFormNotes('');
    setCreateDialog(true);
  };

  // ── Format date for display ──
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(isAr ? 'ar-AE' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" dir={isAr ? 'rtl' : 'ltr'}>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="w-7 h-7 text-amber-400" />
            {isAr ? 'المراسلات البلدية' : 'Municipality Correspondence'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? 'تتبع المراسلات والتصاريح مع البلديات' : 'Track correspondence and permits with municipalities'}
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 me-2" />
          {isAr ? 'مراسلة جديدة' : 'New Correspondence'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: isAr ? 'الإجمالي' : 'Total', value: stats.total, color: 'text-foreground' },
          { label: isAr ? 'قيد الانتظار' : 'Pending', value: stats.pending, color: 'text-amber-400' },
          { label: isAr ? 'قيد المراجعة' : 'Under Review', value: stats.underReview, color: 'text-blue-400' },
          { label: isAr ? 'تمت الموافقة' : 'Approved', value: stats.approved, color: 'text-green-400' },
          { label: isAr ? 'مرفوض' : 'Rejected', value: stats.rejected, color: 'text-red-400' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? 'بحث بالرقم أو الموضوع...' : 'Search by reference or subject...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-10 bg-muted border-border"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 bg-muted border-border">
            <SelectValue placeholder={isAr ? 'النوع' : 'Type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? 'كل الأنواع' : 'All Types'}</SelectItem>
            {Object.entries(CORR_TYPE_MAP).map(([key, val]) => (
              <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-muted border-border">
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
      <Card className="bg-card border-border overflow-x-auto">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-border hover:bg-muted">
                <th className="text-muted-foreground text-start p-3">{isAr ? 'الرقم المرجعي' : 'Reference'}</th>
                <th className="text-muted-foreground text-start p-3">{isAr ? 'الموضوع' : 'Subject'}</th>
                <th className="text-muted-foreground text-start p-3">{isAr ? 'النوع' : 'Type'}</th>
                <th className="text-muted-foreground text-start p-3">{isAr ? 'المشروع' : 'Project'}</th>
                <th className="text-muted-foreground text-start p-3">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="text-muted-foreground text-start p-3">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="text-muted-foreground text-end p-3">{isAr ? 'عرض' : 'View'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const statusInfo = getStatusInfo(item.status);
                return (
                  <tr
                    key={item.id}
                    className="border-border hover:bg-muted/50 cursor-pointer"
                    onClick={() => setViewDialog(item)}
                  >
                    <td className="p-3 text-blue-400 font-mono text-sm">{item.referenceNumber || '—'}</td>
                    <td className="p-3 text-foreground font-medium max-w-[250px] truncate">{item.subject || '—'}</td>
                    <td className="p-3"><Badge variant="outline" className="border-border text-foreground/80">{getTypeLabel(item.correspondenceType, isAr)}</Badge></td>
                    <td className="p-3 text-foreground/80 text-sm">{item.project?.name || '—'}</td>
                    <td className="p-3 text-muted-foreground text-sm">{formatDate(item.submissionDate)}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={statusInfo.color}>
                        {isAr ? statusInfo.ar : statusInfo.en}
                      </Badge>
                    </td>
                    <td className="p-3 text-end">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setViewDialog(item); }}>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    {isAr ? 'لا توجد نتائج' : 'No results found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              {viewDialog?.referenceNumber || (isAr ? 'مراسلة' : 'Correspondence')}
            </DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{isAr ? 'الموضوع' : 'Subject'}</Label>
                  <p className="text-foreground">{viewDialog.subject || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isAr ? 'النوع' : 'Type'}</Label>
                  <p className="text-foreground">{getTypeLabel(viewDialog.correspondenceType, isAr)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isAr ? 'المشروع' : 'Project'}</Label>
                  <p className="text-foreground">{viewDialog.project?.name || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isAr ? 'الحالة' : 'Status'}</Label>
                  <Badge variant="outline" className={getStatusInfo(viewDialog.status).color}>
                    {isAr ? getStatusInfo(viewDialog.status).ar : getStatusInfo(viewDialog.status).en}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isAr ? 'تاريخ التقديم' : 'Submission Date'}</Label>
                  <p className="text-foreground">{formatDate(viewDialog.submissionDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isAr ? 'تاريخ الرد' : 'Response Date'}</Label>
                  <p className="text-foreground">{formatDate(viewDialog.responseDate)}</p>
                </div>
              </div>
              {viewDialog.notes && (
                <div>
                  <Label className="text-muted-foreground">{isAr ? 'ملاحظات' : 'Notes'}</Label>
                  <p className="text-foreground/80 bg-muted p-3 rounded-lg mt-1">{viewDialog.notes}</p>
                </div>
              )}
              {viewDialog.responseNotes && (
                <div>
                  <Label className="text-muted-foreground">{isAr ? 'ملاحظات الرد' : 'Response Notes'}</Label>
                  <p className="text-foreground/80 bg-muted p-3 rounded-lg mt-1">{viewDialog.responseNotes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(null)} className="border-border text-foreground/80">
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              {isAr ? 'مراسلة بلدية جديدة' : 'New Municipality Correspondence'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? 'المشروع *' : 'Project *'}</Label>
              <Select value={formProjectId} onValueChange={setFormProjectId}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder={isAr ? 'اختر المشروع...' : 'Select project...'} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'نوع المراسلة *' : 'Type *'}</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder={isAr ? 'اختر النوع...' : 'Select type...'} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CORR_TYPE_MAP).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الرقم المرجعي' : 'Reference Number'}</Label>
              <Input
                placeholder={isAr ? 'مثال: MC-2026-001' : 'e.g. MC-2026-001'}
                className="bg-muted border-border"
                value={formReference}
                onChange={(e) => setFormReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الموضوع' : 'Subject'}</Label>
              <Input
                placeholder={isAr ? 'موضوع المراسلة' : 'Correspondence subject'}
                className="bg-muted border-border"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'تاريخ التقديم' : 'Submission Date'}</Label>
              <Input
                type="date"
                className="bg-muted border-border"
                value={formSubmissionDate}
                onChange={(e) => setFormSubmissionDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea
                placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'}
                className="bg-muted border-border"
                rows={3}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-border text-foreground/80">
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formProjectId || !formType || createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 me-2" />
              )}
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
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-7 h-7 text-blue-400" />
          {isAr ? 'السكرتارية' : 'Secretarial'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr ? 'إدارة الاجتماعات والمراسلات والتقويم' : 'Manage meetings, correspondence, and calendar'}
        </p>
      </div>

      <Tabs defaultValue="meetings" className="space-y-6">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="meetings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground">
            <Calendar className="w-4 h-4 me-2" />
            {isAr ? 'الاجتماعات' : 'Meetings'}
          </TabsTrigger>
          <TabsTrigger value="correspondence" className="data-[state=active]:bg-amber-600 data-[state=active]:text-foreground">
            <Landmark className="w-4 h-4 me-2" />
            {isAr ? 'المراسلات البلدية' : 'Municipality'}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-foreground">
            <CalendarDays className="w-4 h-4 me-2" />
            {isAr ? 'التقويم' : 'Calendar'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meetings">
          <MeetingsContent />
        </TabsContent>

        <TabsContent value="correspondence">
          <CorrespondenceContent />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
