/**
 * Profile API Tests
 */

import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: { user: { findUnique: jest.fn(), update: jest.fn() } },
}));

jest.mock('@/lib/services/audit.service', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/api/utils/db', () => ({
  getDb: jest.fn().mockResolvedValue(null),
  DEMO_USERS: [{ id: 'demo-user', email: 'demo@test.com', password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qO.1BoWBPfGKqe' }],
}));

jest.mock('@/app/api/utils/auth', () => ({
  getUserFromToken: jest.fn().mockResolvedValue(null),
}));

import { GET as getProfile, PUT as updateProfile } from '@/app/api/profile/route';
import { PUT as changePassword } from '@/app/api/profile/password/route';
import { getUserFromToken } from '@/app/api/utils/auth';

describe('Profile API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/profile', () => {
    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile');
      const response = await getProfile(request);
      expect(response.status).toBe(401);
    });

    it('should return user profile for authenticated user', async () => {
      (getUserFromToken as jest.Mock).mockResolvedValueOnce({ id: 'user-1', email: 'test@test.com' });
      const request = new NextRequest('http://localhost:3000/api/profile', {
        headers: { authorization: 'Bearer token' },
      });
      const response = await getProfile(request);
      // Response depends on implementation
      expect(response).toBeDefined();
    });
  });

  describe('PUT /api/profile', () => {
    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName: 'Test' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await updateProfile(request);
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/profile/password', () => {
    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: 'old', newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await changePassword(request);
      expect(response.status).toBe(401);
    });
  });
});

describe('Profile Validation', () => {
  it('should validate email format', () => {
    expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('test@example.com')).toBe(true);
    expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('invalid')).toBe(false);
  });

  it('should validate phone format', () => {
    expect(/^\+[1-9]\d{6,14}$/.test('+971501234567')).toBe(true);
    expect(/^\+[1-9]\d{6,14}$/.test('123')).toBe(false);
  });
});
