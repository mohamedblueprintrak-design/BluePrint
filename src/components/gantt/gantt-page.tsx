'use client';

/**
 * Gantt Chart Page Component
 * صفحة مخطط جانت
 */

import { useState } from 'react';
import { GanttChart } from '@/components/gantt/gantt-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, List, Filter, Download, 
  BarChart3, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';

interface GanttPageProps {
  projectId?: string;
  lang?: 'ar' | 'en';
}

export function GanttPage({ projectId, lang = 'ar' }: GanttPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
  });

  const isRTL = lang === 'ar';

  // Handle task creation
  const handleTaskCreate = async (task: any) => {
    try {
      const response = await fetch('/api/gantt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Handle task update
  const handleTaskUpdate = async (task: any) => {
    try {
      const response = await fetch('/api/gantt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Handle task deletion
  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/gantt?id=${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/gantt${projectId ? `?projectId=${projectId}` : ''}`);
      const data = await response.json();

      if (data.success) {
        const csvContent = [
          ['Title', 'Status', 'Priority', 'Start Date', 'End Date', 'Progress'].join(','),
          ...data.data.map((task: any) => [
            `"${task.title}"`,
            task.status,
            task.priority,
            task.startDate || '',
            task.endDate || '',
            `${task.progress}%`,
          ].join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {lang === 'ar' ? 'مخطط جانت' : 'Gantt Chart'}
          </h1>
          <p className="text-slate-400 mt-1">
            {lang === 'ar' 
              ? 'إدارة جدول المهام والمشاريع' 
              : 'Manage project schedules and tasks'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            {lang === 'ar' ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">
                  {lang === 'ar' ? 'إجمالي المهام' : 'Total Tasks'}
                </p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">
                  {lang === 'ar' ? 'مكتملة' : 'Completed'}
                </p>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">
                  {lang === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
                </p>
                <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">
                  {lang === 'ar' ? 'متأخرة' : 'Overdue'}
                </p>
                <p className="text-2xl font-bold text-white">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      <GanttChart
        key={refreshKey}
        projectId={projectId}
        lang={lang}
        onTaskCreate={handleTaskCreate}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />

      {/* Legend */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm">
            {lang === 'ar' ? 'دليل الألوان' : 'Color Legend'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm text-slate-400">
                {lang === 'ar' ? 'أولوية منخفضة' : 'Low Priority'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-sm text-slate-400">
                {lang === 'ar' ? 'أولوية متوسطة' : 'Medium Priority'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm text-slate-400">
                {lang === 'ar' ? 'أولوية عالية' : 'High Priority'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-700" />
              <span className="text-sm text-slate-400">
                {lang === 'ar' ? 'أولوية حرجة' : 'Critical Priority'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rotate-45 bg-amber-400" />
              <span className="text-sm text-slate-400">
                {lang === 'ar' ? 'معلم رئيسي' : 'Milestone'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GanttPage;
