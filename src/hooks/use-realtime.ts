'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import type { Notification as NotificationType, NotificationType as NotifType } from '@/types';

// التحقق من بيئة المتصفح
const isBrowser = typeof window !== 'undefined';

interface RealtimeNotification extends NotificationType {
  timestamp?: string;
}

interface UseRealtimeOptions {
  onNotification?: (notification: RealtimeNotification) => void;
  onUnreadCountChange?: (count: number) => void;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface RealtimeState {
  isConnected: boolean;
  lastHeartbeat: Date | null;
  unreadCount: number;
  error: string | null;
}

// رسائل الإشعارات بالعربية
const NOTIFICATION_MESSAGES: Record<NotifType, { title: string; icon: string }> = {
  task_assigned: { title: 'مهمة جديدة', icon: '📋' },
  task_completed: { title: 'مهمة مكتملة', icon: '✅' },
  task_due_soon: { title: 'موعد مهمة قريب', icon: '⏰' },
  invoice_created: { title: 'فاتورة جديدة', icon: '📄' },
  invoice_paid: { title: 'فاتورة مدفوعة', icon: '💰' },
  invoice_overdue: { title: 'فاتورة متأخرة', icon: '⚠️' },
  low_stock: { title: 'مخزون منخفض', icon: '📦' },
  new_message: { title: 'رسالة جديدة', icon: '💬' },
  deadline_approaching: { title: 'موعد تسليم قريب', icon: '📅' },
  project_update: { title: 'تحديث مشروع', icon: '🏗️' },
  contract_signed: { title: 'عقد موقع', icon: '📝' },
  leave_approved: { title: 'إجازة موافق عليها', icon: '✈️' },
  leave_rejected: { title: 'إجازة مرفوضة', icon: '❌' },
  payment_received: { title: 'دفعة مستلمة', icon: '💵' },
  defect_reported: { title: 'عيب مُبلغ عنه', icon: '🔧' },
  system: { title: 'إشعار نظام', icon: '🔔' },
  approval_required: { title: 'يتطلب موافقة', icon: '✋' },
};

// إظهار إشعار المتصفح (دالة مستقلة)
function showBrowserNotification(notification: RealtimeNotification) {
  if (!isBrowser || !('Notification' in window)) return;
  
  // استخدام window.Notification للتفريق بين API والنوع
  const BrowserNotification = window.Notification;
  
  if (BrowserNotification.permission === 'granted') {
    const notifInfo = NOTIFICATION_MESSAGES[notification.notificationType] || NOTIFICATION_MESSAGES.system;
    
    new BrowserNotification(`${notifInfo.icon} ${notification.title}`, {
      body: notification.message || '',
      icon: '/logo.svg',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent'
    });
  }
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    onNotification,
    onUnreadCountChange,
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10
  } = options;

  const { token } = useAuth();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    lastHeartbeat: null,
    unreadCount: 0,
    error: null
  });

  // معالجة الأحداث الواردة
  const handleEvent = useCallback((event: MessageEvent) => {
    if (!isBrowser) return;
    
    const eventType = (event as any).event || 'message';
    
    try {
      const data = JSON.parse(event.data);
      
      switch (eventType) {
        case 'connected':
          setState(prev => ({ ...prev, isConnected: true, error: null }));
          reconnectAttemptsRef.current = 0;
          console.log('🔗 متصل بنظام الإشعارات الفورية');
          break;
          
        case 'notification':
          const notification = data as RealtimeNotification;
          
          // تحديث قائمة الإشعارات
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          // استدعاء callback إذا كان موجوداً
          if (onNotification) {
            onNotification(notification);
          }
          
          // عرض إشعار المتصفح إذا كان مسموحاً
          showBrowserNotification(notification);
          break;
          
        case 'unread_count':
          const count = data.count;
          setState(prev => ({ ...prev, unreadCount: count }));
          
          if (onUnreadCountChange) {
            onUnreadCountChange(count);
          }
          break;
          
        case 'heartbeat':
          setState(prev => ({ ...prev, lastHeartbeat: new Date() }));
          break;
          
        default:
          // معالجة الأحداث الأخرى
          if (data.count !== undefined) {
            setState(prev => ({ ...prev, unreadCount: data.count }));
          }
      }
    } catch (err) {
      console.error('خطأ في معالجة حدث SSE:', err);
    }
  }, [onNotification, onUnreadCountChange, queryClient]);

  // إنشاء اتصال SSE
  const connect = useCallback(() => {
    // التحقق من بيئة المتصفح
    if (!isBrowser || !token || !enabled) return;
    
    // إغلاق الاتصال السابق إذا كان موجوداً
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // إنشاء اتصال SSE مع التوكن في query parameter
      const url = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(url, {
        withCredentials: true
      });

      eventSource.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = handleEvent;

      // معالجة أنواع الأحداث المختلفة
      eventSource.addEventListener('connected', handleEvent);
      eventSource.addEventListener('notification', handleEvent);
      eventSource.addEventListener('unread_count', handleEvent);
      eventSource.addEventListener('heartbeat', handleEvent);

      eventSource.onerror = () => {
        console.error('خطأ في اتصال SSE');
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          error: 'فقدان الاتصال بنظام الإشعارات' 
        }));
        
        eventSource.close();
        
        // محاولة إعادة الاتصال
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectInterval * Math.min(reconnectAttemptsRef.current, 5);
          
          console.log(`محاولة إعادة الاتصال ${reconnectAttemptsRef.current}/${maxReconnectAttempts} خلال ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error: any) {
      console.error('خطأ في إنشاء اتصال SSE:', error);
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, [token, enabled, handleEvent, reconnectInterval, maxReconnectAttempts]);

  // قطع الاتصال
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  // إعادة الاتصال يدوياً
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    connect();
  }, [connect, disconnect]);

  // طلب إذن الإشعارات
  const requestNotificationPermission = useCallback(async () => {
    if (!isBrowser || !('Notification' in window)) {
      return false;
    }
    
    const BrowserNotification = window.Notification;
    
    if (BrowserNotification.permission === 'granted') {
      return true;
    }
    
    if (BrowserNotification.permission !== 'denied') {
      const permission = await BrowserNotification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }, []);

  // إنشاء اتصال عند تحميل المكون (فقط في المتصفح)
  useEffect(() => {
    if (!isBrowser) return;
    
    if (token && enabled) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [token, enabled, connect, disconnect]);

  return {
    ...state,
    reconnect,
    disconnect,
    requestNotificationPermission
  };
}

// Hook مبسط للإشعارات الفورية
export function useNotificationsRealtime() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  
  const { isConnected, unreadCount, reconnect } = useRealtime({
    onNotification: (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10));
    }
  });
  
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  return {
    notifications,
    isConnected,
    unreadCount,
    clearNotifications,
    reconnect
  };
}

export default useRealtime;
