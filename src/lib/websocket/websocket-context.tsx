/**
 * WebSocket Context Provider
 * مزود سياق WebSocket للتطبيق
 *
 * Provides WebSocket connection state and methods to entire app
 */

'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
// @ts-expect-error - socket.io-client types not installed
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/auth-context';
import {
  NotificationPayload,
  ProjectPayload,
  TaskPayload,
  UserPresencePayload,
  SystemAlertPayload,
  TypingPayload,
} from './types';
import { toast } from 'sonner';

// ============================================
// Context Types
// ============================================

interface WebSocketContextValue {
  isConnected: boolean;
  notificationCount: number;
  notifications: NotificationPayload[];
  onlineUsers: Map<string, UserPresencePayload>;
  typingUsers: Map<string, TypingPayload>;
  joinOrganization: (organizationId: string) => void;
  leaveOrganization: (organizationId: string) => void;
  subscribeToEntity: (entityType: string, entityId: string) => void;
  unsubscribeFromEntity: (entityType: string, entityId: string) => void;
  startTyping: (entityType: string, entityId: string) => void;
  stopTyping: (entityType: string, entityId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
}

// ============================================
// Context
// ============================================

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// ============================================
// Provider
// ============================================

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresencePayload>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingPayload>>(new Map());

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !token) return;

    const url = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!url) {
      console.log('[WebSocket] No WebSocket URL configured');
      return;
    }



    // Initialize socket
    const socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });

    // Notification handlers
    socket.on('notification', (data: NotificationPayload) => {
      console.log('[WebSocket] Notification:', data);

      // Add to notifications list
      setNotifications((prev) => [data, ...prev.slice(0, 49)]);
      setNotificationCount((prev) => prev + 1);

      // Show toast notification
      const toastOptions = {
        description: data.message,
        action: data.actionUrl
          ? {
              label: 'عرض',
              onClick: () => window.location.href = data.actionUrl!,
            }
          : undefined,
      };

      switch (data.priority) {
        case 'urgent':
          toast.error(data.title, toastOptions);
          break;
        case 'high':
          toast.warning(data.title, toastOptions);
          break;
        default:
          toast.info(data.title, toastOptions);
      }
    });

    socket.on('notification_count', (data: { count: number }) => {
      setNotificationCount(data.count);
    });

    // Project update handler
    socket.on('project_update', (data: ProjectPayload) => {
      console.log('[WebSocket] Project update:', data);
      toast.info(`تحديث المشروع: ${data.name}`);
    });

    // Task update handler
    socket.on('task_update', (data: TaskPayload) => {
      console.log('[WebSocket] Task update:', data);

      // Only show toast if task is assigned to current user
      const currentUserId = user?.id;
      if (data.assignedTo === currentUserId) {
        toast.info(`تحديث المهمة: ${data.title}`);
      }
    });

    // User presence handlers
    socket.on('user_online', (data: UserPresencePayload) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data);
        return next;
      });
    });

    socket.on('user_offline', (data: UserPresencePayload) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    // Typing handler
    socket.on('user_typing', (data: TypingPayload) => {
      const key = `${data.entityType}:${data.entityId}:${data.userId}`;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (data.isTyping) {
          next.set(key, data);
        } else {
          next.delete(key);
        }
        return next;
      });

      // Auto-clear typing indicator after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        }, 3000);
      }
    });

    // System alert handler
    socket.on('system_alert', (data: SystemAlertPayload) => {
      console.log('[WebSocket] System alert:', data);

      switch (data.type) {
        case 'error':
          toast.error(data.title, { description: data.message });
          break;
        case 'warning':
          toast.warning(data.title, { description: data.message });
          break;
        case 'maintenance':
          toast.info('صيانة مجدولة', { description: data.message });
          break;
        default:
          toast.info(data.title, { description: data.message });
      }
    });

    // Error handler
    socket.on('error', (data: { message: string; code?: string }) => {
      console.error('[WebSocket] Error:', data);
      toast.error('خطأ في الاتصال', { description: data.message });
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user, token]);

  // ============================================
  // Actions
  // ============================================

  const joinOrganization = useCallback((organizationId: string) => {
    socketRef.current?.emit('join_organization', organizationId);
  }, []);

  const leaveOrganization = useCallback((organizationId: string) => {
    socketRef.current?.emit('leave_organization', organizationId);
  }, []);

  const subscribeToEntity = useCallback((entityType: string, entityId: string) => {
    socketRef.current?.emit('subscribe_to_entity', { entityType, entityId });
  }, []);

  const unsubscribeFromEntity = useCallback((entityType: string, entityId: string) => {
    socketRef.current?.emit('unsubscribe_from_entity', { entityType, entityId });
  }, []);

  const startTyping = useCallback((entityType: string, entityId: string) => {
    socketRef.current?.emit('typing_start', { entityType, entityId });
  }, []);

  const stopTyping = useCallback((entityType: string, entityId: string) => {
    socketRef.current?.emit('typing_stop', { entityType, entityId });
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    socketRef.current?.emit('mark_notification_read', notificationId);
    setNotificationCount((prev) => Math.max(0, prev - 1));
    setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setNotificationCount(0);
  }, []);

  // ============================================
  // Context Value
  // ============================================

  const value: WebSocketContextValue = {
    isConnected,
    notificationCount,
    notifications,
    onlineUsers,
    typingUsers,
    joinOrganization,
    leaveOrganization,
    subscribeToEntity,
    unsubscribeFromEntity,
    startTyping,
    stopTyping,
    markNotificationRead,
    clearNotifications,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

// ============================================
// Selector Hooks
// ============================================

export function useIsConnected(): boolean {
  const { isConnected } = useWebSocketContext();
  return isConnected;
}

export function useNotificationCount(): number {
  const { notificationCount } = useWebSocketContext();
  return notificationCount;
}

export function useNotifications(): NotificationPayload[] {
  const { notifications } = useWebSocketContext();
  return notifications;
}

export function useOnlineUsers(): Map<string, UserPresencePayload> {
  const { onlineUsers } = useWebSocketContext();
  return onlineUsers;
}

export function useIsUserOnline(userId: string): boolean {
  const { onlineUsers } = useWebSocketContext();
  return onlineUsers.has(userId);
}

export function useTypingUsers(entityType?: string, entityId?: string): TypingPayload[] {
  const { typingUsers } = useWebSocketContext();

  const typing = Array.from(typingUsers.values());

  if (entityType && entityId) {
    return typing.filter(
      (t) => t.entityType === entityType && t.entityId === entityId
    );
  }

  return typing;
}
