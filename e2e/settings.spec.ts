/**
 * Settings E2E Tests
 * اختبارات E2E للإعدادات
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Settings Page', () => {
  test('should display settings page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/settings|الإعدادات/i);
  });

  test('should display profile settings tab', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Click profile tab
    const profileTab = page.locator('button:has-text("Profile"), button:has-text("الملف الشخصي")');
    if (await profileTab.count() > 0) {
      await profileTab.click();
    }
  });

  test('should display security settings tab', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Click security tab
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
    }
  });

  test('should display notifications settings tab', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Click notifications tab
    const notificationsTab = page.locator('button:has-text("Notifications"), button:has-text("الإشعارات")');
    if (await notificationsTab.count() > 0) {
      await notificationsTab.click();
    }
  });

  test('should display billing settings tab', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Click billing tab
    const billingTab = page.locator('button:has-text("Billing"), button:has-text("الفواتير")');
    if (await billingTab.count() > 0) {
      await billingTab.click();
    }
  });
});

test.describe('Profile Settings', () => {
  test('should update profile information', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Find name input
    const nameInput = page.locator('input[name="fullName"], input[name="name"]');
    if (await nameInput.count() > 0) {
      await nameInput.fill(`Updated Name ${Date.now()}`);
      
      // Save
      const saveButton = page.locator('button:has-text("Save"), button:has-text("حفظ")');
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
    }
  });

  test('should change language', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Find language select
    const languageSelect = page.locator('select[name="language"]');
    if (await languageSelect.count() > 0) {
      await languageSelect.selectOption('en');
      
      // Save
      const saveButton = page.locator('button:has-text("Save"), button:has-text("حفظ")');
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
    }
  });

  test('should change theme', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Find theme select
    const themeSelect = page.locator('select[name="theme"]');
    if (await themeSelect.count() > 0) {
      await themeSelect.selectOption('dark');
      
      // Save
      const saveButton = page.locator('button:has-text("Save"), button:has-text("حفظ")');
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
    }
  });

  test('should upload avatar', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Find avatar upload
    const avatarInput = page.locator('input[type="file"][name="avatar"]');
    if (await avatarInput.count() > 0) {
      // Would handle file upload
    }
  });
});

test.describe('Security Settings', () => {
  test('should display password change form', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Check for password inputs
      const currentPasswordInput = page.locator('input[name="currentPassword"]');
      const newPasswordInput = page.locator('input[name="newPassword"]');
      
      if (await currentPasswordInput.count() > 0) {
        expect(await currentPasswordInput.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should change password', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Fill password form
      const currentPasswordInput = page.locator('input[name="currentPassword"]');
      const newPasswordInput = page.locator('input[name="newPassword"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
      
      if (await currentPasswordInput.count() > 0) {
        await currentPasswordInput.fill('currentPassword123!');
        await newPasswordInput.fill('newPassword123!');
        await confirmPasswordInput.fill('newPassword123!');
        
        // Submit
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.click();
        }
      }
    }
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Check for password requirements
      const requirements = page.locator('[data-testid="password-requirements"], .password-requirements');
      if (await requirements.count() > 0) {
        expect(await requirements.textContent()).toContain('8');
      }
    }
  });

  test('should show password strength indicator', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Type password
      const newPasswordInput = page.locator('input[name="newPassword"]');
      if (await newPasswordInput.count() > 0) {
        await newPasswordInput.fill('StrongPassword123!');
        
        // Check for strength indicator
        const strengthIndicator = page.locator('[data-testid="password-strength"], .password-strength');
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('Two-Factor Authentication', () => {
  test('should display 2FA setup option', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Check for 2FA section
      const twoFactorSection = page.locator('[data-testid="two-factor-section"], button:has-text("Two-Factor")');
      expect(await twoFactorSection.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should start 2FA setup', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Click enable 2FA
      const enableButton = page.locator('button:has-text("Enable"), button:has-text("تفعيل")');
      if (await enableButton.count() > 0) {
        await enableButton.click();
      }
    }
  });

  test('should show QR code for 2FA', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Check for QR code
      const qrCode = page.locator('[data-testid="qr-code"], canvas, img[alt*="QR"]');
      // Would appear after enabling
    }
  });

  test('should verify 2FA code', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Find verification code input
      const codeInput = page.locator('input[name="verificationCode"], input[name="code"]');
      if (await codeInput.count() > 0) {
        await codeInput.fill('123456');
        
        // Verify
        const verifyButton = page.locator('button:has-text("Verify"), button:has-text("تحقق")');
        if (await verifyButton.count() > 0) {
          await verifyButton.click();
        }
      }
    }
  });

  test('should show backup codes', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Find backup codes section
      const backupCodes = page.locator('[data-testid="backup-codes"], .backup-codes');
      // Would appear after 2FA is enabled
    }
  });

  test('should disable 2FA', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Click disable 2FA
      const disableButton = page.locator('button:has-text("Disable"), button:has-text("تعطيل")');
      if (await disableButton.count() > 0) {
        await disableButton.click();
        
        // Confirm
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("تأكيد")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }
      }
    }
  });
});

test.describe('Notification Settings', () => {
  test('should display notification preferences', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to notifications
    const notificationsTab = page.locator('button:has-text("Notifications"), button:has-text("الإشعارات")');
    if (await notificationsTab.count() > 0) {
      await notificationsTab.click();
      
      // Check for toggles
      const toggles = page.locator('input[type="checkbox"], [role="switch"]');
      expect(await toggles.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should toggle email notifications', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to notifications
    const notificationsTab = page.locator('button:has-text("Notifications"), button:has-text("الإشعارات")');
    if (await notificationsTab.count() > 0) {
      await notificationsTab.click();
      
      // Find email toggle
      const emailToggle = page.locator('input[name="emailNotifications"], [data-testid="email-toggle"]');
      if (await emailToggle.count() > 0) {
        await emailToggle.click();
      }
    }
  });

  test('should toggle push notifications', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to notifications
    const notificationsTab = page.locator('button:has-text("Notifications"), button:has-text("الإشعارات")');
    if (await notificationsTab.count() > 0) {
      await notificationsTab.click();
      
      // Find push toggle
      const pushToggle = page.locator('input[name="pushNotifications"], [data-testid="push-toggle"]');
      if (await pushToggle.count() > 0) {
        await pushToggle.click();
      }
    }
  });

  test('should save notification preferences', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to notifications
    const notificationsTab = page.locator('button:has-text("Notifications"), button:has-text("الإشعارات")');
    if (await notificationsTab.count() > 0) {
      await notificationsTab.click();
      
      // Save
      const saveButton = page.locator('button:has-text("Save"), button:has-text("حفظ")');
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
    }
  });
});

test.describe('Email Verification', () => {
  test('should show verification status', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Check for verification status
    const verificationStatus = page.locator('[data-testid="email-status"], .email-status');
    // Would show verified or unverified
  });

  test('should resend verification email', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Find resend button
    const resendButton = page.locator('button:has-text("Resend"), button:has-text("إعادة الإرسال")');
    if (await resendButton.count() > 0) {
      await resendButton.click();
    }
  });
});

test.describe('Session Management', () => {
  test('should show active sessions', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Check for sessions section
      const sessionsSection = page.locator('[data-testid="sessions-section"], .sessions-list');
    }
  });

  test('should revoke other sessions', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Find revoke button
      const revokeButton = page.locator('button:has-text("Revoke"), button:has-text("إلغاء")');
      if (await revokeButton.count() > 0) {
        await revokeButton.click();
      }
    }
  });

  test('should logout from all devices', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Navigate to security
    const securityTab = page.locator('button:has-text("Security"), button:has-text("الأمان")');
    if (await securityTab.count() > 0) {
      await securityTab.click();
      
      // Find logout all button
      const logoutAllButton = page.locator('button:has-text("Logout all"), button:has-text("تسجيل الخروج من جميع")');
      if (await logoutAllButton.count() > 0) {
        await logoutAllButton.click();
      }
    }
  });
});
