/**
 * WebSocket Module
 * وحدة WebSocket للإشعارات الفورية
 *
 * Exports all WebSocket-related functionality
 */

// Types
export * from './types';

// Service
export {
  initializeWebSocket,
  sendNotificationToUser,
  sendNotificationToOrganization,
  broadcastProjectUpdate,
  broadcastTaskUpdate,
  broadcastSystemAlert,
  isUserOnline,
  getOnlineUsersInOrganization,
  getWebSocketServer,
  getConnectionStats,
} from './websocket-service';

// React Hook
export { useWebSocket, useGlobalWebSocket } from './use-websocket';

// Context
export {
  WebSocketProvider,
  useWebSocketContext,
  useIsConnected,
  useNotificationCount,
  useNotifications,
  useOnlineUsers,
  useIsUserOnline,
  useTypingUsers,
} from './websocket-context';
