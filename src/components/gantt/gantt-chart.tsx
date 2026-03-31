'use client';

/**
 * Gantt Chart Component with Phase Groups, SLA Color Coding, Milestones, Today Line
 * مخطط جانت مع تجميع المراحل وتلوين SLA ومعالم اليوم
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight,
  Plus, Trash2, Clock, 
  CheckCircle, AlertCircle, Play, Pause, GripHorizontal,
  Diamond, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Types
interface GanttTask {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  parentId?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  startDate: Date | null;
  endDate: Date | null;
  dueDate?: Date | null;
  progress: number;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  order: number;
  color?: string;
  isMilestone: boolean;
  isMandatory?: boolean;
  phaseCategory?: string;
  slaDays?: number;
  slaStartDate?: string;
  slaBreachedAt?: string;
  taskType?: string;
  governmentEntity?: string;
  subtasks?: GanttTask[];
}

interface GanttChartProps {
  projectId?: string;
  lang?: 'ar' | 'en';
  onTaskUpdate?: (task: GanttTask) => void;
  onTaskCreate?: (task: Partial<GanttTask>) => void;
  onTaskDelete?: (taskId: string) => void;
}

// 2A: Phase category colors
const PHASE_CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  ARCHITECTURAL: { bg: 'bg-blue-500/20', text: 'text-blue-400', bar: '#3b82f6' },
  STRUCTURAL: { bg: 'bg-orange-500/20', text: 'text-orange-400', bar: '#f59e0b' },
  MEP: { bg: 'bg-green-500/20', text: 'text-green-400', bar: '#10b981' },
  GOVERNMENT: { bg: 'bg-purple-500/20', text: 'text-purple-400', bar: '#8b5cf6' },
  CONTRACTING: { bg: 'bg-amber-500/20', text: 'text-amber-400', bar: '#d97706' },
};

const PHASE_CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  ARCHITECTURAL: { en: 'Architectural', ar: 'معماري' },
  STRUCTURAL: { en: 'Structural', ar: 'إنشائي' },
  MEP: { en: 'MEP', ar: 'كهرباء وميكانيك' },
  GOVERNMENT: { en: 'Government', ar: 'حكومي' },
  CONTRACTING: { en: 'Contracting', ar: 'مقاولات' },
};

// 2A: Phase dependency rules (arrows)
const _PHASE_DEPENDENCIES: Record<string, string> = {
  'ARCHITECTURAL': 'STRUCTURAL',
  'STRUCTURAL': 'MEP',
  'GOVERNMENT': 'CONTRACTING',
};

const _TASK_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  todo: { en: 'To Do', ar: 'قيد الانتظار' },
  in_progress: { en: 'In Progress', ar: 'قيد التنفيذ' },
  review: { en: 'Review', ar: 'مراجعة' },
  done: { en: 'Done', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  todo: <Pause className="w-4 h-4" />,
  in_progress: <Play className="w-4 h-4" />,
  review: <Clock className="w-4 h-4" />,
  done: <CheckCircle className="w-4 h-4" />,
  cancelled: <AlertCircle className="w-4 h-4" />,
};

// 2B: Get SLA color for a task bar
function getSLABarColor(task: GanttTask): string {
  if (!task.slaDays || !task.slaStartDate) {
    // No SLA - use phase category color
    if (task.phaseCategory && PHASE_CATEGORY_COLORS[task.phaseCategory]) {
      return PHASE_CATEGORY_COLORS[task.phaseCategory].bar;
    }
    return task.color || PRIORITY_COLORS[task.priority];
  }

  const start = new Date(task.slaStartDate);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const remaining = task.slaDays - elapsed;
  const percentRemaining = (remaining / task.slaDays) * 100;

  if (remaining <= 0) return '#991b1b'; // dark red - breached
  if (percentRemaining < 25) return '#ef4444'; // red - at risk
  if (percentRemaining < 50) return '#f59e0b'; // amber - warning
  return '#22c55e'; // green - on track
}

function isSLABreached(task: GanttTask): boolean {
  if (!task.slaDays || !task.slaStartDate) return false;
  const start = new Date(task.slaStartDate);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return elapsed > task.slaDays;
}

export function GanttChart({
  projectId,
  lang = 'ar',
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
}: GanttChartProps) {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showPhaseGroups, setShowPhaseGroups] = useState(true);
  
  // Drag state
  const [draggedTask, setDraggedTask] = useState<GanttTask | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalDates, setOriginalDates] = useState<{ start: Date | null; end: Date | null } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'ar';

  // 2A: Group tasks by phase category
  const phaseGroups = useMemo(() => {
    if (!showPhaseGroups) return { ungrouped: tasks };
    
    const groups: Record<string, GanttTask[]> = {};
    const order = ['ARCHITECTURAL', 'STRUCTURAL', 'MEP', 'GOVERNMENT', 'CONTRACTING'];
    
    tasks.forEach(task => {
      const cat = task.phaseCategory || 'OTHER';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(task);
    });
    
    // Sort by predefined order
    const sorted: Record<string, GanttTask[]> = {};
    order.forEach(cat => {
      if (groups[cat]) sorted[cat] = groups[cat];
    });
    if (groups['OTHER']) sorted['OTHER'] = groups['OTHER'];
    
    return sorted;
  }, [tasks, showPhaseGroups]);

  // Flatten grouped tasks for rendering
  const flattenedTasks = useMemo(() => {
    const result: (GanttTask | { type: 'phase-header'; category: string })[] = [];
    
    if (showPhaseGroups) {
      Object.entries(phaseGroups).forEach(([category, groupTasks]) => {
        result.push({ type: 'phase-header', category } as any);
        groupTasks.forEach(task => result.push(task));
      });
    } else {
      tasks.forEach(task => result.push(task));
    }
    
    return result;
  }, [phaseGroups, tasks, showPhaseGroups]);

  // Calculate view range
  const viewRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        start.setDate(start.getDate() - 7);
        end.setDate(end.getDate() + 14);
        break;
      case 'week':
        start.setDate(start.getDate() - 14);
        end.setDate(end.getDate() + 42);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        end.setMonth(end.getMonth() + 3);
        break;
    }

    return { start, end };
  }, [currentDate, viewMode]);

  // Generate timeline headers with month labels
  const { timelineHeaders, monthLabels } = useMemo(() => {
    const headers: { date: Date; label: string; isToday: boolean; dayOfWeek: number }[] = [];
    const months: { label: string; startIndex: number; count: number }[] = [];
    const current = new Date(viewRange.start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let lastMonth = -1;
    let monthStartIdx = 0;

    while (current <= viewRange.end) {
      const isToday = current.getTime() === today.getTime();
      const month = current.getMonth();
      
      if (month !== lastMonth && lastMonth !== -1) {
        months.push({
          label: current.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', year: 'numeric' }),
          startIndex: monthStartIdx,
          count: headers.length - monthStartIdx,
        });
        monthStartIdx = headers.length;
      }
      lastMonth = month;
      
      headers.push({
        date: new Date(current),
        label: current.getDate().toString(),
        isToday,
        dayOfWeek: current.getDay(),
      });

      current.setDate(current.getDate() + 1);
    }
    
    if (monthStartIdx < headers.length) {
      const lastDate = headers[headers.length - 1].date;
      months.push({
        label: lastDate.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', year: 'numeric' }),
        startIndex: monthStartIdx,
        count: headers.length - monthStartIdx,
      });
    }

    return { timelineHeaders: headers, monthLabels: months };
  }, [viewRange, lang]);

  // Fetch tasks
  useEffect(() => {
    async function fetchTasks() {
      try {
        const url = projectId 
          ? `/api/gantt?projectId=${projectId}`
          : '/api/gantt';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          const parsedTasks = data.data.map((task: any) => ({
            ...task,
            startDate: task.startDate ? new Date(task.startDate) : null,
            endDate: task.endDate ? new Date(task.endDate) : null,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
          }));
          setTasks(parsedTasks);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [projectId]);

  // Calculate task position in timeline
  const getTaskPosition = useCallback((task: GanttTask) => {
    if (!task.startDate || !task.endDate) return null;

    const totalDays = timelineHeaders.length;
    const startOffset = Math.floor(
      (task.startDate.getTime() - viewRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const endOffset = Math.floor(
      (task.endDate.getTime() - viewRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const left = Math.max(0, (startOffset / totalDays) * 100);
    const width = Math.min(100 - left, ((endOffset - startOffset) / totalDays) * 100);

    return { left: `${left}%`, width: `${Math.max(2, width)}%` };
  }, [timelineHeaders, viewRange]);

  // Navigate timeline
  const navigateTimeline = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 14 : -14));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
  };

  // Handle task click
  const handleTaskClick = (task: GanttTask) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent, task: GanttTask, mode: 'move' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    setDraggedTask(task);
    setDragMode(mode);
    setDragStartX(e.clientX);
    setOriginalDates({ start: task.startDate, end: task.endDate });
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!draggedTask || !dragMode || !originalDates || !timelineRef.current) return;

    const timelineWidth = timelineRef.current.offsetWidth;
    const deltaX = e.clientX - dragStartX;
    const daysDelta = Math.round((deltaX / timelineWidth) * timelineHeaders.length);

    if (daysDelta === 0) return;

    const ONE_DAY = 24 * 60 * 60 * 1000;

    let newStartDate = originalDates.start;
    let newEndDate = originalDates.end;

    if (dragMode === 'move') {
      if (originalDates.start) newStartDate = new Date(originalDates.start.getTime() + daysDelta * ONE_DAY);
      if (originalDates.end) newEndDate = new Date(originalDates.end.getTime() + daysDelta * ONE_DAY);
    } else if (dragMode === 'resize-left') {
      if (originalDates.start && originalDates.end) {
        const newStart = new Date(originalDates.start.getTime() + daysDelta * ONE_DAY);
        if (newStart < originalDates.end) newStartDate = newStart;
      }
    } else if (dragMode === 'resize-right') {
      if (originalDates.start && originalDates.end) {
        const newEnd = new Date(originalDates.end.getTime() + daysDelta * ONE_DAY);
        if (newEnd > originalDates.start) newEndDate = newEnd;
      }
    }

    setTasks(prev => prev.map(t => 
      t.id === draggedTask.id ? { ...t, startDate: newStartDate, endDate: newEndDate } : t
    ));
  }, [draggedTask, dragMode, dragStartX, originalDates, timelineHeaders.length]);

  const handleDragEnd = useCallback(() => {
    if (draggedTask) {
      const updatedTask = tasks.find(t => t.id === draggedTask.id);
      if (updatedTask) onTaskUpdate?.(updatedTask);
    }
    
    setDraggedTask(null);
    setDragMode(null);
    setOriginalDates(null);
    
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [draggedTask, tasks, onTaskUpdate, handleDragMove]);

  // Format date for display
  const _formatDate = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  };

  // 2C: Get today position in percentage
  const todayPosition = useMemo(() => {
    const todayIdx = timelineHeaders.findIndex(h => h.isToday);
    if (todayIdx === -1) return null;
    return (todayIdx / timelineHeaders.length) * 100;
  }, [timelineHeaders]);

  // 2C: Get SLA deadline positions
  const slaDeadlinePositions = useMemo(() => {
    return tasks
      .filter(t => t.slaDays && t.slaStartDate && t.startDate)
      .map(t => {
        const slaStart = new Date(t.slaStartDate || '');
        const deadline = new Date(slaStart);
        deadline.setDate(deadline.getDate() + t.slaDays!);
        
        const offset = Math.floor(
          (deadline.getTime() - viewRange.start.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const pct = (offset / timelineHeaders.length) * 100;
        if (pct < 0 || pct > 100) return null;
        
        return {
          position: pct,
          taskId: t.id,
          taskTitle: t.title,
          breached: isSLABreached(t),
        };
      })
      .filter(Boolean) as Array<{ position: number; taskId: string; taskTitle: string; breached: boolean }>;
  }, [tasks, viewRange, timelineHeaders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={cn("bg-slate-900/50 rounded-xl border border-slate-800", isRTL ? 'rtl' : 'ltr')} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">
              {lang === 'ar' ? 'مخطط جانت' : 'Gantt Chart'}
            </h2>
            <Badge variant="secondary" className="bg-slate-800">
              {tasks.length} {lang === 'ar' ? 'مهمة' : 'tasks'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 2A: Phase Group Toggle */}
            <Button
              variant={showPhaseGroups ? 'default' : 'outline'}
              size="sm"
              className={cn(
                showPhaseGroups ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-700 text-slate-400'
              )}
              onClick={() => setShowPhaseGroups(!showPhaseGroups)}
            >
              <Layers className="w-4 h-4 me-2" />
              {showPhaseGroups 
                ? (lang === 'ar' ? 'بمراحل' : 'Phased') 
                : (lang === 'ar' ? 'بمراحل' : 'Phased')}
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              {(['day', 'week', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1 rounded text-sm transition-colors",
                    viewMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {mode === 'day' ? (lang === 'ar' ? 'يوم' : 'Day') :
                   mode === 'week' ? (lang === 'ar' ? 'أسبوع' : 'Week') :
                   (lang === 'ar' ? 'شهر' : 'Month')}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <Button variant="ghost" size="icon" onClick={() => navigateTimeline('prev')}>
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
              {lang === 'ar' ? 'اليوم' : 'Today'}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => navigateTimeline('next')}>
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>

            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {lang === 'ar' ? 'إضافة مهمة' : 'Add Task'}
            </Button>
          </div>
        </div>
      </div>

      {/* Gantt Chart Body */}
      <div className="flex">
        {/* Task List */}
        <div className="w-80 border-r border-slate-800 flex-shrink-0">
          <div className="h-12 border-b border-slate-800 flex items-center px-4 bg-slate-800/50">
            <span className="text-sm font-medium text-slate-400">
              {lang === 'ar' ? 'المهمة' : 'Task'}
            </span>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            {flattenedTasks.map((item) => {
              // Phase header row
              if ((item as any).type === 'phase-header') {
                const category = (item as any).category;
                const phaseInfo = PHASE_CATEGORY_LABELS[category];
                const colorInfo = PHASE_CATEGORY_COLORS[category];
                const taskCount = (phaseGroups[category] || []).length;
                
                return (
                  <div 
                    key={`phase-${category}`}
                    className={cn("h-10 flex items-center px-4 bg-slate-800/80 border-b border-slate-700/50", colorInfo?.bg)}
                  >
                    <div className={cn("flex items-center gap-2 font-semibold text-sm", colorInfo?.text)}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorInfo?.bar }} />
                      {phaseInfo 
                        ? (lang === 'ar' ? phaseInfo.ar : phaseInfo.en) 
                        : category}
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                        {taskCount}
                      </Badge>
                    </div>
                  </div>
                );
              }

              // Regular task row
              const task = item as GanttTask;
              return (
                <div
                  key={task.id}
                  className="h-12 border-b border-slate-800 flex items-center px-4 hover:bg-slate-800/30 cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getSLABarColor(task) }}
                    />
                    {/* 2C: Milestone indicator */}
                    {task.isMilestone && (
                      <Diamond className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                    <span className="text-sm text-white truncate">{task.title}</span>
                    {/* Government entity */}
                    {task.governmentEntity && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500/30 text-amber-400 bg-amber-500/10 shrink-0">
                        {task.governmentEntity}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {STATUS_ICONS[task.status]}
                    <span className="text-xs text-slate-400">{task.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-x-auto" ref={timelineRef}>
          {/* Month labels row */}
          <div className="h-6 border-b border-slate-800 flex bg-slate-900/80 sticky top-0 z-20">
            {monthLabels.map((ml, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 h-6 flex items-center px-2 text-[10px] font-medium text-slate-500 border-r border-slate-700/50"
                style={{ width: `${(ml.count / timelineHeaders.length) * 100}%` }}
              >
                {ml.label}
              </div>
            ))}
          </div>
          
          {/* Day headers row */}
          <div className="h-8 border-b border-slate-800 flex bg-slate-800/50 sticky top-6 z-20">
            {timelineHeaders.map((header, index) => (
              <div
                key={index}
                className={cn(
                  "flex-shrink-0 w-10 h-8 flex flex-col items-center justify-center text-[10px] border-r border-slate-700/30 last:border-r-0",
                  header.dayOfWeek === 5 || header.dayOfWeek === 6 ? 'bg-slate-800/30' : '',
                  header.isToday ? 'bg-blue-500/20' : ''
                )}
              >
                <span className={cn(
                  header.isToday ? 'text-blue-400 font-bold' : 'text-slate-500'
                )}>
                  {header.label}
                </span>
              </div>
            ))}
          </div>

          {/* Task Bars + Today Line + SLA Deadlines */}
          <div className="relative">
            {/* 2C: Today Line */}
            {todayPosition !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none"
                style={{ left: `${todayPosition}%` }}
              >
                <div className="absolute -top-5 -translate-x-1/2 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                  {lang === 'ar' ? 'اليوم' : 'Today'}
                </div>
              </div>
            )}

            {/* 2C: SLA Deadline Markers (dashed vertical lines) */}
            {slaDeadlinePositions.map((sla) => (
              <div
                key={`sla-${sla.taskId}`}
                className="absolute top-0 bottom-0 z-[5] pointer-events-none"
                style={{ left: `${sla.position}%` }}
              >
                <div 
                  className={cn(
                    "w-0 h-full border-l border-dashed",
                    sla.breached ? "border-red-500/60" : "border-amber-500/40"
                  )} 
                />
                <div 
                  className={cn(
                    "absolute top-1 -translate-x-1/2 text-[8px] px-1 py-0.5 rounded max-w-[60px] truncate",
                    sla.breached 
                      ? "bg-red-500/80 text-white" 
                      : "bg-amber-500/60 text-white"
                  )}
                >
                  SLA
                </div>
              </div>
            ))}

            {/* Task Rows */}
            {flattenedTasks.map((item, _rowIdx) => {
              // Phase header row - just a separator
              if ((item as any).type === 'phase-header') {
                const category = (item as any).category;
                const _colorInfo = PHASE_CATEGORY_COLORS[category];
                return (
                  <div
                    key={`phase-bar-${category}`}
                    className="h-10 border-b border-slate-700/50 bg-slate-800/40"
                  />
                );
              }

              const task = item as GanttTask;
              const position = getTaskPosition(task);
              const isBeingDragged = draggedTask?.id === task.id;
              const breached = isSLABreached(task);
              const barColor = getSLABarColor(task);
              
              return (
                <div
                  key={task.id}
                  className="h-12 border-b border-slate-800 relative"
                >
                  {position && (
                    <div
                      className={cn(
                        "absolute top-2 h-8 rounded-lg flex items-center group",
                        isBeingDragged ? 'ring-2 ring-white ring-opacity-50' : '',
                        breached && 'animate-pulse'
                      )}
                      style={{
                        left: position.left,
                        width: position.width,
                        backgroundColor: barColor,
                        cursor: dragMode === 'move' ? 'grabbing' : 'grab',
                      }}
                    >
                      {/* Left Resize Handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, task, 'resize-left');
                        }}
                      >
                        <GripHorizontal className="w-3 h-3 text-white/50" />
                      </div>

                      {/* Progress Bar */}
                      <div
                        className="h-full rounded-l-lg flex-1"
                        style={{
                          width: `${task.progress}%`,
                          backgroundColor: 'rgba(255,255,255,0.3)',
                        }}
                      />

                      {/* Task Title */}
                      <div 
                        className="flex-1 px-2 cursor-grab"
                        onMouseDown={(e) => handleDragStart(e, task, 'move')}
                        onClick={() => !draggedTask && handleTaskClick(task)}
                      >
                        <span className="text-xs text-white truncate block">
                          {task.title}
                        </span>
                      </div>

                      {/* Right Resize Handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, task, 'resize-right');
                        }}
                      >
                        <GripHorizontal className="w-3 h-3 text-white/50" />
                      </div>
                    </div>
                  )}

                  {/* 2C: Milestone diamond marker */}
                  {task.isMilestone && task.endDate && (() => {
                    const endDateOffset = Math.floor(
                      (task.endDate.getTime() - viewRange.start.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const milestonePct = (endDateOffset / timelineHeaders.length) * 100;
                    if (milestonePct < 0 || milestonePct > 100) return null;
                    
                    return (
                      <div
                        className="absolute top-3 z-[6] pointer-events-none"
                        style={{ left: `${milestonePct}%` }}
                      >
                        <div className="w-5 h-5 transform rotate-45 bg-amber-500 border-2 border-amber-300 shadow-lg shadow-amber-500/30" />
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-slate-800 flex items-center gap-4 flex-wrap text-xs">
        <span className="text-slate-500">{lang === 'ar' ? 'ألوان SLA:' : 'SLA Colors:'}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-slate-400">{lang === 'ar' ? 'على المسار' : 'On Track'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-500" />
          <span className="text-slate-400">{lang === 'ar' ? 'تحذير' : 'Warning'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-slate-400">{lang === 'ar' ? 'خطر' : 'At Risk'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-900 animate-pulse" />
          <span className="text-slate-400">{lang === 'ar' ? 'مخالف' : 'Breached'}</span>
        </div>
        <span className="text-slate-600 mx-1">|</span>
        <div className="flex items-center gap-1.5">
          <Diamond className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-slate-400">{lang === 'ar' ? 'معلم' : 'Milestone'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0 border-t-2 border-dashed border-amber-500/60" />
          <span className="text-slate-400">SLA {lang === 'ar' ? 'موعد نهائي' : 'Deadline'}</span>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === 'ar' ? 'تعديل المهمة' : 'Edit Task'}</DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <Label>{lang === 'ar' ? 'العنوان' : 'Title'}</Label>
                <Input
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}</Label>
                  <Input
                    type="date"
                    value={selectedTask.startDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setSelectedTask({
                      ...selectedTask,
                      startDate: e.target.value ? new Date(e.target.value) : null,
                    })}
                  />
                </div>
                <div>
                  <Label>{lang === 'ar' ? 'تاريخ النهاية' : 'End Date'}</Label>
                  <Input
                    type="date"
                    value={selectedTask.endDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setSelectedTask({
                      ...selectedTask,
                      endDate: e.target.value ? new Date(e.target.value) : null,
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>{lang === 'ar' ? 'التقدم' : 'Progress'}</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={selectedTask.progress}
                  onChange={(e) => setSelectedTask({
                    ...selectedTask,
                    progress: parseInt(e.target.value) || 0,
                  })}
                />
              </div>

              <div>
                <Label>{lang === 'ar' ? 'الحالة' : 'Status'}</Label>
                <Select
                  value={selectedTask.status}
                  onValueChange={(value) => setSelectedTask({ ...selectedTask, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label[lang]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{lang === 'ar' ? 'الأولوية' : 'Priority'}</Label>
                <Select
                  value={selectedTask.priority}
                  onValueChange={(value) => setSelectedTask({ ...selectedTask, priority: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{lang === 'ar' ? 'منخفضة' : 'Low'}</SelectItem>
                    <SelectItem value="medium">{lang === 'ar' ? 'متوسطة' : 'Medium'}</SelectItem>
                    <SelectItem value="high">{lang === 'ar' ? 'عالية' : 'High'}</SelectItem>
                    <SelectItem value="critical">{lang === 'ar' ? 'حرجة' : 'Critical'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="destructive" onClick={() => {
              if (selectedTask) {
                onTaskDelete?.(selectedTask.id);
                setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
                setIsEditDialogOpen(false);
              }
            }}>
              <Trash2 className="w-4 h-4 mr-2" />
              {lang === 'ar' ? 'حذف' : 'Delete'}
            </Button>
            <Button onClick={() => {
              if (selectedTask) {
                onTaskUpdate?.(selectedTask);
                setTasks(prev => prev.map(t => t.id === selectedTask.id ? selectedTask : t));
                setIsEditDialogOpen(false);
              }
            }}>
              {lang === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === 'ar' ? 'إضافة مهمة جديدة' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          
          <TaskForm
            lang={lang}
            projectId={projectId}
            onSubmit={(task) => {
              onTaskCreate?.(task);
              setIsCreateDialogOpen(false);
            }}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Form Component
function TaskForm({
  lang,
  projectId,
  onSubmit,
  onCancel,
}: {
  lang: 'ar' | 'en';
  projectId?: string;
  onSubmit: (task: Partial<GanttTask>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      projectId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      priority,
      status: 'todo',
      progress: 0,
      order: 0,
      isMilestone: false,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{lang === 'ar' ? 'العنوان' : 'Title'} *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === 'ar' ? 'عنوان المهمة' : 'Task title'}
        />
      </div>

      <div>
        <Label>{lang === 'ar' ? 'الوصف' : 'Description'}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={lang === 'ar' ? 'وصف المهمة' : 'Task description'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>{lang === 'ar' ? 'تاريخ النهاية' : 'End Date'}</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>{lang === 'ar' ? 'الأولوية' : 'Priority'}</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">{lang === 'ar' ? 'منخفضة' : 'Low'}</SelectItem>
            <SelectItem value="medium">{lang === 'ar' ? 'متوسطة' : 'Medium'}</SelectItem>
            <SelectItem value="high">{lang === 'ar' ? 'عالية' : 'High'}</SelectItem>
            <SelectItem value="critical">{lang === 'ar' ? 'حرجة' : 'Critical'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button onClick={handleSubmit} disabled={!title}>
          {lang === 'ar' ? 'إضافة' : 'Add'}
        </Button>
      </div>
    </div>
  );
}

export default GanttChart;
