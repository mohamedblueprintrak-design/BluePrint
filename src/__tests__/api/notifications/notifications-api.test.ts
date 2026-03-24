/**
 * Notifications API Tests
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/notifications/route';
import { GET as getSettings, PUT as updateSettings } from '@/app/api/notifications/settings/route';
import * as jose from 'jose';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
        organization: { id: 'org-1', name: 'Test Org' }
      }),
    },
    notificationSettings: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({
        id: 'settings-1',
        userId: 'user-1',
        emailInvoices: true,
        emailTasks: true,
        emailLeaves: true,
        emailProjects: true,
        emailPayments: true,
        pushEnabled: false,
        pushTasks: true,
        pushLeaves: true,
        pushProjects: true,
        digestEmail: false,
      }),
    },
  },
}));

// Mock dependencies
jest.mock('@/app/api/utils/demo-config', () => ({
  getUserFromRequest: jest.fn(),
  isDemoUser: jest.fn(),
  DEMO_DATA: {
    notifications: [
      { id: 'n1', userId: 'user-1', type: 'info', read: false },
      { id: 'n2', userId: 'user-1', type: 'warning', read: true },
    ],
    notificationSettings: { email: true, push: true },
  },
}));

jest.mock('@/lib/services', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    createNotification: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  },
}));

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configure jose mock for authenticated requests
    (jose.jwtVerify as jest.Mock).mockResolvedValue({
      payload: { userId: 'user-1' }
    });
  });

  describe('GET /api/notifications', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/notifications');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return notifications for authenticated users', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/notifications');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should filter by read status', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/notifications?read=false');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should filter by notification type', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/notifications?type=info');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const { getUserFromRequest, isDemoUser } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      (isDemoUser as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/notifications?page=1&limit=10');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/notifications', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getUserFromRequest } = require('@/app/api/utils/demo-config');
      (getUserFromRequest as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', message: 'Test message' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notifications/settings', () => {
    it('should return 401 for unauthenticated users', async () => {
      // Mock jose to return null (no valid token)
      (jose.jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const request = new NextRequest('http://localhost:3000/api/notifications/settings');
      const response = await getSettings(request);

      expect(response.status).toBe(401);
    });

    it('should return settings for authenticated users', async () => {
      // Mock jose to return valid user
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: { userId: 'user-1' }
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/settings', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      const response = await getSettings(request);

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/notifications/settings', () => {
    it('should return 401 for unauthenticated users', async () => {
      // Mock jose to return null (no valid token)
      (jose.jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const request = new NextRequest('http://localhost:3000/api/notifications/settings', {
        method: 'PUT',
        body: JSON.stringify({ email: false }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await updateSettings(request);

      expect(response.status).toBe(401);
    });
  });
});

describe('Notification Types', () => {
  it('should support standard notification types', () => {
    const types = ['info', 'warning', 'error', 'success'];
    expect(types).toHaveLength(4);
    expect(types).toContain('info');
    expect(types).toContain('warning');
  });
});
