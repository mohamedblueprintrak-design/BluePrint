'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/use-data';
import { useRealtime } from '@/hooks/use-realtime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell, Check, CheckCheck, Clock, FileText, Package, 
  AlertTriangle, MessageSquare, Calendar, Building2,
  FileSignature, Plane, Ban, DollarSign, Bug, Settings,
  Loader2
} from 'lucide-react';
import type { NotificationType, Notification } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// أيقونات الإشعارات
const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  task_assigned: <Check className="w-4 h-4 text-blue-400" />,
  task_completed: <CheckCheck className="w-4 h-4 text-green-400" />,
  task_due_soon: <Clock className="w-4 h-4 text-orange-400" />,
  invoice_created: <FileText className="w-4 h-4 text-blue-400" />,
  invoice_paid: <DollarSign className="w-4 h-4 text-green-400" />,
  invoice_overdue: <AlertTriangle className="w-4 h-4 text-red-400" />,
  low_stock: <Package className="w-4 h-4 text-orange-400" />,
  new_message: <MessageSquare className="w-4 h-4 text-blue-400" />,
  deadline_approaching: <Calendar className="w-4 h-4 text-red-400" />,
  project_update: <Building2 className="w-4 h-4 text-blue-400" />,
  contract_signed: <FileSignature className="w-4 h-4 text-green-400" />,
  leave_approved: <Plane className="w-4 h-4 text-green-400" />,
  leave_rejected: <Ban className="w-4 h-4 text-red-400" />,
  payment_received: <DollarSign className="w-4 h-4 text-green-400" />,
  defect_reported: <Bug className="w-4 h-4 text-orange-400" />,
  system: <Settings className="w-4 h-4 text-muted-foreground" />,
  approval_required: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
};

// ألوان الأولوية
const PRIORITY_COLORS = {
  low: 'border-l-slate-500',
  normal: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500'
};

// تنسيق الوقت النسبي
function formatRelativeTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ar });
  } catch {
    return 'منذ فترة';
  }
}

interface NotificationDropdownProps {
  isRTL: boolean;
}

export function NotificationDropdown({ isRTL }: NotificationDropdownProps) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  
  // جلب الإشعارات
  const { data: notificationsData, isLoading, refetch } = useNotifications(false);
  const notifications = notificationsData?.data || [];
  
  // حساب عدد الإشعارات غير المقروءة
  const unreadCount = localUnreadCount || notifications.filter((n: Notification) => !n.isRead).length;
  
  // mutations
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  
  // الاتصال الفوري - يعمل فقط في المتصفح
  const { isConnected } = useRealtime({
    onNotification: () => {
      // إعادة تحميل الإشعارات عند وصول إشعار جديد
      refetch();
    },
    onUnreadCountChange: (count) => {
      setLocalUnreadCount(count);
    },
    enabled: !!token
  });

  // معالجة تحديد إشعار كمقروء
  const handleMarkAsRead = useCallback(async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await markAsRead.mutateAsync(id);
    setLocalUnreadCount(prev => Math.max(0, prev - 1));
  }, [markAsRead]);

  // معالجة تحديد الكل كمقروء
  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead.mutateAsync();
    setLocalUnreadCount(0);
  }, [markAllAsRead]);

  // فتح الإشعار
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
      setLocalUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
  }, [markAsRead]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-accent relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-foreground text-xs animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {isConnected && (
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align={isRTL ? 'start' : 'end'} 
        className="w-80 md:w-96 bg-card border-border p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <DropdownMenuLabel className="text-foreground p-0">
            الإشعارات
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ms-2 bg-secondary text-foreground/80">
                {unreadCount} جديد
              </Badge>
            )}
          </DropdownMenuLabel>
          <div className="flex items-center gap-2">
            {isConnected && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                متصل
              </span>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'تحديد الكل كمقروء'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Bell className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.slice(0, 10).map((notification: Notification, index: number) => (
                <div key={notification.id}>
                  {index > 0 && <Separator className="my-1 bg-muted" />}
                  <DropdownMenuItem
                    className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-accent focus:bg-muted border-l-2 ${PRIORITY_COLORS[notification.priority]} ${!notification.isRead ? 'bg-muted' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    asChild
                  >
                    {notification.actionUrl ? (
                      <Link href={notification.actionUrl} className="flex items-start gap-3 w-full">
                        <div className="flex-shrink-0 mt-0.5">
                          {NOTIFICATION_ICONS[notification.notificationType] || <Bell className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.isRead ? 'font-medium text-foreground' : 'text-foreground/80'}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 flex-shrink-0"
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                              >
                                <Check className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                          {notification.message && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex-shrink-0 mt-0.5">
                          {NOTIFICATION_ICONS[notification.notificationType] || <Bell className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.isRead ? 'font-medium text-foreground' : 'text-foreground/80'}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 flex-shrink-0"
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                              >
                                <Check className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                          {notification.message && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </DropdownMenuItem>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DropdownMenuSeparator className="bg-muted" />
        <div className="p-2">
          <Link
            href="/dashboard/notifications"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-full p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            عرض جميع الإشعارات
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationDropdown;
