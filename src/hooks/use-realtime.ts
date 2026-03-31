'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import type { Notification, NotificationType } from '@/types';

// التحقق من بيئة المتصفح
const isBrowser = typeof window !== 'undefined';

// RealtimeNotification يرث من Notification interface
interface RealtimeNotification extends Notification {
  timestamp?: string;
}

// Type alias للسهولة
type NotifType = NotificationType;

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
    maxReconnectAttempts = 3
  } = options;

  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Refs لتتبع الحالة بدون إعادة render
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalDisconnectRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(false);
  
  // Callbacks refs لتجنب dependency issues
  const onNotificationRef = useRef(onNotification);
  const onUnreadCountChangeRef = useRef(onUnreadCountChange);
  
  // تحديث refs
  useEffect(() => {
    onNotificationRef.current = onNotification;
    onUnreadCountChangeRef.current = onUnreadCountChange;
  }, [onNotification, onUnreadCountChange]);

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    lastHeartbeat: null,
    unreadCount: 0,
    error: null
  });

  // QueryClient ref لتجنب dependency issues
  const queryClientRef = useRef(queryClient);
  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  // معالجة الأحداث الواردة - بدون dependencies (ثابتة)
  const handleEvent = useCallback((event: MessageEvent) => {
    if (!isBrowser) return;
    
    const eventType = (event as MessageEvent & { event?: string }).event || 'message';
    
    try {
      const data = JSON.parse(event.data);
      
      switch (eventType) {
        case 'connected':
          setState(prev => ({ ...prev, isConnected: true, error: null }));
          reconnectAttemptsRef.current = 0;
          break;
          
        case 'notification':
          const notification = data as RealtimeNotification;
          
          // تحديث قائمة الإشعارات
          queryClientRef.current.invalidateQueries({ queryKey: ['notifications'] });
          
          // استدعاء callback إذا كان موجوداً
          if (onNotificationRef.current) {
            onNotificationRef.current(notification);
          }
          
          // عرض إشعار المتصفح إذا كان مسموحاً
          showBrowserNotification(notification);
          break;
          
        case 'unread_count':
          const count = data.count;
          setState(prev => ({ ...prev, unreadCount: count }));
          
          if (onUnreadCountChangeRef.current) {
            onUnreadCountChangeRef.current(count);
          }
          break;
          
        case 'heartbeat':
          setState(prev => ({ ...prev, lastHeartbeat: new Date() }));
          break;
          
        default:
          if (data.count !== undefined) {
            setState(prev => ({ ...prev, unreadCount: data.count }));
          }
      }
    } catch {
      // Silent fail for SSE parsing
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // فارغة عمداً - نستخدم refs

  // قطع الاتصال - بدون dependencies
  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    reconnectAttemptsRef.current = 0;
    isConnectingRef.current = false;
    setState(prev => ({ ...prev, isConnected: false, error: null }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Options refs لتجنب dependency issues
  const enabledRef = useRef(enabled);
  const maxReconnectAttemptsRef = useRef(maxReconnectAttempts);
  const reconnectIntervalRef = useRef(reconnectInterval);
  
  useEffect(() => {
    enabledRef.current = enabled;
    maxReconnectAttemptsRef.current = maxReconnectAttempts;
    reconnectIntervalRef.current = reconnectInterval;
  }, [enabled, maxReconnectAttempts, reconnectInterval]);

  // إنشاء اتصال SSE - بدون dependencies (ثابتة)
  const createConnection = useCallback((currentToken: string) => {
    if (!isBrowser || !currentToken || !enabledRef.current || isConnectingRef.current) {
      return;
    }
    
    // Reset intentional disconnect flag
    intentionalDisconnectRef.current = false;
    lastTokenRef.current = currentToken;
    isConnectingRef.current = true;
    
    // إغلاق الاتصال السابق إذا كان موجوداً
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // إنشاء اتصال SSE مع التوكن في query parameter
      const url = `/api/notifications/stream?token=${encodeURIComponent(currentToken)}`;
      const eventSource = new EventSource(url, {
        withCredentials: true
      });

      eventSource.onopen = () => {
        isConnectingRef.current = false;
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
        isConnectingRef.current = false;
        
        // Check if this was an intentional disconnect
        if (intentionalDisconnectRef.current) {
          return;
        }
        
        // Check if token changed or user logged out
        if (isBrowser) {
          const storedToken = localStorage.getItem('bp_token');
          if (!storedToken || storedToken !== lastTokenRef.current) {
            eventSource.close();
            return;
          }
        }
        
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          error: 'فقدان الاتصال بنظام الإشعارات' 
        }));
        
        eventSource.close();
        
        // Only reconnect if still authenticated and have valid token
        if (reconnectAttemptsRef.current < maxReconnectAttemptsRef.current && lastTokenRef.current) {
          reconnectAttemptsRef.current++;
          const delay = reconnectIntervalRef.current * Math.pow(2, Math.min(reconnectAttemptsRef.current - 1, 4));
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (lastTokenRef.current && !intentionalDisconnectRef.current) {
              createConnection(lastTokenRef.current);
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttemptsRef.current) {
          setState(prev => ({ 
            ...prev, 
            error: 'تعذر الاتصال بنظام الإشعارات بعد عدة محاولات' 
          }));
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      isConnectingRef.current = false;
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errMsg }));
    }
  }, [handleEvent]); // handleEvent ثابتة الآن

  // إنشاء اتصال عند تغير token فقط - بدون function dependencies
  useEffect(() => {
    if (!isBrowser) return;
    
    mountedRef.current = true;
    
    // Only connect if authenticated with valid token
    if (token && enabled && isAuthenticated && token !== lastTokenRef.current) {
      // Reset reconnection attempts on new connection
      reconnectAttemptsRef.current = 0;
      createConnection(token);
    } else if (!token && lastTokenRef.current) {
      // Token was cleared, disconnect
      disconnect();
    }
    
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, enabled, isAuthenticated]); // فقط primitive values

  // Token ref للـ reconnect
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // إعادة الاتصال يدوياً - بدون dependencies
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    if (tokenRef.current) {
      createConnection(tokenRef.current);
    }
  }, [createConnection, disconnect]);

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
