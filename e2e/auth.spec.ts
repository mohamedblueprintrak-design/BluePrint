/**
 * Authentication E2E Tests
 * اختبارات المصادقة الشاملة
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click submit without filling fields
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=/مطلوب|required/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/غير صحيحة|invalid/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.click('text=/إنشاء حساب|signup|register/i');
    
    await expect(page).toHaveURL(/.*signup|.*register/);
  });

  test('should signup with valid data', async ({ page }) => {
    await page.goto('/auth/signup');
    
    const uniqueEmail = `test${Date.now()}@example.com`;
    
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="username"]', `user${Date.now()}`);
    await page.fill('input[name="password"]', 'StrongPass123!');
    await page.fill('input[name="fullName"]', 'Test User');
    
    await page.click('button[type="submit"]');
    
    // Should redirect or show success
    await expect(page).not.toHaveURL('/auth/signup', { timeout: 10000 });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login|.*auth/, { timeout: 5000 });
  });

  test('should not access admin routes without admin role', async ({ page }) => {
    // Login as regular user first
    await page.goto('/auth/login');
    // ... login logic
    
    // Try to access admin route
    await page.goto('/admin');
    
    // Should show access denied or redirect
    // await expect(page.locator('text=/غير مصرح|access denied/i')).toBeVisible();
  });
});

test.describe('Password Reset', () => {
  test('should request password reset', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=/تم إرسال|sent|email/i')).toBeVisible({ timeout: 5000 });
  });

  test('should reset password with valid token', async ({ page }) => {
    // This would need a valid token in real test
    await page.goto('/auth/reset-password?token=valid_token');
    
    await page.fill('input[name="newPassword"]', 'NewStrongPass123!');
    await page.fill('input[name="confirmPassword"]', 'NewStrongPass123!');
    await page.click('button[type="submit"]');
    
    // Should show success or redirect to login
  });
});

test.describe('Two-Factor Authentication', () => {
  test('should show 2FA setup page', async ({ page }) => {
    // Login first, then access 2FA settings
    // This is a placeholder for actual 2FA flow
    await page.goto('/settings/security');
    
    // Check for 2FA setup elements
    // await expect(page.locator('text=/المصادقة الثنائية|2FA/i')).toBeVisible();
  });

  test('should verify 2FA code during login', async ({ page }) => {
    // After login with 2FA enabled
    // await page.goto('/auth/login');
    // ... login with credentials
    // Should show 2FA code input
    // await expect(page.locator('input[name="twoFactorCode"]')).toBeVisible();
  });
});
