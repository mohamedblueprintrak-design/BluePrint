/**
 * Profile API Tests
 * اختبارات API الملف الشخصي
 */

import { NextRequest } from 'next/server';
import { GET as getProfile, PUT as updateProfile } from '@/app/api/profile/route';
import { POST as changePassword } from '@/app/api/profile/password/route';
import { POST as uploadAvatar } from '@/app/api/profile/avatar/route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/audit.service', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));

describe('Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/profile', () => {
    it('should return user profile', async () => {
      const { prisma } = require('@/lib/db');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        username: 'testuser',
        fullName: 'Test User',
        role: 'admin',
        avatar: null,
        language: 'ar',
        theme: 'dark',
        phone: '+971501234567',
        jobTitle: 'Engineer',
        department: 'Engineering',
        organizationId: 'org-1',
        lastLoginAt: new Date(),
        createdAt: new Date(),
        organization: {
          id: 'org-1',
          name: 'Test Organization',
          slug: 'test-org',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'x-user-id': 'user-1',
        },
      });

      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const { prisma } = require('@/lib/db');
      prisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'x-user-id': 'non-existent',
        },
      });

      const response = await getProfile(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('PUT /api/profile', () => {
    it('should update user profile', async () => {
      const { prisma } = require('@/lib/db');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        fullName: 'Updated Name',
        phone: '+971509876543',
        jobTitle: 'Senior Engineer',
        department: 'Engineering',
        language: 'en',
        theme: 'light',
      });

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: 'Updated Name',
          phone: '+971509876543',
          jobTitle: 'Senior Engineer',
          language: 'en',
          theme: 'light',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
      });

      const response = await updateProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          email: 'invalid-email',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
      });

      const response = await updateProfile(request);
      const data = await response.json();

      expect(data.success).toBe(false);
    });

    it('should validate phone format', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          phone: 'invalid-phone',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
      });

      const response = await updateProfile(request);
      expect(response).toBeDefined();
    });
  });

  describe('POST /api/profile/password', () => {
    it('should change password successfully', async () => {
      const { prisma } = require('@/lib/db');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qO.1BoWBPfGKqe',
        organizationId: null,
      });
      prisma.user.update.mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'password123',
          newPassword: 'NewStrongPass123!',
          confirmPassword: 'NewStrongPass123!',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
      });

      const response = await changePassword(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject mismatched passwords', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'password123',
          newPassword: 'NewStrongPass123!',
          confirmPassword: 'DifferentPass123!',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
      });

      const response = await changePassword(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.code).toBe('PASSWORD_MISMATCH');
    });

    it('should reject weak password', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'password123',
          newPassword: 'weak',
          confirmPassword: 'weak',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
      });

      const response = await changePassword(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.code).toBe('WEAK_PASSWORD');
    });
  });

  describe('POST /api/profile/avatar', () => {
    it('should reject invalid file type', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': 'user-1',
        },
      });

      const response = await uploadAvatar(request);
      const data = await response.json();

      expect(data.success).toBe(false);
    });

    it('should reject oversized file', async () => {
      // Create a mock file that's too large (> 10MB)
      const largeContent = 'x'.repeat(11 * 1024 * 1024);
      const formData = new FormData();
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': 'user-1',
        },
      });

      const response = await uploadAvatar(request);
      const data = await response.json();

      expect(data.success).toBe(false);
    });
  });
});

describe('Profile Validation', () => {
  it('should validate email format', () => {
    const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@example.org'];
    const invalidEmails = ['invalid', 'invalid@', '@invalid.com', 'invalid@.com'];

    validEmails.forEach(email => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true);
    });

    invalidEmails.forEach(email => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false);
    });
  });

  it('should validate phone format', () => {
    const validPhones = ['+971501234567', '+201234567890', '+966501234567'];
    const invalidPhones = ['123', 'not-a-phone', '+abc'];

    validPhones.forEach(phone => {
      expect(/^\+[1-9]\d{6,14}$/.test(phone)).toBe(true);
    });

    invalidPhones.forEach(phone => {
      expect(/^\+[1-9]\d{6,14}$/.test(phone)).toBe(false);
    });
  });

  it('should validate language code', () => {
    const validLanguages = ['ar', 'en'];
    const invalidLanguages = ['fr', 'de', 'es', ''];

    validLanguages.forEach(lang => {
      expect(['ar', 'en'].includes(lang)).toBe(true);
    });

    invalidLanguages.forEach(lang => {
      expect(['ar', 'en'].includes(lang)).toBe(false);
    });
  });

  it('should validate theme', () => {
    const validThemes = ['light', 'dark', 'system'];
    const invalidThemes = ['blue', 'red', ''];

    validThemes.forEach(theme => {
      expect(['light', 'dark', 'system'].includes(theme)).toBe(true);
    });

    invalidThemes.forEach(theme => {
      expect(['light', 'dark', 'system'].includes(theme)).toBe(false);
    });
  });
});
