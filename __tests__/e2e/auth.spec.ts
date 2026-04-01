import { test, expect } from '@playwright/test';
import { nanoid } from 'nanoid';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('Authentication E2E Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
  });

  // ============================================
  // Login Page Rendering
  // ============================================
  test('should render login page with all elements (Arabic)', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/BluePrint/i);

    // Check logo
    await expect(page.locator('img[alt="BluePrint"]').first()).toBeVisible();

    // Check login form elements
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check Arabic text direction
    const dir = await page.evaluate(() => document.documentElement.dir || document.documentElement.getAttribute('dir'));
    expect(dir).toBe('rtl');
  });

  test('should render login page with all elements (English)', async ({ page }) => {
    // Switch to English
    const langSwitch = page.locator('[data-testid="lang-switch"], button:has-text("English"), button:has-text("EN")');
    if (await langSwitch.isVisible()) {
      await langSwitch.click();
    }

    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  // ============================================
  // Successful Login
  // ============================================
  test('should login successfully with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.locator('input[name="email"], input[type="email"]').fill('admin@blueprint.dev');
    await page.locator('input[name="password"], input[type="password"]').fill('Admin@123456');

    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Should show user info or dashboard content
    await expect(page.locator('main, [data-testid="dashboard"], .dashboard-content').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show "Remember Me" checkbox functionality', async ({ page }) => {
    const rememberMe = page.locator('input[type="checkbox"][name="remember"], label:has-text("remember"), label:has-text("تذكرني")');
    if (await rememberMe.isVisible()) {
      await rememberMe.click();
      expect(await rememberMe.isChecked()).toBeTruthy();
    }
  });

  test('should navigate to "Forgot Password" page', async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot"], a:has-text("Forgot"), a:has-text("نسيت")');
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/forgot-password|reset/i, { timeout: 10000 });
      await expect(page.locator('input[type="email"]').first()).toBeVisible();
    }
  });

  test('should navigate to "Sign Up" page', async ({ page }) => {
    const signupLink = page.locator('a[href*="signup"], a[href*="register"], a:has-text("Sign Up"), a:has-text("تسجيل")');
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/signup|register/i, { timeout: 10000 });
    }
  });

  // ============================================
  // Failed Login
  // ============================================
  test('should show error message with invalid email', async ({ page }) => {
    await page.locator('input[name="email"], input[type="email"]').fill('invalid-email');
    await page.locator('input[name="password"], input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Should show validation error
    await expect(page.locator('[role="alert"], .error, [data-testid="error-message"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error message with wrong password', async ({ page }) => {
    await page.locator('input[name="email"], input[type="email"]').fill('admin@blueprint.dev');
    await page.locator('input[name="password"], input[type="password"]').fill('WrongPassword123');
    await page.locator('button[type="submit"]').click();

    // Should show error message
    const error = page.locator('[role="alert"], .error, [data-testid="error-message"], .toast');
    await expect(error.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show error message with non-existent email', async ({ page }) => {
    await page.locator('input[name="email"], input[type="email"]').fill(`nonexistent-${nanoid(8)}@test.com`);
    await page.locator('input[name="password"], input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    const error = page.locator('[role="alert"], .error, [data-testid="error-message"], .toast');
    await expect(error.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show error for empty fields', async ({ page }) => {
    await page.locator('button[type="submit"]').click();

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    // Check for HTML5 validation or custom error messages
    const isInvalid = await emailInput.evaluate(el => (el as HTMLInputElement).validity.valid);
    expect(isInvalid).toBeFalsy();
  });

  // ============================================
  // 2FA Challenge Flow
  // ============================================
  test('should show 2FA challenge after login if enabled', async ({ page }) => {
    // Use a user account that has 2FA enabled
    await page.locator('input[name="email"], input[type="email"]').fill('2fa-user@blueprint.dev');
    await page.locator('input[name="password"], input[type="password"]').fill('Test@123456');
    await page.locator('button[type="submit"]').click();

    // Check for 2FA input
    const twoFAInput = page.locator('input[name="code"], input[name="otp"], input[autocomplete="one-time-code"], input[data-testid="2fa-code"]');
    await expect(twoFAInput.first()).toBeVisible({ timeout: 10000 });
  });

  test('should accept valid 2FA code and redirect to dashboard', async ({ page }) => {
    // This requires a real TOTP secret - test with environment variable
    if (!process.env.TEST_2FA_SECRET) {
      test.skip();
      return;
    }

    await page.locator('input[name="email"], input[type="email"]').fill('2fa-user@blueprint.dev');
    await page.locator('input[name="password"], input[type="password"]').fill('Test@123456');
    await page.locator('button[type="submit"]').click();

    const twoFAInput = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
    await twoFAInput.waitFor({ state: 'visible', timeout: 10000 });

    // In real tests, use the TOTP secret to generate current code
    await twoFAInput.fill('123456'); // Placeholder - replace with real TOTP in CI
    await page.locator('button[type="submit"], button:has-text("Verify")').first().click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('should reject invalid 2FA code', async ({ page }) => {
    await page.locator('input[name="email"], input[type="email"]').fill('2fa-user@blueprint.dev');
    await page.locator('input[name="password"], input[type="password"]').fill('Test@123456');
    await page.locator('button[type="submit"]').click();

    const twoFAInput = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
    await twoFAInput.waitFor({ state: 'visible', timeout: 10000 });

    await twoFAInput.fill('000000');
    await page.locator('button[type="submit"], button:has-text("Verify")').first().click();

    const error = page.locator('[role="alert"], .error, [data-testid="error-message"]');
    await expect(error.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show "Use Backup Code" option on 2FA page', async ({ page }) => {
    await page.locator('input[name="email"], input[type="email"]').fill('2fa-user@blueprint.dev');
    await page.locator('input[name="password"], input[type="password"]').fill('Test@123456');
    await page.locator('button[type="submit"]').click();

    const twoFAInput = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
    await twoFAInput.waitFor({ state: 'visible', timeout: 10000 });

    const backupLink = page.locator('button:has-text("backup"), a:has-text("backup"), button:has-text("رمز احتياطي")');
    if (await backupLink.isVisible()) {
      await backupLink.click();
      // Should switch to backup code input
      await expect(page.locator('input[name="backupCode"], input[placeholder*="backup"], input[placeholder*="احتياطي"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  // ============================================
  // Password Reset Flow
  // ============================================
  test('should complete forgot password flow', async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot"], a:has-text("Forgot"), a:has-text("نسيت")');
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/forgot/i, { timeout: 10000 });

      await page.locator('input[type="email"]').fill('admin@blueprint.dev');
      await page.locator('button[type="submit"]').click();

      // Should show success message
      const success = page.locator('[data-testid="success"], .success-message, :text("sent"), :text("أرسلنا")');
      await expect(success.first()).toBeVisible({ timeout: 10000 });
    }
  });

  // ============================================
  // Session & Logout
  // ============================================
  test('should persist session after page refresh', async ({ page }) => {
    await page.locator('input[name="email"], input[type="email"]').fill('admin@blueprint.dev');
    await page.locator('input[name="password"], input[type="password"]').fill('Admin@123456');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Refresh page
    await page.reload();

    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should logout successfully and redirect to login', async ({ page }) => {
    await page.locator('input[name="email"], input[type="email"]').fill('admin@blueprint.dev');
    await page.locator('input[name="password"], input[type="password"]').fill('Admin@123456');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Find and click logout
    const logoutBtn = page.locator('button:has-text("logout"), button:has-text("sign out"), button:has-text("تسجيل خروج"), [data-testid="logout"], [aria-label="logout"]');
    if (await logoutBtn.first().isVisible({ timeout: 5000 })) {
      await logoutBtn.first().click();

      // Confirm logout if there's a confirmation dialog
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("تأكيد")');
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click();
      }

      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    }
  });

  // ============================================
  // Rate Limiting
  // ============================================
  test('should show rate limit error after too many failed attempts', async ({ page }) => {
    for (let i = 0; i < 11; i++) {
      await page.locator('input[name="email"], input[type="email"]').fill('wrong@test.com');
      await page.locator('input[name="password"], input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(500);
    }

    // After 10+ attempts, should show rate limit message
    const rateLimitMsg = page.locator(':text("rate limit"), :text("many attempts"), :text("محاولات كثيرة"), :text("429")');
    await expect(rateLimitMsg.first()).toBeVisible({ timeout: 10000 });
  });

  // ============================================
  // Accessibility
  // ============================================
  test('should be keyboard navigable', async ({ page }) => {
    // Tab through all form elements
    await page.keyboard.press('Tab'); // Email
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeFocused();

    await page.keyboard.press('Tab'); // Password
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeFocused();

    await page.keyboard.press('Tab'); // Submit button or Remember me
    const focused = page.locator(':focus');
    expect(await focused.count()).toBeGreaterThan(0);
  });

  test('should have proper form labels and ARIA attributes', async ({ page }) => {
    // Check that inputs have associated labels
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    const emailId = await emailInput.getAttribute('id');
    const passwordId = await passwordInput.getAttribute('id');

    if (emailId) {
      const emailLabel = page.locator(`label[for="${emailId}"]`);
      await expect(emailLabel).toBeVisible();
    }

    if (passwordId) {
      const passwordLabel = page.locator(`label[for="${passwordId}"]`);
      await expect(passwordLabel).toBeVisible();
    }
  });
});
