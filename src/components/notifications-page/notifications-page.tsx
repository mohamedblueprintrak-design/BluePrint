'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Check,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types';

// Notification type icons and colors (dark theme)
const notificationTypeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  info: { icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  success: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  error: { icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

// Category labels (reserved for future use with language-aware filter badges)
const _categoryLabels: Record<string, { ar: string; en: string }> = {
  project: { ar: 'مشروع', en: 'Project' },
  finance: { ar: 'مالي', en: 'Finance' },
  task: { ar: 'مهمة', en: 'Task' },
  system: { ar: 'نظام', en: 'System' },
  team: { ar: 'فريق', en: 'Team' },
};

export default function NotificationsPage() {
  const { language, isRTL } = useApp();
  const isArabic = language === 'ar';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return n.notificationType.includes(filter);
  });

  // Stats
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications(
          notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
        toast({
          title: isArabic ? 'تم تحديد الكل كمقروء' : 'All marked as read',
          description: isArabic ? 'تم تحديد جميع الإشعارات كمقروءة' : 'All notifications marked as read',
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== id));
        toast({
          title: isArabic ? 'تم الحذف' : 'Deleted',
          description: isArabic ? 'تم حذف الإشعار بنجاح' : 'Notification deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Get notification type display
  const getNotificationTypeDisplay = (type: NotificationType) => {
    if (type.includes('task')) return { ...notificationTypeConfig.info, category: 'task' };
    if (type.includes('invoice') || type.includes('payment')) return { ...notificationTypeConfig.success, category: 'finance' };
    if (type.includes('project')) return { ...notificationTypeConfig.info, category: 'project' };
    if (type.includes('leave') || type.includes('team')) return { ...notificationTypeConfig.warning, category: 'team' };
    if (type.includes('error') || type.includes('overdue')) return { ...notificationTypeConfig.error, category: 'system' };
    return { ...notificationTypeConfig.info, category: 'system' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isArabic ? 'الإشعارات' : 'Notifications'}
          </h1>
          <p className="text-slate-400 mt-1">
            {isArabic ? `لديك ${unreadCount} إشعار غير مقروء` : `You have ${unreadCount} unread notifications`}
          </p>
        </div>
        <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white">
          <Check className={`w-4 h-4 ${isRTL ? 'me-2' : 'ms-2'}`} />
          {isArabic ? 'تحديد الكل كمقروء' : 'Mark all as read'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: isArabic ? 'الكل' : 'All', count: notifications.length },
          { key: 'unread', label: isArabic ? 'غير مقروء' : 'Unread', count: unreadCount },
          { key: 'project', label: isArabic ? 'مشاريع' : 'Projects' },
          { key: 'finance', label: isArabic ? 'مالي' : 'Finance' },
          { key: 'task', label: isArabic ? 'مهام' : 'Tasks' },
          { key: 'team', label: isArabic ? 'فريق' : 'Team' },
          { key: 'system', label: isArabic ? 'نظام' : 'System' },
        ].map(({ key, label, count }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key)}
            className={filter !== key ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' : ''}
          >
            {label}
            {count !== undefined && (
              <span className={`text-xs opacity-70 ${isRTL ? 'me-1' : 'ms-1'}`}>({count})</span>
            )}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const typeDisplay = getNotificationTypeDisplay(notification.notificationType);
          const Icon = typeDisplay.icon;

          return (
            <Card
              key={notification.id}
              className={`bg-slate-900/50 border-slate-800 ${
                !notification.isRead ? (isRTL ? 'border-r-4 border-blue-500' : 'border-l-4 border-blue-500') : ''
              } hover:border-slate-700 transition-colors`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeDisplay.bgColor}`}
                  >
                    <Icon className={`w-5 h-5 ${typeDisplay.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-semibold ${
                          !notification.isRead ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <Badge variant="default" className="text-xs bg-blue-600">
                          {isArabic ? 'جديد' : 'New'}
                        </Badge>
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-slate-400 text-sm">{notification.message}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(notification.createdAt).toLocaleString(isArabic ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">{isArabic ? 'لا توجد إشعارات' : 'No notifications'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
