'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useProjects, useUsers } from '@/hooks/use-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  CheckSquare, Plus, Search, Trash2,
  Eye, Calendar, Clock, User, Tag, GripVertical, AlertCircle,
  CheckCircle2, Circle, Loader2, Eye as ReviewIcon,
  Wand2, Link2, Shield, Star, Lock, ChevronRight,
  ListChecks
} from 'lucide-react';
import type { Task } from '@/types';

// Priority configuration
const PRIORITIES = [
  { value: 'low', label: 'منخفضة', labelEn: 'Low', color: 'bg-green-500', dotColor: 'bg-green-500' },
  { value: 'medium', label: 'متوسطة', labelEn: 'Medium', color: 'bg-yellow-500', dotColor: 'bg-yellow-500' },
  { value: 'high', label: 'عالية', labelEn: 'High', color: 'bg-orange-500', dotColor: 'bg-orange-500' },
  { value: 'urgent', label: 'عاجل', labelEn: 'Urgent', color: 'bg-red-500', dotColor: 'bg-red-500' },
];

// Status configuration for Kanban columns
const TASK_STATUSES = [
  { value: 'todo', label: 'قيد الانتظار', labelEn: 'To Do', color: 'bg-gray-500', icon: Circle },
  { value: 'in_progress', label: 'قيد التنفيذ', labelEn: 'In Progress', color: 'bg-blue-500', icon: Loader2 },
  { value: 'review', label: 'مراجعة', labelEn: 'Review', color: 'bg-purple-500', icon: ReviewIcon },
  { value: 'done', label: 'مكتمل', labelEn: 'Done', color: 'bg-green-500', icon: CheckCircle2 },
];

// Task type configuration (1A)
const TASK_TYPES: Record<string, { labelAr: string; labelEn: string; color: string }> = {
  STANDARD: { labelAr: 'قياسي', labelEn: 'Standard', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  GOVERNMENTAL: { labelAr: 'حكومي', labelEn: 'Governmental', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  MANDATORY: { labelAr: 'إلزامي', labelEn: 'Mandatory', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  CLIENT: { labelAr: 'عميل', labelEn: 'Client', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  INTERNAL: { labelAr: 'داخلي', labelEn: 'Internal', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

// Phase categories for auto-create
const PHASE_CATEGORIES = [
  { value: 'ARCHITECTURAL', labelAr: 'معماري', labelEn: 'Architectural' },
  { value: 'STRUCTURAL', labelAr: 'إنشائي', labelEn: 'Structural' },
  { value: 'MEP', labelAr: 'كهرباء وميكانيك', labelEn: 'MEP' },
  { value: 'GOVERNMENT', labelAr: 'حكومي', labelEn: 'Government' },
  { value: 'CONTRACTING', labelAr: 'مقاولات', labelEn: 'Contracting' },
];

// Mock users for assignee selection
const MOCK_USERS = [
  { id: '1', name: 'أحمد محمد', nameEn: 'Ahmed Mohamed', avatar: '', initials: 'أم' },
  { id: '2', name: 'سارة أحمد', nameEn: 'Sara Ahmed', avatar: '', initials: 'سا' },
  { id: '3', name: 'محمد علي', nameEn: 'Mohamed Ali', avatar: '', initials: 'مع' },
  { id: '4', name: 'فاطمة خالد', nameEn: 'Fatima Khaled', avatar: '', initials: 'فخ' },
  { id: '5', name: 'عمر حسن', nameEn: 'Omar Hassan', avatar: '', initials: 'عه' },
];

interface TaskFormData {
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  priority: string;
  dueDate: string;
  estimatedHours: string;
  tags: string;
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  priority: 'medium',
  dueDate: '',
  estimatedHours: '',
  tags: '',
};

// Helper: get SLA status info for task with language parameter (1A)
function getSLAStatusForTask(task: any, language: 'ar' | 'en') {
  if (!task.slaDays || !task.slaStartDate) return null;
  
  const start = new Date(task.slaStartDate);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const remaining = task.slaDays - elapsed;
  const percentRemaining = (remaining / task.slaDays) * 100;
  
  let color: string;
  let label: string;
  
  if (remaining <= 0) {
    color = 'bg-red-900/50 text-red-300 border-red-500/50 animate-pulse';
    label = language === 'ar' ? `مخالف (${Math.abs(remaining)}${language === 'ar' ? ' يوم' : 'd'})` : `Breached (${Math.abs(remaining)}d)`;
  } else if (percentRemaining < 25) {
    color = 'bg-red-500/20 text-red-400 border-red-500/30';
    label = `${remaining}${language === 'ar' ? ' يوم متبقي' : 'd left'} ⚠️`;
  } else if (percentRemaining < 50) {
    color = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    label = `${remaining}${language === 'ar' ? ' يوم متبقي' : 'd left'}`;
  } else {
    color = 'bg-green-500/20 text-green-400 border-green-500/30';
    label = `${remaining}${language === 'ar' ? ' يوم متبقي' : 'd left'}`;
  }
  
  return { remaining: Math.max(0, remaining), percentRemaining, color, label, breached: remaining <= 0 };
}

interface SubtaskItem {
  id: string;
  title: string;
  status: string;
  completed: boolean;
}

export function TasksPage() {
  const { language } = useApp();
  const { token } = useAuth();
  const { t, formatDate } = useTranslation(language);
  const { toast } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  
  // Auto-create dialog state (1B)
  const [showAutoCreateDialog, setShowAutoCreateDialog] = useState(false);
  const [autoCreateProjectId, setAutoCreateProjectId] = useState('');
  const [autoCreatePhaseCategory, setAutoCreatePhaseCategory] = useState('');
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  
  // Subtask state (1C)
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
  
  // Hooks
  const { data: tasksData, isLoading, refetch } = useTasks();
  const { data: projectsData } = useProjects();
  const { data: usersData } = useUsers();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const tasks = tasksData?.data || [];
  const projects = projectsData?.data || [];
  
  // Use real users from API, fallback to MOCK_USERS when data is empty
  const realUsers = (usersData?.data || []).map((u: any) => ({
    id: u.id,
    name: u.fullName || u.username,
    nameEn: u.fullName || u.username,
    avatar: '',
    initials: (u.fullName || u.username).split(' ').map((n: string) => n[0]).join('').slice(0, 2),
  }));
  const assigneeUsers = realUsers.length > 0 ? realUsers : MOCK_USERS;
  
  // Form state
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  
  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = {
    total: tasks.length,
    todo: tasks.filter((task: Task) => task.status === 'todo').length,
    inProgress: tasks.filter((task: Task) => task.status === 'in_progress').length,
    completed: tasks.filter((task: Task) => task.status === 'done').length,
    overdue: tasks.filter((task: Task) => {
      if (!task.dueDate || task.status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length,
  };
  
  // Filter tasks
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
    const matchesAssignee = assigneeFilter === 'all' || task.assignedToId === assigneeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all' && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      switch (dateFilter) {
        case 'overdue':
          matchesDate = dueDate < today && task.status !== 'done';
          break;
        case 'today':
          matchesDate = dueDate.getTime() === today.getTime();
          break;
        case 'week':
          matchesDate = dueDate >= today && dueDate <= nextWeek;
          break;
        case 'month':
          matchesDate = dueDate >= today && dueDate <= nextMonth;
          break;
      }
    } else if (dateFilter === 'overdue') {
      matchesDate = false;
    }
    
    return matchesSearch && matchesPriority && matchesProject && matchesAssignee && matchesDate;
  });
  
  // Group tasks by status for Kanban
  const tasksByStatus: Record<string, Task[]> = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };
  
  filteredTasks.forEach((task: Task) => {
    const status = task.status || 'todo';
    if (tasksByStatus[status]) {
      tasksByStatus[status].push(task);
    }
  });
  
  // Handle create task
  const handleCreateTask = async () => {
    if (!formData.title) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'عنوان المهمة مطلوب' : 'Task title is required',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      await createTask.mutateAsync({
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId || undefined,
        assignedToId: formData.assigneeId || undefined,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        status: 'todo',
        progress: 0,
      });
      
      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم إنشاء المهمة بنجاح' : 'Task created successfully'
      });
      
      setShowAddDialog(false);
      setFormData(initialFormData);
      refetch();
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء المهمة' : 'Failed to create task',
        variant: 'destructive'
      });
    }
  };
  
  // Handle auto-create tasks (1B)
  const handleAutoCreateTasks = async () => {
    if (!autoCreateProjectId || !autoCreatePhaseCategory) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار المشروع وPhase' : 'Please select project and phase category',
        variant: 'destructive'
      });
      return;
    }
    
    setIsAutoCreating(true);
    try {
      const response = await fetch('/api/tasks/auto-create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: autoCreateProjectId, phaseCategory: autoCreatePhaseCategory })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: language === 'ar' ? 'تم بنجاح' : 'Success',
          description: language === 'ar' 
            ? `تم إنشاء ${result.data?.created || 0} مهام بنجاح`
            : `${result.data?.created || 0} tasks created successfully`
        });
        setShowAutoCreateDialog(false);
        setAutoCreateProjectId('');
        setAutoCreatePhaseCategory('');
        refetch();
      } else {
        toast({
          title: t.error,
          description: result.error?.message || (language === 'ar' ? 'حدث خطأ' : 'An error occurred'),
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء المهام' : 'Failed to auto-create tasks',
        variant: 'destructive'
      });
    } finally {
      setIsAutoCreating(false);
    }
  };
  
  // Handle update task status
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus as 'todo' | 'in_progress' | 'review' | 'done',
        progress: newStatus === 'done' ? 100 : undefined,
        completedAt: newStatus === 'done' ? new Date() : undefined,
      });
      
      toast({
        title: t.successUpdate,
        description: language === 'ar' ? 'تم تحديث حالة المهمة' : 'Task status updated'
      });
      
      refetch();
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء تحديث المهمة' : 'Failed to update task',
        variant: 'destructive'
      });
    }
  };
  
  // Handle delete task
  const handleDeleteTask = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    
    try {
      await deleteTask.mutateAsync(id);
      toast({
        title: t.successDelete,
        description: language === 'ar' ? 'تم حذف المهمة بنجاح' : 'Task deleted successfully'
      });
      setShowTaskDetail(false);
      setSelectedTask(null);
      refetch();
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء حذف المهمة' : 'Failed to delete task',
        variant: 'destructive'
      });
    }
  };
  
  // Fetch subtasks for selected task (1C)
  useEffect(() => {
    if (!showTaskDetail || !selectedTask) {
      setSubtasks([]);
      return;
    }
    
    const controller = new AbortController();
    const isMountedRef = { current: true };
    
    const fetchSubtasks = async () => {
      setIsLoadingSubtasks(true);
      try {
        const response = await fetch(`/api/tasks?parentId=${selectedTask.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal,
        });
        const result = await response.json();
        if (!isMountedRef.current) return;
        if (result.success && result.data) {
          setSubtasks(result.data.map((st: any) => ({
            id: st.id,
            title: st.title,
            status: st.status || 'todo',
            completed: st.status === 'done',
          })));
        }
      } catch (err) {
        if (!isMountedRef.current || (err instanceof DOMException && err.name === 'AbortError')) return;
        setSubtasks([]);
      } finally {
        if (isMountedRef.current) setIsLoadingSubtasks(false);
      }
    };
    
    fetchSubtasks();
    return () => {
      controller.abort();
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTaskDetail, selectedTask]);
  
  // Add subtask (1C)
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    
    try {
      await createTask.mutateAsync({
        title: newSubtaskTitle.trim(),
        projectId: selectedTask.projectId,
        parentId: selectedTask.id,
        status: 'todo',
        progress: 0,
      });
      
      setNewSubtaskTitle('');
      // Re-fetch subtasks
      try {
        const response = await fetch(`/api/tasks?parentId=${selectedTask.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success && result.data) {
          setSubtasks(result.data.map((st: any) => ({
            id: st.id,
            title: st.title,
            status: st.status || 'todo',
            completed: st.status === 'done',
          })));
        }
      } catch {
        // Silently fail - subtasks will refresh on next selection
      }
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل إضافة المهمة الفرعية' : 'Failed to add subtask',
        variant: 'destructive'
      });
    }
  };
  
  // Toggle subtask completion (1C)
  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await updateTask.mutateAsync({
        id: subtaskId,
        status: completed ? 'todo' : 'done',
        progress: completed ? 0 : 100,
        completedAt: completed ? undefined : new Date(),
      });
      
      const updatedSubtasks = subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !completed, status: !completed ? 'done' : 'todo' } : st
      );
      setSubtasks(updatedSubtasks);
      
      // Auto-complete parent if all subtasks done (1C)
      const allDone = updatedSubtasks.every(st => st.completed);
      if (allDone && updatedSubtasks.length > 0 && selectedTask && selectedTask.status !== 'done') {
        await updateTask.mutateAsync({
          id: selectedTask.id,
          status: 'done',
          progress: 100,
          completedAt: new Date(),
        });
        toast({
          title: language === 'ar' ? 'تم الإكمال التلقائي' : 'Auto-completed',
          description: language === 'ar' ? 'تم إكمال المهمة الرئيسية تلقائياً' : 'Parent task auto-completed',
        });
        refetch();
      }
    } catch {
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل تحديث المهمة الفرعية' : 'Failed to update subtask',
        variant: 'destructive'
      });
    }
  };
  
  // Get priority config
  const getPriorityConfig = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
  };
  
  // Get status config
  const _getStatusConfig = (status: string) => {
    return TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0];
  };
  
  // Get project name
  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find((p: any) => p.id === projectId);
    return project?.name || null;
  };
  
  // Get assignee
  const getAssignee = (assigneeId?: string) => {
    if (!assigneeId) return null;
    return assigneeUsers.find(u => u.id === assigneeId) || null;
  };
  
  // Check if task is overdue
  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'done') return false;
    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < todayCheck;
  };
  
  // Check if dependencies are met (1D)
  const getDependencyInfo = (task: any) => {
    let deps: string[] = [];
    try {
      deps = typeof task.dependencies === 'string' 
        ? JSON.parse(task.dependencies) 
        : Array.isArray(task.dependencies) ? task.dependencies : [];
    } catch {
      deps = [];
    }
    
    if (deps.length === 0) return null;
    
    const completedDeps = deps.filter((depId: string) => {
      const depTask = tasks.find((t: any) => t.id === depId);
      return depTask && depTask.status === 'done';
    });
    
    const allMet = completedDeps.length === deps.length;
    const depTasks = deps.map((depId: string) => tasks.find((t: any) => t.id === depId)).filter(Boolean);
    
    return { deps, depTasks, completedCount: completedDeps.length, total: deps.length, allMet };
  };
  
  // Render task card (with 1A, 1D enhancements)
  const renderTaskCard = (task: Task) => {
    const priorityConfig = getPriorityConfig(task.priority);
    const projectName = getProjectName(task.projectId);
    const assignee = getAssignee(task.assignedToId);
    const overdue = isTaskOverdue(task);
    const taskAny = task as any;
    
    // 1A: SLA Status
    const slaStatus = getSLAStatusForTask(taskAny, language);
    
    // 1A: Task type badge
    const taskType = taskAny.taskType ? TASK_TYPES[taskAny.taskType as string] : null;
    
    // 1A: Government entity badge
    const govEntity = taskAny.governmentEntity;
    
    // 1A: Mandatory flag
    const isMandatory = taskAny.isMandatory || taskAny.taskType === 'MANDATORY';
    
    // 1D: Dependency info
    const depInfo = getDependencyInfo(taskAny);
    
    return (
      <Card 
        key={task.id}
        className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer group"
        onClick={() => {
          setSelectedTask(task);
          setShowTaskDetail(true);
        }}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header with priority, mandatory indicator, and drag handle */}
          <div className="flex items-start gap-2">
            <GripVertical className="w-4 h-4 text-slate-500 mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" role="button" aria-label="Drag to reorder" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${priorityConfig.dotColor}`} />
                {/* 1A: Mandatory indicator */}
                {isMandatory && (
                  <span className="w-3.5 h-3.5 text-red-400 shrink-0" title={language === 'ar' ? 'إلزامي' : 'Required'}>
                    <Star className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                  </span>
                )}
                <span className="text-white font-medium line-clamp-2 text-sm">
                  {task.title}
                </span>
              </div>
            </div>
          </div>
          
          {/* 1A: Badges row - Task type, Gov entity, SLA */}
          <div className="flex flex-wrap gap-1.5">
            {/* Task type badge */}
            {taskType && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border ${taskType.color}`}>
                {language === 'ar' ? taskType.labelAr : taskType.labelEn}
              </Badge>
            )}
            {/* Government entity badge */}
            {govEntity && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border bg-amber-500/10 text-amber-400 border-amber-500/30">
                <Shield className="w-2.5 h-2.5 me-1" />
                {govEntity}
              </Badge>
            )}
            {/* SLA badge */}
            {slaStatus && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border ${slaStatus.color}`}>
                <Clock className="w-2.5 h-2.5 me-1" />
                {slaStatus.label}
              </Badge>
            )}
            {/* 1D: Blocked badge */}
            {depInfo && !depInfo.allMet && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border bg-red-500/10 text-red-400 border-red-500/30">
                <Lock className="w-2.5 h-2.5 me-1" />
                {language === 'ar' ? 'محظور' : 'Blocked'}
              </Badge>
            )}
          </div>
          
          {/* Project name */}
          {projectName && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Tag className="w-3 h-3" />
              <span className="truncate">{projectName}</span>
            </div>
          )}
          
          {/* 1D: Dependency chain */}
          {depInfo && depInfo.depTasks.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Link2 className="w-3 h-3 text-slate-500 shrink-0" />
              <div className="flex items-center gap-1 overflow-hidden">
                {depInfo.depTasks.slice(0, 3).map((dep: any, idx: number) => (
                  <span key={dep.id} className="flex items-center gap-1">
                    {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                    <span className={`text-[10px] truncate max-w-[80px] ${dep.status === 'done' ? 'text-green-400' : 'text-slate-400'}`}>
                      {dep.title}
                    </span>
                  </span>
                ))}
                {depInfo.total > 3 && (
                  <span className="text-[10px] text-slate-500">
                    +{depInfo.total - 3}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ms-auto ${depInfo.allMet ? 'text-green-400' : 'text-amber-400'}`}>
                {depInfo.completedCount}/{depInfo.total}
              </span>
            </div>
          )}
          
          {/* Due date */}
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-slate-400'}`}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
              {overdue && <AlertCircle className="w-3 h-3 ms-1" />}
            </div>
          )}
          
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{t.progress}</span>
              <span className="text-white">{task.progress || 0}%</span>
            </div>
            <Progress value={task.progress || 0} className="h-1.5" />
          </div>
          
          {/* Footer with assignee and actions */}
          <div className="flex items-center justify-between pt-2">
            {assignee ? (
              <Avatar className="w-6 h-6">
                <AvatarImage src={assignee.avatar} />
                <AvatarFallback className="text-[10px] bg-blue-600">
                  {language === 'ar' ? assignee.initials : assignee.nameEn.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="w-3 h-3 text-slate-500" />
              </div>
            )}
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="View task"
                className="h-6 w-6 text-slate-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTask(task);
                  setShowTaskDetail(true);
                }}
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Delete task"
                className="h-6 w-6 text-slate-400 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Render Kanban column
  const renderKanbanColumn = (status: typeof TASK_STATUSES[0]) => {
    const columnTasks = tasksByStatus[status.value] || [];
    const StatusIcon = status.icon;
    
    return (
      <div 
        key={status.value}
        className="flex-shrink-0 w-80 bg-slate-900/50 rounded-lg border border-slate-800"
      >
        {/* Column header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${status.color}/20`}>
                <StatusIcon className={`w-4 h-4 ${status.color.replace('bg-', 'text-')}`} />
              </div>
              <h3 className="font-medium text-white">
                {language === 'ar' ? status.label : status.labelEn}
              </h3>
            </div>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              {columnTasks.length}
            </Badge>
          </div>
        </div>
        
        {/* Column content */}
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="p-3 space-y-3">
            {columnTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                {language === 'ar' ? 'لا توجد مهام' : 'No tasks'}
              </div>
            ) : (
              columnTasks.map(renderTaskCard)
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };
  
  // Completed subtasks count (1C)
  const completedSubtasksCount = subtasks.filter(s => s.completed).length;
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <CheckSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">{t.tasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-500/20">
                <Circle className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.todo}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'قيد الانتظار' : 'To Do'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Loader2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                <p className="text-sm text-slate-400">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-sm text-slate-400">{t.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.overdue}</p>
                <p className="text-sm text-slate-400">{t.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap flex-1 gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          
          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={t.priority} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${priority.dotColor}`} />
                    {language === 'ar' ? priority.label : priority.labelEn}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Project Filter */}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={t.project} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Assignee Filter */}
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={t.assignedTo} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              {assigneeUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {language === 'ar' ? user.name : user.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={t.dueDate} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">{t.all}</SelectItem>
              <SelectItem value="overdue">{t.overdue}</SelectItem>
              <SelectItem value="today">{t.today}</SelectItem>
              <SelectItem value="week">{t.thisWeek}</SelectItem>
              <SelectItem value="month">{t.thisMonth}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* 1B: Auto-Create Tasks Button */}
          <Dialog open={showAutoCreateDialog} onOpenChange={setShowAutoCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <Wand2 className="w-4 h-4 me-2" />
                {language === 'ar' ? 'توليد مهام تلقائية' : 'Auto-Generate'}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'توليد مهام تلقائية' : 'Auto-Generate Tasks'}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {language === 'ar' 
                    ? 'اختر المشروع ونوع المرحلة لإنشاء مهام تلقائية بناءً على القوالب'
                    : 'Select a project and phase category to auto-generate tasks from templates'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.project} *</Label>
                  <Select value={autoCreateProjectId} onValueChange={setAutoCreateProjectId}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder={language === 'ar' ? 'اختر المشروع' : 'Select project'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    {language === 'ar' ? 'فئة المرحلة' : 'Phase Category'} *
                  </Label>
                  <Select value={autoCreatePhaseCategory} onValueChange={setAutoCreatePhaseCategory}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder={language === 'ar' ? 'اختر فئة المرحلة' : 'Select phase category'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {PHASE_CATEGORIES.map((phase) => (
                        <SelectItem key={phase.value} value={phase.value}>
                          {language === 'ar' ? phase.labelAr : phase.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowAutoCreateDialog(false)} className="text-slate-400">
                  {t.cancel}
                </Button>
                <Button 
                  onClick={handleAutoCreateTasks} 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isAutoCreating || !autoCreateProjectId || !autoCreatePhaseCategory}
                >
                  {isAutoCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'توليد المهام' : 'Generate Tasks'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Add Task Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 me-2" />
                {t.newTask}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle>{t.newTask}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {language === 'ar' ? 'أدخل بيانات المهمة الجديدة' : 'Enter the new task details'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.taskTitle} *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder={language === 'ar' ? 'أدخل عنوان المهمة' : 'Enter task title'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.description}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    rows={3}
                    placeholder={language === 'ar' ? 'وصف المهمة...' : 'Task description...'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.project}</Label>
                    <Select 
                      value={formData.projectId} 
                      onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder={language === 'ar' ? 'اختر المشروع' : 'Select project'} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.assignedTo}</Label>
                    <Select 
                      value={formData.assigneeId} 
                      onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder={language === 'ar' ? 'اختر المسؤول' : 'Select assignee'} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {assigneeUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {language === 'ar' ? user.name : user.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.priority}</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(v) => setFormData({ ...formData, priority: v })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {PRIORITIES.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${priority.dotColor}`} />
                              {language === 'ar' ? priority.label : priority.labelEn}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.dueDate}</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">
                      {language === 'ar' ? 'الساعات المقدرة' : 'Estimated Hours'}
                    </Label>
                    <Input
                      type="number"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="0"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.tags}</Label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder={language === 'ar' ? 'تصميم, تطوير' : 'design, development'}
                    />
                    <p className="text-xs text-slate-500">
                      {language === 'ar' ? 'افصل بفاصلة' : 'Separate with commas'}
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAddDialog(false)} 
                  className="text-slate-400"
                >
                  {t.cancel}
                </Button>
                <Button 
                  onClick={handleCreateTask} 
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={createTask.isPending}
                >
                  {createTask.isPending ? t.loading : t.save}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">{t.loading}</div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TASK_STATUSES.map(renderKanbanColumn)}
        </div>
      )}
      
      {/* Task Detail Dialog */}
      <Dialog open={showTaskDetail} onOpenChange={setShowTaskDetail}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityConfig(selectedTask.priority).dotColor}`} />
                    {/* Mandatory indicator in detail */}
                    {(selectedTask as any).isMandatory && (
                      <Star className="w-4 h-4 text-red-400 fill-red-400" />
                    )}
                    <DialogTitle className="text-white">
                      {selectedTask.title}
                    </DialogTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-400"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Status selector */}
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.status}</Label>
                  <div className="flex gap-2 flex-wrap">
                    {TASK_STATUSES.map((status) => {
                      const StatusIcon = status.icon;
                      const isActive = selectedTask.status === status.value;
                      return (
                        <Button
                          key={status.value}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={isActive 
                            ? `${status.color} text-white` 
                            : 'border-slate-700 text-slate-400 hover:text-white'
                          }
                          onClick={() => handleUpdateTaskStatus(selectedTask.id, status.value)}
                        >
                          <StatusIcon className="w-4 h-4 me-1" />
                          {language === 'ar' ? status.label : status.labelEn}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Description */}
                {selectedTask.description && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.description}</Label>
                    <p className="text-slate-400 text-sm bg-slate-800/50 p-3 rounded-lg">
                      {selectedTask.description}
                    </p>
                  </div>
                )}
                
                {/* 1A: SLA, Task Type, Gov Entity Info */}
                {(() => {
                  const taskAny = selectedTask as any;
                  const slaStatus = getSLAStatusForTask(taskAny, language);
                  const taskType = taskAny.taskType ? TASK_TYPES[taskAny.taskType] : null;
                  const govEntity = taskAny.governmentEntity;
                  const depInfo = getDependencyInfo(taskAny);
                  
                  return (slaStatus || taskType || govEntity || depInfo) ? (
                    <div className="space-y-2">
                      <Label className="text-slate-300">
                        {language === 'ar' ? 'معلومات إضافية' : 'Additional Info'}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {taskType && (
                          <Badge variant="outline" className={`border ${taskType.color}`}>
                            {language === 'ar' ? taskType.labelAr : taskType.labelEn}
                          </Badge>
                        )}
                        {govEntity && (
                          <Badge variant="outline" className="border bg-amber-500/10 text-amber-400 border-amber-500/30">
                            <Shield className="w-3 h-3 me-1" />
                            {govEntity}
                          </Badge>
                        )}
                        {slaStatus && (
                          <Badge variant="outline" className={`border ${slaStatus.color}`}>
                            <Clock className="w-3 h-3 me-1" />
                            SLA: {slaStatus.label}
                          </Badge>
                        )}
                        {depInfo && (
                          <Badge variant="outline" className={`border ${depInfo.allMet ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                            <Link2 className="w-3 h-3 me-1" />
                            {language === 'ar' ? `التبعيات: ${depInfo.completedCount}/${depInfo.total}` : `Deps: ${depInfo.completedCount}/${depInfo.total}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
                
                {/* Meta info */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedTask.projectId && (
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">{t.project}</Label>
                      <p className="text-white text-sm">{getProjectName(selectedTask.projectId)}</p>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">{t.assignedTo}</Label>
                    <div className="flex items-center gap-2">
                      {getAssignee(selectedTask.assignedToId) ? (
                        <>
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[10px] bg-blue-600">
                              {language === 'ar' 
                                ? getAssignee(selectedTask.assignedToId)?.initials 
                                : getAssignee(selectedTask.assignedToId)?.nameEn.split(' ').map((n: string) => n[0]).join('')
                              }
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm">
                            {language === 'ar' 
                              ? getAssignee(selectedTask.assignedToId)?.name 
                              : getAssignee(selectedTask.assignedToId)?.nameEn
                            }
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-500 text-sm">
                          {language === 'ar' ? 'غير معين' : 'Unassigned'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {selectedTask.dueDate && (
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">{t.dueDate}</Label>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className={`text-sm ${isTaskOverdue(selectedTask) ? 'text-red-400' : 'text-white'}`}>
                          {formatDate(selectedTask.dueDate)}
                        </span>
                        {isTaskOverdue(selectedTask) && (
                          <Badge variant="destructive" className="text-xs ms-2">
                            {t.overdue}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedTask.estimatedHours && (
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">
                        {language === 'ar' ? 'الساعات المقدرة' : 'Estimated Hours'}
                      </Label>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-white text-sm">{selectedTask.estimatedHours}h</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Tags */}
                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t.tags}</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-slate-800 text-slate-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">{t.progress}</Label>
                    <span className="text-white text-sm">{selectedTask.progress || 0}%</span>
                  </div>
                  <Progress value={selectedTask.progress || 0} className="h-2" />
                </div>
                
                {/* 1C: Subtasks Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-slate-400" />
                      <Label className="text-slate-300">
                        {language === 'ar' ? 'المهام الفرعية' : 'Subtasks'}
                      </Label>
                      {subtasks.length > 0 && (
                        <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-xs">
                          {completedSubtasksCount}/{subtasks.length}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Subtask list */}
                  {isLoadingSubtasks ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {subtasks.map((subtask) => (
                        <div 
                          key={subtask.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors group/sub"
                        >
                          <button
                            onClick={() => handleToggleSubtask(subtask.id, subtask.completed)}
                            className="shrink-0"
                          >
                            {subtask.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                            )}
                          </button>
                          <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                            {subtask.title}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 h-4 border ${
                              subtask.completed 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : 'bg-slate-700/50 text-slate-400 border-slate-600/30'
                            }`}
                          >
                            {subtask.status === 'done' 
                              ? (language === 'ar' ? 'مكتمل' : 'Done') 
                              : (language === 'ar' ? 'قيد الانتظار' : 'To Do')
                            }
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add subtask input */}
                  <div className="flex gap-2">
                    <Input
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                      placeholder={language === 'ar' ? 'إضافة مهمة فرعية...' : 'Add subtask...'}
                      className="bg-slate-800/50 border-slate-700 text-white text-sm h-8"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-slate-400 hover:text-white"
                      onClick={handleAddSubtask}
                      disabled={!newSubtaskTitle.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <Separator className="bg-slate-800" />
                
                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}: {formatDate(selectedTask.createdAt)}</span>
                  {selectedTask.completedAt && (
                    <span>{language === 'ar' ? 'تاريخ الإكمال' : 'Completed'}: {formatDate(selectedTask.completedAt)}</span>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowTaskDetail(false)} 
                  className="text-slate-400"
                >
                  {t.close}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
