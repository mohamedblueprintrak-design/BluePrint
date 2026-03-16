'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useProjects } from '@/hooks/use-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
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
  CheckSquare, Plus, Search, Filter, MoreVertical, Edit, Trash2,
  Eye, Calendar, Clock, User, Tag, GripVertical, AlertCircle,
  CheckCircle2, Circle, Loader2, Eye as ReviewIcon, X
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

export function TasksPage() {
  const { language } = useApp();
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
  
  // Hooks
  const { data: tasksData, isLoading, refetch } = useTasks();
  const { data: projectsData } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const tasks = tasksData?.data || [];
  const projects = projectsData?.data || [];
  
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
    // Search filter
    const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Priority filter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    // Project filter
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
    
    // Assignee filter
    const matchesAssignee = assigneeFilter === 'all' || task.assignedToId === assigneeFilter;
    
    // Date filter
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
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء المهمة' : 'Failed to create task',
        variant: 'destructive'
      });
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
    } catch (error) {
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
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'حدث خطأ أثناء حذف المهمة' : 'Failed to delete task',
        variant: 'destructive'
      });
    }
  };
  
  // Get priority config
  const getPriorityConfig = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
  };
  
  // Get status config
  const getStatusConfig = (status: string) => {
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
    return MOCK_USERS.find(u => u.id === assigneeId) || null;
  };
  
  // Check if task is overdue
  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'done') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };
  
  // Render task card
  const renderTaskCard = (task: Task) => {
    const priorityConfig = getPriorityConfig(task.priority);
    const projectName = getProjectName(task.projectId);
    const assignee = getAssignee(task.assignedToId);
    const overdue = isTaskOverdue(task);
    
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
          {/* Header with priority and drag handle */}
          <div className="flex items-start gap-2">
            <GripVertical className="w-4 h-4 text-slate-500 mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${priorityConfig.dotColor}`} />
                <span className="text-white font-medium line-clamp-2 text-sm">
                  {task.title}
                </span>
              </div>
            </div>
          </div>
          
          {/* Project name */}
          {projectName && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Tag className="w-3 h-3" />
              <span className="truncate">{projectName}</span>
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
                  {language === 'ar' ? assignee.initials : assignee.nameEn.split(' ').map(n => n[0]).join('')}
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
              {MOCK_USERS.map((user) => (
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
              {/* Title */}
              <div className="space-y-2">
                <Label className="text-slate-300">{t.taskTitle} *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  placeholder={language === 'ar' ? 'أدخل عنوان المهمة' : 'Enter task title'}
                />
              </div>
              
              {/* Description */}
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
                {/* Project */}
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
                
                {/* Assignee */}
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
                      {MOCK_USERS.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {language === 'ar' ? user.name : user.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
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
                
                {/* Due Date */}
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
                {/* Estimated Hours */}
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
                
                {/* Tags */}
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityConfig(selectedTask.priority).dotColor}`} />
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
                  <div className="flex gap-2">
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
                
                {/* Meta info */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Project */}
                  {selectedTask.projectId && (
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">{t.project}</Label>
                      <p className="text-white text-sm">{getProjectName(selectedTask.projectId)}</p>
                    </div>
                  )}
                  
                  {/* Assignee */}
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">{t.assignedTo}</Label>
                    <div className="flex items-center gap-2">
                      {getAssignee(selectedTask.assignedToId) ? (
                        <>
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[10px] bg-blue-600">
                              {language === 'ar' 
                                ? getAssignee(selectedTask.assignedToId)?.initials 
                                : getAssignee(selectedTask.assignedToId)?.nameEn.split(' ').map(n => n[0]).join('')
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
                  
                  {/* Due Date */}
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
                  
                  {/* Estimated Hours */}
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
