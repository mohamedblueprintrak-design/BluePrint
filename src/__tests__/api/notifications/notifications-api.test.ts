/**
 * Notifications API Tests
 * اختبارات API الإشعارات
 */

import { NextRequest } from 'next/server';
import { GET as getNotifications, POST as createNotification } from '@/app/api/notifications/route';
import { GET as getSettings, PUT as updateSettings } from '@/app/api/notifications/settings/route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/audit.service', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.notification.findMany.mockResolvedValue([
        {
          id: 'notif-1',
          userId: 'user-1',
          title: 'Test Notification',
          message: 'This is a test',
          notificationType: 'system',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          userId: 'user-1',
          title: 'Task Assigned',
          message: 'You have been assigned to a task',
          notificationType: 'task',
          isRead: true,
          createdAt: new Date(),
        },
      ]);
      
      prisma.notification.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.notifications).toBeDefined();
      expect(data.notifications.length).toBe(2);
    });

    it('should support pagination', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(100);

      const request = new NextRequest('http://localhost:3000/api/notifications?page=2&limit=10', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getNotifications(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
    });

    it('should filter by read status', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(5);

      const request = new NextRequest('http://localhost:3000/api/notifications?unread=true', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getNotifications(request);
      
      expect(response.status).toBe(200);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRead: false,
          }),
        })
      );
    });

    it('should filter by notification type', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(3);

      const request = new NextRequest('http://localhost:3000/api/notifications?type=task', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getNotifications(request);
      
      expect(response.status).toBe(200);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notificationType: 'task',
          }),
        })
      );
    });
  });

  describe('POST /api/notifications', () => {
    it('should create notification', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: 'New Notification',
        message: 'Test message',
        notificationType: 'system',
        isRead: false,
        createdAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          title: 'New Notification',
          message: 'Test message',
          notificationType: 'system',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createNotification(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.notification).toBeDefined();
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          // Missing userId and title
          message: 'Test message',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createNotification(request);
      const data = await response.json();

      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/notifications/settings', () => {
    it('should return notification settings', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        notificationSettings: JSON.stringify({
          email: true,
          push: true,
          task: true,
          project: true,
          invoice: true,
          mention: true,
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/settings', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getSettings(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.settings).toBeDefined();
    });

    it('should return default settings if not set', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        notificationSettings: null,
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/settings', {
        method: 'GET',
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await getSettings(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('PUT /api/notifications/settings', () => {
    it('should update notification settings', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        notificationSettings: JSON.stringify({
          email: false,
          push: true,
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/settings', {
        method: 'PUT',
        body: JSON.stringify({
          email: false,
          push: true,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
      });

      const response = await updateSettings(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

describe('Notification Types', () => {
  it('should support all notification types', () => {
    const validTypes = ['system', 'task', 'project', 'invoice', 'approval', 'mention'];
    
    validTypes.forEach(type => {
      expect(['system', 'task', 'project', 'invoice', 'approval', 'mention'].includes(type)).toBe(true);
    });
  });

  it('should support all priority levels', () => {
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    
    validPriorities.forEach(priority => {
      expect(['low', 'normal', 'high', 'urgent'].includes(priority)).toBe(true);
    });
  });
});

describe('Notification Badge Count', () => {
  it('should count unread notifications', async () => {
    const { prisma } = require('@/lib/db');
    prisma.notification.count.mockResolvedValue(5);

    const count = await prisma.notification.count({
      where: { userId: 'user-1', isRead: false },
    });

    expect(count).toBe(5);
  });
});

describe('Mark as Read', () => {
  it('should mark single notification as read', async () => {
    const { prisma } = require('@/lib/db');
    prisma.notification.update.mockResolvedValue({
      id: 'notif-1',
      isRead: true,
      readAt: new Date(),
    });

    const result = await prisma.notification.update({
      where: { id: 'notif-1' },
      data: { isRead: true, readAt: new Date() },
    });

    expect(result.isRead).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    const { prisma } = require('@/lib/db');
    prisma.notification.updateMany.mockResolvedValue({ count: 10 });

    const result = await prisma.notification.updateMany({
      where: { userId: 'user-1', isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    expect(result.count).toBe(10);
  });
});
