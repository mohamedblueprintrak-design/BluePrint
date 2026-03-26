'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Trash2,
  Filter,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types';

// Notification type icons and colors
const notificationTypeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  success: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  error: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

// Category labels
const categoryLabels: Record<string, string> = {
  project: 'مشروع',
  finance: 'مالي',
  task: 'مهمة',
  system: 'نظام',
  team: 'فريق',
};

export default function NotificationsPage() {
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
          title: 'تم تحديد الكل كمقروء',
          description: 'تم تحديد جميع الإشعارات كمقروءة',
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
          title: 'تم الحذف',
          description: 'تم حذف الإشعار بنجاح',
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
          <p className="text-gray-500 mt-1">
            لديك {unreadCount} إشعار غير مقروء
          </p>
        </div>
        <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
          <Check className="w-4 h-4 ml-2" />
          تحديد الكل كمقروء
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          الكل ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          غير مقروء ({unreadCount})
        </Button>
        <Button
          variant={filter === 'project' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('project')}
        >
          مشاريع
        </Button>
        <Button
          variant={filter === 'finance' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('finance')}
        >
          مالي
        </Button>
        <Button
          variant={filter === 'task' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('task')}
        >
          مهام
        </Button>
        <Button
          variant={filter === 'team' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('team')}
        >
          فريق
        </Button>
        <Button
          variant={filter === 'system' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('system')}
        >
          نظام
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const typeDisplay = getNotificationTypeDisplay(notification.notificationType);
          const Icon = typeDisplay.icon;

          return (
            <Card
              key={notification.id}
              className={`${
                !notification.isRead ? 'bg-blue-50 border-r-4 border-blue-500' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${typeDisplay.bgColor}`}
                  >
                    <Icon className={`w-5 h-5 ${typeDisplay.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-semibold ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <Badge variant="default" className="text-xs">
                          جديد
                        </Badge>
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-gray-600 text-sm">{notification.message}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-2">
                      {new Date(notification.createdAt).toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد إشعارات</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
