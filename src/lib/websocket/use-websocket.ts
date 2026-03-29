/**
 * WebSocket React Hook
 * Hook للاتصال بـ WebSocket من الـ client
 *
 * Provides real-time updates and notifications
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
// @ts-expect-error - socket.io-client types not installed
import { io, Socket } from 'socket.io-client';
import {
  WebSocketEventType,
  NotificationPayload,
  ProjectPayload,
  TaskPayload,
  UserPresencePayload,
  SystemAlertPayload,
  TypingPayload,
} from './types';

// ============================================
// Types
// ============================================

interface UseWebSocketOptions {
  token: string;
  url?: string;
  onNotification?: (notification: NotificationPayload) => void;
  onProjectUpdate?: (update: ProjectPayload) => void;
  onTaskUpdate?: (update: TaskPayload) => void;
  onUserOnline?: (user: UserPresencePayload) => void;
  onUserOffline?: (user: UserPresencePayload) => void;
  onUserTyping?: (typing: TypingPayload) => void;
  onSystemAlert?: (alert: SystemAlertPayload) => void;
  onNotificationCount?: (count: number) => void;
  onError?: (error: { message: string; code?: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  notificationCount: number;
  joinOrganization: (organizationId: string) => void;
  leaveOrganization: (organizationId: string) => void;
  subscribeToEntity: (entityType: string, entityId: string) => void;
  unsubscribeFromEntity: (entityType: string, entityId: string) => void;
  startTyping: (entityType: string, entityId: string) => void;
  stopTyping: (entityType: string, entityId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  disconnect: () => void;
}

// ============================================
// Hook
// ============================================

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    token,
    url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || '',
    onNotification,
    onProjectUpdate,
    onTaskUpdate,
    onUserOnline,
    onUserOffline,
    onUserTyping,
    onSystemAlert,
    onNotificationCount,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !url) return;

    const socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      onConnect?.();
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error);
      onError?.({ message: error.message, code: 'CONNECTION_ERROR' });
    });

    // Notification events
    socket.on('notification', (data: NotificationPayload) => {
      console.log('[WebSocket] Notification received:', data);
      setNotificationCount((prev) => prev + 1);
      onNotification?.(data);
    });

    socket.on('notification_count', (data: { count: number }) => {
      setNotificationCount(data.count);
      onNotificationCount?.(data.count);
    });

    // Project events
    socket.on('project_update', (data: ProjectPayload) => {
      console.log('[WebSocket] Project update:', data);
      onProjectUpdate?.(data);
    });

    // Task events
    socket.on('task_update', (data: TaskPayload) => {
      console.log('[WebSocket] Task update:', data);
      onTaskUpdate?.(data);
    });

    // User presence events
    socket.on('user_online', (data: UserPresencePayload) => {
      onUserOnline?.(data);
    });

    socket.on('user_offline', (data: UserPresencePayload) => {
      onUserOffline?.(data);
    });

    // Typing events
    socket.on('user_typing', (data: TypingPayload) => {
      onUserTyping?.(data);
    });

    // System events
    socket.on('system_alert', (data: SystemAlertPayload) => {
      console.log('[WebSocket] System alert:', data);
      onSystemAlert?.(data);
    });

    // Error events
    socket.on('error', (data: { message: string; code?: string }) => {
      console.error('[WebSocket] Error:', data);
      onError?.(data);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, url]);

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
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    notificationCount,
    joinOrganization,
    leaveOrganization,
    subscribeToEntity,
    unsubscribeFromEntity,
    startTyping,
    stopTyping,
    markNotificationRead,
    disconnect,
  };
}

// ============================================
// Singleton WebSocket Provider Hook
// ============================================

let globalSocket: Socket | null = null;

export function useGlobalWebSocket(token?: string): {
  socket: Socket | null;
  isConnected: boolean;
} {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || '';
    if (!url) return;

    if (!globalSocket) {
      globalSocket = io(url, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
      });
    }

    globalSocket.on('connect', () => setIsConnected(true));
    globalSocket.on('disconnect', () => setIsConnected(false));

    return () => {
      // Don't disconnect global socket on unmount
    };
  }, [token]);

  return { socket: globalSocket, isConnected };
}
