'use client';

/**
 * Gantt Chart Component with Drag & Drop
 * مخطط جانت للمهام والمشاريع مع السحب والإفلات
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  Plus, Edit2, Trash2, Calendar, Clock, 
  CheckCircle, AlertCircle, Play, Pause, GripHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  subtasks?: GanttTask[];
}

interface GanttChartProps {
  projectId?: string;
  lang?: 'ar' | 'en';
  onTaskUpdate?: (task: GanttTask) => void;
  onTaskCreate?: (task: Partial<GanttTask>) => void;
  onTaskDelete?: (taskId: string) => void;
}

// Color palette for tasks
const TASK_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
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
  
  // Drag state
  const [draggedTask, setDraggedTask] = useState<GanttTask | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalDates, setOriginalDates] = useState<{ start: Date | null; end: Date | null } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'ar';

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

  // Generate timeline headers
  const timelineHeaders = useMemo(() => {
    const headers: { date: Date; label: string; isToday: boolean }[] = [];
    const current = new Date(viewRange.start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (current <= viewRange.end) {
      const isToday = current.getTime() === today.getTime();
      
      headers.push({
        date: new Date(current),
        label: current.getDate().toString(),
        isToday,
      });

      current.setDate(current.getDate() + 1);
    }

    return headers;
  }, [viewRange]);

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
    
    // Add global mouse move and up listeners
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
      // Move entire task
      if (originalDates.start) {
        newStartDate = new Date(originalDates.start.getTime() + daysDelta * ONE_DAY);
      }
      if (originalDates.end) {
        newEndDate = new Date(originalDates.end.getTime() + daysDelta * ONE_DAY);
      }
    } else if (dragMode === 'resize-left') {
      // Resize from left (change start date)
      if (originalDates.start && originalDates.end) {
        const newStart = new Date(originalDates.start.getTime() + daysDelta * ONE_DAY);
        if (newStart < originalDates.end) {
          newStartDate = newStart;
        }
      }
    } else if (dragMode === 'resize-right') {
      // Resize from right (change end date)
      if (originalDates.start && originalDates.end) {
        const newEnd = new Date(originalDates.end.getTime() + daysDelta * ONE_DAY);
        if (newEnd > originalDates.start) {
          newEndDate = newEnd;
        }
      }
    }

    // Update task temporarily
    setTasks(prev => prev.map(t => 
      t.id === draggedTask.id 
        ? { ...t, startDate: newStartDate, endDate: newEndDate }
        : t
    ));
  }, [draggedTask, dragMode, dragStartX, originalDates, timelineHeaders.length]);

  const handleDragEnd = useCallback(() => {
    if (draggedTask) {
      const updatedTask = tasks.find(t => t.id === draggedTask.id);
      if (updatedTask) {
        onTaskUpdate?.(updatedTask);
      }
    }
    
    setDraggedTask(null);
    setDragMode(null);
    setOriginalDates(null);
    
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [draggedTask, tasks, onTaskUpdate, handleDragMove]);

  // Handle task drag (legacy - simplified)
  const handleTaskDrag = (task: GanttTask, newStartDate: Date) => {
    const duration = task.endDate 
      ? Math.ceil((task.endDate.getTime() - (task.startDate?.getTime() || 0)) / (1000 * 60 * 60 * 24))
      : 1;
    
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + duration);

    const updatedTask = {
      ...task,
      startDate: newStartDate,
      endDate: newEndDate,
    };

    setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    onTaskUpdate?.(updatedTask);
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 rounded-xl border border-slate-800 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">
            {lang === 'ar' ? 'مخطط جانت' : 'Gantt Chart'}
          </h2>
          <Badge variant="secondary" className="bg-slate-800">
            {tasks.length} {lang === 'ar' ? 'مهمة' : 'tasks'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'day' ? (lang === 'ar' ? 'يوم' : 'Day') :
                 mode === 'week' ? (lang === 'ar' ? 'أسبوع' : 'Week') :
                 (lang === 'ar' ? 'شهر' : 'Month')}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTimeline('prev')}
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            {lang === 'ar' ? 'اليوم' : 'Today'}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTimeline('next')}
          >
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>

          {/* Add Task Button */}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {lang === 'ar' ? 'إضافة مهمة' : 'Add Task'}
          </Button>
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
            {tasks.map((task) => (
              <div
                key={task.id}
                className="h-12 border-b border-slate-800 flex items-center px-4 hover:bg-slate-800/30 cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.color || PRIORITY_COLORS[task.priority] }}
                  />
                  <span className="text-sm text-white truncate">{task.title}</span>
                  {task.isMilestone && (
                    <Badge variant="outline" className="text-xs">
                      {lang === 'ar' ? 'معلم' : 'Milestone'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {STATUS_ICONS[task.status]}
                  <span className="text-xs text-slate-400">
                    {task.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-x-auto">
          {/* Timeline Header */}
          <div className="h-12 border-b border-slate-800 flex bg-slate-800/50 sticky top-0">
            {timelineHeaders.map((header, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-10 h-12 flex items-center justify-center text-xs border-r border-slate-700 last:border-r-0 ${
                  header.isToday ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400'
                }`}
              >
                {header.label}
              </div>
            ))}
          </div>

          {/* Task Bars */}
          <div className="relative">
            {/* Today Line */}
            {timelineHeaders.some(h => h.isToday) && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                style={{
                  left: `${(timelineHeaders.findIndex(h => h.isToday) / timelineHeaders.length) * 100}%`,
                }}
              />
            )}

            {/* Task Rows */}
            {tasks.map((task) => {
              const position = getTaskPosition(task);
              const isBeingDragged = draggedTask?.id === task.id;
              
              return (
                <div
                  key={task.id}
                  className="h-12 border-b border-slate-800 relative"
                >
                  {position && (
                    <div
                      className={`absolute top-2 h-8 rounded-lg flex items-center group ${
                        isBeingDragged ? 'ring-2 ring-white ring-opacity-50' : ''
                      }`}
                      style={{
                        left: position.left,
                        width: position.width,
                        backgroundColor: task.color || PRIORITY_COLORS[task.priority],
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

                      {/* Task Title - Drag Area */}
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

                  {/* Milestone marker */}
                  {task.isMilestone && task.endDate && (
                    <div
                      className="absolute top-3 w-4 h-4 transform rotate-45 bg-amber-500"
                      style={{
                        left: `${(Math.ceil((task.endDate.getTime() - viewRange.start.getTime()) / (1000 * 60 * 60 * 24)) / timelineHeaders.length) * 100}%`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lang === 'ar' ? 'تعديل المهمة' : 'Edit Task'}
            </DialogTitle>
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
            <DialogTitle>
              {lang === 'ar' ? 'إضافة مهمة جديدة' : 'Add New Task'}
            </DialogTitle>
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
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <Label>{lang === 'ar' ? 'تاريخ النهاية' : 'End Date'}</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
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
