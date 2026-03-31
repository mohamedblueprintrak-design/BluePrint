/**
 * WebSocket Service
 * خدمة WebSocket للإشعارات الفورية
 *
 * Implements real-time communication using Socket.io
 * Handles notifications, presence, and live updates
 */

import { Server as HTTPServer } from 'http';
import { Server as HTTPSServer } from 'https';
import { Server as IOServer, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import {
  WebSocketEventType,
  WebSocketMessage,
  SocketData,
  NotificationPayload,
  ProjectPayload,
  TaskPayload,
  UserPresencePayload,
  RoomType,
} from './types';

// ============================================
// WebSocket Server Instance
// ============================================

let io: IOServer<any, any, any, SocketData> | null = null;

// ============================================
// Connected Users Tracking
// ============================================

interface ConnectedUser {
  socketId: string;
  userId: string;
  organizationId?: string;
  userName: string;
  connectedAt: Date;
  rooms: Set<string>;
}

const connectedUsers = new Map<string, ConnectedUser>();
const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

// ============================================
// Initialize WebSocket Server
// ============================================

export function initializeWebSocket(
  server: HTTPServer | HTTPSServer,
  corsOrigin: string | string[] = '*'
): IOServer<any, any, any, SocketData> {
  if (io) {
    return io;
  }

  io = new IOServer(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  io.use(async (socket: any, next: any) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const secret = env.JWT_SECRET;
      if (!secret) {
        return next(new Error('Server configuration error'));
      }

      const decoded = verify(token, secret) as {
        userId: string;
        email: string;
        role: string;
        organizationId?: string;
        username: string;
      };

      // Get user from database
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          organizationId: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // Attach user data to socket
      socket.data = {
        userId: user.id,
        organizationId: user.organizationId || undefined,
        role: user.role,
        email: user.email,
        userName: user.fullName || user.username,
        connectedAt: new Date(),
      };

      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: any) => {
    handleConnection(socket);
  });

  return io;
}

// ============================================
// Connection Handler
// ============================================

function handleConnection(socket: Socket<any, any, any, SocketData>) {
  const { userId, organizationId, userName } = socket.data;

  console.log(`[WebSocket] User connected: ${userName} (${userId})`);

  // Track connected user
  const userConnection: ConnectedUser = {
    socketId: socket.id,
    userId,
    organizationId,
    userName,
    connectedAt: new Date(),
    rooms: new Set(),
  };
  connectedUsers.set(socket.id, userConnection);

  // Track sockets per user
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socket.id);

  // Auto-join organization room
  if (organizationId) {
    joinRoom(socket, 'organization', organizationId);
  }

  // Auto-join user's personal room
  joinRoom(socket, 'user', userId);

  // Notify others of online status
  broadcastUserPresence(userId, userName, true);

  // Setup event handlers
  setupEventHandlers(socket);

  // Send initial notification count
  sendNotificationCount(socket, userId);

  // Handle disconnection
  socket.on('disconnect', () => {
    handleDisconnection(socket);
  });
}

// ============================================
// Event Handlers
// ============================================

function setupEventHandlers(socket: Socket<any, any, any, SocketData>) {
  // Join organization room
  socket.on('join_organization', (organizationId: string) => {
    joinRoom(socket, 'organization', organizationId);
  });

  // Leave organization room
  socket.on('leave_organization', (organizationId: string) => {
    leaveRoom(socket, 'organization', organizationId);
  });

  // Mark notification as read
  socket.on('mark_notification_read', async (notificationId: string) => {
    try {
      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      });

      // Update notification count
      await sendNotificationCount(socket, socket.data.userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  });

  // Subscribe to entity updates
  socket.on('subscribe_to_entity', (data: { entityType: string; entityId: string }) => {
    joinRoom(socket, 'entity' as RoomType, `${data.entityType}:${data.entityId}`);
  });

  // Unsubscribe from entity updates
  socket.on('unsubscribe_from_entity', (data: { entityType: string; entityId: string }) => {
    leaveRoom(socket, 'entity' as RoomType, `${data.entityType}:${data.entityId}`);
  });

  // Typing indicators
  socket.on('typing_start', (data: { entityType: string; entityId: string }) => {
    const room = `entity:${data.entityType}:${data.entityId}`;
    socket.to(room).emit('user_typing', {
      userId: socket.data.userId,
      userName: socket.data.userName,
      entityType: data.entityType,
      entityId: data.entityId,
      isTyping: true,
      timestamp: new Date(),
    });
  });

  socket.on('typing_stop', (data: { entityType: string; entityId: string }) => {
    const room = `entity:${data.entityType}:${data.entityId}`;
    socket.to(room).emit('user_typing', {
      userId: socket.data.userId,
      userName: socket.data.userName,
      entityType: data.entityType,
      entityId: data.entityId,
      isTyping: false,
      timestamp: new Date(),
    });
  });
}

// ============================================
// Disconnection Handler
// ============================================

function handleDisconnection(socket: Socket<any, any, any, SocketData>) {
  const { userId, userName } = socket.data;

  console.log(`[WebSocket] User disconnected: ${userName} (${userId})`);

  // Remove from tracking
  connectedUsers.delete(socket.id);

  // Remove from user's sockets
  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.delete(socket.id);
    if (userSocketSet.size === 0) {
      userSockets.delete(userId);
      // User is completely offline
      broadcastUserPresence(userId, userName, false);
    }
  }
}

// ============================================
// Room Management
// ============================================

function joinRoom(socket: Socket<any, any, any, SocketData>, type: RoomType, id: string) {
  const roomName = getRoomName(type, id);
  socket.join(roomName);

  const userConnection = connectedUsers.get(socket.id);
  if (userConnection) {
    userConnection.rooms.add(roomName);
  }

  console.log(`[WebSocket] ${socket.data.userName} joined room: ${roomName}`);
}

function leaveRoom(socket: Socket<any, any, any, SocketData>, type: RoomType, id: string) {
  const roomName = getRoomName(type, id);
  socket.leave(roomName);

  const userConnection = connectedUsers.get(socket.id);
  if (userConnection) {
    userConnection.rooms.delete(roomName);
  }

  console.log(`[WebSocket] ${socket.data.userName} left room: ${roomName}`);
}

function getRoomName(type: RoomType, id: string): string {
  return `${type}:${id}`;
}

// ============================================
// Broadcasting Functions
// ============================================

/**
 * Send notification to specific user
 */
export async function sendNotificationToUser(
  userId: string,
  notification: NotificationPayload
): Promise<void> {
  if (!io) return;

  const roomName = getRoomName('user', userId);
  io.to(roomName).emit('notification', notification);

  // Update notification count
  await sendNotificationCountToUser(userId);
}

/**
 * Send notification to all users in organization
 */
export function sendNotificationToOrganization(
  organizationId: string,
  event: string,
  payload: any
): void {
  if (!io) return;

  const roomName = getRoomName('organization', organizationId);
  io.to(roomName).emit(event, payload);
}

/**
 * Broadcast project update
 */
export function broadcastProjectUpdate(
  organizationId: string,
  payload: ProjectPayload
): void {
  if (!io) return;

  const roomName = getRoomName('organization', organizationId);
  io.to(roomName).emit('project_update', payload);
}

/**
 * Broadcast task update
 */
export function broadcastTaskUpdate(
  organizationId: string,
  userId: string,
  payload: TaskPayload
): void {
  if (!io) return;

  // Send to organization
  if (organizationId) {
    const orgRoom = getRoomName('organization', organizationId);
    io.to(orgRoom).emit('task_update', payload);
  }

  // Also send to assigned user specifically
  if (payload.assignedTo) {
    const userRoom = getRoomName('user', payload.assignedTo);
    io.to(userRoom).emit('task_update', payload);
  }
}

/**
 * Broadcast user presence
 */
function broadcastUserPresence(
  userId: string,
  userName: string,
  isOnline: boolean
): void {
  if (!io) return;

  // Find all organizations this user belongs to and notify them
  const userConnection = findUserConnection(userId);
  if (userConnection?.organizationId) {
    const orgRoom = getRoomName('organization', userConnection.organizationId);

    if (isOnline) {
      io.to(orgRoom).emit('user_online', {
        userId,
        userName,
        timestamp: new Date(),
        organizationId: userConnection.organizationId,
      });
    } else {
      io.to(orgRoom).emit('user_offline', {
        userId,
        userName,
        timestamp: new Date(),
        organizationId: userConnection.organizationId,
      });
    }
  }
}

/**
 * Send notification count to user
 */
async function sendNotificationCount(
  socket: Socket<any, any, any, SocketData>,
  userId: string
): Promise<void> {
  try {
    const count = await db.notification.count({
      where: { userId, isRead: false },
    });
    socket.emit('notification_count', { count });
  } catch (error) {
    console.error('Error getting notification count:', error);
  }
}

/**
 * Send notification count to all user's sockets
 */
async function sendNotificationCountToUser(userId: string): Promise<void> {
  if (!io) return;

  try {
    const count = await db.notification.count({
      where: { userId, isRead: false },
    });

    const userRoom = getRoomName('user', userId);
    io.to(userRoom).emit('notification_count', { count });
  } catch (error) {
    console.error('Error getting notification count:', error);
  }
}

/**
 * Broadcast system alert
 */
export function broadcastSystemAlert(
  organizationId: string,
  alert: {
    type: 'info' | 'warning' | 'error' | 'maintenance';
    title: string;
    message: string;
  }
): void {
  if (!io) return;

  const roomName = getRoomName('organization', organizationId);
  io.to(roomName).emit('system_alert', {
    ...alert,
    alertId: `alert_${Date.now()}`,
    timestamp: new Date(),
    organizationId,
  });
}

// ============================================
// Helper Functions
// ============================================

function findUserConnection(userId: string): ConnectedUser | undefined {
  for (const connection of connectedUsers.values()) {
    if (connection.userId === userId) {
      return connection;
    }
  }
  return undefined;
}

/**
 * Check if user is online
 */
export function isUserOnline(userId: string): boolean {
  const sockets = userSockets.get(userId);
  return sockets !== undefined && sockets.size > 0;
}

/**
 * Get all online users in organization
 */
export function getOnlineUsersInOrganization(organizationId: string): string[] {
  const onlineUsers: string[] = [];

  for (const connection of connectedUsers.values()) {
    if (connection.organizationId === organizationId) {
      onlineUsers.push(connection.userId);
    }
  }

  return onlineUsers;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): IOServer<any, any, any, SocketData> | null {
  return io;
}

/**
 * Get connection statistics
 */
export function getConnectionStats(): {
  totalConnections: number;
  uniqueUsers: number;
  connectionsPerUser: Record<string, number>;
} {
  const connectionsPerUser: Record<string, number> = {};

  for (const [userId, sockets] of userSockets.entries()) {
    connectionsPerUser[userId] = sockets.size;
  }

  return {
    totalConnections: connectedUsers.size,
    uniqueUsers: userSockets.size,
    connectionsPerUser,
  };
}
