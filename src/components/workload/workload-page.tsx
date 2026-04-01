'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase, Users, AlertTriangle, CheckCircle, Clock,
  Loader2, ArrowRightLeft, TrendingUp, Gauge, RefreshCw
} from 'lucide-react';

interface WorkloadMember {
  userId: string;
  fullName: string;
  avatar?: string | null;
  role?: string;
  department?: string;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  doneTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  completionRate: number;
  pressureScore: number;
  maxCapacity: number;
  currentLoad: number;
  availableCapacity: number;
  utilizationPercentage: number;
  suggestedAction: string;
  suggestedActionColor: string;
}

interface TeamSummary {
  totalEmployees: number;
  overloadedEmployees: number;
  heavyLoadEmployees: number;
  moderateLoadEmployees: number;
  availableEmployees: number;
  totalActiveTasks: number;
  totalOverdueTasks: number;
  avgCompletionRate: number;
  maxWeeklyCapacity: number;
  totalTeamCapacity: number;
  totalCurrentLoad: number;
  totalAvailableCapacity: number;
  teamUtilizationPercentage: number;
  teamSuggestedAction: string;
  avgUtilizationPerEmployee: number;
}

interface ReassignTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimatedHours: number;
  project?: string;
}

export default function WorkloadPage() {
  const { language } = useApp();
  const { t } = useTranslation(language);

  const [members, setMembers] = useState<WorkloadMember[]>([]);
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkloadMember | null>(null);
  const [memberTasks, setMemberTasks] = useState<ReassignTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [reassignToId, setReassignToId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const fetchWorkload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workload');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || []);
        setSummary(data.meta || null);
      }
    } catch (error) {
      console.error('Error fetching workload:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkload();
  }, [fetchWorkload]);

  const fetchMemberTasks = async (userId: string) => {
    try {
      const response = await fetch(`/api/tasks?status=todo,in_progress,review`);
      if (response.ok) {
        const data = await response.json();
        const tasks = (data.data || []).filter(
          (task: ReassignTask & { assignedTo: string }) => task.assignedTo === userId
        );
        setMemberTasks(tasks);
      }
    } catch {
      setMemberTasks([]);
    }
  };

  const openReassignDialog = (member: WorkloadMember) => {
    setSelectedMember(member);
    setSelectedTaskId(null);
    setReassignToId('');
    fetchMemberTasks(member.userId);
    setReassignDialogOpen(true);
  };

  const handleReassign = async () => {
    if (!selectedTaskId || !reassignToId) return;
    setReassigning(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTaskId, assignedTo: reassignToId }),
      });
      if (response.ok) {
        setReassignDialogOpen(false);
        fetchWorkload();
      }
    } catch (error) {
      console.error('Reassign failed:', error);
    } finally {
      setReassigning(false);
    }
  };

  const getUtilColor = (pct: number) => {
    if (pct <= 60) return 'text-green-400';
    if (pct <= 80) return 'text-amber-400';
    if (pct <= 100) return 'text-orange-400';
    return 'text-red-400';
  };

  const getUtilBarColor = (pct: number) => {
    if (pct <= 60) return 'bg-green-500';
    if (pct <= 80) return 'bg-amber-500';
    if (pct <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getActionBadge = (action: string) => {
    const map: Record<string, { ar: string; en: string; color: string }> = {
      available: { ar: 'متاح', en: 'Available', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      moderate: { ar: 'معتدل', en: 'Moderate', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      heavy: { ar: 'ثقيل', en: 'Heavy', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      overloaded: { ar: 'محمل', en: 'Overloaded', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };
    return map[action] || map.moderate;
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return '';
    const roles: Record<string, { ar: string; en: string }> = {
      admin: { ar: 'مدير النظام', en: 'Admin' },
      manager: { ar: 'مدير', en: 'Manager' },
      project_manager: { ar: 'مدير مشروع', en: 'Project Manager' },
      engineer: { ar: 'مهندس', en: 'Engineer' },
      accountant: { ar: 'محاسب', en: 'Accountant' },
      viewer: { ar: 'مشاهد', en: 'Viewer' },
    };
    const r = roles[role.toLowerCase()] || { ar: role, en: role };
    return language === 'ar' ? r.ar : r.en;
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-violet-400" />
            {language === 'ar' ? 'إدارة الأحمال' : 'Workload Management'}
          </h1>
          <p className="text-slate-400 mt-1">
            {language === 'ar' ? 'مراقبة توزيع المهام وأحمال الفريق' : 'Monitor task distribution and team capacity'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchWorkload}
          disabled={loading}
          className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`w-4 h-4 me-2 ${loading ? 'animate-spin' : ''}`} />
          {t.refresh}
        </Button>
      </div>

      {/* Team Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <p className="text-xs text-slate-400">{language === 'ar' ? 'إجمالي الفريق' : 'Total Team'}</p>
              </div>
              <p className="text-xl font-bold text-white">{summary.totalEmployees}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-violet-400" />
                <p className="text-xs text-slate-400">{language === 'ar' ? 'متوسط الاستخدام' : 'Avg Utilization'}</p>
              </div>
              <p className={`text-xl font-bold ${getUtilColor(summary.avgUtilizationPerEmployee)}`}>
                {summary.avgUtilizationPerEmployee}%
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <p className="text-xs text-slate-400">{language === 'ar' ? 'الطاقة الكلية' : 'Total Capacity'}</p>
              </div>
              <p className="text-xl font-bold text-white">{summary.totalTeamCapacity}h</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <p className="text-xs text-slate-400">{language === 'ar' ? 'الحمل الحالي' : 'Current Load'}</p>
              </div>
              <p className="text-xl font-bold text-orange-400">{summary.totalCurrentLoad}h</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-xs text-slate-400">{language === 'ar' ? 'متاح' : 'Available'}</p>
              </div>
              <p className="text-xl font-bold text-green-400">{summary.totalAvailableCapacity}h</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-xs text-slate-400">{language === 'ar' ? 'متأخرة' : 'Overdue'}</p>
              </div>
              <p className="text-xl font-bold text-red-400">{summary.totalOverdueTasks}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Load Distribution */}
      {summary && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">
              {language === 'ar' ? 'توزيع الأحمال' : 'Load Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <p className="text-lg font-bold text-green-400">{summary.availableEmployees}</p>
                  <p className="text-xs text-slate-400">{language === 'ar' ? 'متاح (≤60%)' : 'Available (≤60%)'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <p className="text-lg font-bold text-amber-400">{summary.moderateLoadEmployees}</p>
                  <p className="text-xs text-slate-400">{language === 'ar' ? 'معتدل (≤80%)' : 'Moderate (≤80%)'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <div>
                  <p className="text-lg font-bold text-orange-400">{summary.heavyLoadEmployees}</p>
                  <p className="text-xs text-slate-400">{language === 'ar' ? 'ثقيل (≤100%)' : 'Heavy (≤100%)'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div>
                  <p className="text-lg font-bold text-red-400">{summary.overloadedEmployees}</p>
                  <p className="text-xs text-slate-400">{language === 'ar' ? 'محمل (>100%)' : 'Overloaded (>100%)'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members Cards */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            {language === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{language === 'ar' ? 'لا يوجد أعضاء فريق' : 'No team members found'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {members.map((member) => {
                const actionBadge = getActionBadge(member.suggestedAction);
                return (
                  <Card
                    key={member.userId}
                    className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all ${
                      member.suggestedAction === 'overloaded' ? 'ring-1 ring-red-500/30' : ''
                    }`}
                  >
                    <CardContent className="p-5">
                      {/* Member Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar className="w-11 h-11">
                          <AvatarFallback className="bg-violet-600 text-white text-sm">
                            {member.fullName?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-medium truncate">{member.fullName}</h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {getRoleLabel(member.role)}
                            {member.department ? ` · ${member.department}` : ''}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-xs shrink-0 ${actionBadge.color}`}>
                          {language === 'ar' ? actionBadge.ar : actionBadge.en}
                        </Badge>
                      </div>

                      {/* Utilization Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-400">
                            {language === 'ar' ? 'استخدام الطاقة' : 'Utilization'}
                          </span>
                          <span className={`text-sm font-semibold ${getUtilColor(member.utilizationPercentage)}`}>
                            {member.utilizationPercentage}%
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getUtilBarColor(member.utilizationPercentage)}`}
                            style={{ width: `${Math.min(member.utilizationPercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        <div className="p-2 rounded-lg bg-slate-900/50">
                          <p className="text-sm font-semibold text-white">{member.totalTasks}</p>
                          <p className="text-[10px] text-slate-500">{language === 'ar' ? 'مهام' : 'Tasks'}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/50">
                          <p className="text-sm font-semibold text-white">{member.currentLoad}h</p>
                          <p className="text-[10px] text-slate-500">{language === 'ar' ? 'الحمّل' : 'Load'}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/50">
                          <p className={`text-sm font-semibold ${getUtilColor(member.utilizationPercentage)}`}>
                            {member.availableCapacity}h
                          </p>
                          <p className="text-[10px] text-slate-500">{language === 'ar' ? 'متاح' : 'Avail.'}</p>
                        </div>
                      </div>

                      {/* Task breakdown */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {member.todoTasks} {language === 'ar' ? 'قيد الانتظار' : 'todo'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {member.inProgressTasks} {language === 'ar' ? 'جارٍ' : 'active'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {member.doneTasks} {language === 'ar' ? 'مكتمل' : 'done'}
                        </span>
                        {member.overdueTasks > 0 && (
                          <span className="flex items-center gap-1 text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {member.overdueTasks} {language === 'ar' ? 'متأخر' : 'overdue'}
                          </span>
                        )}
                      </div>

                      {/* Reassign button for heavy/overloaded */}
                      {(member.suggestedAction === 'heavy' || member.suggestedAction === 'overloaded') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300"
                          onClick={() => openReassignDialog(member)}
                        >
                          <ArrowRightLeft className="w-4 h-4 me-2" />
                          {language === 'ar' ? 'إعادة تعيين مهام' : 'Reassign Tasks'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reassignment Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-orange-400" />
              {language === 'ar' ? 'إعادة تعيين مهمة' : 'Reassign Task'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedMember && (
                language === 'ar'
                  ? `إعادة تعيين مهمة من ${selectedMember.fullName}`
                  : `Reassign a task from ${selectedMember.fullName}`
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 flex-1 overflow-y-auto">
            {/* Select Task */}
            <div className="space-y-2">
              <p className="text-sm text-slate-300 font-medium">
                {language === 'ar' ? 'اختر المهمة' : 'Select Task'}
              </p>
              <Select value={selectedTaskId || ''} onValueChange={setSelectedTaskId}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder={language === 'ar' ? 'اختر مهمة...' : 'Select a task...'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {memberTasks.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      {language === 'ar' ? 'لا توجد مهام نشطة' : 'No active tasks'}
                    </SelectItem>
                  ) : (
                    memberTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        <div className="flex items-center gap-2">
                          <span>{task.title}</span>
                          <Badge variant="outline" className="text-[10px] border-slate-600">
                            {task.estimatedHours}h
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Select Target Member */}
            <div className="space-y-2">
              <p className="text-sm text-slate-300 font-medium">
                {language === 'ar' ? 'إعادة تعيين إلى' : 'Reassign To'}
              </p>
              <Select value={reassignToId} onValueChange={setReassignToId}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder={language === 'ar' ? 'اختر عضو الفريق...' : 'Select team member...'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {members
                    .filter((m) => m.userId !== selectedMember?.userId)
                    .map((m) => {
                      const badge = getActionBadge(m.suggestedAction);
                      return (
                        <SelectItem key={m.userId} value={m.userId}>
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span>{m.fullName}</span>
                            <span className={`text-[10px] ${badge.color.split(' ')[1]}`}>
                              ({m.utilizationPercentage}%)
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {/* Recommendation */}
            {reassignToId && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? '💡 نصيحة: اختر عضوًا بحالة "متاح" أو "معتدل" لتوزيع أفضل للأحمال' :
                    '💡 Tip: Choose a member with "Available" or "Moderate" status for better load distribution'}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 pt-2 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setReassignDialogOpen(false)}
              className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!selectedTaskId || !reassignToId || reassigning}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {reassigning ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-4 h-4 me-2" />
              )}
              {language === 'ar' ? 'إعادة تعيين' : 'Reassign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
